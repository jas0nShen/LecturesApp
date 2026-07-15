const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const snapshotPath = path.join(ROOT, 'data', 'tpg-source-snapshots', 'polyu-2027.json');
const outputPath = path.join(ROOT, 'data', 'tpg-course-supplements', 'polyu-ama-finance-ai-2027.json');
const AIE = ['DSAI5T09', 'Academic Integrity and Ethics in Computer and Mathematical Sciences', 1];

const configs = [{
  programmeId: 'POLYU-TPG-077',
  subjectArea: 'Quantitative Finance and FinTech',
  sourceUrl: 'https://www.polyu.edu.hk/study/pg/tpg/2027/63029-qfm-qpm',
  curriculumUrl: 'https://www.polyu.edu.hk/ama/study/pg/master-quantitative-finance-and-fintech/curriculum/',
  compulsory: [
    ['AMA576', 'Advanced Topics in Algorithmic Trading', 3],
    ['AMA575', 'Advanced Topics in Investment Science', 3],
    ['AMA568', 'Advanced Topics in Quantitative Finance', 3],
    ['AF5381', 'Financial Markets', 3],
    ['AMA571', 'Financial Technology', 3],
    ['AMA535A', 'Mathematical Models of Derivative Pricing', 3]
  ],
  electives: [
    ['AF5115', 'Accounting for Business Analysis', 3],
    ['AMA570', 'Current Topics in Actuarial Science', 3],
    ['AMA564', 'Deep Learning', 3],
    ['AMA572', 'Fixed-income and Credit Risk', 3],
    ['AMA515A', 'Forecasting and Applied Time Series Analysis', 3],
    ['COMP5564', 'Machine Learning and Applications in Finance', 3],
    ['AMA538', 'Principles of Risk Analysis', 3],
    ['AMA567', 'Quantum Computing for Data Science', 3],
    ['AMA573', 'Statistical Machine Learning', 3]
  ],
  dissertations: [['AMA592', 'Dissertation', 9]],
  compulsoryCount: 6,
  compulsoryCredits: 18,
  taughtElectiveCount: 4,
  taughtElectiveCredits: 12,
  dissertationElectiveCount: 1,
  dissertationElectiveCredits: 3,
  statusNote: 'The official 2027 Programme page and current AMA Curriculum page publish the same 31-credit structure and matching subject list. Students complete six compulsory subjects and either four electives, or one elective plus AMA592 Dissertation. DSAI5T09 is compulsory in both paths. The Dissertation path is subject to the official GPA eligibility rule, and the mutually exclusive paths require manual audit review.'
}, {
  programmeId: 'POLYU-TPG-078',
  subjectArea: 'Mathematics for Artificial Intelligence Technology',
  sourceUrl: 'https://www.polyu.edu.hk/study/pg/tpg/2027/63031-afm-apm',
  curriculumUrl: 'https://www.polyu.edu.hk/ama/study/pg/master-mathematics-for-articificial-intellegence-technology/curriculum/',
  compulsory: [
    ['AMA564', 'Deep Learning', 3],
    ['AMA578', 'Emerging Topics in Mathematics and AI', 3],
    ['AMA574', 'Generative AI and Foundation Models', 3],
    ['DSAI5105', 'Hands-on AI for Science and Technology', 3],
    ['DSAI5104', 'Optimization for Machine Learning', 3],
    ['AMA528', 'Probability and Stochastic Models', 3],
    ['AMA577', 'Theoretical Aspects of Reinforcement Learning', 3]
  ],
  electives: [
    ['AMA576', 'Advanced Topics in Algorithmic Trading', 3],
    ['AMA571', 'Financial Technology', 3],
    ['AMA579', 'Learning Theory for AI', 3],
    ['AMA567', 'Quantum Computing for Data Science', 3],
    ['AMA524', 'Scientific Computing', 3],
    ['AMA569', 'Stochastic Models for Carbon Pricing and Trading', 3],
    ['BME5150', 'Medical Artificial Intelligence and Data Analytics', 3],
    ['COMP5554', 'Advanced Artificial Intelligence', 3],
    ['COMP5434', 'Big Data Computing', 3],
    ['COMP5523', 'Computer Vision and Image Processing', 3],
    ['COMP5355', 'Cyber and Internet Security', 3],
    ['COMP5112', 'Data Structures and Database Systems', 3],
    ['COMP5423', 'Natural Language Processing', 3],
    ['DSAI5103', 'Advanced High Dimensional Data Analysis', 3],
    ['DSAI5203', 'Brain-inspired Computing', 3],
    ['DSAI5204', 'Efficient Data Processing', 3],
    ['DSAI5206', 'Machine Vision and Intelligence', 3],
    ['DSAI5208', 'Trustworthy AI Systems and Technologies', 3],
    ['DSAI5209', 'Visual Data Representation and Processing', 3]
  ],
  dissertations: [
    ['AMA592', 'Dissertation', 9],
    ['DSAI5901', 'Dissertation', 9]
  ],
  compulsoryCount: 7,
  compulsoryCredits: 21,
  taughtElectiveCount: 3,
  taughtElectiveCredits: 9,
  dissertationElectiveCount: 0,
  dissertationElectiveCredits: 0,
  statusNote: 'The official 2027 Programme page and current AMA Curriculum page publish the same 31-credit structure with AMA, BME, COMP and DSAI subject codes. Students complete seven compulsory subjects and either three electives, or one 9-credit Dissertation. AMA528 is listed by the official page as both compulsory and elective; it is stored once as compulsory and must not be double counted. The mutually exclusive taught and Dissertation paths require manual audit review.'
}];

function buildProgramme(config, snapshot) {
  const row = snapshot.rows.find((item) => item.programmeId === config.programmeId);
  assert(row, `Missing official snapshot row ${config.programmeId}`);
  assert.equal(row.sourceUrl, config.sourceUrl);
  assert.equal(row.officialSubjectArea, config.subjectArea);
  assert.equal(row.creditText, '31');
  assert.match(row.curriculumText, new RegExp(`${config.compulsoryCount} Compulsory Subjects? \\(${config.compulsoryCredits} credits\\)`, 'i'));
  assert.match(row.curriculumText, /1-credit compulsory subject/);

  [...config.compulsory, ...config.electives].forEach(([, name]) => {
    assert(row.curriculumText.includes(name), `${config.programmeId} official snapshot is missing ${name}`);
  });
  config.dissertations.forEach(([, name]) => {
    assert(row.curriculumText.includes(name), `${config.programmeId} official snapshot is missing ${name}`);
  });

  const allCodes = [...config.compulsory, ...config.electives, ...config.dissertations, AIE].map(([code]) => code);
  assert.equal(new Set(allCodes).size, allCodes.length, `${config.programmeId} repeats a subject code`);

  const course = ([code, name, credits], options = {}) => ({
    code,
    name,
    credits,
    appliesToTrackIds: [],
    sourceUrl: config.curriculumUrl,
    ...options
  });

  const electiveRule = config.dissertationElectiveCount
    ? `Choose ${config.taughtElectiveCount} Elective Subjects for ${config.taughtElectiveCredits} credits on the taught path, or ${config.dissertationElectiveCount} Elective Subject for ${config.dissertationElectiveCredits} credits with a 9-credit Dissertation.`
    : `Choose ${config.taughtElectiveCount} Elective Subjects for ${config.taughtElectiveCredits} credits on the taught path, or complete one 9-credit Dissertation instead.`;

  return {
    programmeId: config.programmeId,
    status: 'verified',
    creditsRequired: 31,
    creditUnit: 'credits',
    sourceUrl: config.sourceUrl,
    ruleReviewStatus: 'manual_review_required',
    statusNote: config.statusNote,
    courseGroups: [{
      id: 'compulsory-subjects',
      name: 'Compulsory Subjects',
      type: 'core',
      creditsRequired: config.compulsoryCredits,
      coursesRequired: config.compulsoryCount,
      ruleText: `Complete all ${config.compulsoryCount} Compulsory Subjects for ${config.compulsoryCredits} credits.`,
      appliesToTrackIds: [],
      sourceUrl: config.curriculumUrl,
      courses: config.compulsory.map((item) => course(item))
    }, {
      id: 'elective-subjects',
      name: 'Elective Subjects',
      type: 'elective',
      ruleText: electiveRule,
      appliesToTrackIds: [],
      sourceUrl: config.curriculumUrl,
      courses: config.electives.map((item) => course(item))
    }, {
      id: 'dissertation-option',
      name: 'Dissertation Option',
      type: 'dissertation',
      ruleText: config.dissertationElectiveCount
        ? `Complete one 9-credit Dissertation together with ${config.dissertationElectiveCount} Elective Subject for ${config.dissertationElectiveCredits} credits as an alternative to the taught path.`
        : 'Complete one 9-credit Dissertation as an alternative to three Elective Subjects.',
      appliesToTrackIds: [],
      sourceUrl: config.curriculumUrl,
      courses: config.dissertations.map((item) => course(item, {
        courseKind: 'dissertation',
        conditionalRequirement: true
      }))
    }, {
      id: 'academic-integrity',
      name: 'Academic Integrity and Ethics',
      type: 'academic_integrity',
      creditsRequired: 1,
      coursesRequired: 1,
      ruleText: 'Complete DSAI5T09 for 1 credit in either award path.',
      appliesToTrackIds: [],
      sourceUrl: config.curriculumUrl,
      courses: [course(AIE)]
    }]
  };
}

function buildSupplement() {
  const snapshot = JSON.parse(fs.readFileSync(snapshotPath, 'utf8'));
  return {
    schemaVersion: 1,
    schoolCode: 'POLYU',
    academicYear: '2027-28',
    verifiedAt: '2026-07-15',
    programmes: configs.map((config) => buildProgramme(config, snapshot))
  };
}

function main() {
  const supplement = buildSupplement();
  fs.writeFileSync(outputPath, `${JSON.stringify(supplement, null, 2)}\n`);
  console.log(JSON.stringify({
    ok: true,
    output: path.relative(ROOT, outputPath),
    programmes: supplement.programmes.length,
    courses: supplement.programmes.reduce((count, programme) => (
      count + programme.courseGroups.reduce((subtotal, group) => subtotal + group.courses.length, 0)
    ), 0)
  }));
}

if (require.main === module) main();

module.exports = { buildSupplement };
