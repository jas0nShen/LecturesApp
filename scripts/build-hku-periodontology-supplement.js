const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const OUTPUT = path.join(ROOT, 'data', 'tpg-course-supplements', 'hku-periodontology-2023.json');
const REGULATIONS_SOURCE = 'https://facdent.hku.hk/download/taught-postgraduate/reg-syl-mds-perio.pdf';

const facultyCoreRows = [
  ['DENT7505', 'Biomaterials I', 3],
  ['DENT7506', 'Biomaterials II', 3],
  ['DENT6023', 'Oral epidemiology and clinical research methodology', 3],
  ['DENT6024', 'Introduction to statistical analysis in dental research', 3],
  ['DENT6025', 'Multivariable statistical analysis in dental research and use of statistical software', 3],
  ['DENT7030', 'Dissertation writing for Master of Dental Surgery and Master of Science - An Induction Course', 0],
  ['DENT7032', 'Diagnostic & Advanced Dental & Maxillofacial Imaging', 3]
];

const disciplineRows = [
  ['DENT7354', 'Case presentations plus clinical topics', 9],
  ['DENT7355', 'Classic literature I', 6],
  ['DENT7356', 'Classic literature II', 6],
  ['DENT7357', 'Classic literature III', 6],
  ['DENT7350', 'Basic Perio science I', 6],
  ['DENT7351', 'Basic Perio science II', 6],
  ['DENT7352', 'Basic Perio science III', 6],
  ['DENT7359', 'Current literature I', 3],
  ['DENT7360', 'Current literature II', 3],
  ['DENT7361', 'Current literature III', 3],
  ['DENT7362', 'Joint sessions I', 3],
  ['DENT7363', 'Joint sessions II', 3],
  ['DENT7364', 'Joint sessions III', 6]
];

const clinicalRows = [
  ['DENT7358', 'Clinic (incl. pre-clinic)', 126]
];

const researchRows = [
  ['DENT7365', 'Project report and oral examination', 54]
];

const capstoneRows = [
  ['DENT7353', 'Capstone Experience: Clinical Portfolio', 6]
];

function course([code, name, credits], extra = {}) {
  return { code, name, credits, appliesToTrackIds: [], ...extra };
}

function sumCredits(rows) {
  return rows.reduce((sum, row) => sum + row[2], 0);
}

function buildSupplement() {
  assert.equal(sumCredits(facultyCoreRows), 18);
  assert.equal(sumCredits(disciplineRows), 66);
  assert.equal(sumCredits(clinicalRows), 126);
  assert.equal(sumCredits(researchRows), 54);
  assert.equal(sumCredits(capstoneRows), 6);
  const allRows = [...facultyCoreRows, ...disciplineRows, ...clinicalRows, ...researchRows, ...capstoneRows];
  assert.equal(allRows.length, 23, 'HKU MDS(Perio) course list changed');
  assert.equal(new Set(allRows.map(([code]) => code)).size, 23);
  assert.equal(sumCredits(allRows), 270);

  return {
    schemaVersion: 1,
    schoolCode: 'HKU',
    academicYear: '2023-24 and thereafter',
    verifiedAt: '2026-07-16',
    programmes: [{
      programmeId: 'HKU-TPG-026',
      status: 'verified',
      creditsRequired: 270,
      creditUnit: 'credits',
      sourceUrl: REGULATIONS_SOURCE,
      ruleReviewStatus: 'verified',
      statusNote: 'The current HKU Faculty of Dentistry Programme page for 2026 admissions links this official Regulations and Syllabuses PDF. It applies to candidates admitted in 2023-24 and thereafter, no longer carries the older Subject to official approval notice, and publishes a compulsory 270-credit curriculum: 18 Faculty Core, 66 Discipline Specific, 126 Clinical, 54 Research and 6 Capstone credits. This corrects the 66-credit directory value, which matches only the Discipline Specific subtotal. The Syllabuses are dated Apr 20, 2023.',
      courseGroups: [
        {
          id: 'faculty-core-courses',
          name: 'Faculty Core Courses',
          type: 'core',
          creditsRequired: 18,
          coursesRequired: 7,
          ruleText: 'Complete all seven Faculty Core Courses. DENT7030 is compulsory but non-credit bearing; the other six courses contribute 18 credits.',
          appliesToTrackIds: [],
          sourceUrl: REGULATIONS_SOURCE,
          courses: facultyCoreRows.map((row) => course(row))
        },
        {
          id: 'discipline-specific-courses',
          name: 'Discipline Specific Courses',
          type: 'core',
          creditsRequired: 66,
          coursesRequired: 13,
          ruleText: 'Complete all thirteen Discipline Specific Courses across Years 1, 2 and 3 for 66 credits.',
          appliesToTrackIds: [],
          sourceUrl: REGULATIONS_SOURCE,
          courses: disciplineRows.map((row) => course(row))
        },
        {
          id: 'clinical-components',
          name: 'Clinical Components',
          type: 'core',
          creditsRequired: 126,
          coursesRequired: 1,
          ruleText: 'Complete DENT7358 Clinic (including pre-clinic) for 126 credits.',
          appliesToTrackIds: [],
          sourceUrl: REGULATIONS_SOURCE,
          courses: clinicalRows.map((row) => course(row))
        },
        {
          id: 'research-components',
          name: 'Research Components',
          type: 'dissertation',
          creditsRequired: 54,
          coursesRequired: 1,
          ruleText: 'Complete DENT7365 Project report and oral examination for 54 credits and submit the required dissertation, project report or research paper in publication format.',
          appliesToTrackIds: [],
          sourceUrl: REGULATIONS_SOURCE,
          courses: researchRows.map((row) => course(row, { courseKind: 'research_project' }))
        },
        {
          id: 'capstone-experience',
          name: 'Capstone Experience',
          type: 'project',
          creditsRequired: 6,
          coursesRequired: 1,
          ruleText: 'Complete DENT7353 Capstone Experience: Clinical Portfolio for 6 credits, including case presentations and an oral clinical examination.',
          appliesToTrackIds: [],
          sourceUrl: REGULATIONS_SOURCE,
          courses: capstoneRows.map((row) => course(row, { courseKind: 'project' }))
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
    courses: 23
  }));
}

if (require.main === module) main();
module.exports = { buildSupplement, facultyCoreRows, disciplineRows, clinicalRows, researchRows, capstoneRows };
