const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const OUTPUT = path.join(ROOT, 'data', 'tpg-course-supplements', 'hku-applied-linguistics-2026.json');
const REGULATIONS_SOURCE = 'https://sweb.hku.hk/tola/servlet/ApplicantDownloadForm/getForm?pREF_CODE=R83&pDOCUMENT_TYPE=REGULATIONSYLLABUS&pVIEW=Y';
const CURRICULUM_SOURCE = 'https://caes.hku.hk/maal/curriculum-structure/';

const coreRows = [
  ['MAAL6002', 'Second language curricula'],
  ['MAAL6028', 'Introduction to research methods'],
  ['MAAL6029', 'Second language acquisition'],
  ['MAAL6030', 'Understanding language through grammar'],
  ['MAAL7005', 'Spoken discourse analysis']
];

const electiveRows = [
  ['MAAL6014', 'Language testing and assessment'],
  ['MAAL6018', 'Vocabulary teaching and learning'],
  ['MAAL6023', 'Advances in writing pedagogy'],
  ['MAAL6031', 'Technology in language teaching and learning'],
  ['MAAL6034', 'Gender and language'],
  ['MAAL6035', 'Language teacher development'],
  ['MAAL6037', 'Advanced research methods'],
  ['MAAL7001', 'Applied corpus linguistics'],
  ['MAAL7002', 'Applied linguistics in the workplace'],
  ['MAAL7003', 'Understanding intercultural communication'],
  ['MAAL7004', 'Instructed second language acquisition'],
  ['MAAL7006', 'Psycholinguistics'],
  ['MAAL7007', 'Language policy'],
  ['MAAL7008', 'Pragmatics in digital communication']
];

function course([code, name], credits = 6) {
  return { code, name, credits, appliesToTrackIds: [] };
}

function buildSupplement() {
  assert.equal(coreRows.length, 5, 'HKU MAAL core-course list changed');
  assert.equal(electiveRows.length, 14, 'HKU MAAL current elective-course list changed');
  assert.equal(new Set([...coreRows, ...electiveRows].map(([code]) => code)).size, 19);

  return {
    schemaVersion: 1,
    schoolCode: 'HKU',
    academicYear: '2026-27',
    verifiedAt: '2026-07-14',
    programmes: [{
      programmeId: 'HKU-TPG-011',
      status: 'verified',
      creditsRequired: 69,
      creditUnit: 'credits',
      sourceUrl: REGULATIONS_SOURCE,
      ruleReviewStatus: 'manual_review_required',
      statusNote: 'The current MAAL curriculum page publishes 14 elective courses. The official regulations PDF also lists MAAL6017 Phonology and MAAL6036 Sociocultural dimensions of SLA, which are absent from the current curriculum page. The current web list is used here; the two-source elective-pool difference and the alternative capstone paths require manual review.',
      courseGroups: [
        {
          id: 'core-courses',
          name: 'Core Courses',
          type: 'core',
          creditsRequired: 30,
          coursesRequired: 5,
          ruleText: 'Complete all five Core Courses for 30 credits.',
          appliesToTrackIds: [],
          sourceUrl: CURRICULUM_SOURCE,
          courses: coreRows.map((row) => course(row))
        },
        {
          id: 'elective-courses',
          name: 'Elective Courses',
          type: 'elective',
          creditsRequired: 24,
          coursesRequired: 4,
          ruleText: 'Complete four 6-credit courses from the Elective pool. The Dissertation path requires MAAL6037 as one of the four; the Portfolio path permits another elective instead. Not all electives are necessarily offered every year, and the current curriculum page differs from the regulations PDF by two older listed electives; availability and the alternative path require manual audit review.',
          appliesToTrackIds: [],
          sourceUrl: CURRICULUM_SOURCE,
          courses: electiveRows.map((row) => course(row))
        },
        {
          id: 'capstone-experience',
          name: 'Capstone Experience',
          type: 'project',
          creditsRequired: 15,
          coursesRequired: 1,
          ruleText: 'Complete either MAAL8999 Dissertation (15 credits), with MAAL6037 required among the four Elective-pool courses, or MAAL8998 Portfolio (15 credits), with any four Elective-pool courses. The alternative combinations require manual audit review.',
          appliesToTrackIds: [],
          sourceUrl: REGULATIONS_SOURCE,
          courses: [
            course(['MAAL8999', 'Capstone Experience: Dissertation'], 15),
            course(['MAAL8998', 'Capstone Experience: Portfolio'], 15)
          ]
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
    courses: coreRows.length + electiveRows.length + 2
  }));
}

if (require.main === module) main();
module.exports = { buildSupplement, coreRows, electiveRows };
