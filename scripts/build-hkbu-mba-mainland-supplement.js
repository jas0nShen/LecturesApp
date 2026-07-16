const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const outputPath = path.join(ROOT, 'data', 'tpg-course-supplements', 'hkbu-mba-mainland-2025.json');
const PROGRAMME_ID = 'HKBU-TPG-027';
const VERIFIED_AT = '2026-07-16';
const ADMISSIONS_URL = 'https://ar.hkbu.edu.hk/tpg-admissions/programmes/master-of-business-administration-mba-mainland-class-only';
const HANDBOOK_URL = 'https://handbook.ar.hkbu.edu.hk/2025-2026/academic-programmes/postgraduate-programmes/school-of-business/master-of-business-administration';
const COURSE_ROOT = 'https://handbook.ar.hkbu.edu.hk/2025-2026/course';

const coreCourses = [
  ['ACCT7070', 'Accounting for Decision Making'],
  ['BUS7380', 'Business Ethics and Corporate Governance'],
  ['BUS7410', 'Operations and Supply Chain Management'],
  ['BUSD7130', 'Business Analytics'],
  ['BUSD7140', 'Entrepreneurship and New Venture Development'],
  ['ECON7600', 'Managerial Economics in Digital Era'],
  ['FIN7090', 'Corporate Finance'],
  ['HRM7600', 'Global Human Resources Management and Cross-cultural Management'],
  ['MGNT7240', 'Strategic Management'],
  ['MGNT7250', 'Leadership and Organizational Development'],
  ['MKT7730', 'Marketing Strategy and Analytics']
];

const advancedElectives = [
  ['ACCT7005', 'IT Ethics and Compliance in the Digital Economy'],
  ['ACCT7940', 'Enterprise Risk Management'],
  ['BUSD7150', 'Blockchain and Their Business Applications'],
  ['ECON7075', 'Global Sustainable Investing and ESG Integration in Business'],
  ['ECON7630', 'International Trade and Finance'],
  ['FIN7770', 'Fundamental Investment and Portfolio Analysis'],
  ['FIN7920', 'Financial Technology (FinTech)'],
  ['MGNT7340', 'Lessons from Strategic Failures and Critical Thinking for Managers'],
  ['MGNT7790', 'Sustainable Growth through Mergers and Acquisition'],
  ['MGNT7810', 'Business Negotiation'],
  ['MGNT7830', 'Managing Organizational Change in the AI Era'],
  ['MKT7740', 'Brand Psychology and Digital Marketing'],
  ['MKT7760', 'Strategic Sales Management']
];

function course(code, name, credits, options = {}) {
  return {
    code,
    name,
    credits,
    appliesToTrackIds: [],
    sourceUrl: `${COURSE_ROOT}/${code}`,
    ...options
  };
}

function buildSupplement() {
  return {
    schemaVersion: 1,
    schoolCode: 'HKBU',
    academicYear: '2025-26',
    verifiedAt: VERIFIED_AT,
    programmes: [
      {
        programmeId: PROGRAMME_ID,
        programmeName: 'Master of Business Administration (MBA) (Mainland Class only)',
        faculty: 'School of Business',
        status: 'verified',
        creditsRequired: 45,
        creditUnit: 'units',
        sourceUrl: ADMISSIONS_URL,
        ruleReviewStatus: 'manual_review_required',
        tracks: [],
        statusNote: 'The current HKBU admissions page confirms September 2026 entry and a 45-unit structure comprising 33 Core, 6 Required and 6 Advanced Elective units, and directs applicants to the Programme website or University Student Handbook for the course list. The linked 2025-26 official Handbook publishes all 29 fixed course codes and credits: eleven Core Courses, the three consecutive one-unit MBA Capstone Project parts, the zero-unit MBA Seminars and Company Visits course, the three-unit Learning in the Field course, and thirteen Advanced Electives. The three Capstone codes together form one 3-unit Required component. The Handbook also permits Recommended non-MBA Electives and states that the Advanced Elective list may vary with demand and teaching resources; only the thirteen currently published Advanced Electives are modelled as the fixed pool, while any separately approved non-MBA option requires manual audit review.',
        courseGroups: [
          {
            id: 'core-courses',
            name: 'Core Courses',
            type: 'core',
            creditsRequired: 33,
            coursesRequired: 11,
            ruleText: 'Complete all eleven Core Courses for 33 units.',
            appliesToTrackIds: [],
            sourceUrl: HANDBOOK_URL,
            courses: coreCourses.map(([code, name]) => course(code, name, 3))
          },
          {
            id: 'required-courses',
            name: 'Required Courses',
            type: 'required_with_project',
            creditsRequired: 6,
            coursesRequired: 5,
            ruleText: 'Complete BUS7221, BUS7222 and BUS7223 as the three consecutive one-unit parts of the MBA Capstone Project, BUS7360 MBA Seminars and Company Visits for zero units, and BUS7520 Learning in the Field for 3 units. Together these five codes satisfy the 6-unit Required component.',
            appliesToTrackIds: [],
            sourceUrl: HANDBOOK_URL,
            courses: [
              course('BUS7221', 'MBA Capstone Project', 1, { courseKind: 'project' }),
              course('BUS7222', 'MBA Capstone Project', 1, { courseKind: 'project' }),
              course('BUS7223', 'MBA Capstone Project', 1, { courseKind: 'project' }),
              course('BUS7360', 'MBA Seminars and Company Visits', 0),
              course('BUS7520', 'Learning in the Field', 3)
            ]
          },
          {
            id: 'advanced-electives',
            name: 'Advanced Electives',
            type: 'elective',
            creditsRequired: 6,
            coursesRequired: 2,
            ruleText: 'Complete 6 units, normally two 3-unit courses, from the published Advanced Elective list or separately approved Recommended non-MBA Electives. The fixed list may vary with demand and teaching resources; unlisted approved non-MBA options are not represented as a fixed course pool and require manual review.',
            appliesToTrackIds: [],
            sourceUrl: HANDBOOK_URL,
            courses: advancedElectives.map(([code, name]) => course(code, name, 3))
          }
        ]
      }
    ]
  };
}

const supplement = buildSupplement();
const codes = supplement.programmes[0].courseGroups.flatMap((group) => group.courses.map((item) => item.code));
if (codes.length !== 29 || new Set(codes).size !== 29) {
  throw new Error(`Expected 29 unique course codes, received ${codes.length}/${new Set(codes).size}`);
}

if (require.main === module) {
  fs.writeFileSync(outputPath, `${JSON.stringify(supplement, null, 2)}\n`);
  console.log(`Wrote ${path.relative(ROOT, outputPath)} with ${codes.length} unique courses`);
}

module.exports = { buildSupplement };
