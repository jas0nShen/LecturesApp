const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const outputPath = path.join(ROOT, 'data', 'tpg-course-supplements', 'hkbu-communication-2025.json');
const PROGRAMME_ID = 'HKBU-TPG-041';
const TRACK_ID = 'HKBU-TPG-041-INTERACTIVE-MEDIA';
const VERIFIED_AT = '2026-07-16';
const SOURCE_URL = 'https://handbook.ar.hkbu.edu.hk/2025-2026/academic-programmes/postgraduate-programmes/school-of-communication/master-of-arts-in-communication';
const COURSE_ROOT = 'https://handbook.ar.hkbu.edu.hk/2025-2026/course';

const programmeElectives = [
  ['AIDM7010', 'Media Psychology'],
  ['AIDM7020', 'AI and Big Data Applications in Financial Market Analytics'],
  ['AIDM7390', 'Data Mining and Knowledge Discovery for Digital Media'],
  ['AIDM7420', 'News and Feature Writing for Digital Media'],
  ['AIDM7450', 'Dynamic Web and Mobile Programming for Digital Media'],
  ['AIDM7840', 'Algorithmic Culture'],
  ['AIDM7860', 'Human-Computer Interaction and User Experience'],
  ['COMM7040', 'Issues in Intercultural Communication'],
  ['COMM7050', 'Media and Communication in Chinese Societies'],
  ['COMM7060', 'Issues in Corporate Communication'],
  ['COMM7100', 'Intelligent Communication: Cloud and AI Solutions for Small Organizations'],
  ['COMM7130', 'Globalization of Media and Communication'],
  ['COMM7160', 'Organizational Communication'],
  ['COMM7170', 'Communication Campaign Workshop'],
  ['COMM7180', 'Media Law and Ethics'],
  ['COMM7190', 'Issues and Cases in Mass Communication'],
  ['COMM7200', 'New Media Workshop'],
  ['COMM7210', 'Project'],
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
  ['COMM7910', 'Health Communication'],
  ['COMM7950', 'Interactive Media Economy'],
  ['COMM7960', 'AI for Interactive Media Design'],
  ['COMM7970', 'Online Media Management'],
  ['COMM7980', 'Interactive Media Cultures and Ethics']
];

const externalElectives = [
  ['ACCT7770', 'Corporate Accounting'],
  ['ACCT7780', 'Corporate Law and Compliance'],
  ['ACCT7820', 'Taxation'],
  ['ACCT7830', 'Risk, Compliance and Corporate Social Responsibility'],
  ['BUSD7010', 'Social Enterprise Management and Social Impact Strategies'],
  ['CTV7220', 'World Cinema: History and Aesthetics'],
  ['CTV7230', 'Seminar on Chinese Cinemas'],
  ['CTV7270', 'Current Issues of Asian Media'],
  ['CTV7290', 'Critique of Contemporary Arts'],
  ['CTV7370', 'Cinematography for Directors'],
  ['CTV7380', 'Dramaturgy and Directing'],
  ['CTV7540', 'Seminar on Television and New Media'],
  ['EDUC7530', 'Sociocultural Context of Human Development'],
  ['EDUM7550', 'Educational Psychology'],
  ['JOUR7010', 'International Relations Theory and Practice'],
  ['JOUR7020', 'Comparative and International News'],
  ['JOUR7030', 'Research Methods in Media and Communication'],
  ['JOUR7040', 'Multimedia Journalism'],
  ['JOUR7070', 'Theories of Journalism and Communication'],
  ['JOUR7080', 'Current Issues and Case Studies in International News'],
  ['JOUR7090', 'International News Translation'],
  ['JOUR7110', 'Reporting International Conflict'],
  ['JOUR7120', 'International Business and Financial Reporting'],
  ['JOUR7140', 'Globalisation, Economics and Finance'],
  ['JOUR7150', 'Business News Writing'],
  ['JOUR7160', 'Principles of Economics'],
  ['JOUR7170', 'Business and Finance'],
  ['JOUR7180', 'Advanced Business News Writing and Production'],
  ['JOUR7250', 'Reporting China and Hong Kong'],
  ['JOUR7260', 'Reporting Southeast Asia'],
  ['JOUR7270', 'The Journalism Business']
];

function course(code, name, credits = 3, options = {}) {
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
      programmeName: 'Master of Arts (MA) in Communication',
      faculty: 'School of Communication',
      status: 'verified',
      creditsRequired: 27,
      creditUnit: 'units',
      sourceUrl: SOURCE_URL,
      ruleReviewStatus: 'manual_review_required',
      trackSelectionOptional: true,
      tracks: [
        {
          id: TRACK_ID,
          name: 'Interactive Media',
          type: 'Concentration',
          creditsRequired: 27,
          sourceUrl: SOURCE_URL,
          lastVerifiedAt: VERIFIED_AT
        }
      ],
      statusNote: 'The latest publicly accessible 2025-26 HKBU Academic Registry handbook publishes the complete 27-unit MA structure and all 98 unique course codes. All students complete COMM7020 and either COMM7010 or COMM7030; the unselected foundation course may count as an Elective. Students without a Concentration complete 21 Elective units, including at least 15 units from this Programme. Interactive Media students complete COMM7920, COMM7930 and COMM7940 plus 12 Elective units; seven AIDM Electives are restricted to that Concentration. At most two approved external Electives may count, and three published workshop courses carry zero units. The foundation-course cross-role rule, optional Concentration and combined internal/external Elective quota require manual audit review.',
      courseGroups: [
        {
          id: 'required-foundation-choice',
          name: 'Required Foundation Choice',
          type: 'core_choice',
          creditsRequired: 3,
          coursesRequired: 1,
          ruleText: 'Complete either COMM7010 or COMM7030 for 3 units. The course not used for this requirement may count as a Programme Elective.',
          appliesToTrackIds: [],
          sourceUrl: SOURCE_URL,
          courses: [
            course('COMM7010', 'Foundations of Communication Study', 3, { conditionalRequirement: true, subjectGroups: ['required_choice', 'programme_elective'] }),
            course('COMM7030', 'Perspectives on Media and Society', 3, { conditionalRequirement: true, subjectGroups: ['required_choice', 'programme_elective'] })
          ]
        },
        {
          id: 'required-research-methods',
          name: 'Required Research Methods',
          type: 'core',
          creditsRequired: 3,
          coursesRequired: 1,
          ruleText: 'Complete COMM7020 Approaches and Methods in Communication Research for 3 units.',
          appliesToTrackIds: [],
          sourceUrl: SOURCE_URL,
          courses: [course('COMM7020', 'Approaches and Methods in Communication Research')]
        },
        {
          id: 'interactive-media-concentration-required',
          name: 'Interactive Media Concentration Required Courses',
          type: 'track_core_requirement',
          creditsRequired: 9,
          coursesRequired: 3,
          appliesToTrackIds: [TRACK_ID],
          ruleText: 'Interactive Media Concentration students complete all three courses for 9 units.',
          sourceUrl: SOURCE_URL,
          courses: [
            course('COMM7920', 'Transnational Studies of Interactive Media', 3, { appliesToTrackIds: [TRACK_ID] }),
            course('COMM7930', 'Interactive Media Narrative and Storyboarding', 3, { appliesToTrackIds: [TRACK_ID] }),
            course('COMM7940', 'Interactive Media Studies Workshop', 3, { appliesToTrackIds: [TRACK_ID] })
          ]
        },
        {
          id: 'elective-requirement',
          name: 'Elective Requirement',
          type: 'elective_requirement',
          creditsRequired: 21,
          coursesRequired: 7,
          creditsRequiredByTrackIds: { [TRACK_ID]: 12 },
          coursesRequiredByTrackIds: { [TRACK_ID]: 4 },
          ruleText: 'Students without a Concentration complete seven Electives (21 units), including at least five Programme Electives (15 units). Interactive Media students complete four Electives (12 units). At most two approved external Electives (6 units) may count. The unused COMM7010 or COMM7030 foundation option may count as a Programme Elective.',
          appliesToTrackIds: [],
          sourceUrl: SOURCE_URL,
          courses: []
        },
        {
          id: 'programme-elective-pool',
          name: 'Programme Elective Pool',
          type: 'elective',
          ruleText: 'Choose from the official Programme Elective pool. AIDM-coded courses are available only to the Interactive Media Concentration. COMM7210 is a Project and COMM7890 is a Communication Research Thesis, but both remain Electives.',
          appliesToTrackIds: [],
          sourceUrl: SOURCE_URL,
          courses: programmeElectives.map(([code, name]) => course(code, name, 3, {
            ...(code.startsWith('AIDM') ? { appliesToTrackIds: [TRACK_ID] } : {}),
            ...(code === 'COMM7210' ? { courseKind: 'project' } : {}),
            ...(code === 'COMM7890' ? { courseKind: 'dissertation' } : {})
          }))
        },
        {
          id: 'approved-external-elective-pool',
          name: 'Approved External Elective Pool',
          type: 'elective',
          creditsMax: 6,
          coursesMax: 2,
          ruleText: 'At most two 3-unit Electives from this official cross-Programme pool may count toward the MA Elective requirement.',
          appliesToTrackIds: [],
          sourceUrl: SOURCE_URL,
          courses: externalElectives.map(([code, name]) => course(code, name))
        },
        {
          id: 'optional-zero-unit-courses',
          name: 'Optional Zero-unit Courses',
          type: 'optional',
          ruleText: 'These workshops are optional and carry zero units; they do not contribute to the 27-unit graduation requirement.',
          appliesToTrackIds: [],
          sourceUrl: SOURCE_URL,
          courses: [
            course('COMM7520', 'Cross-cultural Documentary Workshop', 0),
            course('COMM7530', 'Information Design', 0),
            course('COMM7540', 'Multimedia Production', 0)
          ]
        }
      ]
    }
  ]
  };
}

const supplement = buildSupplement();
const codes = supplement.programmes[0].courseGroups.flatMap((group) => group.courses.map((item) => item.code));
if (codes.length !== 98 || new Set(codes).size !== 98) {
  throw new Error(`Expected 98 unique course codes, received ${codes.length}/${new Set(codes).size}`);
}

if (require.main === module) {
  fs.writeFileSync(outputPath, `${JSON.stringify(supplement, null, 2)}\n`);
  console.log(`Wrote ${path.relative(ROOT, outputPath)} with ${codes.length} unique courses`);
}

module.exports = { TRACK_ID, buildSupplement };
