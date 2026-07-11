const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const source = require('../data/tpg-source-snapshots/polyu-2027.json');
const outputPath = path.join(ROOT, 'data', 'tpg-course-candidates', 'polyu-2027.json');
const CODE_RE = /\b[A-Z]{2,8}\d[A-Z0-9]{2,6}\b/;

function cleanName(value, code) {
  return value
    .replace(code, '')
    .replace(/\(\s*\*?\s*\)/g, '')
    .replace(/\((?:no\s+)?\d+(?:\.\d+)?\s*credits?\)/ig, '')
    .replace(/^[\s–—:;-]+|[\s–—:;-]+$/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function readCredits(value = '') {
  const match = value.match(/\b(\d+(?:\.\d+)?)\s*credits?\b/i);
  if (match) return Number(match[1]);
  const noCredits = value.match(/\bnon[- ]credit[- ]bearing\b|\(no\s+credits?\)/i);
  return noCredits ? 0 : null;
}

function extractCandidates(row) {
  const lines = String(row.curriculumText || '').split('\n').map((line) => line.trim()).filter(Boolean);
  const byCode = new Map();
  lines.forEach((line, index) => {
    const match = line.match(CODE_RE);
    if (!match) return;
    const code = match[0];
    const name = cleanName(line, code);
    const creditContext = [line, lines[index + 1] || '', lines[index + 2] || ''].join(' ');
    const candidate = {
      code,
      name,
      credits: readCredits(creditContext),
      evidenceText: creditContext,
      sourceUrl: row.sourceUrl,
      reviewStatus: 'candidate'
    };
    const existing = byCode.get(code);
    if (!existing || (!existing.name && candidate.name) || (existing.credits === null && candidate.credits !== null)) byCode.set(code, candidate);
  });
  return [...byCode.values()];
}

function main() {
  const programmes = source.rows.map((row) => ({
    programmeId: row.programmeId,
    officialSubjectArea: row.officialSubjectArea || '',
    sourceUrl: row.sourceUrl,
    error: row.error || '',
    courses: extractCandidates(row)
  }));
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, `${JSON.stringify({ schemaVersion: 1, academicYear: source.academicYear, generatedAt: new Date().toISOString(), programmes }, null, 2)}\n`);
  const courses = programmes.flatMap((item) => item.courses);
  console.log(JSON.stringify({
    ok: true,
    programmes: programmes.length,
    programmesWithCandidates: programmes.filter((item) => item.courses.length).length,
    candidateRows: courses.length,
    withCredits: courses.filter((item) => item.credits !== null).length,
    missingName: courses.filter((item) => !item.name).length,
    output: path.relative(ROOT, outputPath)
  }));
}

if (require.main === module) main();
module.exports = { cleanName, extractCandidates, readCredits };
