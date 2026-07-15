const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const snapshotPath = path.join(ROOT, 'data', 'tpg-source-snapshots', 'polyu-2027.json');
const outputPath = path.join(ROOT, 'data', 'tpg-course-supplements', 'polyu-chinese-culture-2027.json');
const PROGRAMME_ID = 'POLYU-TPG-086';
const SOURCE_URL = 'https://www.polyu.edu.hk/study/pg/tpg/2027/77002-maf-map';
const SUBJECT_LIST_URL = 'https://www.polyu.edu.hk/chc/study/ma/ma-list-of-all-subjects/?sc_lang=en';
const SUBJECT_PDF_ROOT = 'https://www.polyu.edu.hk/chc/-/media/department/chc/content/study/master-of-arts-ma';

const compulsorySubjects = [
  ['CHC5001', 'Introduction to the Study of Chinese Culture', 3, 'chc5001.pdf'],
  ['CHC5002', 'Studying Chinese Culture through Fieldtrips', 3, 'chc5002.pdf']
];

const coreArea1Subjects = [
  ['CHC5101', 'Chinese Dietary Culture', 3, 'chc5101.pdf'],
  ['CHC5102', 'Chinese Customs and Etiquettes', 3, 'ma/chc5102.pdf'],
  ['CHC5103', 'Underground Societies in China', 3, 'chc5103.pdf'],
  ['CHC5104', 'Folk Beliefs and Occult Science', 3, 'chc5104.pdf'],
  ['CHC5105', 'Gender and Sexuality in Modern China', 3, 'chc5105.pdf'],
  ['CHC5107', 'Special Topic on Society and Culture', 3, 'chc5107.pdf'],
  ['CHC5115', 'Modern China’s Intra-Asian Political and Cultural Relations', 3, 'chc5115.pdf'],
  ['CHC5116', 'China’s Frontiers: Society, History & Culture', 3, 'chc5116.pdf'],
  ['CHC5117', 'The Culture of Work in Contemporary China: From Maoist China to Reform and Opening-Up to the Age of Artificial Intelligence', 3, 'chc5117.pdf'],
  ['CHC5118', 'Society and Culture of Civil Service Examinations in Premodern China', 3, 'chc5118.pdf'],
  ['CHC5119', 'Chinese-Language Cinema and Society', 3, 'chc5119.pdf']
];

const coreArea2Subjects = [
  ['CHC5201', 'Government and Education in Confucianism', 3, 'chc5201.pdf'],
  ['CHC5202', 'Buddhism and Chinese Culture', 3, 'ma/chc5202.pdf'],
  ['CHC5203', 'Daoism and Chinese Culture', 3, 'chc5203.pdf'],
  ['CHC5204', 'Islam, Christianity and Chinese Culture', 3, 'chc5204.pdf'],
  ['CHC5205', 'Special Topic on Religions and Thought', 3, 'chc5205.pdf'],
  ['CHC5211', 'Early Chinese Thought, Belief, and Technology', 3, 'chc5211.pdf'],
  ['CHC5212', 'Song-Ming Confucianism', 3, 'chc5212.pdf'],
  ['CHC5213', 'The Making of Chinese Martial Arts Tradition', 3, 'chc5213.pdf'],
  ['CHC5214', 'Science, Technology and Thought in China', 3, 'chc5214.pdf']
];

const coreArea3Subjects = [
  ['CHC5301', 'Expressions and Applications of Chinese Writing', 3, 'chc5301.pdf'],
  ['CHC5302', 'Appreciation of Chinese Classical Rhymed Writings', 3, 'chc5302.pdf'],
  ['CHC5304', 'Chinese Traditional Theatre and Performing Arts', 3, 'chc5304.pdf'],
  ['CHC5305', 'Special Topic on Literature and Arts', 3, 'ma/chc5305.pdf'],
  ['CHC5311', 'Classical Chinese Fiction', 3, 'chc5311.pdf'],
  ['CHC5312', 'Modern Chinese Literature', 3, 'ma/chc5312.pdf'],
  ['CHC5313', 'Music and Language in Traditional Chinese Poetry and Drama', 3, 'chc5313.pdf'],
  ['CHC5314', 'The Book of Poetry and Chinese Culture', 3, 'chc5314.pdf'],
  ['CHC5315', 'A History of Chinese Calligraphy and Painting', 3, 'chc5315.pdf']
];

const freeElectiveSubjects = [
  ['CHC5401', 'Businessmen and Business Culture in China', 3, 'chc5401.pdf'],
  ['CHC5405', 'Special Topic on Business, Tourism and Cultural Management', 3, 'chc5405.pdf'],
  ['CHC5406', 'Great Works on Chinese Geography and Travel', 3, 'ma/chc5406.pdf'],
  ['CHC5409', 'Chinese Studies and Generative AI: Opportunity, Challenge, and Ethics', 3, 'ma/chc5409.pdf'],
  ['CHC5502', 'Selected Topics and Readings in Chinese Culture', 3, 'ma/chc5502.pdf']
];

const dissertationSubjects = [
  ['CHC5503', 'MA Dissertation (For full-time students)', 9, 'chc5503_chc5504.pdf'],
  ['CHC5504', 'MA Dissertation (For part-time students)', 9, 'chc5503_chc5504.pdf']
];

function buildSupplement() {
  const snapshot = JSON.parse(fs.readFileSync(snapshotPath, 'utf8'));
  const row = snapshot.rows.find((item) => item.programmeId === PROGRAMME_ID);
  assert(row, `Missing official snapshot row ${PROGRAMME_ID}`);
  assert.equal(row.sourceUrl, SOURCE_URL);
  assert.equal(row.officialSubjectArea, 'Chinese Culture');
  assert.equal(row.creditText, '31');
  assert.match(row.curriculumText, /For the MA Non-Dissertation Option/);
  assert.match(row.curriculumText, /5\s+Elective Subjects from any area \(15 credits\)/);
  assert.match(row.curriculumText, /For the MA Dissertation Option/);
  assert.match(row.curriculumText, /2\s+Elective Subjects from any area \(6 credits\)/);
  assert.match(row.curriculumText, /MA Dissertation \(9 credits\)/);
  assert.match(row.curriculumText, /Postgraduate Diploma \(PgD\)/);

  const normalizedCurriculumText = row.curriculumText.replace(/\s+/g, ' ');
  [
    ...compulsorySubjects,
    ...coreArea1Subjects,
    ...coreArea2Subjects,
    ...coreArea3Subjects.filter(([code]) => code !== 'CHC5301'),
    ...freeElectiveSubjects
  ].forEach(([, name]) => {
    assert(normalizedCurriculumText.includes(name), `Official 2027 snapshot is missing ${name}`);
  });
  assert(normalizedCurriculumText.includes('Expression and Application of Chinese Writing'));
  assert(normalizedCurriculumText.includes('Academic Integrity and Ethics in China-related Humanities'));

  const allCodes = [
    ...compulsorySubjects,
    ...coreArea1Subjects,
    ...coreArea2Subjects,
    ...coreArea3Subjects,
    ...freeElectiveSubjects,
    ...dissertationSubjects,
    ['CHC5T06']
  ].map(([code]) => code);
  assert.equal(allCodes.length, 39);
  assert.equal(new Set(allCodes).size, 39);

  const course = ([code, name, credits, pdf], options = {}) => ({
    code,
    name,
    credits,
    appliesToTrackIds: [],
    sourceUrl: `${SUBJECT_PDF_ROOT}/${pdf}`,
    ...options
  });

  return {
    schemaVersion: 1,
    schoolCode: 'POLYU',
    academicYear: '2027-28',
    verifiedAt: '2026-07-15',
    programmes: [{
      programmeId: PROGRAMME_ID,
      status: 'verified',
      creditsRequired: 31,
      creditUnit: 'credits',
      sourceUrl: SOURCE_URL,
      ruleReviewStatus: 'manual_review_required',
      statusNote: 'The official 2027 Programme page publishes both 31-credit MA paths and the current Department of Chinese History and Culture subject table publishes the matching codes, titles, credits and Subject Description PDFs. Both paths require the two Compulsory Subjects, the 1-credit AIE subject and at least one subject from each of the three Core Areas. The Non-Dissertation path then requires five additional electives from any published area; the Dissertation path requires two additional electives plus either CHC5503 for full-time students or CHC5504 for part-time students. The shared cross-area elective quota requires manual audit review, and the two mutually exclusive mode-specific Dissertation codes must not be combined. The PgD exit award is not modelled as an MA completion path. The current CHC table and CHC5301 Subject Description use “Expressions and Applications of Chinese Writing”, while the 2027 Programme page uses the singular “Expression and Application”; the current Subject Description title is retained.',
      courseGroups: [
        {
          id: 'compulsory-subjects',
          name: 'Compulsory Subjects',
          type: 'core',
          creditsRequired: 6,
          coursesRequired: 2,
          ruleText: 'Complete both 3-credit Compulsory Subjects for either MA path.',
          appliesToTrackIds: [],
          sourceUrl: SUBJECT_LIST_URL,
          courses: compulsorySubjects.map((item) => course(item))
        },
        {
          id: 'core-area-1',
          name: 'Core Area 1: Society and Culture',
          type: 'elective',
          creditsRequired: 3,
          coursesRequired: 1,
          ruleText: 'Complete at least one 3-credit subject from Core Area 1 for either MA path. Additional subjects from this area may count toward the shared cross-area elective quota.',
          appliesToTrackIds: [],
          sourceUrl: SUBJECT_LIST_URL,
          courses: coreArea1Subjects.map((item) => course(item))
        },
        {
          id: 'core-area-2',
          name: 'Core Area 2: Religions and Thought',
          type: 'elective',
          creditsRequired: 3,
          coursesRequired: 1,
          ruleText: 'Complete at least one 3-credit subject from Core Area 2 for either MA path. Additional subjects from this area may count toward the shared cross-area elective quota.',
          appliesToTrackIds: [],
          sourceUrl: SUBJECT_LIST_URL,
          courses: coreArea2Subjects.map((item) => course(item))
        },
        {
          id: 'core-area-3',
          name: 'Core Area 3: Literature and Arts',
          type: 'elective',
          creditsRequired: 3,
          coursesRequired: 1,
          ruleText: 'Complete at least one 3-credit subject from Core Area 3 for either MA path. Additional subjects from this area may count toward the shared cross-area elective quota.',
          appliesToTrackIds: [],
          sourceUrl: SUBJECT_LIST_URL,
          courses: coreArea3Subjects.map((item) => course(item))
        },
        {
          id: 'free-electives',
          name: 'Other Free Elective Subjects',
          type: 'elective',
          ruleText: 'These subjects may count toward the five additional electives required on the Non-Dissertation path or the two additional electives required on the Dissertation path. The quota is shared with additional subjects from Core Areas 1, 2 and 3, so it requires manual audit review.',
          appliesToTrackIds: [],
          sourceUrl: SUBJECT_LIST_URL,
          courses: freeElectiveSubjects.map((item) => course(item))
        },
        {
          id: 'dissertation-option',
          name: 'MA Dissertation Option',
          type: 'dissertation',
          ruleText: 'On the Dissertation path, full-time students complete CHC5503 and part-time students complete CHC5504. Each is a 9-credit MA Dissertation; the two mode-specific codes are alternatives and must not be combined.',
          appliesToTrackIds: [],
          sourceUrl: `${SUBJECT_PDF_ROOT}/chc5503_chc5504.pdf`,
          courses: dissertationSubjects.map((item) => course(item, {
            courseKind: 'dissertation',
            conditionalRequirement: true
          }))
        },
        {
          id: 'academic-integrity',
          name: 'Academic Integrity and Ethics',
          type: 'academic_integrity',
          creditsRequired: 1,
          coursesRequired: 1,
          ruleText: 'Complete CHC5T06 for 1 credit in either MA path.',
          appliesToTrackIds: [],
          sourceUrl: SUBJECT_LIST_URL,
          courses: [course(['CHC5T06', 'Academic Integrity and Ethics in China-related Humanities', 1, 'chc5t06.pdf'])]
        }
      ]
    }]
  };
}

function main() {
  const supplement = buildSupplement();
  fs.writeFileSync(outputPath, `${JSON.stringify(supplement, null, 2)}\n`);
  console.log(JSON.stringify({
    ok: true,
    output: path.relative(ROOT, outputPath),
    programmes: supplement.programmes.length,
    courses: supplement.programmes[0].courseGroups.reduce((count, group) => count + group.courses.length, 0)
  }));
}

if (require.main === module) main();

module.exports = { buildSupplement };
