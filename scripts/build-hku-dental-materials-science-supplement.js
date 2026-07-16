const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const OUTPUT = path.join(ROOT, 'data', 'tpg-course-supplements', 'hku-dental-materials-science-2017.json');
const REGULATIONS_SOURCE = 'https://sweb.hku.hk/tola/servlet/ApplicantDownloadForm/getForm?pREF_CODE=R233&pDOCUMENT_TYPE=REGULATIONSYLLABUS&pVIEW=Y';

const facultyCoreRows = [
  ['DENT6023', 'Oral epidemiology and clinical research methodology', 3],
  ['DENT6024', 'Introduction to statistical analysis in dental research', 3],
  ['DENT6025', 'Multivariable statistical analysis in dental research and use of statistical software', 3],
  ['DENT7030', 'Dissertation writing for Master of Dental Surgery and Master of Science - An Induction Course', 0]
];

const disciplineRows = [
  ['DENT7505', 'Biomaterials I', 3],
  ['DENT7506', 'Biomaterials II', 3],
  ['DENT7502', 'Guided Learning Tutorials', 15],
  ['DENT7503', 'Laboratory Class + Theme-based Sessions', 3],
  ['DENT7501', 'DMS Scientific Writing + DMS Seminar Presentation', 3]
];

const researchRows = [
  ['DENT7504', 'Laboratory Research Component', 18],
  ['DENT7500', 'Capstone experience: MSc(DMS) Project + Scientific Manuscript', 18]
];

function course([code, name, credits], extra = {}) {
  return { code, name, credits, appliesToTrackIds: [], ...extra };
}

function sumCredits(rows) {
  return rows.reduce((sum, row) => sum + row[2], 0);
}

function buildSupplement() {
  assert.equal(sumCredits(facultyCoreRows), 9);
  assert.equal(sumCredits(disciplineRows), 27);
  assert.equal(sumCredits(researchRows), 36);
  const allRows = [...facultyCoreRows, ...disciplineRows, ...researchRows];
  assert.equal(allRows.length, 11, 'HKU MSc(DMS) course list changed');
  assert.equal(new Set(allRows.map(([code]) => code)).size, 11);
  assert.equal(sumCredits(allRows), 72);

  return {
    schemaVersion: 1,
    schoolCode: 'HKU',
    academicYear: '2017-18 and thereafter',
    verifiedAt: '2026-07-16',
    programmes: [{
      programmeId: 'HKU-TPG-029',
      status: 'verified',
      creditsRequired: 72,
      creditUnit: 'credits',
      sourceUrl: REGULATIONS_SOURCE,
      ruleReviewStatus: 'verified',
      statusNote: 'The current HKU Taught Postgraduate Admissions page identifies this Programme as R233 and links the official Regulations and Syllabuses. The Regulations apply to candidates admitted in 2017-18 and thereafter, and the Syllabuses publish a compulsory 72-credit curriculum: 9 Faculty Core, 27 Discipline Specific and 36 Research credits. The Syllabuses are dated Sep 27, 2019.',
      courseGroups: [
        {
          id: 'faculty-core-courses',
          name: 'Faculty Core Courses',
          type: 'core',
          creditsRequired: 9,
          coursesRequired: 4,
          ruleText: 'Complete all four Faculty Core Courses. DENT7030 is compulsory but non-credit bearing; the other three courses contribute 9 credits.',
          appliesToTrackIds: [],
          sourceUrl: REGULATIONS_SOURCE,
          courses: facultyCoreRows.map((row) => course(row))
        },
        {
          id: 'discipline-specific-courses',
          name: 'Discipline Specific Courses',
          type: 'core',
          creditsRequired: 27,
          coursesRequired: 5,
          ruleText: 'Complete all five Discipline Specific Courses for 27 credits.',
          appliesToTrackIds: [],
          sourceUrl: REGULATIONS_SOURCE,
          courses: disciplineRows.map((row) => course(row))
        },
        {
          id: 'research-component',
          name: 'Research Component',
          type: 'dissertation',
          creditsRequired: 36,
          coursesRequired: 2,
          ruleText: 'Complete the Laboratory Research Component and the MSc(DMS) capstone project with scientific manuscript for 36 credits, and submit the required dissertation or project report portfolio.',
          appliesToTrackIds: [],
          sourceUrl: REGULATIONS_SOURCE,
          courses: researchRows.map((row) => course(row, row[0] === 'DENT7500' ? { courseKind: 'dissertation' } : { courseKind: 'research_project' }))
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
    courses: 11
  }));
}

if (require.main === module) main();
module.exports = { buildSupplement, facultyCoreRows, disciplineRows, researchRows };
