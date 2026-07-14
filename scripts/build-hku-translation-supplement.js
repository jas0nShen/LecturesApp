const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const OUTPUT = path.join(ROOT, 'data', 'tpg-course-supplements', 'hku-translation-2025.json');
const REGULATIONS_SOURCE = 'https://sweb.hku.hk/tola/servlet/ApplicantDownloadForm/getForm?pREF_CODE=R341&pDOCUMENT_TYPE=REGULATIONSYLLABUS&pVIEW=Y';
const STRUCTURE_SOURCE = 'https://mat.chinese.hku.hk/en/general/programme_structure/';
const COURSEWORK_SOURCE = 'https://mat.chinese.hku.hk/en/general/coursework_requirement/';
const PROGRAMME_SOURCE = 'https://mat.chinese.hku.hk/';
const ADMISSIONS_SOURCE = 'https://portal.hku.hk/tpg-admissions/programme-details?programme=master-of-arts-in-the-field-of-translation-arts';

const coreRows = [
  ['CHIN7201', 'Advanced Translation Studies', 'translation'],
  ['CHIN7202', 'Approaches to Translation', 'translation'],
  ['CHIN7203', 'Introduction to Interpreting', 'interpreting']
];

const electiveRows = [
  ['CHIN7204', 'Language Contrast for Translators', 'translation'],
  ['CHIN7205', 'Culture and Translation', 'translation'],
  ['CHIN7206', 'Translation of Government and Commercial Texts', 'translation'],
  ['CHIN7207', 'Legal Translation', 'translation'],
  ['CHIN7208', 'Mass Media Translation', 'translation'],
  ['CHIN7209', 'English-Chinese Conference Interpreting (SI)', 'interpreting'],
  ['CHIN7210', 'English-Cantonese Legal Interpreting', 'interpreting'],
  ['CHIN7212', 'Translation of Music Writings and Lyrics', 'translation'],
  ['CHIN7213', 'Financial Translation', 'translation'],
  ['CHIN7214', 'Subtitling in Film, Television and Beyond', 'translation'],
  ['CHIN7215', 'Translation of Social Science Writing', 'translation'],
  ['CHIN7216', 'Literary Translation: Chinese to English', 'translation'],
  ['CHIN7217', 'Literary Translation: English to Chinese', 'translation'],
  ['CHIN7218', 'Translation Criticism (E-C & C-E)', 'translation'],
  ['CHIN7219', 'AI-Assisted Translation of Case Law in Hong Kong', 'translation'],
  ['CHIN7220', 'Functional Translation in the Digital Age', 'translation'],
  ['CHIN7221', 'Theatre Translation', 'translation'],
  ['CHIN7222', 'Translating Humour', 'translation'],
  ['CHIN7223', 'Translation of Documents Relating to International Affairs', 'translation']
];

function sixCreditCourse([code, name, subjectGroup]) {
  return { code, name, credits: 6, subjectGroups: [subjectGroup], appliesToTrackIds: [] };
}

function buildSupplement() {
  assert.equal(coreRows.length, 3);
  assert.equal(coreRows.filter((row) => row[2] === 'translation').length, 2);
  assert.equal(coreRows.filter((row) => row[2] === 'interpreting').length, 1);
  assert.equal(electiveRows.length, 19, 'HKU MAT elective-course pool changed');
  assert.equal(electiveRows.filter((row) => row[2] === 'translation').length, 17);
  assert.equal(electiveRows.filter((row) => row[2] === 'interpreting').length, 2);
  assert.equal(new Set([...coreRows, ...electiveRows].map(([code]) => code)).size, 22);

  return {
    schemaVersion: 1,
    schoolCode: 'HKU',
    academicYear: '2025-26',
    verifiedAt: '2026-07-14',
    programmes: [{
      programmeId: 'HKU-TPG-019',
      status: 'verified',
      creditsRequired: 66,
      creditUnit: 'credits',
      sourceUrl: REGULATIONS_SOURCE,
      ruleReviewStatus: 'manual_review_required',
      statusNote: 'The official Regulations and Syllabuses apply to the 2024-25 and 2025-26 intakes and require 66 credits: three Core Courses, six Elective Courses and CHIN7996 Capstone Experience. The curriculum overview inside the PDF still says Module 2 contains 14 electives, but the same PDF has 19 current elective syllabuses and the official Programme Structure page explicitly says to choose six out of the same 19-course list. The 19-course official list is therefore retained, while the internal count conflict, Advanced Standing rules and three Capstone output formats remain marked for manual review.',
      courseGroups: [
        {
          id: 'module-1-core-courses',
          name: 'Module 1: Core Courses',
          type: 'core',
          creditsRequired: 18,
          coursesRequired: 3,
          ruleText: 'Complete all three 6-credit Core Courses for 18 credits. CHIN7201 and CHIN7202 are Translation lecture courses; CHIN7203 combines interpreting lectures and workshops.',
          appliesToTrackIds: [],
          sourceUrl: REGULATIONS_SOURCE,
          courses: coreRows.map(sixCreditCourse)
        },
        {
          id: 'module-2-elective-courses',
          name: 'Module 2: Elective Courses',
          type: 'elective',
          creditsRequired: 36,
          coursesRequired: 6,
          ruleText: 'Choose six 6-credit electives from the current official 19-course pool for 36 credits. Seventeen are Translation lecture courses and CHIN7209/CHIN7210 are Interpreting workshop courses. The PDF overview retains an older 14-elective count while its detailed syllabuses and the current Programme Structure page both list 19, so the conflict requires manual review.',
          appliesToTrackIds: [],
          sourceUrl: STRUCTURE_SOURCE,
          courses: electiveRows.map(sixCreditCourse)
        },
        {
          id: 'module-3-capstone-experience',
          name: 'Module 3: Capstone Experience',
          type: 'project',
          creditsRequired: 12,
          coursesRequired: 1,
          ruleText: 'Complete CHIN7996 for 12 credits. The official course permits a Translation project as either a long translation or a translation-studies paper, or an Interpreting project based on analysis of a recorded interpreted meeting. The format choice and supervision requirements require manual audit review.',
          appliesToTrackIds: [],
          sourceUrl: REGULATIONS_SOURCE,
          courses: [{
            code: 'CHIN7996',
            name: 'Capstone Experience: Translation / Interpreting Project',
            credits: 12,
            courseKind: 'project',
            appliesToTrackIds: []
          }]
        }
      ],
      additionalSources: [STRUCTURE_SOURCE, COURSEWORK_SOURCE, PROGRAMME_SOURCE, ADMISSIONS_SOURCE]
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
