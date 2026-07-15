const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const snapshotPath = path.join(ROOT, 'data', 'tpg-source-snapshots', 'polyu-2027.json');
const outputPath = path.join(ROOT, 'data', 'tpg-course-supplements', 'polyu-sustainable-technology-carbon-neutrality-2027.json');
const PROGRAMME_ID = 'POLYU-TPG-013';
const SOURCE_URL = 'https://www.polyu.edu.hk/study/pg/tpg/2027/12060-mft-mpt';

const compulsorySubjects = [
  ['ABCT5031', 'Ecological Approaches for Carbon Management', 3],
  ['ABCT5032', 'Materials Science for Carbon Neutrality Applications', 3],
  ['ABCT5033', 'Renewable Energies and Technologies I: Hydrogen and Biofuels', 3],
  ['ABCT5042', 'Quantitation and Reporting of Greenhouse Gases and Carbon Footprint and Climate Action Methodologies', 6],
  ['ABCT5T01', 'Academic Integrity and Ethics in Science', 1],
  ['AF5130', 'Sustainable Finance', 3],
  ['AP5021', 'Renewable Energies and Technologies II: Energy Conversion and Storage', 3]
];

const projectOptions = [
  ['ABCT5039', 'Project', 3, 'project'],
  ['ABCT5040', 'Research Project', 6, 'research_project']
];

const electiveSubjects = [
  ['ABCT5037', 'Green Chemistry for Sustainable Products Development', 3],
  ['ABCT5038', 'Expert Seminars: Special Topics in Sustainable Science and Technology', 3],
  ['ABCT5041', 'Sustainable Chemistry for Circular Economy', 3],
  ['AMA569', 'Stochastic Models for Carbon Pricing and Trading', 3],
  ['AP5022', 'Energy Efficient Lighting and Control', 3],
  ['BSE542', 'Energy Efficient Buildings', 3],
  ['EE546', 'Electric Energy Storage and New Energy Sources for Electric Vehicles', 3]
];

function buildSupplement() {
  const snapshot = JSON.parse(fs.readFileSync(snapshotPath, 'utf8'));
  const row = snapshot.rows.find((item) => item.programmeId === PROGRAMME_ID);
  assert(row, `Missing official snapshot row ${PROGRAMME_ID}`);
  assert.equal(row.sourceUrl, SOURCE_URL);
  assert.equal(row.creditText, '31');
  assert.match(row.curriculumText, /Compulsory Subjects \(Total credits: 22\)/);
  assert.match(row.curriculumText, /Elective Subjects \(Total credits: 9\)/);
  assert.match(row.curriculumText, /3-credit Project \(ABCT5039\).*at least 6 credits[\s\S]*6-credit Research Project \(ABCT5040\).*at least 3 credits/);

  const officialCourseRows = [...compulsorySubjects, ...projectOptions, ...electiveSubjects];
  assert.equal(new Set(officialCourseRows.map(([code]) => code)).size, 16);
  officialCourseRows.forEach(([code, name]) => {
    assert(row.curriculumText.includes(code), `Official snapshot is missing ${code}`);
    assert(row.curriculumText.includes(name), `Official snapshot is missing ${code} ${name}`);
  });

  const course = ([code, name, credits], options = {}) => ({
    code,
    name,
    credits,
    appliesToTrackIds: [],
    sourceUrl: SOURCE_URL,
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
      statusNote: 'The official 31-credit structure has two mutually exclusive completion paths: ABCT5039 plus at least 6 elective credits, or ABCT5040 plus at least 3 elective credits. The app must not infer completion from the combined visible project and elective pools.',
      courseGroups: [
        {
          id: 'compulsory-subjects',
          name: 'Compulsory Subjects',
          type: 'core',
          creditsRequired: 22,
          coursesRequired: 7,
          ruleText: 'Complete all seven Compulsory Subjects for 22 credits.',
          appliesToTrackIds: [],
          sourceUrl: SOURCE_URL,
          courses: compulsorySubjects.map((row) => course(row))
        },
        {
          id: 'project-options',
          name: 'Project or Research Project Option',
          type: 'project',
          coursesRequired: 1,
          ruleText: 'Choose either ABCT5039 Project (3 credits) with at least 6 credits from the Elective Subject pool, or ABCT5040 Research Project (6 credits) with at least 3 credits from the Elective Subject pool.',
          appliesToTrackIds: [],
          sourceUrl: SOURCE_URL,
          courses: projectOptions.map((row) => course(row, {
            courseKind: row[3],
            conditionalRequirement: true
          }))
        },
        {
          id: 'elective-subjects',
          name: 'Elective Subjects',
          type: 'elective',
          ruleText: 'Complete at least 6 elective credits with ABCT5039, or at least 3 elective credits with ABCT5040. This conditional requirement must be checked together with the selected project path.',
          appliesToTrackIds: [],
          sourceUrl: SOURCE_URL,
          courses: electiveSubjects.map((row) => course(row))
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
