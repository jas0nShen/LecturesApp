const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const candidates = require('../data/tpg-course-candidates/hkust-2026.json');
const sourceSnapshot = require('../data/tpg-source-snapshots/hkust-2026.json');
const outputPath = path.join(ROOT, 'data', 'tpg-course-supplements', 'hkust-first-batch-2026.json');
const statusPath = path.join(ROOT, 'data', 'tpg-course-supplements', 'hkust-source-status-2026.json');
const selectedIds = new Set([
  'HKUST-TPG-007',
  'HKUST-TPG-002',
  'HKUST-TPG-003',
  'HKUST-TPG-004',
  'HKUST-TPG-005',
  'HKUST-TPG-006',
  'HKUST-TPG-008',
  'HKUST-TPG-009',
  'HKUST-TPG-010',
  'HKUST-TPG-011',
  'HKUST-TPG-012',
  'HKUST-TPG-013',
  'HKUST-TPG-014',
  'HKUST-TPG-016',
  'HKUST-TPG-017',
  'HKUST-TPG-018',
  'HKUST-TPG-020',
  'HKUST-TPG-021',
  'HKUST-TPG-022',
  'HKUST-TPG-030',
  'HKUST-TPG-035',
  'HKUST-TPG-036',
  'HKUST-TPG-040',
  'HKUST-TPG-046',
  'HKUST-TPG-052',
  'HKUST-TPG-015',
  'HKUST-TPG-019',
  'HKUST-TPG-023',
  'HKUST-TPG-024',
  'HKUST-TPG-025',
  'HKUST-TPG-026',
  'HKUST-TPG-027',
  'HKUST-TPG-028',
  'HKUST-TPG-029',
  'HKUST-TPG-031',
  'HKUST-TPG-032',
  'HKUST-TPG-033',
  'HKUST-TPG-034',
  'HKUST-TPG-037',
  'HKUST-TPG-038',
  'HKUST-TPG-039',
  'HKUST-TPG-041',
  'HKUST-TPG-042',
  'HKUST-TPG-043',
  'HKUST-TPG-044',
  'HKUST-TPG-045',
  'HKUST-TPG-047',
  'HKUST-TPG-048',
  'HKUST-TPG-049',
  'HKUST-TPG-050',
  'HKUST-TPG-051',
  'HKUST-TPG-053'
]);

const announcedElectiveRequirements = new Map([
  ['HKUST-TPG-002', { creditsRequired: 20, ruleText: 'Complete 20 elective credits. The official Programme page states that the elective list for each year is announced at the beginning of the intake.' }],
  ['HKUST-TPG-003', { creditsRequired: 19, ruleText: 'Complete 19 elective credits from the IMBA and EMBA course lists, or other electives approved by the Academic Director and Programme Committee.' }],
  ['HKUST-TPG-004', { creditsRequired: 18, ruleText: 'Complete 18 elective credits, including at least 10 credits offered by the MSc in Finance Programme. The official page does not publish a fixed elective-code pool.' }],
  ['HKUST-TPG-005', { creditsRequired: 18, ruleText: 'Complete 18 elective credits from the EMBA course list.' }],
  ['HKUST-TPG-008', { creditsRequired: 14, ruleText: 'Complete 14 elective credits, including at least one elective from each of Engineering, Business and Management, and Science. The annual course list is announced separately.' }],
  ['HKUST-TPG-012', { creditsRequired: 10, ruleText: 'Complete 10 elective credits offered by the MSc in Global Finance Programme.' }],
  ['HKUST-TPG-016', { creditsRequired: 12, ruleText: 'Complete 12 elective credits. The official Programme page states that the intake-specific elective list is announced separately.' }],
  ['HKUST-TPG-021', { creditsRequired: 18, ruleText: 'Complete 18 elective credits. The official Programme page states that the intake-specific Programme elective list is announced separately.' }],
  ['HKUST-TPG-022', { creditsRequired: 16, ruleText: 'Complete 16 elective credits from information and cyber security management courses, or other courses approved by the Academic Director. The annual list is announced separately.' }],
  ['HKUST-TPG-030', { creditsRequired: 16, ruleText: 'Complete 16 elective credits. The official Programme page states that the intake-specific list is announced separately.' }],
  ['HKUST-TPG-035', { creditsRequired: 14, ruleText: 'Complete 14 elective credits. The official Programme page states that the intake-specific list is announced separately.' }],
  ['HKUST-TPG-040', { creditsRequired: 12, ruleText: 'Complete 12 elective credits: at least 6 credits in Entrepreneurship and Leadership and 6 credits in Technology and Science. The annual pre-approved list is announced separately.' }],
  ['HKUST-TPG-046', { creditsRequired: 27, ruleText: 'Complete 27 credits of advanced electives selected for the needs of executives in China and Asia. The official page does not publish a fixed elective-code pool.' }]
]);

const additionalGroups = new Map([
  ['HKUST-TPG-018', [{
    name: 'Elective Courses',
    type: 'elective',
    creditsMin: 14,
    creditsMax: 20,
    ruleText: 'Complete 14–20 elective credits, depending on whether 0–6 conditional Required Course credits apply. The intake-specific elective list and Concentration selections are approved separately by the Academic Director.'
  }]],
  ['HKUST-TPG-046', [{
    name: 'Required Immersion Program',
    type: 'programme',
    creditsRequired: 2,
    ruleText: 'Complete the 2-credit Required Immersion Program. The official Programme page does not publish a course code for this requirement.'
  }]]
]);

const groupRequirementOverrides = new Map([
  ['HKUST-TPG-006/group-1', {
    creditsMin: 27,
    ruleText: 'Complete at least 27 credits from the official Required Course pool; the courses in the pool are not all individually mandatory.'
  }],
  ['HKUST-TPG-006/group-2', {
    creditsMin: 0,
    creditsMax: 9,
    ruleText: 'Up to 9 elective credits may be taken from mathematics courses at 4000-level or above, courses outside the department at 5000-level or above, and/or MAFS 6100.'
  }],
  ['HKUST-TPG-042/group-2', {
    ruleText: 'Complete 6 MSc Project credits. Students are required to repeat EESM 6980 until they have obtained 6 credits for graduation.'
  }],
  ['HKUST-TPG-018/group-2', {
    name: 'Conditional Required Courses',
    creditsMin: 0,
    creditsMax: 6,
    ruleText: 'Students without sufficient information systems, computer science or engineering background may be required to complete 0–6 credits from these courses, as decided by the Academic Director.'
  }],
  ['HKUST-TPG-020/group-1', {
    name: 'Programme Courses',
    type: 'programme',
    creditsRequired: 30,
    ruleText: 'Complete at least 30 credits of CSIT courses. CSIT 6910 may be repeated for up to 6 credits; up to 3 approved MSBD credits may count toward the Programme.'
  }],
  ['HKUST-TPG-020/group-2', {
    name: 'Cybersecurity Concentration Requirements',
    type: 'elective',
    creditsRequired: 12,
    appliesToTrackIds: ['HKUST-TPG-020-CYBERSECURITY'],
    ruleText: 'For the Cybersecurity Concentration, complete at least 9 credits from the listed Cybersecurity courses and 3 credits of CSIT 6910 in the Cybersecurity area with Programme Director approval.'
  }],
  ['HKUST-TPG-026/group-1', {
    creditsRequired: 6,
    ruleText: 'Complete at least 6 core credits from IBTM 5050 and IBTM 5060.'
  }],
  ['HKUST-TPG-026/group-2', {
    name: 'Elective Courses',
    type: 'elective',
    creditsRequired: 24,
    ruleText: 'Complete 24 credits of IBTM courses. The official page specifically identifies IBTM 6010 and IBTM 6950 and permits limited approved non-IBTM substitutions; it does not publish a fixed complete elective-code pool.'
  }],
  ['HKUST-TPG-052/group-1', {
    creditsRequired: 18,
    ruleText: 'MSc students must complete at least 18 foundation credits, including at least three management-related courses. Official substitution rules remain subject to Programme approval.'
  }],
  ['HKUST-TPG-052/group-2', {
    ruleText: 'The pre-approved elective list, including JEVE 6980, is made available at the beginning of every term; the official page does not state a fixed elective-group credit minimum.'
  }]
]);

const courseDetailOverrides = new Map();

const programmeCreditOverrides = new Map([
  ['HKUST-TPG-013', 45]
]);

const programmeTracks = new Map([
  ['HKUST-TPG-010', [
    {
      id: 'HKUST-TPG-010-HISTORY-CULTURE',
      name: 'History and Culture',
      type: 'Concentration',
      creditsRequired: 24,
      ruleText: 'Optional disciplinary Concentration: complete at least 9 credits (three courses) from the official History and Culture list.'
    },
    {
      id: 'HKUST-TPG-010-POLITICAL-SCIENCE',
      name: 'Political Science',
      type: 'Concentration',
      creditsRequired: 24,
      ruleText: 'Optional disciplinary Concentration: complete at least 9 credits (three courses) from the official Political Science list.'
    },
    {
      id: 'HKUST-TPG-010-QUANTITATIVE-SOCIAL-SCIENCE',
      name: 'Quantitative Social Science',
      type: 'Concentration',
      creditsRequired: 24,
      ruleText: 'Optional disciplinary Concentration: complete at least 9 credits (three courses) from the official Quantitative Social Science list.'
    },
    {
      id: 'HKUST-TPG-010-SOCIOLOGY',
      name: 'Sociology',
      type: 'Concentration',
      creditsRequired: 24,
      ruleText: 'Optional disciplinary Concentration: complete at least 9 credits (three courses) from the official Sociology list.'
    },
    {
      id: 'HKUST-TPG-010-ACADEMIC-RESEARCH',
      name: 'Academic Research',
      type: 'Concentration',
      creditsRequired: 42,
      ruleText: 'Complete the existing 24-credit coursework requirement plus 3 credits of Research Methodology, MGCS 6200 (3 credits), and MGCS 6980 with MGCS 6982 (12 credits).'
    }
  ]],
  ['HKUST-TPG-043', [
    {
      id: 'HKUST-TPG-043-AI-DATA-ANALYTICS',
      name: 'AI and Data Analytics',
      type: 'Concentration',
      creditsRequired: 30,
      ruleText: 'Optional professional Concentration: complete four approved courses (8 credits). The approved course list is not published on the Programme page.'
    },
    {
      id: 'HKUST-TPG-043-ECONOMIC-POLICY',
      name: 'Economic Policy',
      type: 'Concentration',
      creditsRequired: 30,
      ruleText: 'Optional professional Concentration: complete four approved courses (8 credits). The approved course list is not published on the Programme page.'
    },
    {
      id: 'HKUST-TPG-043-FINANCIAL-ECONOMICS',
      name: 'Financial Economics',
      type: 'Concentration',
      creditsRequired: 30,
      ruleText: 'Optional professional Concentration: complete four approved courses (8 credits). The approved course list is not published on the Programme page.'
    },
    {
      id: 'HKUST-TPG-043-RESEARCH-PREPARATION',
      name: 'Research Preparation',
      type: 'Concentration',
      creditsRequired: 36,
      ruleText: 'Complete at least 36 credits, including 14 Core, at least 16 Elective credits with 6 credits at PhD level, plus ECON 6980.'
    }
  ]],
  ['HKUST-TPG-013', [
    {
      id: 'HKUST-TPG-013-FULL-TIME',
      name: 'Full-time MBA',
      type: 'Award Path',
      creditsRequired: 52,
      ruleText: 'Complete 52 credits: 2 Required Immersion, 16 Core, 33 Elective and 1 Required Wrap-up credit.'
    },
    {
      id: 'HKUST-TPG-013-PART-TIME',
      name: 'Part-time MBA',
      type: 'Award Path',
      creditsRequired: 45,
      ruleText: 'Complete 45 credits: 2 Required Immersion, 16 Core and 27 Elective credits.'
    }
  ]],
  ['HKUST-TPG-011', [
    {
      id: 'HKUST-TPG-011-TESL',
      name: 'Teaching English as a Second Language',
      type: 'Concentration',
      ruleText: 'Complete at least two TESL Concentration elective courses (6 credits) within the 12-credit elective requirement.'
    },
    {
      id: 'HKUST-TPG-011-TCSL',
      name: 'Teaching Chinese as a Second Language',
      type: 'Concentration',
      ruleText: 'Complete at least two TCSL Concentration elective courses (6 credits) within the 12-credit elective requirement.'
    }
  ]],
  ['HKUST-TPG-009', [
    {
      id: 'HKUST-TPG-009-CHINESE-LANGUAGE-LITERATURE',
      name: 'Chinese Language and Literature',
      type: 'Concentration',
      ruleText: 'Complete four courses (12 credits) in the Concentration, including at least one required course (3 credits). The intake-specific Concentration elective list is not published on the official curriculum page.'
    },
    {
      id: 'HKUST-TPG-009-CHINESE-HISTORY-ANTHROPOLOGY',
      name: 'Chinese History and Anthropology',
      type: 'Concentration',
      ruleText: 'Complete four courses (12 credits) in the Concentration, including at least one required course (3 credits). The intake-specific Concentration elective list is not published on the official curriculum page.'
    }
  ]],
  ['HKUST-TPG-020', [{
    id: 'HKUST-TPG-020-CYBERSECURITY',
    name: 'Cybersecurity',
    type: 'Concentration'
  }]],
  ['HKUST-TPG-017', [
    { id: 'HKUST-TPG-017-ESP', name: 'Environmental and Sustainability Policy', type: 'Concentration' },
    { id: 'HKUST-TPG-017-STP', name: 'Science and Technology Policy', type: 'Concentration' },
    { id: 'HKUST-TPG-017-PEPM', name: 'Policy Economics and Public Management', type: 'Concentration' }
  ]],
  ['HKUST-TPG-018', [
    {
      id: 'HKUST-TPG-018-FINANCIAL-TECHNOLOGY',
      name: 'Financial Technology',
      type: 'Concentration',
      ruleText: 'Complete four approved Financial Technology electives (8 credits). The official curriculum page does not publish a fixed course-code list.'
    },
    {
      id: 'HKUST-TPG-018-TECHNOLOGY-INNOVATION-ENTREPRENEURSHIP',
      name: 'Technology Innovation and Entrepreneurship',
      type: 'Concentration',
      ruleText: 'Complete four approved Technology Innovation and Entrepreneurship electives (8 credits). The official curriculum page does not publish a fixed course-code list.'
    },
    {
      id: 'HKUST-TPG-018-ARTIFICIAL-INTELLIGENCE',
      name: 'Artificial Intelligence',
      type: 'Concentration',
      ruleText: 'Complete four approved Artificial Intelligence electives (8 credits). The official curriculum page does not publish a fixed course-code list.'
    }
  ]],
  ['HKUST-TPG-050', [
    { id: 'HKUST-TPG-050-INFRASTRUCTURAL-SYSTEMS', name: 'Infrastructural System Engineering and Management', type: 'Concentration' },
    { id: 'HKUST-TPG-050-MATERIAL', name: 'Material Engineering', type: 'Concentration' },
    { id: 'HKUST-TPG-050-STRUCTURAL', name: 'Structural Engineering', type: 'Concentration' },
    { id: 'HKUST-TPG-050-ENVIRONMENTAL', name: 'Environmental Engineering', type: 'Concentration' },
    { id: 'HKUST-TPG-050-WATER-RESOURCES', name: 'Water Resources Engineering', type: 'Concentration' },
    { id: 'HKUST-TPG-050-TRANSPORTATION', name: 'Transportation Engineering', type: 'Concentration' },
    { id: 'HKUST-TPG-050-GEOTECHNICAL', name: 'Geotechnical Engineering', type: 'Concentration' }
  ].map((track) => ({
    ...track,
    ruleText: 'Optional MSc Concentration: complete at least 12 credits in the selected sub-area. The Programme itself requires breadth across at least three sub-areas.'
  }))],
  ['HKUST-TPG-044', [
    { id: 'HKUST-TPG-044-MSC', name: 'Master of Science', type: 'Award Path', creditsRequired: 30, ruleText: 'Complete 24 course-pool credits and the 6-credit MSc Project.' },
    { id: 'HKUST-TPG-044-MENG', name: 'Master of Engineering', type: 'Award Path', creditsRequired: 36, ruleText: 'Complete the 30-credit MSc requirements and the 6-credit year-long Industrial Placement.' }
  ]],
  ['HKUST-TPG-036', [{
    id: 'HKUST-TPG-036-MATERIALS-TECHNOLOGY',
    name: 'Materials Technology',
    type: 'Concentration',
    ruleText: 'Optional Concentration: complete at least 18 credits from the approved Materials Technology course list as part of the 30-credit Programme requirement.'
  }]],
  ['HKUST-TPG-048', [{
    id: 'HKUST-TPG-048-PSYCHOLOGY',
    name: 'Psychology',
    type: 'Concentration',
    ruleText: 'Optional Concentration: complete at least three courses (9 credits) from the official Psychology required-course list.'
  }]]
]);

const optionalTrackProgrammeIds = new Set([
  'HKUST-TPG-009',
  'HKUST-TPG-010',
  'HKUST-TPG-017',
  'HKUST-TPG-018',
  'HKUST-TPG-020',
  'HKUST-TPG-036',
  'HKUST-TPG-043',
  'HKUST-TPG-048',
  'HKUST-TPG-050'
]);

function buildChineseCultureGroups(candidate) {
  const sourceUrl = candidate.sourceUrl;
  const foundation = candidate.courseGroups.find((group) => group.id === 'group-1');
  const requiredCandidates = candidate.courseGroups.slice(1).flatMap((group) => group.courses);
  const otherRequired = sourceSnapshot.courses.find((course) => course.code === 'HMMA 5007');
  if (!otherRequired) throw new Error('HKUST Chinese Culture is missing HMMA 5007 details');
  const requiredCourses = [...new Map([...requiredCandidates, otherRequired].map((course) => [course.code, course])).values()];
  const normalizeCourse = (course) => ({
    ...course,
    name: course.name.replace(/^[*#@]+\s*/, ''),
    sourceUrl,
    appliesToTrackIds: []
  });
  return [
    {
      ...foundation,
      name: 'Foundation Course',
      creditsRequired: 3,
      ruleText: 'Complete LANG 5072. An approved exemption requires one additional elective course so that the 24-credit Programme total is maintained.',
      sourceUrl,
      appliesToTrackIds: [],
      courses: foundation.courses.map(normalizeCourse)
    },
    {
      id: 'group-2',
      name: 'Required Courses',
      type: 'core',
      creditsRequired: 6,
      coursesRequired: 2,
      ruleText: 'Complete two required courses (6 credits) from the official pool. Named HUMA substitutions require approval. These courses remain available without a Concentration; the Concentration qualification separately requires at least one applicable required course.',
      sourceUrl,
      appliesToTrackIds: [],
      courses: requiredCourses.map(normalizeCourse)
    },
    {
      id: 'group-3',
      name: 'Elective Courses',
      type: 'elective',
      creditsRequired: 15,
      coursesRequired: 5,
      ruleText: 'Complete 15 elective credits from the annual China-related elective list published by the Division of Humanities. Surplus required-course credits may count toward this requirement; the fixed annual elective codes are not published on the official curriculum page.',
      sourceUrl,
      appliesToTrackIds: [],
      courses: []
    }
  ];
}

function buildPublicPolicyGroups(candidate) {
  const sourceUrl = candidate.sourceUrl;
  const groupsById = new Map(candidate.courseGroups.map((group) => [group.id, group]));
  const core = groupsById.get('group-1');
  const professionalDevelopment = groupsById.get('group-2');
  const concentrationGroups = [groupsById.get('group-3'), groupsById.get('group-4'), groupsById.get('group-5')];
  const coursesByCode = new Map(concentrationGroups.flatMap((group) => group.courses).map((course) => [course.code, course]));
  const esp = new Set(groupsById.get('group-3').courses.map((course) => course.code));
  const stp = new Set(['PPOL 5180', 'PPOL 5210', 'PPOL 5220', 'PPOL 5230', 'PPOL 5240', 'PPOL 5320', 'PPOL 6100-6109', 'IPEN 5160', 'IPEN 5180', 'IPEN 5200', 'IPEN 5250']);
  const pepm = new Set([...groupsById.get('group-5').courses.map((course) => course.code), 'PPOL 6100-6109']);
  const trackMembership = [
    ['HKUST-TPG-017-ESP', esp],
    ['HKUST-TPG-017-STP', stp],
    ['HKUST-TPG-017-PEPM', pepm]
  ];
  return [
    {
      ...core,
      ruleText: 'Complete 24 core credits, including either PPOL 6110 Policy Analysis Project or PPOL 6980 Individual Research Capstone Project. The two capstone paths are alternatives and require manual audit review.',
      sourceUrl,
      appliesToTrackIds: [],
      courses: core.courses.map((course) => ({ ...course, sourceUrl, appliesToTrackIds: [] }))
    },
    {
      id: 'group-2',
      name: 'Elective Courses',
      type: 'elective',
      creditsRequired: 24,
      ruleText: 'Complete 24 elective credits: at least 12 credits of PPOL/IPEN postgraduate courses and up to 12 credits from the intake-specific approved Other Electives list.',
      sourceUrl,
      appliesToTrackIds: [],
      courses: []
    },
    {
      id: 'group-3',
      name: 'Concentration Elective Pools',
      type: 'elective',
      ruleText: 'A selected Concentration requires at least 12 of the 24 elective credits from its approved lists, including at least 6 PPOL/IPEN Concentration elective credits. This is a subset of the Programme elective requirement and requires manual audit review.',
      sourceUrl,
      appliesToTrackIds: programmeTracks.get(candidate.programmeId).map((track) => track.id),
      courses: [...coursesByCode.values()].map((course) => ({
        ...course,
        sourceUrl,
        appliesToTrackIds: trackMembership.filter(([, codes]) => codes.has(course.code)).map(([trackId]) => trackId)
      }))
    },
    {
      ...professionalDevelopment,
      id: 'group-4',
      ruleText: 'Complete the zero-credit PPOL 5770 Professional Development requirement.',
      sourceUrl,
      appliesToTrackIds: [],
      courses: professionalDevelopment.courses.map((course) => ({ ...course, sourceUrl, appliesToTrackIds: [] }))
    }
  ];
}

function buildInternationalManagementGroups(candidate) {
  const sourceUrl = candidate.sourceUrl;
  const [core, required, elective, cems, mixed] = candidate.courseGroups;
  const languageCourses = mixed.courses.filter((course) => course.code.startsWith('LANG '));
  const internship = mixed.courses.find((course) => course.code === 'MIMT 6300');
  if (!internship) throw new Error('HKUST International Management is missing MIMT 6300 details');
  const common = (course) => ({ ...course, sourceUrl, appliesToTrackIds: [] });
  return [
    { ...core, sourceUrl, appliesToTrackIds: [], courses: core.courses.map(common) },
    { ...required, sourceUrl, appliesToTrackIds: [], courses: required.courses.map(common) },
    {
      ...elective,
      ruleText: 'Complete 19 elective credits from the annual International Management portfolio. MGMT 5983 may be required for students without prior business foundation training; the complete annual elective list is announced separately.',
      sourceUrl,
      appliesToTrackIds: [],
      courses: elective.courses.map(common)
    },
    {
      ...cems,
      name: 'CEMS Specified Elective Courses',
      creditsWithinProgramme: 7,
      ruleText: 'Optional CEMS qualification: complete these 7 specified elective credits as part of the Programme\'s 19 elective credits. This is a subset requirement and requires manual audit review.',
      sourceUrl,
      appliesToTrackIds: [],
      courses: cems.courses.map(common)
    },
    {
      id: 'group-5',
      name: 'CEMS Language Requirement',
      type: 'programme',
      countsTowardProgrammeCredits: false,
      ruleText: 'Optional CEMS qualification only. Students entering with two languages may need one of the published third-language paths. Credits and grades from these language courses do not count toward the 34-credit degree requirement.',
      sourceUrl,
      appliesToTrackIds: [],
      courses: languageCourses.map((course) => ({ ...common(course), countsTowardProgrammeCredits: false }))
    },
    {
      id: 'group-6',
      name: 'CEMS International Internship',
      type: 'programme',
      countsTowardProgrammeCredits: false,
      ruleText: 'Optional CEMS qualification only. Complete the approved international internship or obtain the official experience exemption. MIMT 6300 carries zero credits.',
      sourceUrl,
      appliesToTrackIds: [],
      courses: [{ ...common(internship), countsTowardProgrammeCredits: false }]
    }
  ];
}

function buildGlobalMarineResourcesGroups(candidate) {
  const sourceUrl = candidate.sourceUrl;
  const [uosRequired, uosElective, hkustRequired, hkustElective, project] = candidate.courseGroups;
  const common = (course) => ({ ...course, sourceUrl, appliesToTrackIds: [] });
  const uosCourse = (course) => ({ ...common(course), programmeCredits: course.credits / 2 });
  return [
    {
      ...uosRequired,
      name: 'Fall Term at UoS — Required Courses',
      creditsRequired: 11.25,
      officialCreditsRequired: 22.5,
      officialCreditUnit: 'ECTS',
      ruleText: 'Complete both required UoS courses: 22.5 ECTS, transferred as 11.25 HKUST credits using the official 2 ECTS to 1 credit conversion.',
      sourceUrl,
      appliesToTrackIds: [],
      courses: uosRequired.courses.map(uosCourse)
    },
    {
      ...uosElective,
      name: 'Fall Term at UoS — Elective Course',
      type: 'elective',
      creditsRequired: 3.75,
      officialCreditsRequired: 7.5,
      officialCreditUnit: 'ECTS',
      coursesRequired: 1,
      ruleText: 'Complete one available UoS elective: 7.5 ECTS, transferred as 3.75 HKUST credits.',
      sourceUrl,
      appliesToTrackIds: [],
      courses: uosElective.courses.map(uosCourse)
    },
    {
      ...hkustRequired,
      name: 'Spring Term at HKUST — Required Courses',
      creditsRequired: 12,
      ruleText: 'Complete all four required Spring Term courses (12 HKUST credits).',
      sourceUrl,
      appliesToTrackIds: [],
      courses: hkustRequired.courses.map(common)
    },
    {
      ...hkustElective,
      name: 'Spring Term at HKUST — Elective Course',
      type: 'elective',
      creditsRequired: 3,
      coursesRequired: 1,
      ruleText: 'Complete one available Spring Term elective (3 HKUST credits).',
      sourceUrl,
      appliesToTrackIds: [],
      courses: hkustElective.courses.map(common)
    },
    {
      ...project,
      name: 'Research Project',
      type: 'project',
      creditsRequired: 15,
      ruleText: 'Complete OCES 6111 in Spring Term and OCES 6112 plus OCES 6113 in Summer Term, for 15 HKUST credits in total.',
      sourceUrl,
      appliesToTrackIds: [],
      courses: project.courses.map(common)
    }
  ];
}

function buildCivilInfrastructureGroups(candidate) {
  const sourceUrl = candidate.sourceUrl;
  const [pool, project] = candidate.courseGroups;
  const tracks = programmeTracks.get(candidate.programmeId);
  const byName = new Map(tracks.map((track) => [track.name, track.id]));
  const membership = new Map([
    ['Infrastructural System Engineering and Management', ['CIEM 5140', 'CIEM 5160', 'CIEM 5170', 'CIEM 5180', 'CIEM 5190', 'CIEM 5810']],
    ['Material Engineering', ['CIEM 5240']],
    ['Structural Engineering', ['CIEM 5310', 'CIEM 5311', 'CIEM 5320', 'CIEM 5380', 'CIEM 5390']],
    ['Environmental Engineering', ['CIEM 5410', 'CIEM 5420', 'CIEM 5460', 'CIEM 5480']],
    ['Water Resources Engineering', ['CIEM 5390']],
    ['Transportation Engineering', ['CIEM 5620', 'CIEM 5630']],
    ['Geotechnical Engineering', ['CIEM 5720', 'CIEM 5740', 'CIEM 5760', 'CIEM 5770', 'CIEM 5790']]
  ]);
  const allTrackIds = tracks.map((track) => track.id);
  const annotate = (course) => ({
    ...course,
    sourceUrl,
    appliesToTrackIds: [],
    countsTowardTrackIds: course.code === 'CIEM 6000-6010'
      ? allTrackIds
      : [...membership].filter(([, codes]) => codes.includes(course.code)).map(([name]) => byName.get(name)),
    ...(course.code === 'CIEM 6000-6010' ? { trackRuleText: 'Counts toward one or two approved sub-areas according to the Special Topics content and Programme Director approval.' } : {})
  });
  return [
    {
      ...pool,
      name: 'Required Course Pool',
      creditsRequired: 24,
      ruleText: 'Complete 24 credits from the official course pool across at least three sub-areas. Approved JEVE and IBTM courses may each contribute up to 6 credits under the published substitution limits.',
      sourceUrl,
      appliesToTrackIds: [],
      courses: pool.courses.map(annotate)
    },
    {
      ...project,
      name: 'MSc Project',
      type: 'project',
      creditsRequired: 6,
      ruleText: 'Complete the mandatory 6-credit CIEM 6980 MSc Project. Its approved topic may cover one or two sub-areas.',
      sourceUrl,
      appliesToTrackIds: [],
      courses: project.courses.map((course) => ({ ...annotate(course), countsTowardTrackIds: allTrackIds, trackRuleText: 'Counts toward one or two approved sub-areas according to the project topic.' }))
    }
  ];
}

function buildDigitalSustainableCitiesGroups(candidate) {
  const sourceUrl = candidate.sourceUrl;
  const [pool, combinedProject] = candidate.courseGroups;
  const project = combinedProject.courses.find((course) => course.code === 'DISC 6980');
  const placement = combinedProject.courses.find((course) => course.code === 'DISC 6500');
  if (!project || !placement) throw new Error('HKUST Digital and Sustainable Cities is missing project path details');
  const common = (course) => ({ ...course, sourceUrl, appliesToTrackIds: [] });
  return [
    {
      ...pool,
      name: 'Required Course Pool',
      creditsRequired: 24,
      ruleText: 'Complete 24 credits from the official pool, including at least two courses from Digital Technology and Data Science and at least two from Sustainable Design and Management of Infrastructures. At most 9 approved credits may come from the listed external MSc courses.',
      sourceUrl,
      appliesToTrackIds: [],
      courses: pool.courses.map(common)
    },
    {
      id: 'group-2',
      name: 'MSc Project',
      type: 'project',
      creditsRequired: 6,
      ruleText: 'Complete the 6-credit DISC 6980 MSc Project. This requirement applies to both MSc and MEng award paths.',
      sourceUrl,
      appliesToTrackIds: [],
      courses: [common(project)]
    },
    {
      id: 'group-3',
      name: 'MEng Industrial Placement',
      type: 'practicum',
      creditsRequired: 6,
      ruleText: 'MEng award path only: complete the 6-credit year-long DISC 6500 Industrial Placement. These credits do not count toward the MSc award.',
      sourceUrl,
      appliesToTrackIds: ['HKUST-TPG-044-MENG'],
      courses: [{ ...placement, sourceUrl, appliesToTrackIds: ['HKUST-TPG-044-MENG'] }]
    }
  ];
}

function buildMechanicalEngineeringGroups(candidate) {
  const sourceUrl = candidate.sourceUrl;
  const [programme, materials] = candidate.courseGroups;
  const trackId = 'HKUST-TPG-036-MATERIALS-TECHNOLOGY';
  return [
    {
      ...programme,
      name: 'Programme Course Requirement',
      type: 'programme',
      creditsRequired: 30,
      ruleText: 'Complete at least 30 credits of MESF courses. MESF 6950 may be repeated for up to 6 credits; up to 9 approved IBTM or MECH postgraduate credits may count toward the Programme.',
      sourceUrl,
      appliesToTrackIds: [],
      courses: programme.courses.map((course) => ({ ...course, sourceUrl, appliesToTrackIds: [], countsTowardTrackIds: [trackId] }))
    },
    {
      ...materials,
      name: 'Materials Technology Concentration Course Pool',
      type: 'elective',
      creditsRequired: 18,
      ruleText: 'Optional Materials Technology Concentration: complete at least 18 credits from this approved pool. MESF 6950 in the Materials Technology area may also count.',
      sourceUrl,
      appliesToTrackIds: [trackId],
      courses: materials.courses.map((course) => ({ ...course, sourceUrl, appliesToTrackIds: [trackId], countsTowardTrackIds: [trackId] }))
    }
  ];
}

function buildSocialScienceGroups(candidate) {
  const sourceUrl = candidate.sourceUrl;
  const [foundation, psychology] = candidate.courseGroups;
  const trackId = 'HKUST-TPG-048-PSYCHOLOGY';
  const common = (course) => ({ ...course, sourceUrl, appliesToTrackIds: [] });
  return [
    {
      ...foundation,
      name: 'Foundation Courses',
      creditsRequired: 6,
      ruleText: 'MA students complete both Foundation Courses for 6 credits.',
      sourceUrl,
      appliesToTrackIds: [],
      courses: foundation.courses.map(common)
    },
    {
      id: 'group-2',
      name: 'Required Courses',
      type: 'core',
      creditsRequired: 12,
      ruleText: 'Complete 12 credits from the term-specific SSMA required-course list covering one or more social science disciplines. The fixed course-code list is announced by the Programme Office each term and is not published on the curriculum page.',
      sourceUrl,
      appliesToTrackIds: [],
      courses: []
    },
    {
      id: 'group-3',
      name: 'Elective Courses',
      type: 'elective',
      creditsRequired: 6,
      ruleText: 'Complete 6 elective credits from eligible School of Humanities and Social Science postgraduate courses; at most one approved 4000-level undergraduate course may count.',
      sourceUrl,
      appliesToTrackIds: [],
      courses: []
    },
    {
      ...psychology,
      id: 'group-4',
      name: 'Psychology Concentration Course Pool',
      type: 'elective',
      creditsRequired: 9,
      coursesRequired: 3,
      ruleText: 'Optional Psychology Concentration: complete at least three courses (9 credits) from this official pool. This is a subset of the MA Required Course requirement and needs manual audit review.',
      sourceUrl,
      appliesToTrackIds: [trackId],
      courses: psychology.courses.map((course) => ({ ...course, sourceUrl, appliesToTrackIds: [trackId], countsTowardTrackIds: [trackId] }))
    }
  ];
}

function buildInternationalLanguageEducationGroups(candidate) {
  const sourceUrl = candidate.sourceUrl;
  const teslId = 'HKUST-TPG-011-TESL';
  const tcslId = 'HKUST-TPG-011-TCSL';
  const [foundation, general, tesl, tcsl] = candidate.courseGroups;
  const decorateFoundation = (course) => {
    const appliesToTrackIds = course.code === 'MILE 5005'
      ? [teslId]
      : course.code === 'MILE 5006'
        ? [tcslId]
        : [];
    return { ...course, sourceUrl: course.sourceUrl || sourceUrl, appliesToTrackIds };
  };
  const decorateTrackCourse = (course, trackId) => ({
    ...course,
    sourceUrl: course.sourceUrl || sourceUrl,
    appliesToTrackIds: [trackId],
    countsTowardTrackIds: [trackId]
  });
  return [
    {
      ...foundation,
      name: 'Foundation Courses',
      creditsRequired: 12,
      ruleText: 'Complete MILE 5000, MILE 5002 and MILE 5004, plus MILE 5005 for TESL or MILE 5006 for TCSL.',
      sourceUrl,
      appliesToTrackIds: [],
      courses: foundation.courses.map(decorateFoundation)
    },
    {
      ...general,
      name: 'Elective Courses',
      creditsRequired: 12,
      ruleText: 'Complete 12 elective credits in total, including at least two courses (6 credits) from the selected Concentration pool.',
      sourceUrl,
      appliesToTrackIds: [],
      courses: general.courses.map((course) => ({ ...course, sourceUrl: course.sourceUrl || sourceUrl, appliesToTrackIds: [] }))
    },
    {
      ...tesl,
      name: 'TESL Concentration Elective Pool',
      creditsRequired: 6,
      coursesRequired: 2,
      ruleText: 'TESL students complete at least two courses (6 credits) from this pool as part of the 12-credit elective requirement.',
      sourceUrl,
      appliesToTrackIds: [teslId],
      courses: tesl.courses.map((course) => decorateTrackCourse(course, teslId))
    },
    {
      ...tcsl,
      name: 'TCSL Concentration Elective Pool',
      creditsRequired: 6,
      coursesRequired: 2,
      ruleText: 'TCSL students complete at least two courses (6 credits) from this pool as part of the 12-credit elective requirement.',
      sourceUrl,
      appliesToTrackIds: [tcslId],
      courses: tcsl.courses.map((course) => decorateTrackCourse(course, tcslId))
    }
  ];
}

function buildMbaGroups(candidate) {
  const sourceUrl = candidate.sourceUrl;
  const fullTimeId = 'HKUST-TPG-013-FULL-TIME';
  const partTimeId = 'HKUST-TPG-013-PART-TIME';
  const [immersion, core, wrapUp] = candidate.courseGroups;
  const common = (course) => ({ ...course, sourceUrl: course.sourceUrl || sourceUrl, appliesToTrackIds: [] });
  return [
    {
      ...immersion,
      creditsRequired: 2,
      ruleText: 'Complete the 2-credit Required Immersion Program in both Award Paths.',
      sourceUrl,
      appliesToTrackIds: [],
      courses: immersion.courses.map(common)
    },
    {
      ...core,
      creditsRequired: 16,
      ruleText: 'Complete all eight 2-credit Core Courses in both Award Paths.',
      sourceUrl,
      appliesToTrackIds: [],
      courses: core.courses.map(common)
    },
    {
      id: 'group-3',
      name: 'Full-time Advanced Electives',
      type: 'elective',
      creditsRequired: 33,
      ruleText: 'Full-time MBA students complete 33 advanced elective credits. The official Programme page describes career-focus areas but does not publish a fixed course-code pool.',
      sourceUrl,
      appliesToTrackIds: [fullTimeId],
      courses: []
    },
    {
      id: 'group-4',
      name: 'Part-time Advanced Electives',
      type: 'elective',
      creditsRequired: 27,
      ruleText: 'Part-time MBA students complete 27 advanced elective credits. The official Programme page describes career-focus areas but does not publish a fixed course-code pool.',
      sourceUrl,
      appliesToTrackIds: [partTimeId],
      courses: []
    },
    {
      ...wrapUp,
      id: 'group-5',
      creditsRequired: 1,
      ruleText: 'Full-time MBA students complete the 1-credit Required Wrap-up Program.',
      sourceUrl,
      appliesToTrackIds: [fullTimeId],
      courses: wrapUp.courses.map((course) => ({ ...course, sourceUrl: course.sourceUrl || sourceUrl, appliesToTrackIds: [fullTimeId] }))
    }
  ];
}

function buildEconomicsGroups(candidate) {
  const sourceUrl = candidate.sourceUrl;
  const [core, elective, research] = candidate.courseGroups;
  const professionalTracks = [
    ['HKUST-TPG-043-AI-DATA-ANALYTICS', 'AI and Data Analytics'],
    ['HKUST-TPG-043-ECONOMIC-POLICY', 'Economic Policy'],
    ['HKUST-TPG-043-FINANCIAL-ECONOMICS', 'Financial Economics']
  ];
  const researchId = 'HKUST-TPG-043-RESEARCH-PREPARATION';
  return [
    {
      ...core,
      creditsRequired: 14,
      ruleText: 'Complete 14 Core credits. Starred courses may be substituted by an equivalent course with prior approval.',
      sourceUrl,
      appliesToTrackIds: [],
      courses: core.courses.map((course) => ({ ...course, name: course.name.replace(/^[*#@]+\s*/, ''), sourceUrl, appliesToTrackIds: [] }))
    },
    {
      ...elective,
      creditsMin: 16,
      ruleText: 'Complete at least 16 Elective credits under the official level, department and approval limits. ECON 6950 may count as an elective; the full eligible course-code pool is not fixed on the Programme page.',
      sourceUrl,
      appliesToTrackIds: [],
      courses: elective.courses.map((course) => ({ ...course, sourceUrl, appliesToTrackIds: [] }))
    },
    ...professionalTracks.map(([trackId, name], index) => ({
      id: `group-${index + 3}`,
      name: `${name} Concentration Requirement`,
      type: 'elective',
      creditsRequired: 8,
      coursesRequired: 4,
      ruleText: `Complete four approved ${name} elective courses (8 credits). The official page states that selections require Academic Director approval and does not publish the fixed pool.`,
      sourceUrl,
      appliesToTrackIds: [trackId],
      courses: []
    })),
    {
      id: 'group-6',
      name: 'Research Preparation PhD-level Electives',
      type: 'elective',
      creditsRequired: 6,
      ruleText: 'At least 6 of the minimum 16 Elective credits must be at PhD level; the Programme page does not publish a fixed course-code pool.',
      sourceUrl,
      appliesToTrackIds: [researchId],
      courses: []
    },
    {
      ...research,
      id: 'group-7',
      name: 'Research Preparation Independent Project',
      type: 'project',
      creditsRequired: 6,
      ruleText: 'Research Preparation students complete the 6-credit ECON 6980 Independent Project.',
      sourceUrl,
      appliesToTrackIds: [researchId],
      courses: research.courses.map((course) => ({ ...course, sourceUrl, appliesToTrackIds: [researchId], countsTowardTrackIds: [researchId] }))
    }
  ];
}

function buildGlobalChinaStudiesGroups(candidate) {
  const sourceUrl = candidate.sourceUrl;
  const groupsById = new Map(candidate.courseGroups.map((group) => [group.id, group]));
  const core = groupsById.get('group-1');
  const writing = groupsById.get('group-2');
  const elective = groupsById.get('group-3');
  const optionalProject = groupsById.get('group-4');
  const historyOnly = groupsById.get('group-5');
  const researchSubstitution = groupsById.get('group-6');
  const methodology = groupsById.get('group-7');
  const independentStudy = groupsById.get('group-8');
  const researchProject = groupsById.get('group-9');
  const trackIds = {
    history: 'HKUST-TPG-010-HISTORY-CULTURE',
    political: 'HKUST-TPG-010-POLITICAL-SCIENCE',
    quantitative: 'HKUST-TPG-010-QUANTITATIVE-SOCIAL-SCIENCE',
    sociology: 'HKUST-TPG-010-SOCIOLOGY',
    research: 'HKUST-TPG-010-ACADEMIC-RESEARCH'
  };
  const disciplinaryTrackIds = [trackIds.history, trackIds.political, trackIds.quantitative, trackIds.sociology];
  const memberships = new Map([
    ['MGCS 5001', [trackIds.history, trackIds.quantitative, trackIds.sociology]],
    ['MGCS 5010', [trackIds.quantitative, trackIds.sociology]],
    ['MGCS 5024', [trackIds.political]],
    ['MGCS 5033', [trackIds.history]],
    ['MGCS 5101', [trackIds.history]],
    ['MGCS 5520', [trackIds.political]],
    ['MGCS 5006', [trackIds.political]],
    ['MGCS 5008', [trackIds.history]],
    ['MGCS 5009', [trackIds.history, trackIds.political]],
    ['MGCS 5021', [trackIds.political]],
    ['MGCS 5022', [trackIds.political]],
    ['MGCS 5025', [trackIds.political]],
    ['MGCS 5026', [trackIds.political]],
    ['MGCS 5103', [trackIds.history]],
    ['MGCS 5105', [trackIds.history]],
    ['MGCS 5012', [trackIds.quantitative, trackIds.sociology]],
    ['MGCS 5013', [trackIds.quantitative]],
    ['MGCS 5032', [trackIds.sociology]],
    ['MGCS 5036', [trackIds.history]],
    ['MGCS 5037', [trackIds.history]],
    ['MGCS 5102', [trackIds.history]],
    ['MGCS 6000-6010', disciplinaryTrackIds]
  ]);
  const common = (course) => ({
    ...course,
    sourceUrl: course.sourceUrl || sourceUrl,
    appliesToTrackIds: [],
    ...(memberships.has(course.code) ? { countsTowardTrackIds: memberships.get(course.code) } : {})
  });
  return [
    {
      ...core,
      creditsRequired: 9,
      ruleText: 'Complete 9 Core credits from the official pool. Surplus Core credits count toward the Elective requirement.',
      sourceUrl,
      appliesToTrackIds: [],
      courses: core.courses.map(common)
    },
    {
      ...writing,
      name: 'Conditional Academic Writing Course',
      type: 'core',
      creditsMin: 0,
      creditsMax: 3,
      ruleText: 'LANG 5070 is required only for students admitted with any IELTS sub-score of 5.5.',
      sourceUrl,
      appliesToTrackIds: [],
      courses: writing.courses.map(common)
    },
    {
      ...elective,
      creditsMin: 12,
      creditsMax: 15,
      ruleText: 'Complete 12–15 Elective credits, covering at least two official subject areas and including at least two China-related courses. Up to 9 approved substitution credits may apply; surplus Core credits count here.',
      sourceUrl,
      appliesToTrackIds: [],
      courses: elective.courses.map(common)
    },
    {
      ...optionalProject,
      name: 'Optional Extra Project',
      creditsRequired: null,
      ruleText: 'Selected students may take MGCS 6981 for 1 extra credit; it does not count toward the Programme credit requirement.',
      countsTowardProgrammeCredits: false,
      sourceUrl,
      appliesToTrackIds: [],
      courses: optionalProject.courses.map((course) => ({ ...common(course), countsTowardProgrammeCredits: false }))
    },
    {
      id: 'group-5',
      name: 'History and Culture Additional Course',
      type: 'elective',
      creditsRequired: null,
      ruleText: 'HUMA 5696 is included in the official History and Culture Concentration list.',
      sourceUrl,
      appliesToTrackIds: [trackIds.history],
      courses: historyOnly.courses.map((course) => ({ ...course, sourceUrl, appliesToTrackIds: [trackIds.history], countsTowardTrackIds: [trackIds.history] }))
    },
    ...[
      [trackIds.history, 'History and Culture'],
      [trackIds.political, 'Political Science'],
      [trackIds.quantitative, 'Quantitative Social Science'],
      [trackIds.sociology, 'Sociology']
    ].map(([trackId, name], index) => ({
      id: `group-${index + 6}`,
      name: `${name} Concentration Requirement`,
      type: 'elective',
      creditsRequired: 9,
      coursesRequired: 3,
      ruleText: `Complete at least 9 credits (three courses) from courses marked for the ${name} Concentration. The official page says five disciplinary Concentrations but enumerates only four; no missing fifth Concentration has been inferred.`,
      sourceUrl,
      appliesToTrackIds: [trackId],
      courses: []
    })),
    {
      ...researchSubstitution,
      id: 'group-10',
      name: 'Academic Research Core Substitution',
      creditsRequired: null,
      ruleText: 'With prior approval, Academic Research students may substitute SOSC 5090 for the Core course MGCS 5010.',
      sourceUrl,
      appliesToTrackIds: [trackIds.research],
      courses: researchSubstitution.courses.map((course) => ({ ...course, sourceUrl, appliesToTrackIds: [trackIds.research], countsTowardTrackIds: [trackIds.research] }))
    },
    {
      ...methodology,
      id: 'group-11',
      name: 'Academic Research Methodology',
      creditsRequired: 3,
      coursesRequired: 1,
      ruleText: 'Complete one approved postgraduate Research Methodology course (3 credits).',
      sourceUrl,
      appliesToTrackIds: [trackIds.research],
      courses: methodology.courses.map((course) => ({ ...course, sourceUrl, appliesToTrackIds: [trackIds.research], countsTowardTrackIds: [trackIds.research] }))
    },
    {
      ...independentStudy,
      id: 'group-12',
      name: 'Academic Research Independent Study',
      creditsRequired: 3,
      ruleText: 'Complete MGCS 6200 Independent Study (3 credits).',
      sourceUrl,
      appliesToTrackIds: [trackIds.research],
      courses: independentStudy.courses.map((course) => ({ ...course, sourceUrl, appliesToTrackIds: [trackIds.research], countsTowardTrackIds: [trackIds.research] }))
    },
    {
      ...researchProject,
      id: 'group-13',
      name: 'Academic Research Project',
      creditsRequired: 12,
      coursesRequired: 2,
      ruleText: 'Complete MGCS 6980 and then MGCS 6982 for a two-term Research Project totaling 12 credits.',
      sourceUrl,
      appliesToTrackIds: [trackIds.research],
      courses: researchProject.courses.map((course) => ({ ...course, sourceUrl, appliesToTrackIds: [trackIds.research], countsTowardTrackIds: [trackIds.research] }))
    }
  ];
}

function promote(candidate) {
  const groups = candidate.programmeId === 'HKUST-TPG-009'
    ? buildChineseCultureGroups(candidate)
    : candidate.programmeId === 'HKUST-TPG-010'
      ? buildGlobalChinaStudiesGroups(candidate)
    : candidate.programmeId === 'HKUST-TPG-011'
      ? buildInternationalLanguageEducationGroups(candidate)
    : candidate.programmeId === 'HKUST-TPG-013'
      ? buildMbaGroups(candidate)
    : candidate.programmeId === 'HKUST-TPG-043'
      ? buildEconomicsGroups(candidate)
    : candidate.programmeId === 'HKUST-TPG-017'
      ? buildPublicPolicyGroups(candidate)
      : candidate.programmeId === 'HKUST-TPG-028'
        ? buildInternationalManagementGroups(candidate)
        : candidate.programmeId === 'HKUST-TPG-014'
          ? buildGlobalMarineResourcesGroups(candidate)
          : candidate.programmeId === 'HKUST-TPG-050'
            ? buildCivilInfrastructureGroups(candidate)
            : candidate.programmeId === 'HKUST-TPG-044'
              ? buildDigitalSustainableCitiesGroups(candidate)
              : candidate.programmeId === 'HKUST-TPG-036'
                ? buildMechanicalEngineeringGroups(candidate)
                : candidate.programmeId === 'HKUST-TPG-048'
                  ? buildSocialScienceGroups(candidate)
                  : candidate.courseGroups.map((group) => ({
    ...group,
    ...(groupRequirementOverrides.get(`${candidate.programmeId}/${group.id}`) || {}),
    ruleText: (groupRequirementOverrides.get(`${candidate.programmeId}/${group.id}`) || {}).ruleText
      || group.ruleText
      || (group.creditsRequired ? `Complete ${group.creditsRequired} credits from this group, subject to the official programme rules.` : 'Follow the selection rules shown on the official programme page.'),
    sourceUrl: candidate.sourceUrl,
    appliesToTrackIds: (groupRequirementOverrides.get(`${candidate.programmeId}/${group.id}`) || {}).appliesToTrackIds || [],
    courses: group.courses.map((course) => ({
      ...course,
      name: course.name.replace(/^[*#@]+\s*/, ''),
      sourceUrl: course.sourceUrl || candidate.sourceUrl,
      appliesToTrackIds: []
    }))
                  }));
  const announcedElective = announcedElectiveRequirements.get(candidate.programmeId);
  if (announcedElective) {
    groups.push({
      id: `group-${groups.length + 1}`,
      name: 'Elective Courses',
      type: 'elective',
      ...announcedElective,
      courses: [],
      sourceUrl: candidate.sourceUrl,
      appliesToTrackIds: []
    });
  }
  (additionalGroups.get(candidate.programmeId) || []).forEach((group) => {
    groups.push({
      id: `group-${groups.length + 1}`,
      ...group,
      courses: [],
      sourceUrl: candidate.sourceUrl,
      appliesToTrackIds: []
    });
  });
  return {
    programmeId: candidate.programmeId,
    status: 'verified',
    creditsRequired: candidate.creditsRequired,
    creditUnit: candidate.creditUnit,
    sourceUrl: candidate.sourceUrl,
    ...(optionalTrackProgrammeIds.has(candidate.programmeId) ? { trackSelectionOptional: true } : {}),
    ...(programmeTracks.has(candidate.programmeId) ? {
      tracks: programmeTracks.get(candidate.programmeId).map((track) => ({ ...track, sourceUrl: candidate.sourceUrl }))
    } : {}),
    ruleReviewStatus: 'manual_review_required',
    courseGroups: groups
  };
}

function applyCourseDetailOverrides(candidate) {
  const overriddenCodes = new Set();
  const courseGroups = (candidate.courseGroups || []).map((group) => ({
    ...group,
    courses: group.courses.map((course) => {
      const override = courseDetailOverrides.get(`${candidate.programmeId}/${course.code}`);
      if (!override) return course;
      overriddenCodes.add(course.code.replace(/\s+/g, ''));
      const { sourceError, ...rest } = course;
      return { ...rest, ...override };
    })
  }));
  return {
    ...candidate,
    creditsRequired: programmeCreditOverrides.get(candidate.programmeId) || candidate.creditsRequired,
    courseGroups,
    missingCourseDetails: (candidate.missingCourseDetails || []).filter((code) => !overriddenCodes.has(code.replace(/\s+/g, ''))),
    ungroupedCourseRefs: candidate.ungroupedCourseRefs || []
  };
}

function main() {
  const preparedCandidates = candidates.programmes.map(applyCourseDetailOverrides);
  const selected = preparedCandidates.filter((item) => selectedIds.has(item.programmeId));
  if (selected.length !== selectedIds.size) throw new Error('HKUST selected candidate is missing');
  selected.forEach((item) => {
    if (!item.creditsRequired || !item.courseGroups.length || item.missingCourseDetails.length || item.ungroupedCourseRefs.length) throw new Error(`${item.programmeId} is not ready for promotion`);
  });
  fs.writeFileSync(outputPath, `${JSON.stringify({ schemaVersion: 1, schoolCode: 'HKUST', academicYear: '2026-27', verifiedAt: '2026-07-16', programmes: selected.map(promote) }, null, 2)}\n`);

  const blocked = preparedCandidates.filter((item) => !selectedIds.has(item.programmeId)).map((item) => ({
    programmeId: item.programmeId,
    status: item.error && /No unique current/.test(item.error) ? 'archived' : 'blocked',
    sourceUrl: item.sourceUrl || 'https://prog-crs.hkust.edu.hk/pgprog/2026-27/',
    statusNote: item.error && /No unique current/.test(item.error)
      ? 'The current 2026/27 official directory lists 52 taught postgraduate Programmes and contains no unique match for Digital Master of Business Administration Program for Global Leaders. Keep this historical catalogue entry archived unless a current official Programme page is published.'
      : 'The official curriculum was collected, but course-detail or rule-group review is still incomplete.'
  }));
  fs.writeFileSync(statusPath, `${JSON.stringify({ schemaVersion: 1, schoolCode: 'HKUST', academicYear: '2026-27', verifiedAt: '2026-07-16', programmes: blocked }, null, 2)}\n`);
  console.log(JSON.stringify({ ok: true, verified: selected.length, pending: blocked.length }));
}

if (require.main === module) main();
