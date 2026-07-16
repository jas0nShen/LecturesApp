const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const OUTPUT = path.join(ROOT, 'data', 'tpg-course-supplements', 'hku-paediatric-dentistry-2023.json');
const REGULATIONS_SOURCE = 'https://sweb.hku.hk/tola/servlet/ApplicantDownloadForm/getForm?pREF_CODE=R294&pDOCUMENT_TYPE=REGULATIONSYLLABUS&pVIEW=Y';

const facultyCoreRows = [
  ['DENT7505', 'Biomaterials I', 3],
  ['DENT7506', 'Biomaterials II', 3],
  ['DENT6023', 'Oral epidemiology and clinical research methodology', 3],
  ['DENT6024', 'Introduction to statistical analysis in dental research', 3],
  ['DENT6025', 'Multivariable statistical analysis in dental research and use of statistical software', 3],
  ['DENT7030', 'Dissertation writing for Master of Dental Surgery and Master of Science - An Induction Course', 0],
  ['DENT7031', 'Insights into stem cells and tissue engineering in dentistry', 3],
  ['DENT7032', 'Diagnostic & Advanced Dental & Maxillofacial Imaging', 3]
];

const disciplineRows = [
  ['DENT7302', 'Didactic Paediatric Dentistry', 66]
];

const clinicalRows = [
  ['DENT7301', 'Clinical Paediatric Dentistry', 123],
  ['DENT7300', 'Capstone Experience: Clinical Portfolio', 6]
];

const researchRows = [
  ['DENT7303', 'Research project', 54]
];

function course([code, name, credits], extra = {}) {
  return { code, name, credits, appliesToTrackIds: [], ...extra };
}

function sumCredits(rows) {
  return rows.reduce((sum, row) => sum + row[2], 0);
}

function buildSupplement() {
  assert.equal(sumCredits(facultyCoreRows), 21);
  assert.equal(sumCredits(disciplineRows), 66);
  assert.equal(sumCredits(clinicalRows), 129);
  assert.equal(sumCredits(researchRows), 54);
  const allRows = [...facultyCoreRows, ...disciplineRows, ...clinicalRows, ...researchRows];
  assert.equal(allRows.length, 12, 'HKU MDS(PaediatrDent) course list changed');
  assert.equal(new Set(allRows.map(([code]) => code)).size, 12);
  assert.equal(sumCredits(allRows), 270);

  return {
    schemaVersion: 1,
    schoolCode: 'HKU',
    academicYear: '2023-24 and thereafter',
    verifiedAt: '2026-07-16',
    programmes: [{
      programmeId: 'HKU-TPG-025',
      status: 'verified',
      creditsRequired: 270,
      creditUnit: 'credits',
      sourceUrl: REGULATIONS_SOURCE,
      ruleReviewStatus: 'verified',
      statusNote: 'The current official R294 Regulations and Syllabuses state that all curriculum components are compulsory and publish a 270-credit total: 21 Faculty Core, 66 Discipline Specific, 129 Clinical and 54 Research credits. This corrects the 66-credit directory value, which matches only the Discipline Specific subtotal. The Regulations apply to the 2023-24 intake and thereafter; the Syllabuses are dated Nov 29, 2022.',
      courseGroups: [
        {
          id: 'faculty-core-courses',
          name: 'Faculty Core Courses',
          type: 'core',
          creditsRequired: 21,
          coursesRequired: 8,
          ruleText: 'Complete all eight Faculty Core Courses. DENT7030 is compulsory but non-credit bearing; the other seven courses contribute 21 credits.',
          appliesToTrackIds: [],
          sourceUrl: REGULATIONS_SOURCE,
          courses: facultyCoreRows.map((row) => course(row))
        },
        {
          id: 'discipline-specific-courses',
          name: 'Discipline Specific Courses',
          type: 'core',
          creditsRequired: 66,
          coursesRequired: 1,
          ruleText: 'Complete Didactic Paediatric Dentistry for 66 credits.',
          appliesToTrackIds: [],
          sourceUrl: REGULATIONS_SOURCE,
          courses: disciplineRows.map((row) => course(row))
        },
        {
          id: 'clinical-components',
          name: 'Clinical Components',
          type: 'core',
          creditsRequired: 129,
          coursesRequired: 2,
          ruleText: 'Complete Clinical Paediatric Dentistry and the Clinical Portfolio capstone for 129 credits.',
          appliesToTrackIds: [],
          sourceUrl: REGULATIONS_SOURCE,
          courses: clinicalRows.map((row) => course(row, row[0] === 'DENT7300' ? { courseKind: 'project' } : {}))
        },
        {
          id: 'research-components',
          name: 'Research Components',
          type: 'dissertation',
          creditsRequired: 54,
          coursesRequired: 1,
          ruleText: 'Complete the Research project for 54 credits and submit a dissertation, project report or research paper in publication format.',
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
    courses: 12
  }));
}

if (require.main === module) main();
module.exports = { buildSupplement, facultyCoreRows, disciplineRows, clinicalRows, researchRows };
