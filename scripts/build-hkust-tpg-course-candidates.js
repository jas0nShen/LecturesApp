const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const source = require('../data/tpg-source-snapshots/hkust-2026.json');
const outputPath = path.join(ROOT, 'data', 'tpg-course-candidates', 'hkust-2026.json');

function normalizeCode(value = '') {
  return value.replace(/\s+/g, '');
}

function classifyGroup(name = '') {
  if (/core|compulsory|required/i.test(name)) return 'core';
  if (/project|practicum|capstone/i.test(name)) return 'project';
  if (/thesis|dissertation/i.test(name)) return 'dissertation';
  if (/elective|special|concentration|option/i.test(name)) return 'elective';
  return 'programme';
}

function isHeading(line) {
  return line.length < 120
    && !/[.!]$/.test(line)
    && /(Core|Elective|Required|Compulsory|Foundation|Practicum|Project|Thesis|Dissertation|Capstone|Concentration|Workshop|Coursework|Specialized|Special Topics|Application-oriented|Training|Courses?)\b/i.test(line);
}

function parseProgramme(row, courseCatalogue) {
  if (row.error) return { programmeId: row.programmeId, sourceUrl: row.sourceUrl || '', error: row.error, courseGroups: [] };
  const refCodes = new Set((row.courseRefs || []).map((ref) => normalizeCode(ref.code)).filter(Boolean));
  const seenCodes = new Set();
  const groups = [];
  let current = null;
  const lines = String(row.curriculumText || '').split('\n').map((line) => line.trim()).filter(Boolean);
  const curriculumStart = lines.findIndex((line) => line === 'CURRICULUM');
  const relevantLines = curriculumStart >= 0 ? lines.slice(curriculumStart + 1) : lines;
  relevantLines.forEach((line) => {
    const codes = [...refCodes].filter((code) => new RegExp(`\\b${code.replace(/(\d)/, '\\s*$1')}\\b`).test(line));
    if (!codes.length && isHeading(line)) {
      current = { id: `group-${groups.length + 1}`, name: line.replace(/:$/, ''), type: classifyGroup(line), creditsRequired: null, ruleText: '', courses: [] };
      groups.push(current);
      return;
    }
    if (!codes.length && current && /^\d+(?:-\d+)?\s+credits?$/i.test(line)) {
      const value = line.match(/^\d+/)[0];
      if (!line.includes('-')) current.creditsRequired = Number(value);
      current.ruleText = `${current.name}: ${line}`;
      return;
    }
    codes.forEach((compactCode) => {
      if (seenCodes.has(compactCode)) return;
      seenCodes.add(compactCode);
      if (!current) {
        current = { id: 'programme-courses', name: 'Programme Courses', type: 'programme', creditsRequired: null, ruleText: '', courses: [] };
        groups.push(current);
      }
      const course = courseCatalogue.get(compactCode);
      current.courses.push(course && !course.error
        ? { ...course, description: undefined, appliesToTrackIds: [], sourceUrl: row.sourceUrl }
        : { code: compactCode.replace(/^(\D+)(\d)/, '$1 $2'), name: '', sourceUrl: row.sourceUrl, sourceError: course ? course.error : 'Missing official course detail' });
    });
  });
  const creditSection = (row.curriculumText.match(/Minimum Credit Requirement([\s\S]{0,180})/i) || [])[1] || '';
  const labelledCreditMatch = creditSection.match(/(?:MSc|MA)\s*:\s*(\d+(?:\.\d+)?)\s*(credits|ECTS)/i);
  const simpleCreditMatch = creditSection.match(/^\s*(\d+(?:\.\d+)?)\s*(credits|ECTS)/i);
  const creditMatch = labelledCreditMatch || simpleCreditMatch;
  const populatedGroups = groups.filter((group) => group.courses.length);
  populatedGroups.forEach((group, index) => { group.id = `group-${index + 1}`; group.sourceUrl = row.sourceUrl; group.appliesToTrackIds = []; });
  return {
    programmeId: row.programmeId,
    officialName: row.officialName,
    sourceUrl: row.sourceUrl,
    creditsRequired: creditMatch ? Number(creditMatch[1]) : null,
    creditUnit: creditMatch && /^ECTS$/i.test(creditMatch[2]) ? 'ECTS' : 'credits',
    reviewStatus: 'candidate',
    courseGroups: populatedGroups,
    missingCourseDetails: [...refCodes].filter((code) => !courseCatalogue.get(code) || courseCatalogue.get(code).error),
    ungroupedCourseRefs: [...refCodes].filter((code) => !seenCodes.has(code))
  };
}

function main() {
  const courseCatalogue = new Map(source.courses.map((course) => [normalizeCode(course.code), course]));
  const programmes = source.rows.map((row) => parseProgramme(row, courseCatalogue));
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, `${JSON.stringify({ schemaVersion: 1, academicYear: source.academicYear, generatedAt: new Date().toISOString(), programmes }, null, 2)}\n`);
  const ready = programmes.filter((item) => {
    const availableCredits = item.courseGroups.flatMap((group) => group.courses).reduce((sum, course) => sum + (course.credits || course.creditsMax || 0), 0);
    return item.creditsRequired && availableCredits >= item.creditsRequired && item.courseGroups.length && !item.missingCourseDetails?.length && !item.ungroupedCourseRefs?.length;
  });
  console.log(JSON.stringify({ ok: true, programmes: programmes.length, readyForReview: ready.length, courseRows: programmes.reduce((n, item) => n + item.courseGroups.reduce((m, group) => m + group.courses.length, 0), 0), output: path.relative(ROOT, outputPath) }));
}

if (require.main === module) main();
module.exports = { classifyGroup, isHeading, normalizeCode, parseProgramme };
