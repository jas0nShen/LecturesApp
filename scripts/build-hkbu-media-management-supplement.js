const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const outputPath = path.join(ROOT, 'data', 'tpg-course-supplements', 'hkbu-media-management-2025.json');
const PROGRAMME_ID = 'HKBU-TPG-043';
const VERIFIED_AT = '2026-07-16';
const SOURCE_URL = 'https://handbook.ar.hkbu.edu.hk/2025-2026/academic-programmes/postgraduate-programmes/school-of-communication/master-of-social-sciences-in-media-management';
const COURSE_ROOT = 'https://handbook.ar.hkbu.edu.hk/2025-2026/course';

const businessElectives = [
  ['ACCT7770', 'Corporate Accounting'],
  ['ACCT7780', 'Corporate Law and Compliance'],
  ['ACCT7820', 'Taxation'],
  ['ACCT7830', 'Risk, Compliance and Corporate Social Responsibility'],
  ['BUS7440', 'Entrepreneurship Development'],
  ['BUSD7010', 'Social Enterprise Management and Social Impact Strategies'],
  ['HRM7600', 'Global Human Resources Management and Cross-cultural Management'],
  ['MGNT7320', 'Leadership Theories and Development'],
  ['MKT7100', 'Management of Integrated Marketing Communications']
];

const communicationElectives = [
  ['COMM7010', 'Foundations of Communication Study'],
  ['COMM7020', 'Approaches and Methods in Communication Research'],
  ['COMM7040', 'Issues in Intercultural Communication'],
  ['COMM7050', 'Media and Communication in Chinese Societies'],
  ['COMM7060', 'Issues in Corporate Communication'],
  ['COMM7130', 'Globalization of Media and Communications'],
  ['COMM7160', 'Organizational Communication'],
  ['COMM7170', 'Communication Campaign Workshop'],
  ['COMM7180', 'Media Law and Ethics'],
  ['COMM7190', 'Issues and Cases in Mass Communication'],
  ['COMM7200', 'New Media Workshop'],
  ['COMM7220', 'Advertising Management'],
  ['COMM7230', 'Writing for Multimedia in Public Relations'],
  ['COMM7240', 'Media Markets'],
  ['COMM7250', 'Strategic Public Relations and Crisis Management'],
  ['COMM7270', 'Media Policies and Regulations'],
  ['COMM7280', 'Communication Technologies and Media Organizations'],
  ['COMM7300', 'Consumer Insights'],
  ['COMM7310', 'International Advertising'],
  ['COMM7510', 'Public Administration and the Media'],
  ['COMM7550', 'Advertising in China'],
  ['COMM7560', 'Political Communication and Public Opinion'],
  ['COMM7570', 'Youth, Media and Consumption'],
  ['COMM7580', 'Social Media Marketing'],
  ['COMM7610', 'Social Services Marketing and Communication'],
  ['COMM7620', 'Social Media and Online Social Networks'],
  ['COMM7630', 'Qualitative Research Methods'],
  ['COMM7640', 'Introduction to the Chinese Internet'],
  ['COMM7650', 'Introduction to Social Science Theories'],
  ['COMM7660', 'Statistical Analysis in Communication'],
  ['COMM7750', 'Using Social Networks: For the Communications Professional'],
  ['COMM7760', 'Advertising and Society'],
  ['COMM7770', 'Data Visualization'],
  ['COMM7780', 'Big Data Analytics for Media and Communication'],
  ['COMM7790', 'Communication and Technology'],
  ['COMM7800', 'New Media Design and Communication'],
  ['COMM7810', 'Branding'],
  ['COMM7820', 'Privacy, Data Protection, and Surveillance in the Communication and Media Context'],
  ['COMM7830', 'Media Communications and Psychology'],
  ['COMM7840', 'Algorithmic Culture'],
  ['COMM7850', 'Emerging Technology for Media and Communication'],
  ['COMM7860', 'Communicating Data'],
  ['COMM7870', 'Deceptive Communication'],
  ['COMM7880', 'Advanced Quantitative Communication Research Methods'],
  ['COMM7890', 'Communication Research Thesis'],
  ['COMM7900', 'Media Convergence: Theory and Practice'],
  ['COMM7910', 'Health Communication']
];

const externalElectives = [
  ['AF7410', 'Financial Management for Film, Television and New Media'],
  ['AF7450', 'Case Studies in Production and the Market'],
  ['CTV7220', 'World Cinema: History and Aesthetics'],
  ['CTV7230', 'Seminar on Chinese Cinemas'],
  ['CTV7270', 'Current Issues of Asian Media'],
  ['CTV7290', 'Critique of Contemporary Arts'],
  ['CTV7370', 'Cinematography for Directors'],
  ['CTV7380', 'Dramaturgy and Directing'],
  ['CTV7540', 'Seminar on Television and New Media'],
  ['JOUR7010', 'International Relations Theory and Practice'],
  ['JOUR7020', 'Comparative and International News'],
  ['JOUR7030', 'Research Methods in Media and Communication'],
  ['JOUR7040', 'Multimedia Journalism'],
  ['JOUR7070', 'Theories of Journalism and Communication'],
  ['JOUR7080', 'Current Issues and Case Studies in International News'],
  ['JOUR7090', 'International News Translation'],
  ['JOUR7110', 'Reporting International Conflict'],
  ['JOUR7120', 'International Business and Financial Reporting'],
  ['JOUR7140', 'Globalization, Economics and Finance'],
  ['JOUR7250', 'Reporting China and Hong Kong'],
  ['JOUR7260', 'Reporting Southeast Asia'],
  ['JOUR7270', 'The Journalism Business']
];

function course(code, name, options = {}) {
  return {
    code,
    name,
    credits: 3,
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
    programmes: [{
      programmeId: PROGRAMME_ID,
      programmeName: 'Master of Social Sciences (MSocSc) in Media Management',
      faculty: 'School of Communication',
      status: 'verified',
      creditsRequired: 27,
      creditUnit: 'units',
      sourceUrl: SOURCE_URL,
      ruleReviewStatus: 'manual_review_required',
      statusNote: 'The latest publicly accessible 2025-26 HKBU Academic Registry handbook publishes the complete 27-unit structure and all 83 unique course codes. Students complete four Required Courses (12 units), four Elective Courses (12 units), and either COMM7290 Professional Application Project (3 units) or one additional Elective Course. The Elective pool is divided into Business, Communication and other-Programme courses; no more than 6 units may be taken from the other-Programme category. The Project-or-additional-Elective path and cross-category Elective quota require manual audit review.',
      courseGroups: [
        {
          id: 'required-courses',
          name: 'Required Courses',
          type: 'core',
          creditsRequired: 12,
          coursesRequired: 4,
          ruleText: 'Complete all four Required Courses for 12 units.',
          appliesToTrackIds: [],
          sourceUrl: SOURCE_URL,
          courses: [
            course('COMM7260', 'Introduction to Media Management'),
            course('FIN7250', 'Corporate Financial Management'),
            course('MGNT7090', 'Strategic Management and Business Policy'),
            course('MKT7070', 'Global Marketing Strategy')
          ]
        },
        {
          id: 'elective-requirement',
          name: 'Elective Requirement',
          type: 'elective_requirement',
          creditsRequired: 12,
          coursesRequired: 4,
          ruleText: 'Complete four Elective Courses (12 units). If COMM7290 is not taken, complete one additional Elective Course for a total of 15 Elective units. No more than 6 units may come from the other-Programme pool.',
          appliesToTrackIds: [],
          sourceUrl: SOURCE_URL,
          courses: []
        },
        {
          id: 'business-electives',
          name: 'Business Electives',
          type: 'elective',
          ruleText: 'Official Business Elective pool.',
          appliesToTrackIds: [],
          sourceUrl: SOURCE_URL,
          courses: businessElectives.map(([code, name]) => course(code, name))
        },
        {
          id: 'communication-electives',
          name: 'Communication Electives',
          type: 'elective',
          ruleText: 'Official Communication Elective pool.',
          appliesToTrackIds: [],
          sourceUrl: SOURCE_URL,
          courses: communicationElectives.map(([code, name]) => course(code, name, code === 'COMM7890' ? { courseKind: 'dissertation' } : {}))
        },
        {
          id: 'other-programme-electives',
          name: 'Electives from Other Programmes',
          type: 'elective',
          creditsMax: 6,
          coursesMax: 2,
          ruleText: 'Take no more than two courses (6 units) from this official other-Programme Elective pool.',
          appliesToTrackIds: [],
          sourceUrl: SOURCE_URL,
          courses: externalElectives.map(([code, name]) => course(code, name))
        },
        {
          id: 'project-or-additional-elective',
          name: 'Application Project or Additional Elective',
          type: 'project_or_elective',
          creditsRequired: 3,
          coursesRequired: 1,
          ruleText: 'Complete COMM7290 Professional Application Project for 3 units, or replace it with one additional Elective Course from the official pools. The replacement Elective is not duplicated in this group.',
          appliesToTrackIds: [],
          sourceUrl: SOURCE_URL,
          courses: [course('COMM7290', 'Professional Application Project', { courseKind: 'project', conditionalRequirement: true })]
        }
      ]
    }]
  };
}

const supplement = buildSupplement();
const codes = supplement.programmes[0].courseGroups.flatMap((group) => group.courses.map((item) => item.code));
if (codes.length !== 83 || new Set(codes).size !== 83) {
  throw new Error(`Expected 83 unique course codes, received ${codes.length}/${new Set(codes).size}`);
}

if (require.main === module) {
  fs.writeFileSync(outputPath, `${JSON.stringify(supplement, null, 2)}\n`);
  console.log(`Wrote ${path.relative(ROOT, outputPath)} with ${codes.length} unique courses`);
}

module.exports = { buildSupplement };
