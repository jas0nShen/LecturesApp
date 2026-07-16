const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const SNAPSHOT_PATH = path.join(ROOT, 'data', 'tpg-source-snapshots', 'polyu-2027.json');
const OUTPUT_PATH = path.join(ROOT, 'data', 'tpg-course-supplements', 'polyu-mechanical-engineering-2027.json');
const PROGRAMME_ID = 'POLYU-TPG-069';
const PROGRAMME_SOURCE_URL = 'https://www.polyu.edu.hk/study/pg/tpg/2027/43100-me-met';
const DEPARTMENT_URL = 'https://www.polyu.edu.hk/me/study/taught-postgraduate-programmes/msc-in-mechanical-engineering/';
const SUBJECT_LIST_URL = 'https://www.polyu.edu.hk/me/study/course-info/subject-list/';
const PRD_URL = 'https://www.polyu.edu.hk/me/-/media/department/me/content/study/programme-documents/43100-master-of-science-in-mechanical-engineering/43100_prd_2025-26.pdf';

const TRACKS = {
  AEROSPACE: 'POLYU-TPG-069-AEROSPACE-ENGINEERING',
  AIR_NOISE: 'POLYU-TPG-069-AIR-NOISE-POLLUTION-MANAGEMENT',
  PRODUCT: 'POLYU-TPG-069-PRODUCT-DEVELOPMENT-AND-ANALYSIS'
};

const catalogue = {
  ME534: ['Engineering Acoustics', [TRACKS.AIR_NOISE]],
  ME536: ['Vibrations and Structure-borne Noise', [TRACKS.AIR_NOISE]],
  ME548: ['Computer Aided Product Analysis', [TRACKS.AEROSPACE, TRACKS.PRODUCT]],
  ME552: ['Integrated Engineering Design', [TRACKS.PRODUCT]],
  ME556: ['Advanced Combustion Systems', [TRACKS.AEROSPACE, TRACKS.AIR_NOISE]],
  ME558: ['Advanced Materials and Structural Design', [TRACKS.AEROSPACE, TRACKS.PRODUCT]],
  ME559: ['Advanced Environmental and Transportation Noise Control', [TRACKS.AIR_NOISE]],
  ME5610: ['Air Pollution Engineering', [TRACKS.AIR_NOISE, TRACKS.PRODUCT]],
  ME567: ['Advanced Control Technology', [TRACKS.AEROSPACE]],
  ME570: ['Advanced Product Mechatronics', [TRACKS.PRODUCT]],
  ME571: ['Corrosion Control', [TRACKS.PRODUCT]],
  ME572: ['Design for Sustainable Development', [TRACKS.PRODUCT]],
  ME573: ['Project on Product Design and Management', [TRACKS.PRODUCT]],
  ME574: ['Product Noise Control', [TRACKS.AIR_NOISE, TRACKS.PRODUCT]],
  ME576: ['Turbulent Flows and Aerodynamics', [TRACKS.AEROSPACE]],
  ME577: ['Advanced Aircraft Structures', [TRACKS.AEROSPACE]],
  ME578: ['Aircraft Design', [TRACKS.AEROSPACE]],
  ME579: ['Aircraft Noise and Aeroacoustics', [TRACKS.AEROSPACE]],
  ME5203: ['Green Combustion', [TRACKS.AEROSPACE, TRACKS.AIR_NOISE]],
  ME5510: ['Thermal Engineering', [TRACKS.AEROSPACE, TRACKS.AIR_NOISE, TRACKS.PRODUCT]]
};

function coreCourse(code) {
  const entry = catalogue[code];
  assert(entry, `Missing Mechanical Engineering catalogue entry ${code}`);
  const options = {};
  if (entry[1].length) options.countsTowardTrackIds = entry[1];
  if (['ME576', 'ME577', 'ME578'].includes(code)) options.subjectGroups = ['core', 'aerospace-compulsory'];
  return {
    code,
    name: entry[0],
    credits: 3,
    appliesToTrackIds: [],
    sourceUrl: SUBJECT_LIST_URL,
    ...options
  };
}

function buildSupplement() {
  const snapshot = JSON.parse(fs.readFileSync(SNAPSHOT_PATH, 'utf8'));
  const row = snapshot.rows.find((item) => item.programmeId === PROGRAMME_ID);
  assert(row, `Missing official snapshot row ${PROGRAMME_ID}`);
  assert.equal(row.sourceUrl, PROGRAMME_SOURCE_URL);
  assert.equal(row.creditText, '31');
  assert.match(row.curriculumText, /EEE5T03 Engineering Ethics and Academic Integrity/);
  assert.match(row.curriculumText, /7 taught subjects, including at least 4 Core Subjects, and a Dissertation/);
  assert.match(row.curriculumText, /10 taught subjects, including at least 6 Core Subjects/);
  assert.match(row.curriculumText, /Advanced Aircraft Structures/);
  assert.match(row.curriculumText, /Vibration & Structure-borne Noise/);

  const coreCodes = Object.keys(catalogue);
  const programme = {
    programmeId: PROGRAMME_ID,
    faculty: 'Department of Mechanical Engineering (ME)',
    status: 'verified',
    creditsRequired: 31,
    creditUnit: 'credits',
    trackSelectionOptional: true,
    tracks: [
      { id: TRACKS.AEROSPACE, name: 'Aerospace Engineering', type: 'Specialism', creditsRequired: 31, sourceUrl: PROGRAMME_SOURCE_URL },
      { id: TRACKS.AIR_NOISE, name: 'Air/Noise Pollution Management', type: 'Specialism', creditsRequired: 31, sourceUrl: PROGRAMME_SOURCE_URL },
      { id: TRACKS.PRODUCT, name: 'Product Development and Analysis', type: 'Specialism', creditsRequired: 31, sourceUrl: PROGRAMME_SOURCE_URL }
    ],
    sourceUrl: PROGRAMME_SOURCE_URL,
    ruleReviewStatus: 'manual_review_required',
    statusNote: 'The official 2027 Programme page publishes the current 31-credit generic award and three Specialisms, the coursework and Dissertation routes, EEE5T03 AIE, and the complete tentative Core title matrix. The current Department of Mechanical Engineering Subject List maps all twenty titles to exact codes, while the official 2025/26 Programme Requirement Document confirms those code-title pairs, their 3-credit values, Specialism ownership and the 9-credit ME591 Dissertation. The 2027 page removes the former Green Energy Specialism, which is now a separate Sustainable Energy Programme, so that older Specialism is not retained. The generic award may use approved electives from a dynamic cross-faculty pool that the official page does not enumerate. Route choice, Specialism minima, the three compulsory Aerospace subjects and Dissertation pertinence require manual audit review.',
    courseGroups: [
      {
        id: 'core-subjects',
        name: 'Core Subjects',
        type: 'core',
        creditsRequired: 12,
        coursesRequired: 4,
        ruleText: 'For the Dissertation route, complete seven taught subjects including at least four Core Subjects for 12 Core credits. For the coursework route, complete ten taught subjects including at least six Core Subjects for 18 Core credits. Aerospace Engineering additionally requires ME576, ME577 and ME578 and at least one further Aerospace Core in the Dissertation route, or at least three further Aerospace Cores in the coursework route. Other Specialisms require four or six relevant Core Subjects respectively.',
        appliesToTrackIds: [],
        sourceUrl: PROGRAMME_SOURCE_URL,
        courses: coreCodes.map(coreCourse)
      },
      {
        id: 'dissertation-option',
        name: 'Dissertation Option',
        type: 'dissertation',
        creditsRequired: 9,
        coursesRequired: 1,
        ruleText: 'The Dissertation route requires ME591 Dissertation for 9 credits after seven taught subjects. For a Specialism award, the Dissertation topic must be pertinent to that Specialism.',
        appliesToTrackIds: [],
        sourceUrl: PRD_URL,
        courses: [{
          code: 'ME591',
          name: 'Dissertation',
          credits: 9,
          appliesToTrackIds: [],
          sourceUrl: PRD_URL,
          courseKind: 'dissertation',
          conditionalRequirement: true
        }]
      },
      {
        id: 'academic-integrity',
        name: 'Engineering Ethics and Academic Integrity',
        type: 'academic_integrity',
        creditsRequired: 1,
        coursesRequired: 1,
        ruleText: 'Complete EEE5T03 Engineering Ethics and Academic Integrity for 1 credit in either route.',
        appliesToTrackIds: [],
        sourceUrl: PROGRAMME_SOURCE_URL,
        courses: [{
          code: 'EEE5T03',
          name: 'Engineering Ethics and Academic Integrity',
          credits: 1,
          appliesToTrackIds: [],
          sourceUrl: PROGRAMME_SOURCE_URL,
          courseKind: 'academic_integrity'
        }]
      }
    ]
  };

  const codes = programme.courseGroups.flatMap((item) => item.courses.map((item) => item.code));
  assert.equal(codes.length, 22);
  assert.equal(new Set(codes).size, codes.length);

  return {
    schemaVersion: 1,
    schoolCode: 'POLYU',
    academicYear: '2027-28',
    verifiedAt: '2026-07-16',
    programmes: [programme]
  };
}

function main() {
  const supplement = buildSupplement();
  fs.writeFileSync(OUTPUT_PATH, `${JSON.stringify(supplement, null, 2)}\n`);
  console.log(JSON.stringify({
    ok: true,
    output: path.relative(ROOT, OUTPUT_PATH),
    programmes: supplement.programmes.length,
    courses: supplement.programmes[0].courseGroups.flatMap((group) => group.courses).length
  }));
}

if (require.main === module) main();

module.exports = { TRACKS, buildSupplement };
