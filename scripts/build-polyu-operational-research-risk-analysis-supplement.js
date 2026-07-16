const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const snapshotPath = path.join(ROOT, 'data', 'tpg-source-snapshots', 'polyu-2027.json');
const actuarialSupplementPath = path.join(ROOT, 'data', 'tpg-course-supplements', 'polyu-actuarial-investment-science-2027.json');
const outputPath = path.join(ROOT, 'data', 'tpg-course-supplements', 'polyu-operational-research-risk-analysis-2027.json');
const PROGRAMME_ID = 'POLYU-TPG-076';
const SOURCE_URL = 'https://www.polyu.edu.hk/study/pg/tpg/2027/63024-ofm-opm';
const CURRICULUM_URL = 'https://www.polyu.edu.hk/ama/study/pg/master-operational-and-risk-analysis/curriculum/';
const INSURTECH_SOURCE_URL = 'https://www.polyu.edu.hk/ama/study/pg/msc-actuarial-and-investment-science/curriculum/';

const compulsorySubjects = [
  ['AMA542', 'Advanced Operations Research Methods', 3],
  ['AMA540', 'Business Forecasting', 3],
  ['AMA539', 'Financial Modeling', 3],
  ['AMA502', 'Operations Research Methods', 3],
  ['AMA538', 'Principles of Risk Analysis', 3],
  ['AMA528', 'Probability and Stochastic Models', 3],
  ['AMA541', 'Simulation and Risk Analysis', 3]
];

const electiveSubjects = [
  ['AMA580', 'Advanced Topics in InsurTech', 3, INSURTECH_SOURCE_URL],
  ['AMA568', 'Advanced Topics in Quantitative Finance', 3],
  ['AF5322', 'Corporate Risk Management', 3],
  ['AF5341', 'Economics for Financial Analysis', 3],
  ['AMA532', 'Investment Science', 3],
  ['AMA535', 'Mathematics of Derivative Pricing', 3],
  ['AMA530', 'Mathematics of Finance', 3],
  ['AMA505', 'Optimisation Methods', 3],
  ['AF5312', 'Principles of Corporate Finance', 3],
  ['AMA567', 'Quantum Computing for Data Science', 3],
  ['AMA524', 'Scientific Computing', 3],
  ['DSAI5101', 'Statistical Data Mining', 3],
  ['AMA529', 'Statistical Inference', 3],
  ['AMA569', 'Stochastic Models for Carbon Pricing and Trading', 3],
  ['LGT5015', 'Supply Chain Management', 3]
];

function buildSupplement() {
  const snapshot = JSON.parse(fs.readFileSync(snapshotPath, 'utf8'));
  const row = snapshot.rows.find((item) => item.programmeId === PROGRAMME_ID);
  assert(row, `Missing official snapshot row ${PROGRAMME_ID}`);
  assert.equal(row.sourceUrl, SOURCE_URL);
  assert.equal(row.officialSubjectArea, 'Operational Research and Risk Analysis');
  assert.equal(row.creditText, '31');
  assert.match(row.curriculumText, /7 Compulsory Subjects \(21 credits\)/);
  assert.match(row.curriculumText, /3 Elective Subjects \(9 credits\) or a Dissertation \(9 credits\)/);
  assert.match(row.curriculumText, /1-credit compulsory subject/);

  [...compulsorySubjects, ...electiveSubjects].forEach(([, name]) => {
    assert(row.curriculumText.includes(name), `Official 2027 snapshot is missing ${name}`);
  });

  const actuarialSupplement = JSON.parse(fs.readFileSync(actuarialSupplementPath, 'utf8'));
  const actuarialCourses = actuarialSupplement.programmes[0].courseGroups.flatMap((group) => group.courses);
  const insurtech = actuarialCourses.find((course) => course.code === 'AMA580');
  assert.deepEqual(
    [insurtech && insurtech.name, insurtech && insurtech.credits, insurtech && insurtech.sourceUrl],
    ['Advanced Topics in InsurTech', 3, INSURTECH_SOURCE_URL],
    'The official AMA curriculum must continue to identify AMA580 before it is shared with Operational Research and Risk Analysis'
  );

  const allCodes = [
    ...compulsorySubjects,
    ...electiveSubjects,
    ['AMA592', 'Dissertation', 9],
    ['DSAI5T09', 'Academic Integrity and Ethics in Computer and Mathematical Sciences', 1]
  ].map(([code]) => code);
  assert.equal(new Set(allCodes).size, 24);

  const course = ([code, name, credits, sourceUrl], options = {}) => ({
    code,
    name,
    credits,
    appliesToTrackIds: [],
    sourceUrl: sourceUrl || CURRICULUM_URL,
    ...options
  });

  return {
    schemaVersion: 1,
    schoolCode: 'POLYU',
    academicYear: '2027-28',
    verifiedAt: '2026-07-16',
    programmes: [{
      programmeId: PROGRAMME_ID,
      status: 'verified',
      creditsRequired: 31,
      creditUnit: 'credits',
      sourceUrl: SOURCE_URL,
      ruleReviewStatus: 'manual_review_required',
      statusNote: 'The official 2027 Programme page publishes the complete 31-credit structure and title pool. The current Operational Research and Risk Analysis Curriculum page maps the seven Compulsory Subjects, fourteen of the fifteen current Elective titles, DSAI5T09 and AMA592 to official codes. The current official AMA Actuarial and Investment Science curriculum independently maps the remaining exact-title Elective Advanced Topics in InsurTech to AMA580 for 3 credits. The older AMA570 Current Topics in Actuarial Science entry on the Operational Research curriculum page is not included because the 2027 Programme page omits it. Statistical Data Mining is stored under the current DSAI5101 code rather than duplicating the AMA546 cross-list. The three-Elective and Dissertation paths are mutually exclusive and require manual audit review.',
      courseGroups: [
        {
          id: 'compulsory-subjects',
          name: 'Compulsory Subjects',
          type: 'core',
          creditsRequired: 21,
          coursesRequired: 7,
          ruleText: 'Complete all seven Compulsory Subjects for 21 credits during the first year of study.',
          appliesToTrackIds: [],
          sourceUrl: CURRICULUM_URL,
          courses: compulsorySubjects.map((row) => course(row))
        },
        {
          id: 'elective-subjects',
          name: 'Elective Subjects',
          type: 'elective',
          creditsRequired: 9,
          coursesRequired: 3,
          ruleText: 'Complete three 3-credit Elective Subjects from the official 2027 pool. This taught path is mutually exclusive with AMA592 Dissertation.',
          appliesToTrackIds: [],
          sourceUrl: SOURCE_URL,
          courses: electiveSubjects.map((row) => course(row))
        },
        {
          id: 'dissertation-option',
          name: 'Dissertation Option',
          type: 'dissertation',
          creditsRequired: 9,
          coursesRequired: 1,
          ruleText: 'Complete AMA592 Dissertation for 9 credits instead of the three Elective Subjects.',
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
