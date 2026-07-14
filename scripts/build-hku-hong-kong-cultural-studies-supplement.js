const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const OUTPUT = path.join(ROOT, 'data', 'tpg-course-supplements', 'hku-hong-kong-cultural-studies-2026.json');
const REGULATIONS_SOURCE = 'https://sweb.hku.hk/tola/servlet/ApplicantDownloadForm/getForm?pREF_CODE=R420&pDOCUMENT_TYPE=REGULATIONSYLLABUS&pVIEW=Y';
const STRUCTURE_SOURCE = 'https://mahkcs.chinese.hku.hk/en/general/programme_structure/';
const COURSEWORK_SOURCE = 'https://mahkcs.chinese.hku.hk/en/general/coursework_requirement/';
const ADMISSIONS_SOURCE = 'https://portal.hku.hk/tpg-admissions/programme-details?programme=master-of-arts-in-the-field-of-hong-kong-cultural-studies-arts';

const coreRows = [
  ['HKGS7001', 'Hong Kong Cultural Studies: Theories and Research Methods'],
  ['HKGS7002', 'Perspectives on Hong Kong Cultural Studies']
];

const electiveRows = [
  ['HKGS7121', 'Screening Hong Kong', 'programme-elective'],
  ['HKGS7122', 'Hong Kong Identity: Cultural Symbols and Representation', 'programme-elective'],
  ['HKGS7123', 'Hong Kong Cantopop: The Sound of the City', 'programme-elective'],
  ['HKGS7124', 'The Study of Everyday Life in Hong Kong', 'programme-elective'],
  ['HKGS7125', 'The Controversy of Hong Kong’s Colonial Situation', 'programme-elective'],
  ['HKGS7126', 'Hong Kong Print Media: The Story of the City', 'programme-elective'],
  ['HKGS7127', 'Hong Kong Culture: An Interdisciplinary Perspective', 'programme-elective'],
  ['HKGS7128', 'Hong Kong Celebrity Culture', 'programme-elective'],
  ['HKGS7129', 'Capitalism in Hong Kong: Culture, Politics and Theory', 'programme-elective'],
  ['HKGS7130', 'Tasty Hong Kong: The Food Culture of the City', 'programme-elective'],
  ['CHIN7013', 'Hong Kong since 1842', 'cross-listed'],
  ['CHIN7102', 'Studies in Cantonese', 'cross-listed'],
  ['CHIN7114', 'Topical Studies of Hong Kong Literature', 'cross-listed']
];

function sixCreditCourse([code, name]) {
  return { code, name, credits: 6, appliesToTrackIds: [] };
}

function electiveCourse([code, name, subjectGroup]) {
  return { code, name, credits: 6, subjectGroups: [subjectGroup], appliesToTrackIds: [] };
}

function buildSupplement() {
  assert.equal(coreRows.length, 2);
  assert.equal(electiveRows.length, 13, 'HKU MAHKCS elective-course pool changed');
  assert.equal(electiveRows.filter((row) => row[2] === 'programme-elective').length, 10);
  assert.equal(electiveRows.filter((row) => row[2] === 'cross-listed').length, 3);
  assert.equal(new Set([...coreRows, ...electiveRows].map(([code]) => code)).size, 15);

  return {
    schemaVersion: 1,
    schoolCode: 'HKU',
    academicYear: '2026-27 and thereafter',
    verifiedAt: '2026-07-14',
    programmes: [{
      programmeId: 'HKU-TPG-017',
      status: 'verified',
      creditsRequired: 60,
      creditUnit: 'credits',
      sourceUrl: REGULATIONS_SOURCE,
      ruleReviewStatus: 'manual_review_required',
      statusNote: 'The official 2026-27 Regulations and Syllabuses require two Core Courses, six Elective Courses and HKGS7991 Capstone Experience for 60 credits. The elective pool contains ten MAHKCS courses and three cross-listed CHIN courses; no more than two cross-listed electives (12 credits) may count. HKGS7991 permits either an academic paper or a media project with analysis, so the cross-listed maximum and Capstone format require manual audit review.',
      courseGroups: [
        {
          id: 'core-courses',
          name: 'Core Courses',
          type: 'core',
          creditsRequired: 12,
          coursesRequired: 2,
          ruleText: 'Complete both 6-credit Core Courses for 12 credits. The Core Courses are offered in the first semester of the first academic year.',
          appliesToTrackIds: [],
          sourceUrl: REGULATIONS_SOURCE,
          courses: coreRows.map(sixCreditCourse)
        },
        {
          id: 'elective-courses',
          name: 'Elective Courses',
          type: 'elective',
          creditsRequired: 36,
          coursesRequired: 6,
          ruleText: 'Complete six 6-credit electives from the 13-course pool. A maximum of two cross-listed CHIN electives (12 credits) may be selected; those cross-listed courses are taught in Chinese. Not all listed electives are necessarily offered each year. The maximum requires manual audit review.',
          appliesToTrackIds: [],
          sourceUrl: REGULATIONS_SOURCE,
          courses: electiveRows.map(electiveCourse)
        },
        {
          id: 'capstone-experience',
          name: 'Capstone Experience',
          type: 'project',
          creditsRequired: 12,
          coursesRequired: 1,
          ruleText: 'Complete HKGS7991 in the second semester for 12 credits. The official course permits either an academic paper of at least 7,000 English words or an 8-10 minute media production with an English analysis of at least 5,000 words; the format choice requires manual audit review.',
          appliesToTrackIds: [],
          sourceUrl: REGULATIONS_SOURCE,
          courses: [{
            code: 'HKGS7991',
            name: 'Capstone Experience: MA Project in Hong Kong Cultural Studies',
            credits: 12,
            courseKind: 'project',
            appliesToTrackIds: []
          }]
        }
      ],
      additionalSources: [STRUCTURE_SOURCE, COURSEWORK_SOURCE, ADMISSIONS_SOURCE]
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
