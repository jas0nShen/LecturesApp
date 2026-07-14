const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const OUTPUT = path.join(ROOT, 'data', 'tpg-course-supplements', 'hku-endodontics-2023.json');
const REGULATIONS_SOURCE = 'https://sweb.hku.hk/tola/servlet/ApplicantDownloadForm/getForm?pREF_CODE=R293&pDOCUMENT_TYPE=REGULATIONSYLLABUS&pVIEW=Y';

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
  ['DENT7110', 'Operative technique fundamentals', 3],
  ['DENT7106', 'Endodontics introduction', 6],
  ['DENT7111', 'Practical endodontic techniques I', 6],
  ['DENT7121', 'Tutorials in the discipline - Year 1', 6],
  ['DENT7159', 'Implant Dentistry in Comprehensive Dental Care I', 9],
  ['DENT7107', 'Joint (interdisciplinary) seminars I', 3],
  ['DENT7112', 'Practical endodontic techniques II', 6],
  ['DENT7122', 'Tutorials in the discipline - Year 2', 6],
  ['DENT7160', 'Implant Dentistry in Comprehensive Dental Care II', 9],
  ['DENT7108', 'Joint (interdisciplinary) seminars II', 3],
  ['DENT7113', 'Practical endodontic techniques III', 6],
  ['DENT7123', 'Tutorials in the discipline - Year 3', 6],
  ['DENT7109', 'Joint (interdisciplinary) seminars III', 3]
];

const clinicalRows = [
  ['DENT7103', 'Endodontic consultation clinic I', 6],
  ['DENT7104', 'Endodontic consultation clinic II', 6],
  ['DENT7105', 'Endodontic consultation clinic III', 6],
  ['DENT7118', 'Supervised clinical practice I', 21],
  ['DENT7119', 'Supervised clinical practice II', 27],
  ['DENT7120', 'Supervised clinical practice III', 33]
];

const researchRows = [
  ['DENT7115', 'Research I', 9],
  ['DENT7116', 'Research II', 24],
  ['DENT7117', 'Research III', 24],
  ['DENT7114', 'Publication and presentations', 6]
];

const capstoneRows = [
  ['DENT7100', 'Capstone Experience: Clinical Portfolio I', 3],
  ['DENT7101', 'Capstone Experience: Clinical Portfolio II', 6],
  ['DENT7102', 'Capstone Experience: Clinical Portfolio III', 6]
];

function course([code, name, credits], extra = {}) {
  return { code, name, credits, appliesToTrackIds: [], ...extra };
}

function sumCredits(rows) {
  return rows.reduce((sum, row) => sum + row[2], 0);
}

function buildSupplement() {
  assert.equal(sumCredits(facultyCoreRows), 21);
  assert.equal(sumCredits(disciplineRows), 72);
  assert.equal(sumCredits(clinicalRows), 99);
  assert.equal(sumCredits(researchRows), 63);
  assert.equal(sumCredits(capstoneRows), 15);
  const allRows = [...facultyCoreRows, ...disciplineRows, ...clinicalRows, ...researchRows, ...capstoneRows];
  assert.equal(allRows.length, 34, 'HKU MDS(Endo) course list changed');
  assert.equal(new Set(allRows.map(([code]) => code)).size, 34);
  assert.equal(sumCredits(allRows), 270);

  return {
    schemaVersion: 1,
    schoolCode: 'HKU',
    academicYear: '2023-24 and thereafter',
    verifiedAt: '2026-07-14',
    programmes: [{
      programmeId: 'HKU-TPG-023',
      status: 'verified',
      creditsRequired: 270,
      creditUnit: 'credits',
      sourceUrl: REGULATIONS_SOURCE,
      ruleReviewStatus: 'manual_review_required',
      statusNote: 'The current official R293 Syllabuses state that all curriculum components are compulsory and publish a 270-credit total: 21 Faculty Core, 72 Discipline Specific, 99 Clinical, 63 Research and 15 Clinical Portfolio credits. This corrects the 72-credit directory value, which matches only the Discipline Specific subtotal. The Regulations apply to the 2023-24 intake and thereafter; the Syllabuses are dated Jan 13, 2023. The total-source conflict should remain visible for manual review.',
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
          creditsRequired: 72,
          coursesRequired: 13,
          ruleText: 'Complete all thirteen Discipline Specific Courses across Years 1, 2 and 3 for 72 credits.',
          appliesToTrackIds: [],
          sourceUrl: REGULATIONS_SOURCE,
          courses: disciplineRows.map((row) => course(row))
        },
        {
          id: 'clinical-components',
          name: 'Clinical Components',
          type: 'core',
          creditsRequired: 99,
          coursesRequired: 6,
          ruleText: 'Complete Endodontic consultation clinic I-III and Supervised clinical practice I-III for 99 credits.',
          appliesToTrackIds: [],
          sourceUrl: REGULATIONS_SOURCE,
          courses: clinicalRows.map((row) => course(row))
        },
        {
          id: 'research-components',
          name: 'Research Components',
          type: 'dissertation',
          creditsRequired: 63,
          coursesRequired: 4,
          ruleText: 'Complete Research I-III and Publication and presentations for 63 credits, culminating in a dissertation or research paper in publication format.',
          appliesToTrackIds: [],
          sourceUrl: REGULATIONS_SOURCE,
          courses: researchRows.map((row) => course(row, row[0] === 'DENT7114' ? { courseKind: 'dissertation' } : { courseKind: 'project' }))
        },
        {
          id: 'clinical-portfolio-capstone',
          name: 'Capstone Experience: Clinical Portfolio',
          type: 'project',
          creditsRequired: 15,
          coursesRequired: 3,
          ruleText: 'Complete Clinical Portfolio I, II and III throughout the three-year curriculum for 15 credits.',
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
    courses: 34
  }));
}

if (require.main === module) main();
module.exports = { buildSupplement, facultyCoreRows, disciplineRows, clinicalRows, researchRows, capstoneRows };
