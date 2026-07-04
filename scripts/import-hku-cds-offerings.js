const fs = require('node:fs');
const path = require('node:path');

const SOURCE_URL = 'https://www.cs.hku.hk/programmes/course-offered';
const ACADEMIC_YEAR = '2025-26';

function decodeHtml(value) {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&nbsp;/g, ' ')
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function textContent(value) {
  return decodeHtml(value.replace(/<br\s*\/?>/gi, ' ').replace(/<[^>]+>/g, ' '))
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeCourseCode(sectionCode) {
  const match = sectionCode.match(/^([A-Z]{4}\d{4})[A-Z]$/);
  return match ? match[1] : sectionCode;
}

function parseOfferings(html) {
  const rows = html.match(/<tr\b[\s\S]*?<\/tr>/gi) || [];
  const courses = new Map();
  let category = '';

  rows.forEach((row) => {
    if (/courseLevel\d+_4y/i.test(row) && /colspan/i.test(row)) {
      category = textContent(row);
      return;
    }

    const cells = [...row.matchAll(/<td\b[^>]*>([\s\S]*?)<\/td>/gi)].map((match) => match[1]);
    if (cells.length !== 4) return;

    const sectionCode = textContent(cells[0]);
    const title = textContent(cells[1]);
    const term = textContent(cells[2]);
    if (!/^[A-Z]{4}\d{4}[A-Z]?$/.test(sectionCode) || !title || !term) return;

    const courseCode = normalizeCourseCode(sectionCode);
    const detailMatch = cells[1].match(/href="([^"]*infile=[^"]+)"/i);
    const detailUrl = detailMatch
      ? new URL(decodeHtml(detailMatch[1]), SOURCE_URL).toString()
      : SOURCE_URL;
    const existing = courses.get(courseCode) || {
      courseCode,
      title,
      categories: [],
      terms: [],
      sections: [],
      officialUrl: detailUrl
    };

    if (category && !existing.categories.includes(category)) existing.categories.push(category);
    if (!existing.terms.includes(term)) existing.terms.push(term);
    existing.sections.push({ sectionCode, term });
    courses.set(courseCode, existing);
  });

  return [...courses.values()].sort((a, b) => a.courseCode.localeCompare(b.courseCode));
}

async function main() {
  const fileIndex = process.argv.indexOf('--file');
  let html;

  if (fileIndex !== -1) {
    const sourceFile = process.argv[fileIndex + 1];
    if (!sourceFile) throw new Error('--file requires an HTML file path');
    html = fs.readFileSync(sourceFile, 'utf8');
  } else {
    const response = await fetch(SOURCE_URL);
    if (!response.ok) throw new Error(`HKU source returned HTTP ${response.status}`);
    html = await response.text();
  }

  const courses = parseOfferings(html);
  if (courses.length < 20) throw new Error(`Expected at least 20 courses, received ${courses.length}`);

  const output = {
    universityCode: 'HKU',
    provider: 'School of Computing and Data Science',
    academicYear: ACADEMIC_YEAR,
    sourceUrl: SOURCE_URL,
    retrievedAt: new Date().toISOString(),
    courses
  };
  const target = path.join(__dirname, '..', 'data', 'hku-cds-offerings-2025.json');
  fs.writeFileSync(target, `${JSON.stringify(output, null, 2)}\n`);
  console.log(`Imported ${courses.length} HKU CDS course offerings`);
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}

module.exports = {
  normalizeCourseCode,
  parseOfferings
};
