const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const OUTPUT = path.join(ROOT, 'data', 'tpg-course-supplements', 'hku-chinese-language-literature-2025.json');
const REGULATIONS_SOURCE = 'https://sweb.hku.hk/tola/servlet/ApplicantDownloadForm/getForm?pREF_CODE=R300&pDOCUMENT_TYPE=REGULATIONSYLLABUS&pVIEW=Y';
const REQUIREMENT_SOURCE = 'https://macll.chinese.hku.hk/zh-hant/general/coursework_requirement/';

const electiveRows = [
  ['CHIN6101', 'Special Topics in Chinese Etymology', 'chinese-language'],
  ['CHIN6104', 'Special Topics in Ancient Chinese', 'chinese-language'],
  ['CHIN6105', 'Special Topics in Modern Chinese', 'chinese-language'],
  ['CHIN7102', 'Studies in Cantonese', 'chinese-language'],
  ['CHIN7110', 'Topics in Chinese Dialectology and Historical Linguistics', 'chinese-language'],
  ['CHIN7111', 'Theory and Practice: Frontiers in Chinese Lexicology', 'chinese-language'],
  ['CHIN6201', 'Special Topics in Classical Poetry', 'chinese-literature'],
  ['CHIN6202', 'Special Topics in ci and qu Verse', 'chinese-literature'],
  ['CHIN6203', 'Special Topics in Ancient Prose', 'chinese-literature'],
  ['CHIN6208', 'Special Topics in Modern and Contemporary Literature', 'chinese-literature'],
  ['CHIN6209', 'Studies in Literary Creation', 'chinese-literature'],
  ['CHIN7105', 'Studies in Classical Chinese Fiction', 'chinese-literature'],
  ['CHIN7108', 'Topical Studies of Chinese Women\'s Literature', 'chinese-literature'],
  ['CHIN7112', 'Love, Sex, and Gender in Traditional Chinese Popular Literature', 'chinese-literature'],
  ['CHIN7113', 'Topics in Sinophone Studies', 'chinese-literature'],
  ['CHIN7114', 'Topical Studies of Hong Kong Literature', 'chinese-literature'],
  ['CHIN6301', 'Special Topics in Confucian Classics', 'chinese-culture'],
  ['CHIN6304', 'Special Topics in Chinese Culture', 'chinese-culture'],
  ['CHIN7008', 'Intellectual History of Pre-Qin China', 'chinese-culture'],
  ['CHIN7014', 'History of Women and Gender in China', 'chinese-culture'],
  ['CHIN7109', 'Exploring Chinese Culture: Field Study', 'chinese-culture'],
  ['CHIN7115', 'Topics in Hong Kong Culture', 'chinese-culture'],
  ['CHIN7107', 'Seminar: Special Topics in Chinese Language, Literature and Culture', 'seminar']
];

function course([code, name, subjectGroup], credits = 6) {
  return { code, name, credits, subjectGroups: [subjectGroup], appliesToTrackIds: [] };
}

function buildSupplement() {
  assert.equal(electiveRows.length, 23, 'HKU MACLL elective-course pool changed');
  assert.equal(new Set(electiveRows.map(([code]) => code)).size, 23);

  return {
    schemaVersion: 1,
    schoolCode: 'HKU',
    academicYear: '2024-25 and thereafter',
    verifiedAt: '2026-07-14',
    programmes: [{
      programmeId: 'HKU-TPG-012',
      status: 'verified',
      creditsRequired: 60,
      creditUnit: 'credits',
      sourceUrl: REGULATIONS_SOURCE,
      ruleReviewStatus: 'manual_review_required',
      statusNote: 'The official regulations apply to 2024-25 and thereafter. Students complete eight 6-credit elective courses selected from the four published categories plus the 12-credit CHIN7995 Capstone Experience. The cross-category eight-course selection and cycle-dependent course offering require manual audit review.',
      courseGroups: [
        {
          id: 'elective-courses',
          name: 'Elective Courses',
          type: 'elective',
          creditsRequired: 48,
          coursesRequired: 8,
          ruleText: 'Complete eight 6-credit elective courses selected from the published Chinese Language, Chinese Literature, Chinese Culture and Seminar categories. Courses are offered by cycle; this list does not imply that every course runs in every semester. The cross-category selection requires manual audit review.',
          appliesToTrackIds: [],
          sourceUrl: REGULATIONS_SOURCE,
          courses: electiveRows.map((row) => course(row))
        },
        {
          id: 'capstone-experience',
          name: 'Capstone Experience',
          type: 'dissertation',
          creditsRequired: 12,
          coursesRequired: 1,
          ruleText: 'Complete CHIN7995 Capstone Experience: Dissertation in Chinese Language and Literature for 12 credits.',
          appliesToTrackIds: [],
          sourceUrl: REQUIREMENT_SOURCE,
          courses: [{
            code: 'CHIN7995',
            name: 'Capstone Experience: Dissertation in Chinese Language and Literature',
            credits: 12,
            courseKind: 'dissertation',
            appliesToTrackIds: []
          }]
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
    courses: electiveRows.length + 1
  }));
}

if (require.main === module) main();
module.exports = { buildSupplement, electiveRows };
