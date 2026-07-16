const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const outputPath = path.join(ROOT, 'data', 'tpg-course-supplements', 'hkbu-international-journalism-2025.json');
const PROGRAMME_ID = 'HKBU-TPG-042';
const VERIFIED_AT = '2026-07-16';
const SOURCE_URL = 'https://handbook.ar.hkbu.edu.hk/2025-2026/academic-programmes/postgraduate-programmes/school-of-communication/master-of-arts-in-international-journalism-studies';
const COURSE_ROOT = 'https://handbook.ar.hkbu.edu.hk/2025-2026/course';

const TRACKS = {
  IJ: 'HKBU-TPG-042-INTERNATIONAL-JOURNALISM',
  BFJ: 'HKBU-TPG-042-BUSINESS-FINANCIAL-JOURNALISM'
};
const ALL_TRACK_IDS = Object.values(TRACKS);

const programmeElectives = [
  ['JOUR7030', 'Research Methods in Media and Communication'],
  ['JOUR7070', 'Theories of Journalism and Communication'],
  ['JOUR7080', 'Current Issues and Case Studies in International News'],
  ['JOUR7090', 'International News Translation'],
  ['JOUR7110', 'Reporting International Conflict'],
  ['JOUR7120', 'International Business and Financial Reporting', [TRACKS.IJ]],
  ['JOUR7130', 'Project or Dissertation'],
  ['JOUR7140', 'Globalisation, Economics and Finance'],
  ['JOUR7210', 'Longform Journalism'],
  ['JOUR7220', 'Photojournalism'],
  ['JOUR7230', 'Broadcast Journalism'],
  ['JOUR7240', 'Online and Digital Journalism'],
  ['JOUR7250', 'Reporting China and Hong Kong'],
  ['JOUR7260', 'Reporting Southeast Asia'],
  ['JOUR7270', 'The Journalism Business'],
  ['JOUR7280', 'Big Data Analytics for Media and Communication'],
  ['JOUR7300', 'Approaches and Methods in Communication Research'],
  ['JOUR7310', 'Advanced Quantitative Communication Research Methods'],
  ['JOUR7320', 'Communication Research Thesis'],
  ['JOUR7330', 'Food and Culture Reporting', [TRACKS.IJ]],
  ['JOUR7340', 'International News in a Globalized World'],
  ['JOUR7350', 'Media and Communication in Greater China'],
  ['JOUR7360', 'Generative AI Assisted Reporting'],
  ['JOUR7370', 'Mental Health and Journalism'],
  ['JOUR7380', 'Reporting Cryptocurrency and Blockchain']
];

const externalElectives = [
  ['ACCT7770', 'Corporate Accounting'],
  ['ACCT7780', 'Corporate Law and Compliance'],
  ['ACCT7820', 'Taxation'],
  ['ACCT7830', 'Risk, Compliance and Corporate Social Responsibility'],
  ['COMM7010', 'Foundations of Communication Study'],
  ['COMM7040', 'Issues in Intercultural Communication'],
  ['COMM7050', 'Media and Communication in Chinese Societies'],
  ['COMM7060', 'Issues in Corporate Communication'],
  ['COMM7100', 'Intelligent Communication: Cloud and AI Solutions for Small Organizations'],
  ['COMM7160', 'Organizational Communication'],
  ['COMM7170', 'Communication Campaign Workshop'],
  ['COMM7180', 'Media Law and Ethics'],
  ['COMM7190', 'Issues and Cases in Mass Communication'],
  ['COMM7200', 'New Media Workshop'],
  ['COMM7220', 'Advertising Management'],
  ['COMM7230', 'Writing for Multimedia in Public Relations'],
  ['COMM7240', 'Media Markets'],
  ['COMM7250', 'Strategic Public Relations and Crisis Management'],
  ['COMM7300', 'Consumer Insights'],
  ['COMM7310', 'International Advertising'],
  ['COMM7510', 'Public Administration and the Media'],
  ['COMM7550', 'Advertising in China'],
  ['COMM7560', 'Political Communication and Public Opinion'],
  ['COMM7790', 'Communication and Technology'],
  ['COMM7800', 'New Media Design and Communication'],
  ['COMM7860', 'Communicating Data']
];

function course(code, name, options = {}) {
  return {
    code,
    name,
    credits: 3,
    appliesToTrackIds: options.appliesToTrackIds || ALL_TRACK_IDS,
    sourceUrl: `${COURSE_ROOT}/${code}`,
    ...options
  };
}

function buildSupplement() {
  const requirementByTrack = Object.fromEntries(ALL_TRACK_IDS.map((trackId) => [trackId, 15]));
  const requiredCoursesByTrack = Object.fromEntries(ALL_TRACK_IDS.map((trackId) => [trackId, 5]));
  const electiveCreditsByTrack = Object.fromEntries(ALL_TRACK_IDS.map((trackId) => [trackId, 12]));
  const electiveCoursesByTrack = Object.fromEntries(ALL_TRACK_IDS.map((trackId) => [trackId, 4]));

  return {
    schemaVersion: 1,
    schoolCode: 'HKBU',
    academicYear: '2025-26',
    verifiedAt: VERIFIED_AT,
    programmes: [{
      programmeId: PROGRAMME_ID,
      programmeName: 'Master of Arts (MA) in International Journalism Studies',
      faculty: 'School of Communication',
      status: 'verified',
      creditsRequired: 27,
      creditUnit: 'units',
      sourceUrl: SOURCE_URL,
      ruleReviewStatus: 'manual_review_required',
      trackSelectionOptional: false,
      tracks: [
        {
          id: TRACKS.IJ,
          name: 'International Journalism',
          type: 'Concentration',
          creditsRequired: 27,
          sourceUrl: SOURCE_URL,
          lastVerifiedAt: VERIFIED_AT
        },
        {
          id: TRACKS.BFJ,
          name: 'Business and Financial Journalism',
          type: 'Concentration',
          creditsRequired: 27,
          sourceUrl: SOURCE_URL,
          lastVerifiedAt: VERIFIED_AT
        }
      ],
      statusNote: 'The latest publicly accessible 2025-26 HKBU Academic Registry handbook and the current School of Communication Programme page confirm the two Concentrations and the 27-unit award. Each Concentration requires 15 Required units and 12 Elective units, with at least 9 Elective units taken from MAIJS. International Journalism students choose either JOUR7010 or JOUR7020 as a Required Course, and may use the unselected course as an Elective. JOUR7150, JOUR7160, JOUR7170 and JOUR7180 are Required for Business and Financial Journalism but are available as Electives only to International Journalism students. Students may take at most one of JOUR7220, JOUR7230 and JOUR7240, and at most one approved external Elective. These cross-role, one-of and quota rules require manual audit review.',
      courseGroups: [
        {
          id: 'concentration-required-requirement',
          name: 'Concentration Required Course Requirement',
          type: 'track_core_requirement',
          creditsRequiredByTrackIds: requirementByTrack,
          coursesRequiredByTrackIds: requiredCoursesByTrack,
          appliesToTrackIds: ALL_TRACK_IDS,
          ruleText: 'Complete five Required Courses (15 units) for the selected Concentration. The applicable courses are identified in the cross-role and Concentration-specific groups.',
          sourceUrl: SOURCE_URL,
          courses: []
        },
        {
          id: 'required-elective-cross-role-courses',
          name: 'Required and Elective Cross-role Courses',
          type: 'track_core_elective_cross_role',
          appliesToTrackIds: ALL_TRACK_IDS,
          ruleText: 'JOUR7010 and JOUR7020 form a one-of Required choice for International Journalism; the unselected course may count as an Elective. JOUR7040 is Required for both Concentrations. JOUR7150, JOUR7160, JOUR7170 and JOUR7180 are Required for Business and Financial Journalism and Elective only for International Journalism. Each code may count only once.',
          sourceUrl: SOURCE_URL,
          courses: [
            course('JOUR7010', 'International Relations Theory and Practice', {
              conditionalRequirement: true,
              subjectGroups: ['ij_required_choice', 'elective'],
              typeByTrackIds: { [TRACKS.IJ]: 'core_choice', [TRACKS.BFJ]: 'elective' }
            }),
            course('JOUR7020', 'Comparative and International News', {
              conditionalRequirement: true,
              subjectGroups: ['ij_required_choice', 'elective'],
              typeByTrackIds: { [TRACKS.IJ]: 'core_choice', [TRACKS.BFJ]: 'elective' }
            }),
            course('JOUR7040', 'Multimedia Journalism', {
              requiredForTrackIds: ALL_TRACK_IDS,
              typeByTrackIds: { [TRACKS.IJ]: 'core', [TRACKS.BFJ]: 'core' }
            }),
            ...[
              ['JOUR7150', 'Business News Writing'],
              ['JOUR7160', 'Principles of Economics'],
              ['JOUR7170', 'Business and Finance'],
              ['JOUR7180', 'Advanced Business News Writing and Production']
            ].map(([code, name]) => course(code, name, {
              requiredForTrackIds: [TRACKS.BFJ],
              typeByTrackIds: { [TRACKS.IJ]: 'elective', [TRACKS.BFJ]: 'core' }
            }))
          ]
        },
        {
          id: 'international-journalism-required-courses',
          name: 'International Journalism Required Courses',
          type: 'track_core',
          creditsRequired: 9,
          coursesRequired: 3,
          appliesToTrackIds: [TRACKS.IJ],
          ruleText: 'International Journalism students complete all three courses for 9 units, in addition to JOUR7040 and one of JOUR7010 or JOUR7020.',
          sourceUrl: SOURCE_URL,
          courses: [
            course('JOUR7060', 'News and Feature Writing for International Practice', { appliesToTrackIds: [TRACKS.IJ], requiredForTrackIds: [TRACKS.IJ] }),
            course('JOUR7100', 'Advanced News Writing and Production for International Practice', { appliesToTrackIds: [TRACKS.IJ], requiredForTrackIds: [TRACKS.IJ] }),
            course('JOUR7290', 'Media Law and Ethics for International Journalism', { appliesToTrackIds: [TRACKS.IJ], requiredForTrackIds: [TRACKS.IJ] })
          ]
        },
        {
          id: 'elective-requirement',
          name: 'Elective Requirement',
          type: 'elective_requirement',
          creditsRequiredByTrackIds: electiveCreditsByTrack,
          coursesRequiredByTrackIds: electiveCoursesByTrack,
          appliesToTrackIds: ALL_TRACK_IDS,
          ruleText: 'Complete four Elective Courses (12 units), including at least three MAIJS Electives (9 units). At most one approved external Elective (3 units) may count.',
          sourceUrl: SOURCE_URL,
          courses: []
        },
        {
          id: 'programme-elective-pool',
          name: 'MAIJS Elective Pool',
          type: 'elective',
          appliesToTrackIds: ALL_TRACK_IDS,
          ruleText: 'Choose from the official MAIJS Elective pool. JOUR7120 and JOUR7330 are available only to International Journalism students. At most one of JOUR7220, JOUR7230 and JOUR7240 may be selected. JOUR7130 is a Project or Dissertation and JOUR7320 is a Communication Research Thesis.',
          sourceUrl: SOURCE_URL,
          courses: programmeElectives.map(([code, name, appliesToTrackIds]) => course(code, name, {
            ...(appliesToTrackIds ? { appliesToTrackIds } : {}),
            ...(['JOUR7220', 'JOUR7230', 'JOUR7240'].includes(code) ? { subjectGroups: ['skills_choice'] } : {}),
            ...(code === 'JOUR7130' ? { courseKind: 'project_or_dissertation' } : {}),
            ...(code === 'JOUR7320' ? { courseKind: 'dissertation' } : {})
          }))
        },
        {
          id: 'approved-external-elective-pool',
          name: 'Approved External Elective Pool',
          type: 'elective',
          creditsMax: 3,
          coursesMax: 1,
          appliesToTrackIds: ALL_TRACK_IDS,
          ruleText: 'At most one 3-unit course from this official cross-Programme pool may count toward the 12-unit Elective requirement, subject to quota.',
          sourceUrl: SOURCE_URL,
          courses: externalElectives.map(([code, name]) => course(code, name))
        }
      ]
    }]
  };
}

const supplement = buildSupplement();
const codes = supplement.programmes[0].courseGroups.flatMap((group) => group.courses.map((item) => item.code));
if (codes.length !== 61 || new Set(codes).size !== 61) {
  throw new Error(`Expected 61 unique course codes, received ${codes.length}/${new Set(codes).size}`);
}

if (require.main === module) {
  fs.writeFileSync(outputPath, `${JSON.stringify(supplement, null, 2)}\n`);
  console.log(`Wrote ${path.relative(ROOT, outputPath)} with ${codes.length} unique courses`);
}

module.exports = { TRACKS, buildSupplement };
