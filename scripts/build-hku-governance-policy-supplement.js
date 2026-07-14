const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const OUTPUT = path.join(ROOT, 'data', 'tpg-course-supplements', 'hku-governance-policy-2026.json');
const SOURCE = 'https://sweb.hku.hk/tola/servlet/ApplicantDownloadForm/getForm?pREF_CODE=R424&pDOCUMENT_TYPE=REGULATIONSYLLABUS&pVIEW=Y';

const compulsoryRows = [
  ['MGAP7001', 'Public Governance and Policy Implementation: Comparative Perspective'],
  ['MGAP7002', 'Economics Lessons from Turning Points and Crises'],
  ['MGAP7003', 'Trust, Governance and Leadership'],
  ['MGAP7004', 'Chinese Leadership and Governance'],
  ['MGAP7005', 'Geoeconomics in a Multipolar World'],
  ['MGAP7006', 'Political Ethics in China and the World: Ancient and Modern Perspectives on Public Policy']
];

const electiveRows = [
  ['ECON6095', 'Programme Evaluation for Policy Makers', 'method-and-data-analysis'],
  ['MPOP7004', 'Methods for Policy Evaluation', 'method-and-data-analysis'],
  ['MGAP7101', 'Policy Analysis and Microeconomic Theory', 'method-and-data-analysis'],
  ['CGRM7105', 'Climate Change Law', 'climate-change'],
  ['CGRM7106', 'Sustainable Urban Planning and Green Building', 'climate-change'],
  ['SOCI8028', 'Cultural Policies and Global Cities', 'social-and-cultural-policy'],
  ['SOWK6217', 'Current Social Welfare Policy Issues', 'social-and-cultural-policy'],
  ['MGAP7102', 'The Aging Mind: Neuroscience-informed Policy for Cognitive and Mental Health', 'social-and-cultural-policy'],
  ['ECON6010', 'Monetary Policy: Theory and Practice', 'monetary-policy'],
  ['MGAP7103', 'Economic Policy and the World Economy', 'monetary-policy'],
  ['MGAP7104', 'Introduction to Geopolitics, AI and Technology', 'artificial-intelligence'],
  ['MGAP7105', 'International Political Economy: Global Collaboration and Leadership in a Rapidly Changing World Order', 'global-governance'],
  ['MGAP7106', 'Global Macro Policy and Governance', 'global-governance'],
  ['MGAP7201', 'Experiential Learning in Asia and the World', 'field-trip']
];

function buildSupplement() {
  assert.equal(compulsoryRows.length, 6, 'HKU MGP compulsory-course list changed');
  assert.equal(electiveRows.length, 14, 'HKU MGP elective-course pool changed');
  assert.equal(electiveRows.filter((row) => row[2] === 'method-and-data-analysis').length, 3);
  assert.equal(new Set([...compulsoryRows, ...electiveRows].map(([code]) => code)).size, 20);

  return {
    schemaVersion: 1,
    schoolCode: 'HKU',
    academicYear: '2026-27',
    verifiedAt: '2026-07-14',
    programmes: [{
      programmeId: 'HKU-TPG-062',
      status: 'verified',
      creditsRequired: 66,
      creditUnit: 'credits',
      sourceUrl: SOURCE,
      ruleReviewStatus: 'manual_review_required',
      courseGroups: [
        {
          id: 'compulsory-courses',
          name: 'Compulsory Courses',
          type: 'core',
          creditsRequired: 36,
          coursesRequired: 6,
          ruleText: 'Complete all six compulsory courses for 36 credits.',
          appliesToTrackIds: [],
          sourceUrl: SOURCE,
          courses: compulsoryRows.map(([code, name]) => ({
            code,
            name,
            credits: 6,
            appliesToTrackIds: []
          }))
        },
        {
          id: 'elective-courses',
          name: 'Elective Courses',
          type: 'elective',
          creditsRequired: 18,
          coursesRequired: 3,
          ruleText: 'Complete at least three elective courses for 18 credits, including at least one course from Method and Data Analysis. The sub-group minimum requires manual audit review. Not all listed courses are necessarily offered every academic year.',
          appliesToTrackIds: [],
          sourceUrl: SOURCE,
          courses: electiveRows.map(([code, name, subjectGroup]) => ({
            code,
            name,
            credits: 6,
            subjectGroups: [subjectGroup],
            appliesToTrackIds: []
          }))
        },
        {
          id: 'capstone-project',
          name: 'Capstone Project',
          type: 'project',
          creditsRequired: 12,
          coursesRequired: 1,
          ruleText: 'Complete MGAP8001 Capstone Project for 12 credits. The official course offers a research-based thesis option and an applied policy-project option within the same course code.',
          appliesToTrackIds: [],
          sourceUrl: SOURCE,
          courses: [{
            code: 'MGAP8001',
            name: 'Capstone Project',
            credits: 12,
            courseKind: 'project',
            appliesToTrackIds: []
          }]
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
    courses: compulsoryRows.length + electiveRows.length + 1
  }));
}

if (require.main === module) main();
module.exports = { buildSupplement, compulsoryRows, electiveRows };
