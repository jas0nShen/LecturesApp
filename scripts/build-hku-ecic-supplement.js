const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const OUTPUT = path.join(ROOT, 'data', 'tpg-course-supplements', 'hku-electronic-commerce-internet-computing-2025.json');
const SOURCE = 'https://engg.hku.hk/Portals/0/TPG/MSc(ECIC)_Syl_2024-25_20241112.pdf';
const fundamentalCodes = new Set([
  'ECOM6004', 'ECOM6008', 'ECOM6013', 'ECOM7127',
  'ICOM6012', 'ICOM6034', 'ICOM6045', 'ICOM7128'
]);

const disciplineRows = [
  ['ECOM6004', 'Legal aspects of I.T. and e-commerce'],
  ['ECOM6008', 'Supply chain and e-logistics management'],
  ['ECOM6013', 'E-commerce technologies'],
  ['ECOM6014', 'E-marketing'],
  ['ECOM6016', 'Electronic payment systems'],
  ['ECOM6022', 'Topics in electronic commerce'],
  ['ECOM6023', 'E-financial services'],
  ['ECOM6029', 'E-business transformation'],
  ['ECOM7121', 'Dynamic digital capabilities'],
  ['ECOM7122', 'Entrepreneurship development and ventures in Asia'],
  ['ECOM7123', 'Building smart cities: an information system approach'],
  ['ECOM7124', 'Mobile and IoT computing services and applications'],
  ['ECOM7126', 'Machine learning for business and e-commerce'],
  ['ECOM7127', 'Digital transformation: strategy and people'],
  ['ICOM6012', 'Internet infrastructure technologies'],
  ['ICOM6027', 'E-crimes: digital crime scenes and legal sanctions'],
  ['ICOM6029', 'Topics in Internet computing'],
  ['ICOM6034', 'Website engineering'],
  ['ICOM6044', 'Data science for business'],
  ['ICOM6045', 'Fundamentals of e-commerce security'],
  ['ICOM7125', 'Digital forensics'],
  ['ICOM7128', 'Knowledge graphs'],
  ['COMP7311', 'Legal issues in artificial intelligence and data science'],
  ['COMP7404', 'Computational intelligence and machine learning'],
  ['COMP7412', 'Banking in Web 3.0 - Metaverse, DeFi, NFTs and beyond'],
  ['COMP7802', 'Introduction to financial computing'],
  ['COMP7901', 'Legal protection of digital property'],
  ['FITE7407', 'Securities transaction banking'],
  ['FITE7409', 'Blockchain and cryptocurrency'],
  ['FITE7410', 'Financial fraud analytics'],
  ['FITE7411', 'RegTech in finance'],
  ['FITE7413', 'Smart banking and innovative finance']
];

function buildSupplement() {
  assert.equal(disciplineRows.length, 32, 'HKU MSc(ECom&IComp) official discipline-course pool changed');
  assert.equal(new Set(disciplineRows.map(([code]) => code)).size, disciplineRows.length);
  assert.equal(disciplineRows.filter(([code]) => fundamentalCodes.has(code)).length, 8);

  return {
    schemaVersion: 1,
    schoolCode: 'HKU',
    academicYear: '2025-26',
    verifiedAt: '2026-07-14',
    programmes: [{
      programmeId: 'HKU-TPG-061',
      status: 'verified',
      creditsRequired: 72,
      creditUnit: 'credits',
      sourceUrl: SOURCE,
      ruleReviewStatus: 'manual_review_required',
      courseGroups: [
        {
          id: 'discipline-courses',
          name: 'Discipline Courses',
          type: 'discipline',
          creditsRequired: 36,
          ruleText: 'For the Case Study Project path, complete at least 48 discipline-course credits; for the Dissertation path, complete at least 36 discipline-course credits. Both paths must include at least 24 credits (four courses) from the official Fundamental Courses list. At most 12 credits may be approved external electives. The path-dependent minimum and external approvals require manual audit review.',
          appliesToTrackIds: [],
          sourceUrl: SOURCE,
          courses: disciplineRows.map(([code, name]) => ({
            code,
            name,
            credits: 6,
            subjectGroups: [fundamentalCodes.has(code) ? 'fundamental' : 'discipline'],
            fundamental: fundamentalCodes.has(code),
            appliesToTrackIds: []
          }))
        },
        {
          id: 'capstone-experience',
          name: 'Capstone Experience',
          type: 'case_study_project_or_dissertation',
          ruleText: 'Complete either ECOM7001 Case study project (12 credits) with ten taught courses, or ECOM7000 Dissertation (24 credits) with eight taught courses. The mutually exclusive paths require manual audit review.',
          appliesToTrackIds: [],
          sourceUrl: SOURCE,
          courses: [
            { code: 'ECOM7000', name: 'Dissertation', credits: 24, courseKind: 'dissertation', appliesToTrackIds: [] },
            { code: 'ECOM7001', name: 'Case study project', credits: 12, courseKind: 'project', appliesToTrackIds: [] }
          ]
        }
      ]
    }]
  };
}

function main() {
  const supplement = buildSupplement();
  fs.writeFileSync(OUTPUT, `${JSON.stringify(supplement, null, 2)}\n`);
  console.log(JSON.stringify({ ok: true, output: path.relative(ROOT, OUTPUT), programmes: 1, disciplineCourses: 32 }));
}

if (require.main === module) main();
module.exports = { buildSupplement, disciplineRows, fundamentalCodes };
