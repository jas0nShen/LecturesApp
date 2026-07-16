const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const SNAPSHOT_PATH = path.join(ROOT, 'data', 'tpg-source-snapshots', 'polyu-2027.json');
const OUTPUT_PATH = path.join(ROOT, 'data', 'tpg-course-supplements', 'polyu-electrical-engineering-2027.json');
const VERIFIED_AT = '2026-07-16';
const EEE_SYLLABI_URL = 'https://www.polyu.edu.hk/eee/study/information-for-current-students/subject-syllabi/';
const EE_PRD_URL = 'https://www.polyu.edu.hk/eee/-/media/department/eee/content/study/programme-documents/msc-in-ee/msc_ee_46010_prd_2025-26_final_202601.pdf';
const EIE_PRD_URL = 'https://www.polyu.edu.hk/eee/-/media/department/eee/content/study/programme-documents/msc-in-eie/msc_eie_46011_prd_2025-26_final_202601-v2.pdf';
const EV_PRD_URL = 'https://www.polyu.edu.hk/eee/-/media/department/eee/content/study/programme-documents/msc-in-ev/msc_ev_46012_prd_2025-26_final_202601.pdf';

const TRACKS = {
  EE_POWER: 'POLYU-TPG-044-ELECTRICAL-POWER-SYSTEMS',
  EE_RAILWAY: 'POLYU-TPG-044-RAILWAY-SYSTEMS',
  EIE_IOT: 'POLYU-TPG-045-INTERNET-OF-THINGS',
  EIE_MULTIMEDIA: 'POLYU-TPG-045-MULTIMEDIA-SIGNAL-PROCESSING-AND-COMMUNICATIONS'
};

const programmeSources = {
  'POLYU-TPG-044': 'https://www.polyu.edu.hk/study/pg/tpg/2027/46010-ee-eet',
  'POLYU-TPG-045': 'https://www.polyu.edu.hk/study/pg/tpg/2027/46011-eie-eit',
  'POLYU-TPG-046': 'https://www.polyu.edu.hk/study/pg/tpg/2027/46012-ev-evt'
};

const eePowerCodes = new Set(['EE501', 'EE502', 'EE505', 'EE509', 'EE524', 'EE526', 'EE545', 'EE570']);
const eeRailwayCodes = new Set(['EE509', 'EE510', 'EE533', 'EE535', 'EE536', 'EE537', 'EE5381', 'EE552', 'EE553', 'EE560', 'EEE525']);
const eieIotCodes = new Set(['EIE515', 'EIE546', 'EIE553', 'EIE557', 'EIE560', 'EIE566', 'EIE567', 'EIE568', 'EIE569', 'EIE573', 'EIE575', 'EIE579', 'EIE589', 'EEE532', 'COMP5434']);
const eieMultimediaCodes = new Set(['EIE522', 'EIE529', 'EIE546', 'EIE553', 'EIE557', 'EIE558', 'EIE563', 'EIE566', 'EIE567', 'EIE573', 'EIE575', 'EIE589', 'EEE531']);

const eeCoreRows = [
  ['EE501', 'Alternative Energy Technologies'],
  ['EE502', 'Modern Protection Methods'],
  ['EE505', 'Power System Control and Operation'],
  ['EE509', 'High Voltage Engineering'],
  ['EE510', 'Electrical Traction Engineering'],
  ['EE512', 'Electric Vehicles'],
  ['EE514', 'Real Time Computing'],
  ['EE520', 'Intelligent Motion Systems'],
  ['EE521', 'Industrial Power Electronics'],
  ['EE522', 'Optical Fibre Systems'],
  ['EE524', 'Open Electricity Market Operation'],
  ['EE526', 'Power System Analysis and Dynamics'],
  ['EE528', 'System Modelling and Optimal Control'],
  ['EE530', 'Electrical Energy Saving Systems'],
  ['EE533', 'Railway Power Supply Systems'],
  ['EE535', 'Maintenance and Reliability Engineering'],
  ['EE536', 'Signalling and Train Control Systems'],
  ['EE537', 'Railway Vehicles'],
  ['EE5381', 'System Assurance and Safety in Railways'],
  ['EE539', 'Aerospace Power Electronics and Actuation Systems'],
  ['EE545', 'Modern Generation and Grid Integration Technologies'],
  ['EE546', 'Electric Energy Storage and New Energy Sources for Electric Vehicles'],
  ['EE547', 'Electric Vehicle Charging Systems'],
  ['EE548', 'Advanced Electric Vehicle Technology'],
  ['EE549', 'Modern Sensor Technologies'],
  ['EE552', 'High Speed Rail'],
  ['EE553', 'Railway Electronic Systems'],
  ['EE560', 'Metros in Hong Kong and China'],
  ['EE570', 'Design and Analysis of Smart Grids'],
  ['EEE523', 'Economics and Markets in Power Systems and Electrified Transportation'],
  ['EEE525', 'Smart Transportation in Green Cities']
];

const eieCoreRows = [
  ['EIE509', 'Satellite Communications - Technology and Applications'],
  ['EIE511', 'VLSI System Design'],
  ['EIE515', 'Advanced Optical Communication Systems'],
  ['EIE522', 'Pattern Recognition: Theory and Applications'],
  ['EIE529', 'Digital Image Processing'],
  ['EIE546', 'Video Technology'],
  ['EIE553', 'Security in Data Communication'],
  ['EIE557', 'Computational Intelligence and Its Applications'],
  ['EIE558', 'Speech Processing and Recognition'],
  ['EIE560', 'Microelectronics Processing and Technologies'],
  ['EIE563', 'Digital Audio Processing'],
  ['EIE566', 'Wireless Communications'],
  ['EIE567', 'Wireless Power Transfer Technologies'],
  ['EIE568', 'IoT - Tools and Applications'],
  ['EIE569', 'Sensor Networks'],
  ['EIE571', 'Photonic System Analysis'],
  ['EIE572', 'Information Photonics'],
  ['EIE573', 'Mobile Edge Computing'],
  ['EIE575', 'Vehicular Communications and Inter-Networking Technologies'],
  ['EIE577', 'Optoelectronic Devices'],
  ['EIE579', 'Advanced Telecommunication Systems'],
  ['EIE580', 'Radio Frequency and Microwave Integrated Circuits for Communication System Applications'],
  ['EIE587', 'Channel Coding'],
  ['EIE589', 'Wireless Data Network'],
  ['EEE508', 'VLSI Technology and Design'],
  ['EEE531', 'Spoken Language Technologies'],
  ['EEE532', 'Artificial Intelligence of Things Technology'],
  ['COMP5434', 'Big Data Computing']
];

const evRows = [
  ['EE512', 'Electric Vehicles', ['core_choice', 'elective']],
  ['EE520', 'Intelligent Motion Systems', ['elective']],
  ['EE521', 'Industrial Power Electronics', ['elective']],
  ['EE528', 'System Modelling and Optimal Control', ['elective']],
  ['EE530', 'Electrical Energy Saving Systems', ['elective']],
  ['EE535', 'Maintenance and Reliability Engineering', ['elective']],
  ['EE545', 'Modern Generation and Grid Integration Technologies', ['elective']],
  ['EE546', 'Electric Energy Storage and New Energy Sources for Electric Vehicles', ['core_choice', 'elective']],
  ['EE548', 'Advanced Electric Vehicle Technology', ['core_choice', 'elective']],
  ['EE570', 'Design and Analysis of Smart Grids', ['elective']],
  ['EIE568', 'IoT - Tools and Applications', ['elective']],
  ['EIE575', 'Vehicular Communications and Inter-Networking Technologies', ['elective']],
  ['EEE521', 'Tomorrow\u2019s Leader in Electric Vehicles', ['compulsory_core']],
  ['EEE522', 'Autonomous Vehicles', ['elective']],
  ['EEE523', 'Economics and Markets in Power Systems and Electrified Transportation', ['elective']],
  ['EEE524', 'Green Technology and Policy in Electrical Engineering', ['elective']],
  ['EEE525', 'Smart Transportation in Green Cities', ['elective']]
];

function course(code, name, credits, sourceUrl, options = {}) {
  return {
    code,
    name,
    credits,
    appliesToTrackIds: [],
    sourceUrl,
    ...options
  };
}

function trackMembership(code, pairs) {
  return pairs.filter(([codes]) => codes.has(code)).map(([, trackId]) => trackId);
}

function academicIntegrity(sourceUrl) {
  return {
    id: 'academic-integrity',
    name: 'Academic Integrity and Ethics',
    type: 'academic_integrity',
    creditsRequired: 1,
    coursesRequired: 1,
    ruleText: 'Complete the 1-credit EEE5T03 Engineering Ethics and Academic Integrity subject.',
    appliesToTrackIds: [],
    sourceUrl,
    courses: [course('EEE5T03', 'Engineering Ethics and Academic Integrity', 1, sourceUrl, { courseKind: 'academic_integrity' })]
  };
}

function dissertation(code, name, sourceUrl) {
  return {
    id: 'dissertation-option',
    name: 'Dissertation Option',
    type: 'dissertation',
    coursesRequired: 1,
    ruleText: `The 9-credit ${code} Dissertation is used only on the seven-taught-subject Dissertation path and replaces three taught subjects.`,
    appliesToTrackIds: [],
    sourceUrl,
    courses: [course(code, name, 9, sourceUrl, { courseKind: 'dissertation', conditionalRequirement: true })]
  };
}

function electricalEngineering() {
  const sourceUrl = programmeSources['POLYU-TPG-044'];
  const trackIds = [TRACKS.EE_POWER, TRACKS.EE_RAILWAY];
  return {
    programmeId: 'POLYU-TPG-044',
    status: 'verified',
    creditsRequired: 31,
    creditUnit: 'credits',
    sourceUrl,
    ruleReviewStatus: 'manual_review_required',
    statusNote: 'The official 2027 Programme page and the current 2025/26 Programme Requirement Document publish matching 31-credit Electrical Engineering paths, the complete 31-subject Department Core pool, exact 3-credit values, the 9-credit EE590 Dissertation and the 1-credit EEE5T03 AIE subject. The current PRD also publishes exact Electrical Power Systems and Railway Systems Specialism Core memberships. Students may use approved subjects from other disciplines for the remaining taught-subject places, and the Dissertation and non-Dissertation paths have different Core and Specialism minima. The open external Elective choice, rolling subject schedule and mutually exclusive paths require manual audit review.',
    trackSelectionOptional: true,
    tracks: [
      { id: TRACKS.EE_POWER, code: 'EPS', name: 'Electrical Power Systems', type: 'Specialism', creditsRequired: 31, sourceUrl: EE_PRD_URL },
      { id: TRACKS.EE_RAILWAY, code: 'RS', name: 'Railway Systems', type: 'Specialism', creditsRequired: 31, sourceUrl: EE_PRD_URL }
    ],
    courseGroups: [
      {
        id: 'department-core-subjects',
        name: 'Department Core Subjects',
        type: 'core',
        ruleText: 'Generic students complete at least four Core Subjects on the seven-taught-subject plus Dissertation path, or at least six Core Subjects on the ten-taught-subject path. Each Specialism requires at least four of its marked Core Subjects with a pertinent Dissertation, or at least eight Department Core Subjects including at least six marked for that Specialism on the ten-subject path.',
        appliesToTrackIds: [],
        sourceUrl: EE_PRD_URL,
        courses: eeCoreRows.map(([code, name]) => {
          const countsTowardTrackIds = trackMembership(code, [[eePowerCodes, TRACKS.EE_POWER], [eeRailwayCodes, TRACKS.EE_RAILWAY]]);
          return course(code, name, 3, EE_PRD_URL, {
            subjectGroups: ['core'],
            ...(countsTowardTrackIds.length ? { countsTowardTrackIds } : {})
          });
        })
      },
      {
        id: 'approved-external-electives',
        name: 'Approved Subjects from Other Disciplines',
        type: 'elective',
        ruleText: 'Remaining taught-subject places may be filled with approved subjects from disciplines such as accounting, computing, construction and environment, and logistics. The official sources do not publish a closed Elective code list; confirm eligibility and availability during registration.',
        appliesToTrackIds: [],
        sourceUrl,
        courses: []
      },
      dissertation('EE590', 'EE Dissertation', EE_PRD_URL),
      academicIntegrity(EE_PRD_URL)
    ]
  };
}

function electronicInformationEngineering() {
  const sourceUrl = programmeSources['POLYU-TPG-045'];
  return {
    programmeId: 'POLYU-TPG-045',
    status: 'verified',
    creditsRequired: 31,
    creditUnit: 'credits',
    sourceUrl,
    ruleReviewStatus: 'manual_review_required',
    statusNote: 'The official 2027 Programme page and the current 2025/26 Programme Requirement Document publish matching 31-credit Electronic and Information Engineering paths, the complete 28-subject Core pool, exact 3-credit values, the 9-credit EIE590 Dissertation and the 1-credit EEE5T03 AIE subject. The current PRD also publishes exact Internet of Things and Multimedia Signal Processing and Communications Specialism Core memberships. Students may use approved subjects from other disciplines for the remaining taught-subject places. The open external Elective choice and different generic, Specialism, Dissertation and non-Dissertation Core minima require manual audit review.',
    trackSelectionOptional: true,
    tracks: [
      { id: TRACKS.EIE_IOT, code: 'IOT', name: 'Internet of Things', type: 'Specialism', creditsRequired: 31, sourceUrl: EIE_PRD_URL },
      { id: TRACKS.EIE_MULTIMEDIA, code: 'MSPC', name: 'Multimedia Signal Processing and Communications', type: 'Specialism', creditsRequired: 31, sourceUrl: EIE_PRD_URL }
    ],
    courseGroups: [
      {
        id: 'department-core-subjects',
        name: 'Department Core Subjects',
        type: 'core',
        ruleText: 'Generic students complete at least four Core Subjects on the seven-taught-subject plus Dissertation path, or at least six Core Subjects on the ten-taught-subject path. Each Specialism requires at least five marked Core Subjects with a pertinent Dissertation, or at least seven marked Core Subjects on the ten-subject path.',
        appliesToTrackIds: [],
        sourceUrl: EIE_PRD_URL,
        courses: eieCoreRows.map(([code, name]) => {
          const countsTowardTrackIds = trackMembership(code, [[eieIotCodes, TRACKS.EIE_IOT], [eieMultimediaCodes, TRACKS.EIE_MULTIMEDIA]]);
          return course(code, name, 3, EIE_PRD_URL, {
            subjectGroups: ['core'],
            ...(countsTowardTrackIds.length ? { countsTowardTrackIds } : {})
          });
        })
      },
      {
        id: 'approved-external-electives',
        name: 'Approved Subjects from Other Disciplines',
        type: 'elective',
        ruleText: 'Remaining taught-subject places may be filled with approved subjects from other disciplines, including business and management. The official sources do not publish a closed Elective code list; confirm eligibility and availability during registration.',
        appliesToTrackIds: [],
        sourceUrl,
        courses: []
      },
      dissertation('EIE590', 'Dissertation', EIE_PRD_URL),
      academicIntegrity(EIE_PRD_URL)
    ]
  };
}

function electricVehicles() {
  const sourceUrl = programmeSources['POLYU-TPG-046'];
  return {
    programmeId: 'POLYU-TPG-046',
    status: 'verified',
    creditsRequired: 31,
    creditUnit: 'credits',
    sourceUrl,
    ruleReviewStatus: 'manual_review_required',
    statusNote: 'The official 2027 Programme page and the current 2025/26 Programme Requirement Document publish matching 31-credit Electric Vehicles paths, exact codes and 3-credit values for the complete taught-subject pool, the 9-credit EE590 Dissertation and the 1-credit EEE5T03 AIE subject. EEE521 is compulsory and students select any two of EE512, EE546 and EE548 as the remaining Core Subjects. The other taught places are Electives, and an unused Core choice may also serve as an Elective. The seven-subject plus Dissertation and ten-subject paths and the cross-role Core choices require manual audit review.',
    courseGroups: [
      {
        id: 'core-and-elective-subjects',
        name: 'Core and Elective Subjects',
        type: 'core_elective_cross_role',
        ruleText: 'Complete EEE521 and any two of EE512, EE546 and EE548 as the three Core Subjects. Complete four Elective Subjects plus EE590 on the Dissertation path, or seven Elective Subjects on the ten-taught-subject path. A Core-choice subject not used toward the Core requirement may count as an Elective.',
        appliesToTrackIds: [],
        sourceUrl: EV_PRD_URL,
        courses: evRows.map(([code, name, subjectGroups]) => course(code, name, 3, EV_PRD_URL, { subjectGroups }))
      },
      dissertation('EE590', 'EE Dissertation', EV_PRD_URL),
      academicIntegrity(EV_PRD_URL)
    ]
  };
}

function buildSupplement() {
  const snapshot = JSON.parse(fs.readFileSync(SNAPSHOT_PATH, 'utf8'));
  const rows = new Map(snapshot.rows.map((row) => [row.programmeId, row]));

  Object.entries(programmeSources).forEach(([programmeId, sourceUrl]) => {
    const row = rows.get(programmeId);
    assert(row, `Missing official snapshot row ${programmeId}`);
    assert.equal(row.sourceUrl, sourceUrl);
    assert.equal(row.creditText, '31');
    assert.match(row.curriculumText, /Academic Integrity and Ethics/);
  });
  assert.match(rows.get('POLYU-TPG-044').curriculumText, /Electrical Power Systems/);
  assert.match(rows.get('POLYU-TPG-044').curriculumText, /Railway Systems/);
  assert.match(rows.get('POLYU-TPG-045').curriculumText, /Internet of Things/);
  assert.match(rows.get('POLYU-TPG-045').curriculumText, /Multimedia Signal Processing and Communications/);
  assert.match(rows.get('POLYU-TPG-046').curriculumText, /at least 3 Core Subjects and 4 Elective Subjects/);

  const programmes = [electricalEngineering(), electronicInformationEngineering(), electricVehicles()];
  programmes.forEach((programme) => {
    const codes = programme.courseGroups.flatMap((group) => group.courses.map((item) => item.code));
    assert.equal(new Set(codes).size, codes.length, `${programme.programmeId} contains duplicate course codes`);
  });
  assert.equal(eeCoreRows.length, 31);
  assert.equal(eieCoreRows.length, 28);
  assert.equal(evRows.length, 17);
  assert.equal(eePowerCodes.size, 8);
  assert.equal(eeRailwayCodes.size, 11);
  assert.equal(eieIotCodes.size, 15);
  assert.equal(eieMultimediaCodes.size, 13);

  return {
    schemaVersion: 1,
    schoolCode: 'POLYU',
    academicYear: '2027-28',
    verifiedAt: VERIFIED_AT,
    sourceUrl: EEE_SYLLABI_URL,
    programmes
  };
}

function main() {
  const supplement = buildSupplement();
  fs.writeFileSync(OUTPUT_PATH, `${JSON.stringify(supplement, null, 2)}\n`);
  console.log(JSON.stringify({
    ok: true,
    output: path.relative(ROOT, OUTPUT_PATH),
    programmes: supplement.programmes.length,
    courses: supplement.programmes.reduce((sum, programme) => (
      sum + programme.courseGroups.reduce((groupSum, group) => groupSum + group.courses.length, 0)
    ), 0)
  }));
}

if (require.main === module) main();

module.exports = { TRACKS, buildSupplement };
