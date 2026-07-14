const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const OUTPUT = path.join(ROOT, 'data', 'tpg-course-supplements', 'hku-buddhist-studies-2025.json');
const REGULATIONS_SOURCE = 'https://sweb.hku.hk/tola/servlet/ApplicantDownloadForm/getForm?pREF_CODE=R273&pDOCUMENT_TYPE=REGULATIONSYLLABUS&pVIEW=Y';
const PROGRAMME_SOURCE = 'https://www.buddhism.hku.hk/ap/mbs/admission/';
const ADMISSIONS_SOURCE = 'https://portal.hku.hk/tpg-admissions/programme-details?programme=master-of-buddhist-studies-arts&mode=full-time';

const foundationRows = [
  ['BSTC6079', 'Early Buddhism'],
  ['BSTC6002', 'Mahayana Buddhism']
];

const electiveRows = [
  ['BSTC7006', 'Pāli I', 'buddhist-languages'],
  ['BSTC7007', 'Pāli II', 'buddhist-languages'],
  ['BSTC3044', 'Pāli language III', 'buddhist-languages'],
  ['BSTC3045', 'Pāli language IV', 'buddhist-languages'],
  ['BSTC7008', 'Sanskrit I', 'buddhist-languages'],
  ['BSTC7009', 'Sanskrit II', 'buddhist-languages'],
  ['BSTC3040', 'Sanskrit language III', 'buddhist-languages'],
  ['BSTC3041', 'Sanskrit language IV', 'buddhist-languages'],
  ['BSTC7010', 'Classical Tibetan I', 'buddhist-languages'],
  ['BSTC7011', 'Classical Tibetan II', 'buddhist-languages'],
  ['BSTC3042', 'Tibetan language III', 'buddhist-languages'],
  ['BSTC3043', 'Tibetan language IV', 'buddhist-languages'],
  ['BSTC6032', 'History of Indian Buddhism: a general survey', 'texts-thought-culture'],
  ['BSTC6044', 'History of Chinese Buddhism', 'texts-thought-culture'],
  ['BSTC6013', 'Buddhism in Tibetan contexts: history and doctrines', 'texts-thought-culture'],
  ['BSTC6039', 'Abhidharma doctrines and controversies', 'texts-thought-culture'],
  ['BSTC6012', 'Japanese Buddhism: history and doctrines', 'texts-thought-culture'],
  ['BSTC6052', 'Study of important Buddhist meditation texts', 'texts-thought-culture'],
  ['BSTC6066', 'Doctrines of the early Indian Yogācāra', 'texts-thought-culture'],
  ['BSTC6070', 'Research methodology in Buddhist Studies', 'texts-thought-culture'],
  ['BSTC6075', 'The Pali commentarial literature', 'texts-thought-culture'],
  ['BSTC6076', 'The Buddha-concept and Bodhisatta Ideal in Theravada Buddhism', 'texts-thought-culture'],
  ['BSTC6080', 'Chinese Buddhist art along the Silk Road', 'texts-thought-culture'],
  ['BSTC7002', 'Tantric meditation traditions in Tibet: a survey of Vajrayāna texts and practices', 'texts-thought-culture'],
  ['BSTC7003', 'Dunhuang Buddhist art and culture', 'texts-thought-culture'],
  ['BSTC7110', 'Reading early Buddhist discourses', 'texts-thought-culture'],
  ['BSTC7111', 'Chan Buddhism: history, culture and thought', 'texts-thought-culture'],
  ['BSTC7119', 'Reading Chinese Buddhist texts', 'texts-thought-culture'],
  ['BSTC7607', 'Buddhist liturgy and rituals', 'texts-thought-culture'],
  ['BSTC7121', 'Chinese Buddhist texts: a survey and sample readings', 'texts-thought-culture'],
  ['BSTC7122', 'Yogācāra Models of Reality', 'texts-thought-culture'],
  ['BSTC7123', 'The concept of emptiness in Buddhist literature', 'texts-thought-culture'],
  ['BSTC7124', 'Anthropology of Buddhism', 'texts-thought-culture'],
  ['BSTC6058', 'Buddhism and contemporary society', 'applied-buddhism'],
  ['BSTC6006', 'Counselling and pastoral practice', 'applied-buddhism'],
  ['BSTC6011', 'Buddhist mediation', 'applied-buddhism'],
  ['BSTC6034', 'Mindfulness, stress reduction and well-being', 'applied-buddhism'],
  ['BSTC6055', 'Buddhist psychology I', 'applied-buddhism'],
  ['BSTC7004', 'Buddhist psychology II', 'applied-buddhism'],
  ['BSTC7112', 'Buddhist ethics', 'applied-buddhism'],
  ['BSTC7120', 'Buddhist psychology and mental cultivation', 'applied-buddhism'],
  ['BSTC6024', 'Special topics in Buddhist studies (1)', 'other-courses'],
  ['BSTC6030', 'Special topics in Buddhist studies (2)', 'other-courses'],
  ['BSTC6031', 'Special topics in Buddhist studies (3)', 'other-courses'],
  ['BSTC6056', 'Special topics in Buddhist studies (4)', 'other-courses'],
  ['BSTC6057', 'Special topics in Buddhist studies (5)', 'other-courses']
];

const capstoneRows = [
  ['BSTC8999', 'Capstone Experience: Dissertation', 'dissertation'],
  ['BSTC8002', 'Capstone Experience: Tantric meditation traditions in Tibet: a survey of Vajrayāna texts and practices', 'project'],
  ['BSTC8003', 'Capstone Experience: Dunhuang Buddhist art and culture', 'project'],
  ['BSTC8004', 'Capstone Experience: Buddhist psychology II', 'project'],
  ['BSTC8006', 'Capstone Experience: Counselling and pastoral practice', 'project'],
  ['BSTC8011', 'Capstone Experience: Buddhist mediation', 'project'],
  ['BSTC8012', 'Capstone Experience: Japanese Buddhism: history and doctrines', 'project'],
  ['BSTC8013', 'Capstone Experience: Buddhism in Tibetan contexts: history and doctrines', 'project'],
  ['BSTC8024', 'Capstone Experience: Special topics in Buddhist studies (1)', 'project'],
  ['BSTC8030', 'Capstone Experience: Special topics in Buddhist studies (2)', 'project'],
  ['BSTC8031', 'Capstone Experience: Special topics in Buddhist studies (3)', 'project'],
  ['BSTC8032', 'Capstone Experience: History of Indian Buddhism: a general survey', 'project'],
  ['BSTC8034', 'Capstone Experience: Mindfulness, stress reduction and well-being', 'project'],
  ['BSTC8039', 'Capstone Experience: Abhidharma doctrines and controversies', 'project'],
  ['BSTC8044', 'Capstone Experience: History of Chinese Buddhism', 'project'],
  ['BSTC8052', 'Capstone Experience: Study of important Buddhist meditation texts', 'project'],
  ['BSTC8055', 'Capstone Experience: Buddhist psychology I', 'project'],
  ['BSTC8056', 'Capstone Experience: Special topics in Buddhist studies (4)', 'project'],
  ['BSTC8057', 'Capstone Experience: Special topics in Buddhist studies (5)', 'project'],
  ['BSTC8058', 'Capstone Experience: Buddhism and contemporary society', 'project'],
  ['BSTC8066', 'Capstone Experience: Doctrines of the early Indian Yogācāra', 'project'],
  ['BSTC8075', 'Capstone Experience: The Pali commentarial literature', 'project'],
  ['BSTC8076', 'Capstone Experience: The Buddha-concept and Bodhisatta Ideal in Theravada Buddhism', 'project'],
  ['BSTC8080', 'Capstone Experience: Chinese Buddhist art along the Silk Road', 'project'],
  ['BSTC8110', 'Capstone Experience: Reading early Buddhist discourses', 'project'],
  ['BSTC8111', 'Capstone Experience: Chan Buddhism: history, culture and thought', 'project'],
  ['BSTC8112', 'Capstone Experience: Buddhist ethics', 'project'],
  ['BSTC8119', 'Capstone Experience: Reading Chinese Buddhist Texts', 'project'],
  ['BSTC8607', 'Capstone Experience: Buddhist liturgy and rituals', 'project'],
  ['BSTC8120', 'Capstone Experience: Buddhist psychology and mental cultivation', 'project'],
  ['BSTC8121', 'Capstone Experience: Chinese Buddhist texts: a survey and sample readings', 'project'],
  ['BSTC8122', 'Capstone Experience: Yogācāra Models of Reality', 'project'],
  ['BSTC8123', 'Capstone Experience: The concept of emptiness in Buddhist literature', 'project'],
  ['BSTC8124', 'Capstone Experience: Anthropology of Buddhism', 'project']
];

function buildSupplement() {
  assert.equal(foundationRows.length, 2);
  assert.equal(electiveRows.length, 46);
  assert.deepEqual(
    electiveRows.reduce((counts, row) => ({ ...counts, [row[2]]: (counts[row[2]] || 0) + 1 }), {}),
    { 'buddhist-languages': 12, 'texts-thought-culture': 21, 'applied-buddhism': 8, 'other-courses': 5 }
  );
  assert.equal(capstoneRows.length, 34);
  assert.equal(capstoneRows.filter((row) => row[2] === 'dissertation').length, 1);
  assert.equal(new Set([...foundationRows, ...electiveRows, ...capstoneRows].map(([code]) => code)).size, 82);

  return {
    schemaVersion: 1,
    schoolCode: 'HKU',
    academicYear: '2025-26 and thereafter',
    verifiedAt: '2026-07-14',
    programmes: [{
      programmeId: 'HKU-TPG-021',
      status: 'verified',
      creditsRequired: 60,
      creditUnit: 'credits',
      sourceUrl: REGULATIONS_SOURCE,
      ruleReviewStatus: 'manual_review_required',
      statusNote: 'The official Syllabuses apply to the 2025-26 intake and thereafter and are versioned Jul 18, 2025. The 60-credit curriculum requires both 9-credit Foundation Courses, five 6-credit Elective Courses and one 12-credit Capstone Experience. The Capstone is either BSTC8999 Dissertation or one of 33 subject-specific paths comprising an additional 6-credit elective plus a 6-credit portfolio. Annual offering, prerequisites, the one-Foundation-course Advanced Standing limit and the mutually exclusive Capstone paths require manual review.',
      courseGroups: [
        {
          id: 'foundation-courses',
          name: 'Foundation Courses',
          type: 'core',
          creditsRequired: 18,
          coursesRequired: 2,
          ruleText: 'Complete both 9-credit Foundation Courses for 18 credits. Advanced Standing may be granted for at most one equivalent Foundation Course completed within five years before admission, subject to Faculty approval; the substitution requires manual audit review.',
          appliesToTrackIds: [],
          sourceUrl: REGULATIONS_SOURCE,
          courses: foundationRows.map(([code, name]) => ({ code, name, credits: 9, appliesToTrackIds: [] }))
        },
        {
          id: 'elective-courses',
          name: 'Elective Courses',
          type: 'elective',
          creditsRequired: 30,
          coursesRequired: 5,
          ruleText: 'Choose five 6-credit electives for 30 credits from the four official categories: Buddhist Languages; Buddhist Texts, Thought, and Culture; Applied Buddhism; and Other Courses. Not every listed elective is necessarily offered each year. Prerequisites and any elective paired with a portfolio Capstone require manual review.',
          appliesToTrackIds: [],
          sourceUrl: REGULATIONS_SOURCE,
          courses: electiveRows.map(([code, name, category]) => ({ code, name, credits: 6, subjectGroups: [category], appliesToTrackIds: [] }))
        },
        {
          id: 'capstone-experience',
          name: 'Capstone Experience',
          type: 'project',
          creditsRequired: 12,
          coursesRequired: 1,
          ruleText: 'Choose one 12-credit Capstone path. BSTC8999 is a 10,000-15,000-word Dissertation. Each subject-specific Capstone comprises the named additional elective for 6 credits plus a 10,000-12,000-word portfolio for 6 credits. These mutually exclusive paths, elective pairing, prerequisite and approval rules require manual audit review.',
          appliesToTrackIds: [],
          sourceUrl: REGULATIONS_SOURCE,
          courses: capstoneRows.map(([code, name, courseKind]) => ({ code, name, credits: 12, courseKind, appliesToTrackIds: [] }))
        }
      ],
      additionalSources: [PROGRAMME_SOURCE, ADMISSIONS_SOURCE]
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
    courses: foundationRows.length + electiveRows.length + capstoneRows.length
  }));
}

if (require.main === module) main();
module.exports = { buildSupplement, foundationRows, electiveRows, capstoneRows };
