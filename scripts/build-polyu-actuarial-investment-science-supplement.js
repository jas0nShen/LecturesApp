const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const snapshotPath = path.join(ROOT, 'data', 'tpg-source-snapshots', 'polyu-2027.json');
const outputPath = path.join(ROOT, 'data', 'tpg-course-supplements', 'polyu-actuarial-investment-science-2027.json');
const PROGRAMME_ID = 'POLYU-TPG-075';
const SOURCE_URL = 'https://www.polyu.edu.hk/study/pg/tpg/2027/63032-afm-apm';
const CURRICULUM_URL = 'https://www.polyu.edu.hk/ama/study/pg/msc-actuarial-and-investment-science/curriculum/';

const compulsorySubjects = [
  ['AMA534', 'Credibility Theory', 3],
  ['AMA532', 'Investment Science', 3],
  ['AMA533', 'Life Contingencies', 3],
  ['AMA531', 'Loss Models and Risk Analysis', 3],
  ['AMA528', 'Probability and Stochastic Models', 3],
  ['AMA529', 'Statistical Inference', 3]
];

const additionalCoreSubjects = [
  ['AMA580', 'Advanced Topics in InsurTech', 3],
  ['AMA568', 'Advanced Topics in Quantitative Finance', 3],
  ['AMA514A', 'Applied Linear Models', 3],
  ['AMA570', 'Current Topics in Actuarial Science', 3],
  ['AMA515A', 'Forecasting and Applied Time Series Analysis', 3],
  ['AMA535', 'Mathematics of Derivative Pricing', 3],
  ['AMA530', 'Mathematics of Finance', 3],
  ['AMA505', 'Optimization Methods', 3],
  ['AF5312', 'Principles of Corporate Finance', 3],
  ['AMA567', 'Quantum Computing for Data Science', 3],
  ['DSAI5101', 'Statistical Data Mining', 3]
];

function buildSupplement() {
  const snapshot = JSON.parse(fs.readFileSync(snapshotPath, 'utf8'));
  const row = snapshot.rows.find((item) => item.programmeId === PROGRAMME_ID);
  assert(row, `Missing official snapshot row ${PROGRAMME_ID}`);
  assert.equal(row.sourceUrl, SOURCE_URL);
  assert.equal(row.officialSubjectArea, 'Actuarial and Investment Science');
  assert.equal(row.creditText, '31');
  assert.match(row.curriculumText, /6 Compulsory Subjects \(18 credits\) \+ 4 Elective Subjects \(12 credits\)/);
  assert.match(row.curriculumText, /1 Elective Subject \(3 credits\) \+ a Dissertation \(9 credits\)/);
  assert.match(row.curriculumText, /1-credit compulsory subject/);

  [...compulsorySubjects, ...additionalCoreSubjects].forEach(([, name]) => {
    assert(row.curriculumText.includes(name), `Official 2027 snapshot is missing ${name}`);
  });

  const allCodes = [
    ...compulsorySubjects,
    ...additionalCoreSubjects,
    ['AMA592', 'Dissertation', 9],
    ['DSAI5T09', 'Academic Integrity and Ethics in Computer and Mathematical Sciences', 1]
  ].map(([code]) => code);
  assert.equal(new Set(allCodes).size, 19);

  const course = ([code, name, credits], options = {}) => ({
    code,
    name,
    credits,
    appliesToTrackIds: [],
    sourceUrl: CURRICULUM_URL,
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
      statusNote: 'The official 2027 Programme page publishes the 31-credit award requirements and the current AMA Curriculum page publishes the matching subject codes and titles. Students complete six compulsory subjects and either four additional core subjects, or one additional core subject plus AMA592 Dissertation. DSAI5T09 is compulsory in both paths. The mutually exclusive taught and Dissertation paths require manual audit review and must not be combined.',
      courseGroups: [
        {
          id: 'compulsory-subjects',
          name: 'Compulsory Subjects',
          type: 'core',
          creditsRequired: 18,
          coursesRequired: 6,
          ruleText: 'Complete all six Compulsory Subjects for 18 credits.',
          appliesToTrackIds: [],
          sourceUrl: CURRICULUM_URL,
          courses: compulsorySubjects.map((row) => course(row))
        },
        {
          id: 'additional-core-subjects',
          name: 'Additional Core Subjects',
          type: 'elective',
          ruleText: 'Choose four Additional Core Subjects for 12 credits on the taught path, or one Additional Core Subject for 3 credits together with AMA592 Dissertation. The two paths are mutually exclusive.',
          appliesToTrackIds: [],
          sourceUrl: CURRICULUM_URL,
          courses: additionalCoreSubjects.map((row) => course(row))
        },
        {
          id: 'dissertation-option',
          name: 'Dissertation Option',
          type: 'dissertation',
          ruleText: 'AMA592 Dissertation is a 9-credit alternative to three of the four Additional Core Subjects and must be combined with one 3-credit Additional Core Subject.',
          appliesToTrackIds: [],
          sourceUrl: CURRICULUM_URL,
          courses: [course(['AMA592', 'Dissertation', 9], {
            courseKind: 'dissertation',
            conditionalRequirement: true
          })]
        },
        {
          id: 'academic-integrity',
          name: 'Academic Integrity and Ethics',
          type: 'academic_integrity',
          creditsRequired: 1,
          coursesRequired: 1,
          ruleText: 'Complete DSAI5T09 for 1 credit in either award path.',
          appliesToTrackIds: [],
          sourceUrl: CURRICULUM_URL,
          courses: [course(['DSAI5T09', 'Academic Integrity and Ethics in Computer and Mathematical Sciences', 1])]
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
