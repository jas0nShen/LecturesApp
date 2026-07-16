const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const OUTPUT = path.join(ROOT, 'data', 'tpg-course-supplements', 'hku-matesol-2025.json');
const REGULATIONS_SOURCE = 'https://www4.hku.hk/pubunit/drcd/files/pgdr2025-26/Education/MA(TESOL).pdf';

const coreRows = [
  ['MAES7001', 'Methodological Innovations in TESOL', 6],
  ['MAES7008', 'Methodological Innovations in TESOL (COIL)', 6],
  ['MAES7002', 'Grammar and Pedagogy', 6],
  ['MAES7003', 'Second Language Acquisition', 6],
  ['MAES7004', 'Sociolinguistics and TESOL', 6],
  ['MAES7005', 'Teaching Spoken Communication for English as a Global Language', 6],
  ['MAES7006', 'Methods of Research and Enquiry in TESOL', 6]
];

const capstoneRows = [
  ['MAES7200', 'Project by Independent Study', 12]
];

const electiveRows = [
  ['MAES7100', 'Literature in Language Teaching and Learning', 6],
  ['MAES7101', 'Critical Discourse Studies', 6],
  ['MAES7102', 'Teaching Reading in English as an International Language', 6],
  ['MAES7103', 'Second Language Writing Instruction in Global Contexts', 6],
  ['MAES7105', 'Technology and English Teaching and Learning', 6],
  ['MAES7106', 'Testing and Assessment in TESOL', 6],
  ['MAES7107', 'Autonomy and Language Learning', 6],
  ['MAES7108', 'Corpora for Language Learning and Teaching', 6],
  ['MAES7109', 'Intercultural Communication', 6],
  ['MAES7110', 'Vocabulary Teaching and Learning', 6],
  ['MAES7111', 'English Language Teaching: Principles into Practice', 6],
  ['MAES7112', 'Teaching Listening for English as a Global Language', 6],
  ['MAES7113', 'Teaching Multimodality', 6]
];

function course([code, name, credits], extra = {}) {
  return { code, name, credits, appliesToTrackIds: [], ...extra };
}

function sumCredits(rows) {
  return rows.reduce((sum, row) => sum + row[2], 0);
}

function buildSupplement() {
  assert.equal(coreRows.length, 7);
  assert.equal(sumCredits(coreRows), 42);
  assert.equal(capstoneRows.length, 1);
  assert.equal(sumCredits(capstoneRows), 12);
  assert.equal(electiveRows.length, 13);
  assert.equal(sumCredits(electiveRows), 78);
  const allRows = [...coreRows, ...capstoneRows, ...electiveRows];
  assert.equal(allRows.length, 21, 'HKU MA(TESOL) course pool changed');
  assert.equal(new Set(allRows.map(([code]) => code)).size, 21);

  return {
    schemaVersion: 1,
    schoolCode: 'HKU',
    academicYear: '2025-26 and thereafter',
    verifiedAt: '2026-07-16',
    programmes: [{
      programmeId: 'HKU-TPG-030',
      status: 'verified',
      creditsRequired: 72,
      creditUnit: 'credits',
      sourceUrl: REGULATIONS_SOURCE,
      ruleReviewStatus: 'manual_review_required',
      statusNote: 'The official 2025-26 Regulations and Syllabuses publish the complete 72-credit curriculum: six 6-credit Core Courses, the 12-credit MAES7200 Capstone Project and four 6-credit Elective Courses. MAES7001 and MAES7008 are mutually exclusive alternatives for the same Core requirement, and MAES7008 depends on an overseas partner and may not be offered every year. Elective offerings also vary annually, so the complete course pool is verified while the one-of Core choice and annual availability require manual audit review.',
      courseGroups: [
        {
          id: 'core-courses',
          name: 'Core Courses',
          type: 'core',
          creditsRequired: 36,
          coursesRequired: 6,
          ruleText: 'Complete MAES7002, MAES7003, MAES7004, MAES7005 and MAES7006, plus exactly one of MAES7001 or MAES7008, for 36 credits. MAES7001 and MAES7008 are mutually exclusive; MAES7008 is subject to an overseas partner and may not be offered every year.',
          appliesToTrackIds: [],
          sourceUrl: REGULATIONS_SOURCE,
          courses: coreRows.map((row) => course(row))
        },
        {
          id: 'capstone-project',
          name: 'Capstone Project',
          type: 'project',
          creditsRequired: 12,
          coursesRequired: 1,
          ruleText: 'Complete MAES7200 Project by Independent Study for 12 credits and submit the capstone project by the end of the summer semester.',
          appliesToTrackIds: [],
          sourceUrl: REGULATIONS_SOURCE,
          courses: capstoneRows.map((row) => course(row, { courseKind: 'project' }))
        },
        {
          id: 'elective-courses',
          name: 'Elective Courses',
          type: 'elective',
          creditsRequired: 24,
          coursesRequired: 4,
          ruleText: 'Complete four 6-credit Elective Courses, normally two in each of the first and second semesters. Not all electives are offered annually.',
          appliesToTrackIds: [],
          sourceUrl: REGULATIONS_SOURCE,
          courses: electiveRows.map((row) => course(row))
        }
      ]
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
    courses: 21
  }));
}

if (require.main === module) main();
module.exports = { buildSupplement, coreRows, capstoneRows, electiveRows };
