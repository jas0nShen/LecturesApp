const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const OUTPUT = path.join(ROOT, 'data', 'tpg-course-supplements', 'hku-orthodontics-2023.json');
const REGULATIONS_SOURCE = 'https://sweb.hku.hk/tola/servlet/ApplicantDownloadForm/getForm?pREF_CODE=R289&pDOCUMENT_TYPE=REGULATIONSYLLABUS&pVIEW=Y';

const facultyCoreRows = [
  ['DENT7505', 'Biomaterials I', 3],
  ['DENT7506', 'Biomaterials II', 3],
  ['DENT6023', 'Oral epidemiology and clinical research methodology', 3],
  ['DENT6024', 'Introduction to statistical analysis in dental research', 3],
  ['DENT6025', 'Multivariable statistical analysis in dental research and use of statistical software', 3],
  ['DENT7030', 'Dissertation writing for Master of Dental Surgery and Master of Science - An Induction Course', 0]
];

const disciplineRows = [
  ['DENT7256', 'Orthodontic diagnosis and treatment planning 1', 24],
  ['DENT7257', 'Orthodontic diagnosis and treatment planning 2', 24],
  ['DENT7258', 'Orthodontic diagnosis and treatment planning 3', 24]
];

const clinicalRows = [
  ['DENT7251', 'Clinical orthodontics 1', 48],
  ['DENT7252', 'Clinical orthodontics 2', 48],
  ['DENT7253', 'Clinical orthodontics 3', 51],
  ['DENT7250', 'Capstone Experience: Clinical Portfolio', 6]
];

const researchRows = [
  ['DENT7254', 'Original research 2', 15],
  ['DENT7255', 'Original research 3', 15]
];

function course([code, name, credits], extra = {}) {
  return { code, name, credits, appliesToTrackIds: [], ...extra };
}

function sumCredits(rows) {
  return rows.reduce((sum, row) => sum + row[2], 0);
}

function buildSupplement() {
  assert.equal(sumCredits(facultyCoreRows), 15);
  assert.equal(sumCredits(disciplineRows), 72);
  assert.equal(sumCredits(clinicalRows), 153);
  assert.equal(sumCredits(researchRows), 30);
  const allRows = [...facultyCoreRows, ...disciplineRows, ...clinicalRows, ...researchRows];
  assert.equal(allRows.length, 15, 'HKU MDS(Orthodontics&DentofacialOrthopaedics) course list changed');
  assert.equal(new Set(allRows.map(([code]) => code)).size, 15);
  assert.equal(sumCredits(allRows), 270);

  return {
    schemaVersion: 1,
    schoolCode: 'HKU',
    academicYear: '2023-24 and thereafter',
    verifiedAt: '2026-07-16',
    programmes: [{
      programmeId: 'HKU-TPG-024',
      status: 'verified',
      creditsRequired: 270,
      creditUnit: 'credits',
      sourceUrl: REGULATIONS_SOURCE,
      ruleReviewStatus: 'verified',
      statusNote: 'The current official R289 Regulations and Syllabuses require a minimum of 270 credits and state that all curriculum components are compulsory: 15 Faculty Core, 72 Discipline Specific, 153 Clinical and 30 Research credits. This corrects the 72-credit directory value, which matches only the Discipline Specific subtotal. The Regulations apply to the 2023-24 intake and thereafter; the Syllabuses are dated Dec 21, 2022.',
      courseGroups: [
        {
          id: 'faculty-core-courses',
          name: 'Faculty Core Courses',
          type: 'core',
          creditsRequired: 15,
          coursesRequired: 6,
          ruleText: 'Complete all six Faculty Core Courses. DENT7030 is compulsory but non-credit bearing; the other five courses contribute 15 credits.',
          appliesToTrackIds: [],
          sourceUrl: REGULATIONS_SOURCE,
          courses: facultyCoreRows.map((row) => course(row))
        },
        {
          id: 'discipline-specific-courses',
          name: 'Discipline Specific Courses',
          type: 'core',
          creditsRequired: 72,
          coursesRequired: 3,
          ruleText: 'Complete Orthodontic diagnosis and treatment planning 1, 2 and 3 across Years 1, 2 and 3 for 72 credits.',
          appliesToTrackIds: [],
          sourceUrl: REGULATIONS_SOURCE,
          courses: disciplineRows.map((row) => course(row))
        },
        {
          id: 'clinical-components',
          name: 'Clinical Components',
          type: 'core',
          creditsRequired: 153,
          coursesRequired: 4,
          ruleText: 'Complete Clinical orthodontics 1, 2 and 3 plus the Clinical Portfolio capstone for 153 credits.',
          appliesToTrackIds: [],
          sourceUrl: REGULATIONS_SOURCE,
          courses: clinicalRows.map((row) => course(row, row[0] === 'DENT7250' ? { courseKind: 'project' } : {}))
        },
        {
          id: 'research-components',
          name: 'Research Components',
          type: 'dissertation',
          creditsRequired: 30,
          coursesRequired: 2,
          ruleText: 'Complete Original research 2 and 3 for 30 credits and submit a dissertation or research paper in publication format.',
          appliesToTrackIds: [],
          sourceUrl: REGULATIONS_SOURCE,
          courses: researchRows.map((row) => course(row, { courseKind: 'research_project' }))
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
    courses: 15
  }));
}

if (require.main === module) main();
module.exports = { buildSupplement, facultyCoreRows, disciplineRows, clinicalRows, researchRows };
