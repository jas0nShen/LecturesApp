const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const catalogue = require('../data/tpg-programmes.json');
const snapshots = require('../data/tpg-source-snapshots/polyu-comp-2027.json');
const outputPath = path.join(ROOT, 'data', 'tpg-course-supplements', 'polyu-computing-2027.json');
const CODE_RE = /\b[A-Z]{2,8}\d[A-Z0-9]{2,6}\b/;

function cleanCourseName(line, code) {
  return line
    .replace(code, '')
    .replace(/\((?:\d+(?:\.\d+)?)\s*credits?(?:;[^)]*)?\)/ig, '')
    .replace(/\*+/g, '')
    .replace(/^[\s–—:;.-]+|[\s–—:;.-]+$/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function parseSection(text, startLabel, endLabel, sourceUrl) {
  const start = text.indexOf(startLabel);
  const end = text.indexOf(endLabel, start + startLabel.length);
  if (start < 0 || end < 0) throw new Error(`Cannot find ${startLabel} -> ${endLabel}`);
  const lines = text.slice(start + startLabel.length, end).split('\n').map((line) => line.trim()).filter(Boolean);
  const courses = [];
  lines.forEach((line) => {
    const match = line.match(CODE_RE);
    if (!match) return;
    const code = match[0];
    const explicit = line.match(/(\d+(?:\.\d+)?)\s*credits?/i);
    courses.push({
      code,
      name: cleanCourseName(line, code),
      credits: explicit ? Number(explicit[1]) : 3,
      appliesToTrackIds: [],
      sourceUrl
    });
  });
  return courses;
}

function legacyGroup(programme, name, id, type, sourceUrl, ruleText) {
  const group = programme.courseGroups.find((item) => item.name === name);
  if (!group) throw new Error(`${programme.id} is missing ${name}`);
  return {
    id,
    name,
    type,
    creditsRequired: group.creditsRequired,
    ruleText,
    appliesToTrackIds: [],
    sourceUrl,
    courses: group.courses.map((course) => ({
      ...course,
      credits: course.code === 'DSAI5T09' ? 1 : /Dissertation/i.test(course.name) ? 9 : /(^|\s)Project$/i.test(course.name) || /Systems Project/i.test(course.name) ? 6 : 3,
      appliesToTrackIds: [],
      sourceUrl
    }))
  };
}

function buildLegacyComputing(programmeId, sourceUrl) {
  const programme = catalogue.programmes.find((item) => item.id === programmeId);
  const isBlockchain = programmeId === 'POLYU-TPG-090';
  const groups = isBlockchain
    ? [
        legacyGroup(programme, 'Core Subjects', 'core', 'core', sourceUrl, 'Choose any six of the eight Core Subjects.'),
        legacyGroup(programme, 'Elective / Project / Dissertation Options', 'elective-options', 'elective', sourceUrl, 'Complete the dissertation, project, or taught-subject path stated in the official award requirements.'),
        legacyGroup(programme, 'Academic Integrity and Ethics', 'academic-integrity', 'academic_integrity', sourceUrl, 'Complete the compulsory AIE subject.')
      ]
    : [
        legacyGroup(programme, 'Core Subjects', 'core', 'core', sourceUrl, 'Choose three Core Subjects.'),
        legacyGroup(programme, 'Disciplinary-specific Electives', 'disciplinary-elective', 'disciplinary_elective', sourceUrl, 'Choose three Disciplinary-specific Electives.'),
        legacyGroup(programme, 'Elective / Project / Dissertation Options', 'elective-options', 'elective', sourceUrl, 'Complete the dissertation, project, or taught-subject path stated in the official award requirements.'),
        legacyGroup(programme, 'Academic Integrity and Ethics', 'academic-integrity', 'academic_integrity', sourceUrl, 'Complete the compulsory AIE subject.')
      ];
  return {
    programmeId,
    status: 'verified',
    creditsRequired: 31,
    creditUnit: 'credits',
    sourceUrl,
    ruleReviewStatus: 'manual_review_required',
    courseGroups: groups
  };
}

function buildCybersecurity() {
  const row = snapshots.rows.find((item) => item.programmeId === 'POLYU-TPG-092');
  const sourceUrl = row.sourceUrl;
  return {
    programmeId: row.programmeId,
    status: 'verified',
    creditsRequired: 31,
    creditUnit: 'credits',
    sourceUrl,
    ruleReviewStatus: 'manual_review_required',
    courseGroups: [
      { id: 'core', name: 'Core Subjects', type: 'core', creditsRequired: 12, coursesRequired: 4, ruleText: 'Complete four Core Subjects.', appliesToTrackIds: [], sourceUrl, courses: parseSection(row.curriculumText, 'Core Subjects (12 credits required)', 'Disciplinary-specific Electives', sourceUrl) },
      { id: 'disciplinary-elective', name: 'Disciplinary-specific Electives', type: 'disciplinary_elective', creditsRequired: 9, coursesRequired: 3, ruleText: 'Complete three Disciplinary-specific Electives.', appliesToTrackIds: [], sourceUrl, courses: parseSection(row.curriculumText, 'Disciplinary-specific Electives (9 credits required)', 'Elective Subjects', sourceUrl) },
      { id: 'elective-options', name: 'Elective / Project / Dissertation Options', type: 'elective', creditsRequired: 9, ruleText: 'Complete the dissertation, project, or taught-subject path stated in the official award requirements.', appliesToTrackIds: [], sourceUrl, courses: parseSection(row.curriculumText, 'Elective Subjects ( 9 credits required)', 'AIE Subject', sourceUrl) },
      { id: 'academic-integrity', name: 'Academic Integrity and Ethics', type: 'academic_integrity', creditsRequired: 1, coursesRequired: 1, ruleText: 'Complete the compulsory AIE subject.', appliesToTrackIds: [], sourceUrl, courses: parseSection(row.curriculumText, 'AIE Subject (1 credit required)', 'All subjects are offered', sourceUrl) }
    ]
  };
}

function main() {
  const byId = new Map(snapshots.rows.map((row) => [row.programmeId, row]));
  const programmes = [
    buildLegacyComputing('POLYU-TPG-090', byId.get('POLYU-TPG-090').sourceUrl),
    buildCybersecurity(),
    buildLegacyComputing('POLYU-TPG-093', byId.get('POLYU-TPG-093').sourceUrl)
  ];
  const value = { schemaVersion: 1, schoolCode: 'POLYU', academicYear: '2027-28', verifiedAt: '2026-07-11', programmes };
  fs.writeFileSync(outputPath, `${JSON.stringify(value, null, 2)}\n`);
  console.log(JSON.stringify({ ok: true, programmes: programmes.length, courses: programmes.reduce((n, item) => n + item.courseGroups.reduce((m, group) => m + group.courses.length, 0), 0), output: path.relative(ROOT, outputPath) }));
}

if (require.main === module) main();
module.exports = { cleanCourseName, parseSection };
