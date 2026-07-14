const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const OUTPUT = path.join(ROOT, 'data', 'tpg-course-supplements', 'hku-english-studies-2026.json');
const PROGRAMME_SOURCE = 'https://english.hku.hk/Postgraduate/MAES/2026-27_Full-Time';
const SYLLABUS_SOURCE = 'https://english.hku.hk/public_uploads/MAES/2425_MAES%20Syllabus.pdf';

const coreRows = [
  ['ENGL6073', 'Introduction to Literature and Cross-Cultural Theory', 9],
  ['ENGL7101', 'Introduction to Language and Communication', 9],
  ['ENGL7801', 'Academic Research Practices', 3]
];

const electiveRows = [
  ['ENGL6056', 'Cultural Semiotics', 'linguistics'],
  ['ENGL7102', 'Global Englishes', 'linguistics'],
  ['ENGL7103', 'New Media and Discourse', 'linguistics'],
  ['ENGL7105', 'Intercultural Communication', 'linguistics'],
  ['ENGL7110', 'Gender, Discourse and Society', 'linguistics'],
  ['ENGL6079', 'World Modernisms', 'literature'],
  ['ENGL6081', 'Global Fictions', 'literature'],
  ['ENGL6083', 'Postcolonial Representations', 'literature'],
  ['ENGL7104', 'Global Shakespeare', 'literature'],
  ['ENGL7108', 'Imagining Asia', 'literature']
];

function coreCourse([code, name, credits]) {
  return { code, name, credits, appliesToTrackIds: [] };
}

function electiveCourse([code, name, subjectGroup]) {
  return { code, name, credits: 6, subjectGroups: [subjectGroup], appliesToTrackIds: [] };
}

function buildSupplement() {
  assert.equal(coreRows.reduce((total, row) => total + row[2], 0), 21);
  assert.equal(electiveRows.length, 10, 'HKU MAES current seminar-course list changed');
  assert.equal(electiveRows.filter((row) => row[2] === 'linguistics').length, 5);
  assert.equal(electiveRows.filter((row) => row[2] === 'literature').length, 5);
  assert.equal(new Set([...coreRows, ...electiveRows].map(([code]) => code)).size, 13);

  return {
    schemaVersion: 1,
    schoolCode: 'HKU',
    academicYear: '2026-27',
    verifiedAt: '2026-07-14',
    programmes: [{
      programmeId: 'HKU-TPG-015',
      status: 'verified',
      creditsRequired: 60,
      creditUnit: 'credits',
      sourceUrl: PROGRAMME_SOURCE,
      ruleReviewStatus: 'manual_review_required',
      statusNote: 'The current 2026-27 Programme page publishes ten seminar-course offerings for reference, five in Linguistics and five in Literature. The linked official 2025-26 Syllabuses PDF contains a broader catalogue, including courses absent from the current web offering table; the current web list is used here. A transcript specialisation requires at least three seminar courses and the Capstone completed in the same area, which requires manual audit review.',
      courseGroups: [
        {
          id: 'core-courses',
          name: 'Core Courses',
          type: 'core',
          creditsRequired: 21,
          coursesRequired: 3,
          ruleText: 'Complete ENGL6073 and ENGL7101 at 9 credits each and ENGL7801 at 3 credits, for 21 Core credits.',
          appliesToTrackIds: [],
          sourceUrl: PROGRAMME_SOURCE,
          courses: coreRows.map(coreCourse)
        },
        {
          id: 'seminar-courses',
          name: 'Seminar Courses',
          type: 'elective',
          creditsRequired: 24,
          coursesRequired: 4,
          ruleText: 'Complete four 6-credit Seminar Courses from Linguistics and/or Literature. Students may remain in English Studies without a specialisation. A Linguistics or Literature transcript specialisation requires at least three Seminar Courses and the Capstone in the same area; this rule requires manual audit review. Not all listed seminars are offered every year.',
          appliesToTrackIds: [],
          sourceUrl: PROGRAMME_SOURCE,
          courses: electiveRows.map(electiveCourse)
        },
        {
          id: 'capstone-experience',
          name: 'Capstone Experience',
          type: 'project',
          creditsRequired: 15,
          coursesRequired: 1,
          ruleText: 'Complete ENGL7994 Capstone Experience: Final Research Project for 15 credits. Students pursuing a Linguistics or Literature transcript specialisation must complete the project in that area.',
          appliesToTrackIds: [],
          sourceUrl: SYLLABUS_SOURCE,
          courses: [{
            code: 'ENGL7994',
            name: 'Capstone Experience: Final Research Project',
            credits: 15,
            courseKind: 'project',
            subjectGroups: ['linguistics', 'literature'],
            appliesToTrackIds: []
          }]
        }
      ],
      additionalSources: [SYLLABUS_SOURCE]
    }]
  };
}

function main() {
  const supplement = buildSupplement();
  fs.writeFileSync(OUTPUT, `${JSON.stringify(supplement, null, 2)}\n`);
  console.log(JSON.stringify({
    ok: true,
    output: path.relative(ROOT, OUTPUT),
    programmes: 1,
    courses: coreRows.length + electiveRows.length + 1
  }));
}

if (require.main === module) main();
module.exports = { buildSupplement, coreRows, electiveRows };
