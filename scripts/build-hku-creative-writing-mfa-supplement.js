const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const OUTPUT = path.join(ROOT, 'data', 'tpg-course-supplements', 'hku-creative-writing-mfa-2025.json');
const REGULATIONS_SOURCE = 'https://sweb.hku.hk/tola/servlet/ApplicantDownloadForm/getForm?pREF_CODE=R272&pDOCUMENT_TYPE=REGULATIONSYLLABUS&pVIEW=Y';

const compulsoryRows = [
  ['ENGL7507', 'Creative Foundations: Macro Structure and History', 9],
  ['ENGL7515', 'Creative Writing Foundations: Poetry and Prose', 6],
  ['ENGL7516', 'Creative Writing Foundations: Fiction and Nonfiction', 6],
  ['ENGL7517', 'Creative Writing Workshop', 9]
];

const electiveRows = [
  ['ENGL7514', 'Internship: The History of Practice'],
  ['ENGL7518', 'Corporate Storytelling'],
  ['ENGL7519', 'Building Characters Across Media'],
  ['ENGL7520', '(Re)framing Hong Kong'],
  ['ENGL7521', 'Narrating Transnational Tales'],
  ['ENGL7522', 'Writing Speculative Fiction'],
  ['ENGL7610', 'Theatre and Performance']
];

function course([code, name, credits = 6], extra = {}) {
  return { code, name, credits, appliesToTrackIds: [], ...extra };
}

function buildSupplement() {
  assert.equal(compulsoryRows.length, 4, 'HKU MFA compulsory-course list changed');
  assert.equal(electiveRows.length, 7, 'HKU MFA elective-course pool changed');
  assert.equal(new Set([...compulsoryRows, ...electiveRows].map(([code]) => code)).size, 11);
  assert.equal(compulsoryRows.reduce((sum, row) => sum + row[2], 0), 30);

  return {
    schemaVersion: 1,
    schoolCode: 'HKU',
    academicYear: '2025-26 and thereafter',
    verifiedAt: '2026-07-14',
    programmes: [{
      programmeId: 'HKU-TPG-022',
      status: 'verified',
      creditsRequired: 60,
      creditUnit: 'credits',
      sourceUrl: REGULATIONS_SOURCE,
      ruleReviewStatus: 'verified',
      statusNote: 'The official Syllabuses apply to the 2025-26 intake and thereafter and are versioned Jul 17, 2025. The 60-credit curriculum consists of four compulsory courses, three electives selected from the seven published elective courses, and the compulsory 12-credit Capstone Experience.',
      courseGroups: [
        {
          id: 'compulsory-courses',
          name: 'Compulsory Courses',
          type: 'core',
          creditsRequired: 30,
          coursesRequired: 4,
          ruleText: 'Complete all four Compulsory Courses: two 6-credit courses and two 9-credit courses, for 30 credits.',
          appliesToTrackIds: [],
          sourceUrl: REGULATIONS_SOURCE,
          courses: compulsoryRows.map((row) => course(row))
        },
        {
          id: 'elective-courses',
          name: 'Elective Courses',
          type: 'elective',
          creditsRequired: 18,
          coursesRequired: 3,
          ruleText: 'Complete three 6-credit Elective Courses from the seven courses published in the official Syllabuses, for 18 credits.',
          appliesToTrackIds: [],
          sourceUrl: REGULATIONS_SOURCE,
          courses: electiveRows.map((row) => course(row))
        },
        {
          id: 'capstone-experience',
          name: 'Capstone Experience',
          type: 'project',
          creditsRequired: 12,
          coursesRequired: 1,
          ruleText: 'Complete ENGL7993 Capstone Experience: Creative Dissertation and Showcase for 12 credits.',
          appliesToTrackIds: [],
          sourceUrl: REGULATIONS_SOURCE,
          courses: [course(['ENGL7993', 'Capstone Experience: Creative Dissertation and Showcase', 12], { courseKind: 'dissertation' })]
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
    courses: compulsoryRows.length + electiveRows.length + 1
  }));
}

if (require.main === module) main();
module.exports = { buildSupplement, compulsoryRows, electiveRows };
