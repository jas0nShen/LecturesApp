const assert = require('node:assert/strict');
const { test } = require('node:test');

const tpgService = require('./tpgService');
const tpgCourseShards = require('./tpgCourseShards');

test('TPG catalogue coverage summarizes eight-school MVP data', () => {
  const coverage = tpgService.getSchoolCoverage();

  assert.equal(coverage.schoolCount, 8);
  assert.equal(coverage.programmeCount, 448);
  assert.equal(coverage.programmeWithCoursesCount, 166);
  assert.equal(coverage.courseCount, 3808);
  assert.deepEqual(
    coverage.schools.map((school) => [school.code, school.programmeCount]),
    [
      ['HKU', 62],
      ['CUHK', 18],
      ['HKUST', 53],
      ['POLYU', 105],
      ['CITYU', 62],
      ['HKBU', 48],
      ['EDUHK', 51],
      ['LINGNAN', 49]
    ]
  );
});

test('generated TPG course shards preserve every Programme structure outside the loader lifecycle', () => {
  const universityCodes = tpgService.listUniversities().map((university) => university.code);
  const rows = universityCodes.flatMap((code) => tpgCourseShards.getProgrammesByUniversityCode(code));
  assert.equal(tpgCourseShards.getProgrammeCount(), 166);
  assert.equal(rows.length, 166);
  assert.equal(new Set(rows.map((programme) => programme.id)).size, rows.length);
  assert.equal(tpgCourseShards.getPackageNames('CITYU').length, 1);
  assert.equal(rows.find((programme) => programme.id === 'CITYU-TPG-047').courseGroups.length, 3);
});

test('HKUST intake-announced electives retain official credit requirements without invented courses', () => {
  const financeTechnology = tpgService.getProgramme('HKUST-TPG-008');
  const globalFinance = tpgService.getProgramme('HKUST-TPG-012');
  const financeTechnologyElectives = financeTechnology.courseGroups.find((group) => group.type === 'elective');
  const globalFinanceElectives = globalFinance.courseGroups.find((group) => group.type === 'elective');

  assert.equal(financeTechnology.creditsRequired, 30);
  assert.equal(financeTechnologyElectives.creditsRequired, 14);
  assert.equal(financeTechnologyElectives.courses.length, 0);
  assert.match(financeTechnologyElectives.ruleText, /annual course list is announced separately/);
  assert.equal(globalFinance.creditsRequired, 24);
  assert.equal(globalFinanceElectives.creditsRequired, 10);
  assert.equal(globalFinanceElectives.courses.length, 0);
  assert.equal(tpgService.getProgrammeCourse(financeTechnology.id, 'FINA 5120').credits, 2);
  assert.equal(financeTechnology.courseSourceUrl, 'https://prog-crs.hkust.edu.hk/pgprog/2026-27/msc-fintech/');
});

test('HKUST project and non-course requirements remain separate from announced elective pools', () => {
  const entrepreneurship = tpgService.getProgramme('HKUST-TPG-040');
  const mba = tpgService.getProgramme('HKUST-TPG-046');
  const environment = tpgService.getProgramme('HKUST-TPG-052');
  const project = entrepreneurship.courseGroups.find((group) => group.type === 'project');
  const immersion = mba.courseGroups.find((group) => group.name === 'Required Immersion Program');
  const foundation = environment.courseGroups.find((group) => group.name === 'Foundation Courses');

  assert.equal(project.creditsRequired, 9);
  assert.equal(project.courses[0].code, 'MTLE 6980');
  assert.equal(project.courses[0].credits, 9);
  assert.equal(immersion.creditsRequired, 2);
  assert.equal(immersion.courses.length, 0);
  assert.equal(mba.courseGroups.reduce((total, group) => total + (group.creditsRequired || 0), 0), 45);
  assert.equal(foundation.creditsRequired, 18);
  assert.equal(foundation.courses.find((course) => course.code === 'CIEM 5810').name, 'Engineering Risk, Reliability and Decision');
  assert.equal(environment.courseGroups.find((group) => group.type === 'elective').creditsRequired, null);
});

test('HKUST Information Technology filters the official Cybersecurity Concentration', () => {
  const programme = tpgService.getProgramme('HKUST-TPG-020');
  const track = tpgService.listTracks(programme)[0];
  const common = programme.courseGroups.filter((group) => tpgService.appliesToTrack(group, ''));
  const cybersecurity = programme.courseGroups.filter((group) => tpgService.appliesToTrack(group, track.id));
  const concentration = cybersecurity.find((group) => group.appliesToTrackIds.length);

  assert.equal(track.name, 'Cybersecurity');
  assert.equal(track.type, 'Concentration');
  assert.equal(common.length, 1);
  assert.equal(cybersecurity.length, 2);
  assert.equal(concentration.creditsRequired, 12);
  assert.equal(concentration.courses.length, 7);
  assert.match(concentration.ruleText, /9 credits.*3 credits of CSIT 6910/);
  assert.equal(tpgService.getProgrammeCourse(programme.id, 'CSIT 6000', track.id).creditsMin, 1);
  assert.equal(tpgService.getProgrammeCourse(programme.id, 'CSIT 6000', track.id).creditsMax, 3);
});

test('HKUST Social Science keeps the Psychology Concentration optional and does not invent term-specific courses', () => {
  const programme = tpgService.getProgramme('HKUST-TPG-048');
  const track = tpgService.listTracks(programme)[0];
  const foundation = programme.courseGroups.find((group) => group.name === 'Foundation Courses');
  const required = programme.courseGroups.find((group) => group.name === 'Required Courses');
  const elective = programme.courseGroups.find((group) => group.name === 'Elective Courses');
  const psychology = programme.courseGroups.find((group) => group.name === 'Psychology Concentration Course Pool');

  assert.equal(programme.creditsRequired, 24);
  assert.equal(programme.trackSelectionOptional, true);
  assert.equal(track.name, 'Psychology');
  assert.equal(track.type, 'Concentration');
  assert.equal(foundation.creditsRequired, 6);
  assert.equal(required.creditsRequired, 12);
  assert.equal(required.courses.length, 0);
  assert.equal(elective.creditsRequired, 6);
  assert.equal(elective.courses.length, 0);
  assert.equal(psychology.creditsRequired, 9);
  assert.equal(psychology.coursesRequired, 3);
  assert.equal(psychology.courses.length, 4);
  assert.equal(tpgService.flattenCourses(programme).length, 2);
  assert.equal(tpgService.flattenCourses(programme, '', track.id).length, 6);
  assert.equal(tpgService.getProgrammeCourse(programme.id, 'MASS 5980', track.id).name, 'Understanding Personality');
  assert.equal(tpgService.getProgrammeCourse(programme.id, 'MASS 5980', track.id).credits, 3);
  assert.match(required.ruleText, /announced by the Programme Office each term/);
});

test('HKUST Telecommunications preserves its 24-credit pool and repeatable 6-credit Project', () => {
  const programme = tpgService.getProgramme('HKUST-TPG-042');
  const required = programme.courseGroups.find((group) => group.name === 'Required Courses');
  const project = programme.courseGroups.find((group) => group.name === 'MSc Project');
  const topics = required.courses.find((course) => course.code === 'EESM 5910');
  const projectCourse = project.courses.find((course) => course.code === 'EESM 6980');

  assert.equal(programme.creditsRequired, 30);
  assert.equal(required.creditsRequired, 24);
  assert.equal(topics.name, 'Topics in Telecommunications and Network Convergence');
  assert.equal(topics.credits, 3);
  assert.equal(project.creditsRequired, 6);
  assert.equal(projectCourse.creditsMin, 1);
  assert.equal(projectCourse.creditsMax, 4);
  assert.match(project.ruleText, /repeat EESM 6980.*6 credits/);
});

test('HKUST International Language Education filters both official Concentrations', () => {
  const programme = tpgService.getProgramme('HKUST-TPG-011');
  const tracks = Object.fromEntries(tpgService.listTracks(programme).map((track) => [track.name, track.id]));
  const foundation = programme.courseGroups.find((group) => group.name === 'Foundation Courses');
  const tesl = programme.courseGroups.find((group) => group.name === 'TESL Concentration Elective Pool');
  const tcsl = programme.courseGroups.find((group) => group.name === 'TCSL Concentration Elective Pool');

  assert.equal(programme.creditsRequired, 24);
  assert.equal(Object.keys(tracks).length, 2);
  assert.equal(foundation.creditsRequired, 12);
  assert.equal(tesl.creditsRequired, 6);
  assert.equal(tesl.coursesRequired, 2);
  assert.equal(tcsl.creditsRequired, 6);
  assert.equal(tcsl.coursesRequired, 2);
  assert.equal(tpgService.flattenCourses(programme, '', tracks['Teaching English as a Second Language']).length, 18);
  assert.equal(tpgService.flattenCourses(programme, '', tracks['Teaching Chinese as a Second Language']).length, 16);
  assert.equal(tpgService.getProgrammeCourse(programme.id, 'MILE 5005', tracks['Teaching Chinese as a Second Language']), null);
  assert.equal(tpgService.getProgrammeCourse(programme.id, 'MILE 5006', tracks['Teaching English as a Second Language']), null);
  assert.equal(tpgService.getProgrammeCourse(programme.id, 'MILE 5306', tracks['Teaching Chinese as a Second Language']).credits, 3);
});

test('HKUST Financial Mathematics preserves minimum Required and maximum Elective credits', () => {
  const programme = tpgService.getProgramme('HKUST-TPG-006');
  const required = programme.courseGroups.find((group) => group.name === 'Required Courses');
  const elective = programme.courseGroups.find((group) => group.name === 'Elective Courses');
  const course = tpgService.getProgrammeCourse(programme.id, 'MAFS 5110');

  assert.equal(programme.creditsRequired, 36);
  assert.equal(required.creditsRequired, null);
  assert.equal(required.creditsMin, 27);
  assert.equal(required.courses.length, 23);
  assert.equal(elective.creditsMin, 0);
  assert.equal(elective.creditsMax, 9);
  assert.equal(course.name, 'Advanced Data Analysis with Statistical Programming');
  assert.equal(course.credits, 3);
  assert.match(required.ruleText, /not all individually mandatory/);
});

test('HKUST MBA resolves Full-time and Part-time Award Path credits separately', () => {
  const programme = tpgService.getProgramme('HKUST-TPG-013');
  const tracks = Object.fromEntries(tpgService.listTracks(programme).map((track) => [track.name, track.id]));
  const fullTimeGroups = programme.courseGroups.filter((group) => tpgService.appliesToTrack(group, tracks['Full-time MBA']));
  const partTimeGroups = programme.courseGroups.filter((group) => tpgService.appliesToTrack(group, tracks['Part-time MBA']));

  assert.equal(Object.keys(tracks).length, 2);
  assert.equal(tpgService.getCreditsRequired(programme, tracks['Full-time MBA']), 52);
  assert.equal(tpgService.getCreditsRequired(programme, tracks['Part-time MBA']), 45);
  assert.equal(fullTimeGroups.find((group) => group.name === 'Full-time Advanced Electives').creditsRequired, 33);
  assert.equal(fullTimeGroups.find((group) => group.name === 'Required Wrap-up Program').creditsRequired, 1);
  assert.equal(partTimeGroups.find((group) => group.name === 'Part-time Advanced Electives').creditsRequired, 27);
  assert.equal(partTimeGroups.some((group) => group.name === 'Required Wrap-up Program'), false);
  assert.equal(tpgService.flattenCourses(programme, '', tracks['Full-time MBA']).length, 10);
  assert.equal(tpgService.flattenCourses(programme, '', tracks['Part-time MBA']).length, 9);
});

test('HKUST Economics keeps professional Concentrations optional and Research Preparation at 36 credits', () => {
  const programme = tpgService.getProgramme('HKUST-TPG-043');
  const tracks = Object.fromEntries(tpgService.listTracks(programme).map((track) => [track.name, track.id]));
  const researchGroups = programme.courseGroups.filter((group) => tpgService.appliesToTrack(group, tracks['Research Preparation']));
  const project = researchGroups.find((group) => group.name === 'Research Preparation Independent Project');
  const ai = programme.courseGroups.find((group) => group.name === 'AI and Data Analytics Concentration Requirement');

  assert.equal(programme.creditsRequired, 30);
  assert.equal(programme.trackSelectionOptional, true);
  assert.equal(Object.keys(tracks).length, 4);
  assert.equal(tpgService.getCreditsRequired(programme, tracks['Research Preparation']), 36);
  assert.equal(ai.creditsRequired, 8);
  assert.equal(ai.coursesRequired, 4);
  assert.equal(ai.courses.length, 0);
  assert.equal(project.creditsRequired, 6);
  assert.equal(project.courses[0].code, 'ECON 6980');
  assert.equal(tpgService.flattenCourses(programme).length, 5);
  assert.equal(tpgService.flattenCourses(programme, '', tracks['Research Preparation']).length, 6);
});

test('HKUST Global China Studies preserves conditional writing, optional disciplinary Concentrations, and the 42-credit research path', () => {
  const programme = tpgService.getProgramme('HKUST-TPG-010');
  const tracks = Object.fromEntries(tpgService.listTracks(programme).map((track) => [track.name, track.id]));
  const writing = programme.courseGroups.find((group) => group.name === 'Conditional Academic Writing Course');
  const elective = programme.courseGroups.find((group) => group.name === 'Elective Courses');
  const optionalProject = programme.courseGroups.find((group) => group.name === 'Optional Extra Project');
  const historyRequirement = programme.courseGroups.find((group) => group.name === 'History and Culture Concentration Requirement');
  const researchGroups = programme.courseGroups.filter((group) => tpgService.appliesToTrack(group, tracks['Academic Research']));
  const researchProject = researchGroups.find((group) => group.name === 'Academic Research Project');

  assert.equal(programme.creditsRequired, 24);
  assert.equal(programme.trackSelectionOptional, true);
  assert.deepEqual(Object.keys(tracks), [
    'History and Culture',
    'Political Science',
    'Quantitative Social Science',
    'Sociology',
    'Academic Research'
  ]);
  assert.equal(writing.creditsMin, 0);
  assert.equal(writing.creditsMax, 3);
  assert.equal(elective.creditsMin, 12);
  assert.equal(elective.creditsMax, 15);
  assert.equal(optionalProject.courses[0].code, 'MGCS 6981');
  assert.equal(optionalProject.courses[0].credits, 1);
  assert.equal(optionalProject.courses[0].countsTowardProgrammeCredits, false);
  assert.equal(historyRequirement.creditsRequired, 9);
  assert.equal(historyRequirement.coursesRequired, 3);
  assert.match(historyRequirement.ruleText, /enumerates only four/);
  assert.equal(tpgService.getCreditsRequired(programme, tracks['Academic Research']), 42);
  assert.equal(researchGroups.find((group) => group.name === 'Academic Research Methodology').coursesRequired, 1);
  assert.equal(researchGroups.find((group) => group.name === 'Academic Research Independent Study').courses[0].code, 'MGCS 6200');
  assert.equal(researchProject.creditsRequired, 12);
  assert.deepEqual(researchProject.courses.map((course) => course.code), ['MGCS 6980', 'MGCS 6982']);
  assert.deepEqual(researchProject.courses.map((course) => course.credits), [6, 6]);
  assert.equal(tpgService.getProgrammeCourse(programme.id, 'HUMA 5696'), null);
  assert.equal(tpgService.getProgrammeCourse(programme.id, 'HUMA 5696', tracks['History and Culture']).credits, 3);
});

test('HKUST IBTM keeps its bounded core and dynamic official elective requirement', () => {
  const programme = tpgService.getProgramme('HKUST-TPG-026');
  const core = programme.courseGroups.find((group) => group.type === 'core');
  const elective = programme.courseGroups.find((group) => group.type === 'elective');

  assert.equal(programme.creditsRequired, 30);
  assert.equal(core.creditsRequired, 6);
  assert.equal(core.courses.length, 2);
  assert.equal(elective.creditsRequired, 24);
  assert.equal(elective.courses.length, 2);
  assert.match(elective.ruleText, /does not publish a fixed complete elective-code pool/);
  assert.equal(tpgService.getProgrammeCourse(programme.id, 'IBTM 6950').creditsMin, 3);
  assert.equal(tpgService.getProgrammeCourse(programme.id, 'IBTM 6950').creditsMax, 6);
});

test('HKUST Public Policy filters shared courses across three official Concentrations', () => {
  const programme = tpgService.getProgramme('HKUST-TPG-017');
  const tracks = Object.fromEntries(tpgService.listTracks(programme).map((track) => [track.name, track.id]));
  const noConcentration = tpgService.flattenCourses(programme);
  const esp = tpgService.flattenCourses(programme, '', tracks['Environmental and Sustainability Policy']);
  const stp = tpgService.flattenCourses(programme, '', tracks['Science and Technology Policy']);
  const pepm = tpgService.flattenCourses(programme, '', tracks['Policy Economics and Public Management']);
  const core = programme.courseGroups.find((group) => group.type === 'core');
  const concentrationPool = programme.courseGroups.find((group) => group.name === 'Concentration Elective Pools');

  assert.equal(programme.creditsRequired, 48);
  assert.equal(Object.keys(tracks).length, 3);
  assert.equal(noConcentration.length, 9);
  assert.equal(esp.length, 18);
  assert.equal(stp.length, 20);
  assert.equal(pepm.length, 22);
  assert.equal(core.creditsRequired, 24);
  assert.match(core.ruleText, /either PPOL 6110.*or PPOL 6980/);
  assert.equal(concentrationPool.creditsRequired, undefined);
  assert.equal(concentrationPool.courses.filter((course) => course.code === 'PPOL 6100-6109').length, 1);
  assert.deepEqual(
    concentrationPool.courses.find((course) => course.code === 'PPOL 6100-6109').appliesToTrackIds.sort(),
    Object.values(tracks).sort()
  );
  assert.equal(tpgService.getProgrammeCourse(programme.id, 'PPOL 5770').credits, 0);
});

test('HKUST Chinese Culture keeps Concentrations optional and its Programme requirements common', () => {
  const programme = tpgService.getProgramme('HKUST-TPG-009');
  const tracks = tpgService.listTracks(programme);
  const foundation = programme.courseGroups.find((group) => group.name === 'Foundation Course');
  const required = programme.courseGroups.find((group) => group.name === 'Required Courses');
  const elective = programme.courseGroups.find((group) => group.name === 'Elective Courses');

  assert.equal(programme.creditsRequired, 24);
  assert.equal(tracks.length, 2);
  assert.equal(tracks[0].type, 'Concentration');
  assert.match(tracks[0].ruleText, /four courses \(12 credits\).*at least one required course/);
  assert.equal(foundation.creditsRequired, 3);
  assert.equal(required.creditsRequired, 6);
  assert.equal(required.coursesRequired, 2);
  assert.equal(required.courses.length, 10);
  assert.equal(elective.creditsRequired, 15);
  assert.equal(elective.courses.length, 0);
  assert.equal(tpgService.flattenCourses(programme).length, 11);
  assert.equal(tpgService.flattenCourses(programme, '', tracks[0].id).length, 11);
  assert.equal(tpgService.getProgrammeCourse(programme.id, 'HMMA 5007').name, 'Fundamentals of Chinese Philosophy');
  assert.match(elective.ruleText, /Surplus required-course credits may count/);
});

test('HKUST Information Systems Management preserves conditional credit ranges without invented Track courses', () => {
  const programme = tpgService.getProgramme('HKUST-TPG-018');
  const tracks = tpgService.listTracks(programme);
  const core = programme.courseGroups.find((group) => group.name === 'Core Courses');
  const conditional = programme.courseGroups.find((group) => group.name === 'Conditional Required Courses');
  const elective = programme.courseGroups.find((group) => group.name === 'Elective Courses');

  assert.equal(programme.creditsRequired, 30);
  assert.equal(tracks.length, 3);
  assert.deepEqual(tracks.map((track) => track.name), [
    'Financial Technology',
    'Technology Innovation and Entrepreneurship',
    'Artificial Intelligence'
  ]);
  assert.equal(tracks.every((track) => /four approved.*\(8 credits\)/.test(track.ruleText)), true);
  assert.equal(core.creditsRequired, 10);
  assert.equal(conditional.creditsMin, 0);
  assert.equal(conditional.creditsMax, 6);
  assert.equal(conditional.courses.length, 3);
  assert.equal(elective.creditsMin, 14);
  assert.equal(elective.creditsMax, 20);
  assert.equal(elective.courses.length, 0);
  assert.equal(tpgService.flattenCourses(programme).length, 8);
  assert.equal(tpgService.flattenCourses(programme, '', tracks[2].id).length, 8);
});

test('HKUST International Management excludes optional CEMS language credits from degree audit totals', () => {
  const programme = tpgService.getProgramme('HKUST-TPG-028');
  const core = programme.courseGroups.find((group) => group.name === 'Core Courses');
  const required = programme.courseGroups.find((group) => group.name === 'Required Courses');
  const elective = programme.courseGroups.find((group) => group.name === 'Elective Courses');
  const cems = programme.courseGroups.find((group) => group.name === 'CEMS Specified Elective Courses');
  const language = programme.courseGroups.find((group) => group.name === 'CEMS Language Requirement');
  const internship = programme.courseGroups.find((group) => group.name === 'CEMS International Internship');
  const spanish = language.courses.find((course) => course.code === 'LANG 1330');

  assert.equal(programme.creditsRequired, 34);
  assert.equal(core.creditsRequired, 10);
  assert.equal(required.creditsRequired, 5);
  assert.equal(elective.creditsRequired, 19);
  assert.equal(cems.creditsWithinProgramme, 7);
  assert.equal(cems.courses.reduce((total, course) => total + course.credits, 0), 7);
  assert.equal(language.countsTowardProgrammeCredits, false);
  assert.equal(language.courses.length, 4);
  assert.equal(spanish.credits, 3);
  assert.equal(tpgService.resolveCourseCredits(spanish), 3);
  assert.equal(tpgService.resolveAuditCredits(spanish), 0);
  assert.equal(internship.courses[0].code, 'MIMT 6300');
  assert.equal(internship.courses[0].credits, 0);
  assert.match(language.ruleText, /do not count toward the 34-credit degree requirement/);
});

test('HKUST Integrated Circuits exposes the verified 22-plus-3 credit structure', () => {
  const programme = tpgService.getProgramme('HKUST-TPG-024');
  const core = programme.courseGroups.find((group) => group.type === 'core');
  const elective = programme.courseGroups.find((group) => group.type === 'elective');

  assert.equal(programme.creditsRequired, 25);
  assert.equal(core.creditsRequired, 22);
  assert.equal(core.courses.length, 7);
  assert.equal(elective.creditsRequired, 3);
  assert.equal(elective.courses.length, 4);
  assert.equal(tpgService.getProgrammeCourse(programme.id, 'EESM 5310').name, 'Power Management Circuits and Systems');
  assert.equal(tpgService.getProgrammeCourse(programme.id, 'EESM 5320').credits, 3);
  assert.equal(tpgService.getProgrammeCourse(programme.id, 'EESM 6000-6009').creditsMin, 1);
  assert.equal(tpgService.getProgrammeCourse(programme.id, 'EESM 6000-6009').creditsMax, 3);
});

test('HKUST Global Marine Resources Management converts official ECTS only for degree audit', () => {
  const programme = tpgService.getProgramme('HKUST-TPG-014');
  const uosRequired = programme.courseGroups.find((group) => group.name.includes('UoS — Required'));
  const uosElective = programme.courseGroups.find((group) => group.name.includes('UoS — Elective'));
  const project = programme.courseGroups.find((group) => group.type === 'project');
  const marineScience = tpgService.getProgrammeCourse(programme.id, 'SOES 6099');

  assert.equal(programme.creditsRequired, 45);
  assert.equal(programme.creditUnit, 'credits');
  assert.equal(uosRequired.officialCreditsRequired, 22.5);
  assert.equal(uosRequired.officialCreditUnit, 'ECTS');
  assert.equal(uosRequired.creditsRequired, 11.25);
  assert.equal(uosElective.officialCreditsRequired, 7.5);
  assert.equal(uosElective.creditsRequired, 3.75);
  assert.equal(uosElective.coursesRequired, 1);
  assert.equal(programme.courseGroups.reduce((total, group) => total + group.creditsRequired, 0), 45);
  assert.equal(marineScience.credits, 15);
  assert.equal(marineScience.creditUnit, 'ECTS');
  assert.equal(marineScience.creditLabel, '15 ECTS');
  assert.equal(tpgService.resolveAuditCredits(marineScience), 7.5);
  assert.equal(project.creditsRequired, 15);
  assert.deepEqual(project.courses.map((course) => course.code), ['OCES 6111', 'OCES 6112', 'OCES 6113']);
});

test('HKUST Civil Infrastructure separates the required pool from its mandatory Project and Concentrations', () => {
  const programme = tpgService.getProgramme('HKUST-TPG-050');
  const tracks = tpgService.listTracks(programme);
  const pool = programme.courseGroups.find((group) => group.name === 'Required Course Pool');
  const project = programme.courseGroups.find((group) => group.type === 'project');
  const coastal = pool.courses.find((course) => course.code === 'CIEM 5390');
  const specialTopics = pool.courses.find((course) => course.code === 'CIEM 6000-6010');

  assert.equal(programme.creditsRequired, 30);
  assert.equal(pool.creditsRequired, 24);
  assert.equal(pool.courses.length, 24);
  assert.match(pool.ruleText, /across at least three sub-areas/);
  assert.equal(project.creditsRequired, 6);
  assert.equal(project.courses[0].code, 'CIEM 6980');
  assert.equal(tracks.length, 7);
  assert.equal(tracks.every((track) => /at least 12 credits/.test(track.ruleText)), true);
  assert.deepEqual(coastal.countsTowardTrackIds.sort(), [
    'HKUST-TPG-050-STRUCTURAL',
    'HKUST-TPG-050-WATER-RESOURCES'
  ]);
  assert.equal(specialTopics.countsTowardTrackIds.length, 7);
  assert.match(specialTopics.trackRuleText, /one or two approved sub-areas/);
  assert.equal(tpgService.flattenCourses(programme).length, 25);
  assert.equal(tpgService.flattenCourses(programme, '', tracks[0].id).length, 25);
});

test('HKUST Digital and Sustainable Cities resolves MSc and MEng award-path credits separately', () => {
  const programme = tpgService.getProgramme('HKUST-TPG-044');
  const tracks = Object.fromEntries(tpgService.listTracks(programme).map((track) => [track.name, track]));
  const pool = programme.courseGroups.find((group) => group.name === 'Required Course Pool');
  const project = programme.courseGroups.find((group) => group.name === 'MSc Project');
  const placement = programme.courseGroups.find((group) => group.name === 'MEng Industrial Placement');

  assert.equal(tracks['Master of Science'].creditsRequired, 30);
  assert.equal(tracks['Master of Engineering'].creditsRequired, 36);
  assert.equal(tpgService.getCreditsRequired(programme, tracks['Master of Science'].id), 30);
  assert.equal(tpgService.getCreditsRequired(programme, tracks['Master of Engineering'].id), 36);
  assert.equal(tpgService.getProfileSummary({ profileType: 'tpg', programmeId: programme.id, trackId: tracks['Master of Engineering'].id }).creditsLabel, '36 credits / units');
  assert.equal(pool.creditsRequired, 24);
  assert.equal(pool.courses.length, 21);
  assert.equal(project.creditsRequired, 6);
  assert.equal(project.courses[0].code, 'DISC 6980');
  assert.deepEqual(placement.appliesToTrackIds, [tracks['Master of Engineering'].id]);
  assert.equal(placement.courses[0].code, 'DISC 6500');
  assert.equal(tpgService.flattenCourses(programme, '', tracks['Master of Science'].id).length, 22);
  assert.equal(tpgService.flattenCourses(programme, '', tracks['Master of Engineering'].id).length, 23);
});

test('HKUST Mechanical Engineering keeps its Materials Technology Concentration optional', () => {
  const programme = tpgService.getProgramme('HKUST-TPG-036');
  const track = tpgService.listTracks(programme)[0];
  const common = tpgService.flattenCourses(programme);
  const materials = tpgService.flattenCourses(programme, '', track.id);
  const concentration = programme.courseGroups.find((group) => group.name.includes('Concentration Course Pool'));

  assert.equal(programme.creditsRequired, 30);
  assert.equal(programme.trackSelectionOptional, true);
  assert.equal(track.name, 'Materials Technology');
  assert.equal(common.length, 1);
  assert.equal(materials.length, 9);
  assert.equal(concentration.creditsRequired, 18);
  assert.equal(concentration.courses.length, 8);
  assert.equal(tpgService.getProgrammeCourse(programme.id, 'MESF 6950').countsTowardTrackIds[0], track.id);
  assert.equal(tpgService.getProgrammeCourse(programme.id, 'MESF 5010', track.id).credits, 3);
});

test('CUHK Chinese Language and Literature exposes the complete two-plus-six course structure', () => {
  const programme = tpgService.getProgramme('CUHK-TPG-001');
  const required = programme.courseGroups.find((group) => group.id === 'required-courses');
  const electives = programme.courseGroups.find((group) => group.id === 'elective-courses');
  const courses = tpgService.flattenCourses(programme);

  assert.equal(programme.creditsRequired, 24);
  assert.equal(programme.creditUnit, 'units');
  assert.equal(programme.ruleReviewStatus, 'verified');
  assert.deepEqual([required.creditsRequired, required.coursesRequired], [6, 2]);
  assert.deepEqual([electives.creditsRequired, electives.coursesRequired], [18, 6]);
  assert.equal(courses.length, 53);
  assert.equal(new Set(courses.map((course) => course.code)).size, 53);
  assert.equal(courses.every((course) => course.credits === 3), true);
  assert.equal(tpgService.getProgrammeCourse(programme.id, 'CHLL5600').name, '研究方法與論文寫作');
  assert.equal(tpgService.getProgrammeCourse(programme.id, 'CHLL5994').name, '中國現代文學、藝術與美育');
  assert.equal(courses.every((course) => course.sourceUrl === programme.courseSourceUrl), true);
});

test('CUHK Systems Engineering and Engineering Management preserves its three-area elective rule', () => {
  const programme = tpgService.getProgramme('CUHK-TPG-012');
  const required = programme.courseGroups.find((group) => group.id === 'required-courses');
  const electives = programme.courseGroups.find((group) => group.id === 'elective-courses');
  const courses = tpgService.flattenCourses(programme);

  assert.equal(programme.creditsRequired, 24);
  assert.equal(programme.creditUnit, 'credits');
  assert.equal(programme.ruleReviewStatus, 'manual_review_required');
  assert.deepEqual([required.creditsRequired, required.coursesRequired], [9, 3]);
  assert.deepEqual([electives.creditsRequired, electives.coursesRequired], [15, 5]);
  assert.equal(courses.length, 16);
  assert.equal(new Set(courses.map((course) => course.code)).size, 16);
  assert.equal(courses.every((course) => course.credits === 3), true);
  assert.equal(tpgService.getProgrammeCourse(programme.id, 'SEEM5910').name, 'Project in SEEM');
  assert.equal(tpgService.getProgrammeCourse(programme.id, 'SEEM5920').name, 'SEEM Internship');
  assert.match(electives.ruleText, /at least one course from each of Area I, Area II and Area III/);
  assert.match(electives.ruleText, /at most one of those two courses/);
});

test('CUHK Financial Technology filters enrichment courses by its three official Tracks', () => {
  const programme = tpgService.getProgramme('CUHK-TPG-013');
  const tracks = Object.fromEntries(tpgService.listTracks(programme).map((track) => [track.name, track]));
  const required = programme.courseGroups.find((group) => group.id === 'required-courses');
  const technology = programme.courseGroups.find((group) => group.id === 'technology-electives');
  const business = programme.courseGroups.find((group) => group.id === 'business-application-electives');
  const enrichment = programme.courseGroups.find((group) => group.id === 'enrichment-training');

  assert.equal(programme.creditsRequired, 24);
  assert.equal(programme.trackSelectionOptional, false);
  assert.equal(programme.ruleReviewStatus, 'manual_review_required');
  assert.equal(tpgService.listTracks(programme).length, 3);
  assert.deepEqual([required.courses.length, technology.courses.length, business.courses.length, enrichment.courses.length], [3, 15, 19, 3]);
  assert.equal(tpgService.getStatus(programme).courseCount, 40);
  assert.equal(tpgService.flattenCourses(programme, '', tracks['Course Track'].id).length, 37);
  assert.equal(tpgService.flattenCourses(programme, '', tracks['Practicum Track'].id).length, 38);
  assert.equal(tpgService.flattenCourses(programme, '', tracks['Industrial Project Track'].id).length, 39);
  assert.equal(tpgService.getProgrammeCourse(programme.id, 'FTEC5540', tracks['Course Track'].id), null);
  assert.equal(tpgService.getProgrammeCourse(programme.id, 'FTEC5540', tracks['Practicum Track'].id).credits, 3);
  assert.equal(tpgService.getProgrammeCourse(programme.id, 'FTEC5910', tracks['Industrial Project Track'].id).credits, 3);
  assert.equal(tpgService.getProgrammeCourse(programme.id, 'FTEC5920', tracks['Industrial Project Track'].id).credits, 3);
  assert.match(required.ruleText, /replace it with an additional elective/);
  assert.match(enrichment.ruleText, /Project I earns credit only when Project II/);
});

test('CUHK Translation keeps all three Streams optional and preserves mutually exclusive course paths', () => {
  const programme = tpgService.getProgramme('CUHK-TPG-003');
  const tracks = Object.fromEntries(tpgService.listTracks(programme).map((track) => [track.name, track]));
  const required = programme.courseGroups.find((group) => group.id === 'required-course');
  const electives = programme.courseGroups.find((group) => group.id === 'elective-course-pool');
  const courses = tpgService.flattenCourses(programme);

  assert.equal(programme.creditsRequired, 24);
  assert.equal(programme.name, 'Translation');
  assert.equal(programme.creditUnit, 'units');
  assert.equal(programme.ruleReviewStatus, 'manual_review_required');
  assert.equal(programme.trackSelectionOptional, true);
  assert.equal(tpgService.listTracks(programme).length, 3);
  assert.equal(tracks['Written Translation Stream'].creditsRequired, 24);
  assert.equal(tracks['Interpreting Stream'].creditsRequired, 24);
  assert.equal(tracks['Computer-augmented Translation Stream'].creditsRequired, 24);
  assert.deepEqual([required.creditsRequired, electives.creditsRequired], [3, 21]);
  assert.deepEqual([required.coursesRequired, electives.coursesRequired], [1, 7]);
  assert.equal(courses.length, 38);
  assert.equal(new Set(courses.map((course) => course.code)).size, 38);
  assert.equal(courses.every((course) => course.credits === 3), true);
  assert.equal(tpgService.getProgrammeCourse(programme.id, 'TRAN6001').name, 'Advanced Translation Studies');
  assert.equal(tpgService.getProgrammeCourse(programme.id, 'TRAN6825').name, 'Project Management for Computer-aided Translation');
  assert.match(electives.ruleText, /TRAN6205\/6305/);
  assert.match(electives.ruleText, /only one fulfils that pair/);
  assert.match(electives.ruleText, /not all electives are offered every year/);
});

test('CUHK Applied English Linguistics keeps its 6-unit Research Project optional', () => {
  const programme = tpgService.getProgramme('CUHK-TPG-002');
  const required = programme.courseGroups.find((group) => group.id === 'required-course');
  const electives = programme.courseGroups.find((group) => group.id === 'elective-courses');
  const courses = tpgService.flattenCourses(programme);

  assert.equal(programme.creditsRequired, 24);
  assert.equal(programme.name, 'Applied English Linguistics');
  assert.equal(programme.creditUnit, 'units');
  assert.equal(programme.ruleReviewStatus, 'manual_review_required');
  assert.equal(tpgService.listTracks(programme).length, 0);
  assert.deepEqual([required.creditsRequired, required.coursesRequired], [3, 1]);
  assert.equal(electives.creditsRequired, 21);
  assert.equal(electives.coursesRequired, undefined);
  assert.equal(courses.length, 23);
  assert.equal(new Set(courses.map((course) => course.code)).size, 23);
  assert.equal(tpgService.getProgrammeCourse(programme.id, 'ENGE5010').name, 'Theoretical Linguistics');
  assert.equal(tpgService.getProgrammeCourse(programme.id, 'ENGE5640').credits, 6);
  assert.equal(tpgService.getProgrammeCourse(programme.id, 'ENGE5460').credits, 3);
  assert.match(electives.ruleText, /number of courses needed varies/);
  assert.match(electives.ruleText, /optional and must not be treated as a compulsory Project/);
  assert.match(electives.ruleText, /cumulative GPA of at least 3\.3/);
});

test('CUHK Buddhist Studies preserves the two-of-three required choice and mandatory Graduation Paper', () => {
  const programme = tpgService.getProgramme('CUHK-TPG-005');
  const required = programme.courseGroups.find((group) => group.id === 'required-course-options');
  const electives = programme.courseGroups.find((group) => group.id === 'elective-courses');
  const project = programme.courseGroups.find((group) => group.id === 'graduation-paper');
  const courses = tpgService.flattenCourses(programme);

  assert.equal(programme.creditsRequired, 24);
  assert.equal(programme.name, 'Buddhist Studies');
  assert.equal(programme.creditUnit, 'units');
  assert.equal(programme.ruleReviewStatus, 'manual_review_required');
  assert.equal(tpgService.listTracks(programme).length, 0);
  assert.deepEqual([required.creditsRequired, electives.creditsRequired, project.creditsRequired], [6, 15, 3]);
  assert.deepEqual([required.coursesRequired, electives.coursesRequired, project.coursesRequired], [2, 5, 1]);
  assert.equal(courses.length, 21);
  assert.equal(new Set(courses.map((course) => course.code)).size, 21);
  assert.equal(courses.every((course) => course.credits === 3), true);
  assert.equal(tpgService.getProgrammeCourse(programme.id, 'BUDS5012').name, 'Graduation Paper');
  assert.equal(tpgService.getProgrammeCourse(programme.id, 'CHES6002').name, 'A Critical Cultural History of China: Modern China');
  assert.match(required.ruleText, /any two of BUDS5013, BUDS5005 and BUDS5014/);
  assert.match(required.ruleText, /English admission requirement/);
  assert.match(electives.ruleText, /does not guarantee that every course is offered/);
});

test('CUHK Data Science and Business Statistics keeps Research Workshop optional and exposes the current 9-plus-15 structure', () => {
  const programme = tpgService.getProgramme('CUHK-TPG-017');
  const core = programme.courseGroups.find((group) => group.id === 'core-courses');
  const electives = programme.courseGroups.find((group) => group.id === 'elective-courses');
  const courses = tpgService.flattenCourses(programme);

  assert.equal(programme.creditsRequired, 24);
  assert.equal(programme.name, 'Data Science & Business Stats');
  assert.equal(programme.creditUnit, 'credits');
  assert.equal(programme.ruleReviewStatus, 'manual_review_required');
  assert.equal(tpgService.listTracks(programme).length, 0);
  assert.deepEqual([core.creditsRequired, electives.creditsRequired], [9, 15]);
  assert.deepEqual([core.coursesRequired, electives.coursesRequired], [3, 5]);
  assert.equal(core.courses.length, 3);
  assert.equal(electives.courses.length, 16);
  assert.equal(courses.length, 19);
  assert.equal(new Set(courses.map((course) => course.code)).size, 19);
  assert.equal(courses.every((course) => course.credits === 3), true);
  assert.equal(electives.courses.find((course) => course.code === 'STAT6111').name, 'Research Workshop');
  assert.match(electives.ruleText, /optional and is not a compulsory Project or Dissertation/);
  assert.match(electives.ruleText, /full-time-only placement/);
});

test('CUHK History remains blocked while its level-based elective pools lack a current fixed course list', () => {
  const programme = tpgService.getProgramme('CUHK-TPG-004');

  assert.equal(programme.courseVerificationStatus, 'blocked');
  assert.equal((programme.courseGroups || []).length, 0);
  assert.match(programme.courseStatusNote, /HIST5011/);
  assert.match(programme.courseStatusNote, /HIST6015-HIST6017/);
  assert.match(programme.courseStatusNote, /HIST5000-level courses/);
  assert.match(programme.courseStatusNote, /do not substitute the undergraduate catalogue/);
});

test('CUHK Early Childhood Education remains blocked on three codes missing from the current course catalogue', () => {
  const programme = tpgService.getProgramme('CUHK-TPG-010');

  assert.equal(programme.courseVerificationStatus, 'blocked');
  assert.equal((programme.courseGroups || []).length, 0);
  assert.match(programme.courseStatusNote, /24 units/);
  assert.match(programme.courseStatusNote, /PEDU6072, PEDU6503 or PEDU6701/);
  assert.match(programme.courseStatusNote, /eight 1\.5-unit research-method courses/);
  assert.match(programme.courseStatusNote, /Older official handbooks and timetables are not sufficient/);
});

test('CUHK Marketing remains blocked while its Track label and course codes are unresolved', () => {
  const programme = tpgService.getProgramme('CUHK-TPG-008');

  assert.equal(programme.courseVerificationStatus, 'blocked');
  assert.equal((programme.courseGroups || []).length, 0);
  assert.match(programme.courseStatusNote, /36 credits/);
  assert.match(programme.courseStatusNote, /AI and Quantitative Marketing/);
  assert.match(programme.courseStatusNote, /Big Data Marketing/);
  assert.match(programme.courseStatusNote, /no complete current code table/);
});

test('CUHK Information and Technology Management remains blocked on its cross-programme code pool', () => {
  const programme = tpgService.getProgramme('CUHK-TPG-009');

  assert.equal(programme.courseVerificationStatus, 'blocked');
  assert.equal((programme.courseGroups || []).length, 0);
  assert.match(programme.courseStatusNote, /30 credits/);
  assert.match(programme.courseStatusNote, /five Required Courses and five Elective Courses/);
  assert.match(programme.courseStatusNote, /up to six credits/);
  assert.match(programme.courseStatusNote, /do not copy codes from the separate full-time/);
});

test('CUHK Common Law remains blocked until its cross-programme and research options have complete codes and units', () => {
  const programme = tpgService.getProgramme('CUHK-TPG-014');

  assert.equal(programme.courseVerificationStatus, 'blocked');
  assert.equal((programme.courseGroups || []).length, 0);
  assert.match(programme.courseStatusNote, /24 units/);
  assert.match(programme.courseStatusNote, /12 units from four named Required Courses/);
  assert.match(programme.courseStatusNote, /Independent Research Dissertation/);
  assert.match(programme.courseStatusNote, /LAWS6021 Principles of Contract/);
  assert.match(programme.courseStatusNote, /partial mapping is not a complete current curriculum/);
});

test('CUHK International Economic Law remains blocked rather than exposing its discoverable code subset', () => {
  const programme = tpgService.getProgramme('CUHK-TPG-015');

  assert.equal(programme.courseVerificationStatus, 'blocked');
  assert.equal((programme.courseGroups || []).length, 0);
  assert.match(programme.courseStatusNote, /24 units/);
  assert.match(programme.courseStatusNote, /LAWS6301, LAWS6302, LAWS6303 and LAWS6311/);
  assert.match(programme.courseStatusNote, /approved JD\/other LLM courses/);
  assert.match(programme.courseStatusNote, /Do not publish the discoverable subset/);
});

test('CUHK Global Communication remains blocked while its current curriculum awaits final approval', () => {
  const programme = tpgService.getProgramme('CUHK-TPG-018');

  assert.equal(programme.courseVerificationStatus, 'blocked');
  assert.equal((programme.courseGroups || []).length, 0);
  assert.match(programme.courseStatusNote, /subject to the University's final approval/);
  assert.match(programme.courseStatusNote, /COMM5947 and COMM5992/);
  assert.match(programme.courseStatusNote, /do not publish the superseded 2025-26 curriculum/);
});

test('CUHK Mathematics preserves both official Streams and the Big Data code-range rule', () => {
  const programme = tpgService.getProgramme('CUHK-TPG-016');
  const tracks = Object.fromEntries(tpgService.listTracks(programme).map((track) => [track.name, track]));
  const group = programme.courseGroups.find((item) => item.id === 'mmat-course-pool');
  const courses = tpgService.flattenCourses(programme);
  const bigDataTrackId = tracks['Big Data Analytics and Computations Stream'].id;
  const eligibleCodes = group.courses
    .filter((course) => (course.countsTowardTrackIds || []).includes(bigDataTrackId))
    .map((course) => course.code);

  assert.equal(programme.creditsRequired, 24);
  assert.equal(programme.name, 'Mathematics');
  assert.equal(programme.creditUnit, 'units');
  assert.equal(programme.ruleReviewStatus, 'manual_review_required');
  assert.equal(tpgService.listTracks(programme).length, 2);
  assert.equal(tracks['Mathematics Stream'].creditsRequired, 24);
  assert.equal(tracks['Big Data Analytics and Computations Stream'].creditsRequired, 24);
  assert.equal(group.creditsRequired, 24);
  assert.equal(group.coursesRequired, 8);
  assert.equal(courses.length, 36);
  assert.equal(new Set(courses.map((course) => course.code)).size, 36);
  assert.equal(courses.every((course) => course.credits === 3), true);
  assert.equal(eligibleCodes.includes('MMAT5210'), true);
  assert.equal(eligibleCodes.includes('MMAT5396'), true);
  assert.equal(eligibleCodes.includes('MMAT5220'), false);
  assert.match(group.ruleText, /at least 18 units/);
  assert.match(group.ruleText, /at most 3 units/);
  assert.match(group.ruleText, /does not imply that every course is offered every year/);
});

test('Lingnan Qualifications Register data exposes official Programme names and Tracks', () => {
  const programmes = tpgService.listProgrammes('LINGNAN');
  const crossDisciplinary = programmes.find((item) => item.programmeCode === '24/000464/L6');
  const appliedPsychology = programmes.find((item) => item.programmeCode === '22/000158/L6');
  assert.equal(programmes.some((item) => item.nameKind === 'official_field_label'), false);
  assert.equal(crossDisciplinary.name, 'Master of Science in Cross-disciplinary Technologies+');
  assert.equal(tpgService.listTracks(crossDisciplinary).length, 10);
  assert.equal(tpgService.listTracks(appliedPsychology)[0].name, 'Counselling Psychology');
  assert.equal(programmes.some((item) => item.name === 'Policy Studies'), false);
  assert.equal(programmes.some((item) => item.name === 'Global Digital Economy and Governance'), false);
});

test('EdUHK Master of Education exposes official Areas of Focus as Tracks', () => {
  const programme = tpgService.listProgrammes('EDUHK').find((item) => item.programmeCode === 'MEd');
  const tracks = tpgService.listTracks(programme);
  assert.equal(programme.creditsRequired, 24);
  assert.equal(tracks.length, 10);
  assert.equal(tpgService.getTrack(programme.id, `${programme.id}-CTA`).name, 'Curriculum, Teaching and Assessment');
  assert.equal(tpgService.isValidTrack(programme.id, `${programme.id}-CTA`), true);
  assert.equal(tpgService.isValidTrack(programme.id, 'HKU-TRACK'), false);
  assert.equal(tracks.some((track) => /Life and Values/.test(track.name)), false);
});

test('EdUHK MATESOL filters the Dissertation from the General Degree Strand', () => {
  const programme = tpgService.getProgramme('EDUHK-TPG-DIR-MATESOL');
  const tracks = Object.fromEntries(tpgService.listTracks(programme).map((track) => [track.name, track]));
  const core = programme.courseGroups.find((group) => group.id === 'core-courses');
  const electives = programme.courseGroups.find((group) => group.id === 'degree-strand-electives');

  assert.equal(programme.creditsRequired, 24);
  assert.equal(programme.creditUnit, 'credit points');
  assert.equal(programme.trackSelectionOptional, false);
  assert.equal(tpgService.listTracks(programme).length, 3);
  assert.deepEqual([core.creditsRequired, core.coursesRequired], [6, 2]);
  assert.equal(tpgService.getStatus(programme).courseCount, 13);
  assert.equal(tpgService.flattenCourses(programme, '', tracks['MATESOL (General)'].id).length, 12);
  assert.equal(tpgService.flattenCourses(programme, '', tracks['MATESOL (Applied Linguistics)'].id).length, 13);
  assert.equal(tpgService.getProgrammeCourse(programme.id, 'ENG6359', tracks['MATESOL (General)'].id), null);
  assert.equal(tpgService.getProgrammeCourse(programme.id, 'ENG6359', tracks['MATESOL (Applied Linguistics)'].id).credits, 6);
  assert.match(electives.ruleText, /grade B or above in ENG6361/);
  assert.match(electives.ruleText, /ENG6395, ENG6421 and any two electives/);
});

test('EdUHK Global Histories of Education keeps the 6-credit Research Project optional', () => {
  const programme = tpgService.getProgramme('EDUHK-TPG-DIR-MAGHE');
  const core = programme.courseGroups.find((group) => group.id === 'core-courses');
  const electives = programme.courseGroups.find((group) => group.id === 'elective-or-research-project');
  const courses = tpgService.flattenCourses(programme);

  assert.equal(programme.creditsRequired, 24);
  assert.equal(programme.creditUnit, 'credit points');
  assert.equal(programme.ruleReviewStatus, 'manual_review_required');
  assert.deepEqual([core.creditsRequired, core.coursesRequired, core.courses.length], [9, 3, 3]);
  assert.equal(electives.creditsRequired, 15);
  assert.equal(electives.coursesRequired, undefined);
  assert.equal(courses.length, 16);
  assert.equal(new Set(courses.map((course) => course.code)).size, 16);
  assert.equal(tpgService.getProgrammeCourse(programme.id, 'HIS6062').credits, 6);
  assert.equal(tpgService.getProgrammeCourse(programme.id, 'PFS6062').credits, 3);
  assert.match(electives.ruleText, /Research Project is optional/);
  assert.match(electives.ruleText, /Not all electives are offered every year/);
});

test('EdUHK MATCIL preserves background-dependent requirements and the optional IB Teaching Strand', () => {
  const programme = tpgService.getProgramme('EDUHK-TPG-DIR-MATCIL');
  const track = tpgService.listTracks(programme)[0];
  const core = programme.courseGroups.find((group) => group.id === 'core-courses');
  const electives = programme.courseGroups.find((group) => group.id === 'elective-courses');
  const courses = tpgService.flattenCourses(programme);

  assert.equal(programme.creditsRequired, 30);
  assert.equal(programme.creditUnit, 'credit points');
  assert.equal(programme.trackSelectionOptional, true);
  assert.equal(programme.ruleReviewStatus, 'manual_review_required');
  assert.equal(track.name, 'IB Teaching Strand');
  assert.equal(track.type, 'Teaching Strand');
  assert.deepEqual([core.creditsMin, core.creditsMax, core.courses.length], [12, 15, 5]);
  assert.deepEqual([electives.creditsMin, electives.creditsMax, electives.courses.length], [15, 18, 13]);
  assert.equal(courses.length, 18);
  assert.equal(new Set(courses.map((course) => course.code)).size, 18);
  assert.equal(tpgService.getProgrammeCourse(programme.id, 'CHI6608').credits, 6);
  assert.equal(tpgService.getProgrammeCourse(programme.id, 'FEX6118').credits, 6);
  assert.deepEqual(tpgService.getProgrammeCourse(programme.id, 'CHI6709').countsTowardTrackIds, [track.id]);
  assert.match(core.ruleText, /非中文主修背景学生另须修读 CHI6546/);
  assert.match(electives.ruleText, /IB Teaching Strand 须修读 CHI6709/);
  assert.match(electives.ruleText, /不得视为必修/);
});

test('EdUHK Music Education keeps Independent Project as a required 3-credit Core Course', () => {
  const programme = tpgService.getProgramme('EDUHK-TPG-DIR-MA-ME');
  const core = programme.courseGroups.find((group) => group.id === 'core-courses');
  const electives = programme.courseGroups.find((group) => group.id === 'elective-courses');
  const courses = tpgService.flattenCourses(programme);

  assert.equal(programme.creditsRequired, 24);
  assert.equal(programme.creditUnit, 'credit points');
  assert.equal(programme.ruleReviewStatus, 'verified');
  assert.deepEqual([core.creditsRequired, core.coursesRequired, core.courses.length], [9, 3, 3]);
  assert.deepEqual([electives.creditsRequired, electives.coursesRequired, electives.courses.length], [15, 5, 10]);
  assert.equal(courses.length, 13);
  assert.equal(new Set(courses.map((course) => course.code)).size, 13);
  assert.equal(tpgService.getProgrammeCourse(programme.id, 'MUS6333').credits, 3);
  assert.equal(core.courses.some((course) => course.code === 'MUS6333'), true);
  assert.equal(electives.courses.some((course) => course.code === 'MUS6333'), false);
  assert.match(core.ruleText, /required Core Course worth 3 credit points/);
});

test('EdUHK Chinese Studies remains blocked while the current structure omits every course code', () => {
  const programme = tpgService.getProgramme('EDUHK-TPG-DIR-MACSLE');

  assert.equal(programme.courseVerificationStatus, 'blocked');
  assert.equal(programme.dataLevel, 'programme');
  assert.deepEqual(programme.courseGroups || [], []);
  assert.match(programme.courseStatusNote, /does not publish a course code for any Core or Elective Course/);
  assert.match(programme.courseStatusNote, /do not infer codes from titles/);
});

test('EdUHK Intercultural Communication and Translation preserves the optional Dissertation route', () => {
  const programme = tpgService.getProgramme('EDUHK-TPG-DIR-MAICT');
  const core = programme.courseGroups.find((group) => group.id === 'core-courses');
  const electives = programme.courseGroups.find((group) => group.id === 'elective-or-dissertation');
  const courses = tpgService.flattenCourses(programme);

  assert.equal(programme.creditsRequired, 24);
  assert.equal(programme.creditUnit, 'credit points');
  assert.equal(programme.ruleReviewStatus, 'manual_review_required');
  assert.deepEqual([core.creditsRequired, core.coursesRequired, core.courses.length], [12, 4, 4]);
  assert.deepEqual([electives.creditsRequired, electives.coursesRequired, electives.courses.length], [12, undefined, 10]);
  assert.equal(courses.length, 14);
  assert.equal(new Set(courses.map((course) => course.code)).size, 14);
  assert.equal(tpgService.getProgrammeCourse(programme.id, 'LIN6069').credits, 6);
  assert.match(electives.ruleText, /Dissertation is optional/);
  assert.match(electives.ruleText, /grade B\+ or above in LIN6062/);
  assert.match(electives.ruleText, /Not all Elective Courses are offered every year/);
});

test('EdUHK Mathematics and Pedagogy preserves both 12-credit domains and their bounded choices', () => {
  const programme = tpgService.getProgramme('EDUHK-TPG-DIR-MA-MP');
  const groups = Object.fromEntries(programme.courseGroups.map((group) => [group.id, group]));
  const courses = tpgService.flattenCourses(programme);

  assert.equal(programme.creditsRequired, 24);
  assert.equal(programme.creditUnit, 'credit points');
  assert.equal(programme.ruleReviewStatus, 'verified');
  assert.deepEqual(
    [groups['mathematical-studies-core'].creditsRequired, groups['mathematical-studies-core'].coursesRequired, groups['mathematical-studies-core'].courses.length],
    [9, 3, 3]
  );
  assert.deepEqual(
    [groups['mathematical-studies-elective'].creditsRequired, groups['mathematical-studies-elective'].coursesRequired, groups['mathematical-studies-elective'].courses.length],
    [3, 1, 3]
  );
  assert.deepEqual(
    [groups['pedagogy-in-mathematics-core'].creditsRequired, groups['pedagogy-in-mathematics-core'].coursesRequired, groups['pedagogy-in-mathematics-core'].courses.length],
    [6, 2, 2]
  );
  assert.deepEqual(
    [groups['pedagogy-in-mathematics-elective'].creditsRequired, groups['pedagogy-in-mathematics-elective'].coursesRequired, groups['pedagogy-in-mathematics-elective'].courses.length],
    [6, 2, 5]
  );
  assert.equal(courses.length, 13);
  assert.equal(new Set(courses.map((course) => course.code)).size, 13);
  assert.equal(courses.every((course) => course.credits === 3), true);
  assert.equal(tpgService.getProgrammeCourse(programme.id, 'MTH6198').name, 'Mathematical Principles for Machine Learning and Quantum Computing');
  assert.equal(tpgService.getProgrammeCourse(programme.id, 'INT6065').name, 'Artificial Intelligence in Education');
});

test('EdUHK AI and Educational Technology preserves the complete five-plus-three course rule', () => {
  const programme = tpgService.getProgramme('EDUHK-TPG-DIR-MSC-AI-EDTECH');
  const core = programme.courseGroups.find((group) => group.id === 'core-courses');
  const electives = programme.courseGroups.find((group) => group.id === 'elective-courses');
  const courses = tpgService.flattenCourses(programme);

  assert.equal(programme.creditsRequired, 24);
  assert.equal(programme.creditUnit, 'credit points');
  assert.equal(programme.ruleReviewStatus, 'verified');
  assert.deepEqual([core.creditsRequired, core.coursesRequired, core.courses.length], [15, 5, 5]);
  assert.deepEqual([electives.creditsRequired, electives.coursesRequired, electives.courses.length], [9, 3, 9]);
  assert.equal(courses.length, 14);
  assert.equal(new Set(courses.map((course) => course.code)).size, 14);
  assert.equal(courses.every((course) => course.credits === 3), true);
  assert.equal(tpgService.getProgrammeCourse(programme.id, 'INT6071').name, 'Independent Project');
  assert.equal(core.courses.some((course) => course.code === 'INT6071'), false);
  assert.match(core.ruleText, /semester distribution differs by study mode/);
});

test('EdUHK Personal Finance Education remains blocked on the official Internship credit conflict', () => {
  const programme = tpgService.getProgramme('EDUHK-TPG-DIR-MA-PFE');

  assert.equal(programme.courseVerificationStatus, 'blocked');
  assert.equal(programme.dataLevel, 'programme');
  assert.deepEqual(programme.courseGroups || [], []);
  assert.match(programme.courseStatusNote, /BUS6046.*6 credit points/);
  assert.match(programme.courseStatusNote, /Publishing either value would contradict another current official source/);
  assert.match(programme.courseStatusNote, /do not force BUS6046 into the 3-credit elective rule/);
});

test('EdUHK STEM Education remains blocked rather than inferring its omitted course codes', () => {
  const programme = tpgService.getProgramme('EDUHK-TPG-DIR-MA-STEM-ED');

  assert.equal(programme.courseVerificationStatus, 'blocked');
  assert.equal(programme.dataLevel, 'programme');
  assert.deepEqual(programme.courseGroups || [], []);
  assert.match(programme.courseStatusNote, /publish every current title and credit value but omit the course codes/);
  assert.match(programme.courseStatusNote, /only a subset of codes/);
  assert.match(programme.courseStatusNote, /do not infer the missing codes from numbering patterns/);
});

test('EdUHK Education for Sustainability preserves its elective-or-thesis route', () => {
  const programme = tpgService.getProgramme('EDUHK-TPG-DIR-MA-EFS');
  const core = programme.courseGroups.find((group) => group.id === 'core-courses');
  const options = programme.courseGroups.find((group) => group.id === 'elective-or-thesis');
  const courses = tpgService.flattenCourses(programme);

  assert.equal(programme.creditsRequired, 24);
  assert.equal(programme.creditUnit, 'credit points');
  assert.equal(programme.ruleReviewStatus, 'manual_review_required');
  assert.deepEqual([core.creditsRequired, core.coursesRequired, core.courses.length], [18, 6, 6]);
  assert.deepEqual([options.creditsRequired, options.coursesRequired, options.courses.length], [6, undefined, 3]);
  assert.equal(courses.length, 9);
  assert.equal(new Set(courses.map((course) => course.code)).size, 9);
  assert.equal(tpgService.getProgrammeCourse(programme.id, 'SES6026').credits, 6);
  assert.match(options.ruleText, /both 3-credit Elective Courses.*or complete the 6-credit SES6026 Thesis/);
  assert.match(options.ruleText, /mutually exclusive path requires manual audit review/);
});

test('EdUHK Digital Humanities preserves the optional Project substitution', () => {
  const programme = tpgService.getProgramme('EDUHK-TPG-DIR-MADHCP');
  const core = programme.courseGroups.find((group) => group.id === 'core-courses');
  const options = programme.courseGroups.find((group) => group.id === 'elective-or-capstone-project');
  const courses = tpgService.flattenCourses(programme);

  assert.equal(programme.creditsRequired, 24);
  assert.equal(programme.ruleReviewStatus, 'manual_review_required');
  assert.deepEqual([core.creditsRequired, core.coursesRequired, core.courses.length], [6, 2, 2]);
  assert.deepEqual([options.creditsRequired, options.coursesRequired, options.courses.length], [18, 6, 11]);
  assert.equal(courses.length, 13);
  assert.equal(new Set(courses.map((course) => course.code)).size, 13);
  assert.equal(tpgService.getProgrammeCourse(programme.id, 'CUS6034').credits, 3);
  assert.match(options.ruleText, /six 3-credit Elective Courses, or five.*plus.*CUS6034/);
  assert.match(options.ruleText, /optional Project substitution requires manual audit review/);
});

test('EdUHK Visual Arts Education keeps the 6-credit Capstone mandatory', () => {
  const programme = tpgService.getProgramme('EDUHK-TPG-DIR-MA-VAECP');
  const core = programme.courseGroups.find((group) => group.id === 'core-courses-and-capstone');
  const electives = programme.courseGroups.find((group) => group.id === 'elective-courses');
  const courses = tpgService.flattenCourses(programme);

  assert.equal(programme.creditsRequired, 24);
  assert.equal(programme.ruleReviewStatus, 'manual_review_required');
  assert.deepEqual([core.creditsRequired, core.coursesRequired, core.courses.length], [15, 4, 4]);
  assert.deepEqual([electives.creditsRequired, electives.coursesRequired, electives.courses.length], [9, 3, 5]);
  assert.equal(courses.length, 9);
  assert.equal(new Set(courses.map((course) => course.code)).size, 9);
  assert.equal(tpgService.getProgrammeCourse(programme.id, 'VAC6004').credits, 6);
  assert.equal(core.courses.some((course) => course.code === 'VAC6004'), true);
  assert.match(electives.ruleText, /semester-specific selection requires manual audit review/);
});

test('EdUHK incomplete current code tables remain blocked instead of exposing partial pools', () => {
  const expectations = [
    ['EDUHK-TPG-DIR-MSOCSC-SCM', /superseded four-Core structure/, /do not carry forward the obsolete 2023-24 mapping/],
    ['EDUHK-TPG-DIR-MSC-ADS', /does not publish the course codes/, /do not infer codes from related MIT offerings/],
    ['EDUHK-TPG-DIR-MSC-LSSE', /subject to review/, /do not infer codes from similarly titled learning-sciences/],
    ['EDUHK-TPG-DIR-MSCESLPLD', /maps all 23 published titles/, /do not infer one of the possible 3\/6 distributions/],
    ['EDUHK-TPG-DIR-MA-NMSM', /four of eight 3-credit Elective Courses/, /do not expose the old six-course elective pool/],
    ['EDUHK-TPG-DIR-MSC-AIEP', /two required 3-credit Project Courses/, /do not infer codes from AI course titles/],
    ['EDUHK-TPG-DIR-MA-ETFW', /INT6140 Future of Work/, /do not extrapolate the missing codes/],
    ['EDUHK-TPG-DIR-MA-MLE', /five required 3-credit Core Courses/, /do not substitute the older PSY6069/],
    ['EDUHK-TPG-DIR-MSC-ESGSD', /PUA6027 Technology and Innovation Policies/, /do not infer the missing codes/],
    ['EDUHK-TPG-DIR-MOT', /87-credit professional award/, /do not substitute similarly themed rehabilitation/],
    ['EDUHK-TPG-DIR-LLM-NSL', /LAW6008 National Security and Informational Security/, /do not infer the missing LAW codes/],
    ['EDUHK-TPG-DIR-MA-DMEC', /BUS6085 Introduction to E-commerce/, /do not map similarly named marketing/],
    ['EDUHK-TPG-DIR-MA-IECE', /both co-delivering departments/, /do not map the new curriculum onto similarly titled legacy courses/],
    ['EDUHK-TPG-DIR-MSOCSC-TPWB', /identify only a subset/, /do not publish a partial pool/],
    ['EDUHK-TPG-DIR-MA-CHEM', /Xiqu Specialisation is not open/, /do not treat the closed Xiqu path/]
  ];

  expectations.forEach(([id, evidence, safeguard]) => {
    const programme = tpgService.getProgramme(id);
    assert.equal(programme.courseVerificationStatus, 'blocked');
    assert.equal(programme.dataLevel, 'programme');
    assert.deepEqual(programme.courseGroups || [], []);
    assert.match(programme.courseStatusNote, evidence);
    assert.match(programme.courseStatusNote, safeguard);
  });
});

test('EdUHK Child and Family Education filters the official Thesis and Practice Tracks', () => {
  const programme = tpgService.getProgramme('EDUHK-TPG-DIR-MA-CFE');
  const tracks = Object.fromEntries(tpgService.listTracks(programme).map((track) => [track.name, track]));
  const core = programme.courseGroups.find((group) => group.id === 'core-courses');
  const thesis = programme.courseGroups.find((group) => group.id === 'thesis-track');
  const practice = programme.courseGroups.find((group) => group.id === 'practice-track');

  assert.equal(programme.creditsRequired, 24);
  assert.equal(programme.ruleReviewStatus, 'verified');
  assert.equal(programme.trackSelectionOptional, false);
  assert.deepEqual(Object.keys(tracks), ['Thesis Track', 'Practice Track']);
  assert.deepEqual([core.creditsRequired, core.coursesRequired, core.courses.length], [18, 6, 6]);
  assert.deepEqual([thesis.creditsRequired, thesis.coursesRequired, thesis.courses.length], [6, 1, 1]);
  assert.deepEqual([practice.creditsRequired, practice.coursesRequired, practice.courses.length], [6, 2, 2]);
  assert.equal(tpgService.flattenCourses(programme).length, 6);
  assert.equal(tpgService.flattenCourses(programme, '', tracks['Thesis Track'].id).length, 7);
  assert.equal(tpgService.flattenCourses(programme, '', tracks['Practice Track'].id).length, 8);
  assert.equal(tpgService.getProgrammeCourse(programme.id, 'ECE6181', tracks['Practice Track'].id), null);
  assert.equal(tpgService.getProgrammeCourse(programme.id, 'ECE6181', tracks['Thesis Track'].id).credits, 6);
  assert.equal(tpgService.getProgrammeCourse(programme.id, 'INS6040', tracks['Practice Track'].id).credits, 3);
});

test('EdUHK Educational Counselling preserves mixed four- and three-credit requirements', () => {
  const programme = tpgService.getProgramme('EDUHK-TPG-DIR-MA-EC');
  const groups = Object.fromEntries(programme.courseGroups.map((group) => [group.id, group]));
  const courses = tpgService.flattenCourses(programme);

  assert.equal(programme.creditsRequired, 30);
  assert.equal(programme.ruleReviewStatus, 'verified');
  assert.deepEqual([groups['core-courses'].creditsRequired, groups['core-courses'].coursesRequired], [12, 3]);
  assert.deepEqual([groups['specialist-courses'].creditsRequired, groups['specialist-courses'].coursesRequired], [12, 3]);
  assert.deepEqual([groups['practicum-training'].creditsRequired, groups['practicum-training'].coursesRequired], [6, 2]);
  assert.equal(courses.length, 8);
  assert.deepEqual(courses.map((course) => course.credits), [4, 4, 4, 4, 4, 4, 3, 3]);
  assert.equal(tpgService.getProgrammeCourse(programme.id, 'COU6021').name, 'Practicum II');
});

test('EdUHK Global Studies in Education keeps its four-of-six elective pool', () => {
  const programme = tpgService.getProgramme('EDUHK-TPG-DIR-MA-GSE');
  const core = programme.courseGroups.find((group) => group.id === 'core-courses');
  const electives = programme.courseGroups.find((group) => group.id === 'elective-courses');
  const courses = tpgService.flattenCourses(programme);

  assert.equal(programme.creditsRequired, 24);
  assert.equal(programme.ruleReviewStatus, 'verified');
  assert.deepEqual([core.creditsRequired, core.coursesRequired, core.courses.length], [12, 4, 4]);
  assert.deepEqual([electives.creditsRequired, electives.coursesRequired, electives.courses.length], [12, 4, 6]);
  assert.equal(courses.length, 10);
  assert.equal(new Set(courses.map((course) => course.code)).size, 10);
  assert.equal(tpgService.getProgrammeCourse(programme.id, 'PFS6063').name, 'Independent Project in Global Studies in Education');
  assert.match(electives.ruleText, /may not be offered every year/);
});

test('EdUHK Positive Psychology uses the current five-plus-three course rule', () => {
  const programme = tpgService.getProgramme('EDUHK-TPG-DIR-MA-PPE');
  const core = programme.courseGroups.find((group) => group.id === 'core-courses');
  const electives = programme.courseGroups.find((group) => group.id === 'elective-courses');
  const courses = tpgService.flattenCourses(programme);

  assert.equal(programme.creditsRequired, 24);
  assert.equal(programme.ruleReviewStatus, 'verified');
  assert.deepEqual([core.creditsRequired, core.coursesRequired, core.courses.length], [15, 5, 5]);
  assert.deepEqual([electives.creditsRequired, electives.coursesRequired, electives.courses.length], [9, 3, 9]);
  assert.equal(courses.length, 14);
  assert.equal(new Set(courses.map((course) => course.code)).size, 14);
  assert.equal(courses.every((course) => course.credits === 3), true);
  assert.equal(tpgService.getProgrammeCourse(programme.id, 'PSY6097').name, 'Counselling and Guidance');
  assert.match(electives.ruleText, /Four electives are cross-listed/);
});

test('EdUHK Public Policy and Management filters three Specialisations and the cross-direction award path', () => {
  const programme = tpgService.getProgramme('EDUHK-TPG-DIR-MPPM');
  const tracks = Object.fromEntries(tpgService.listTracks(programme).map((track) => [track.name, track]));
  const core = programme.courseGroups.find((group) => group.id === 'core-courses');
  const blockA = programme.courseGroups.find((group) => group.id === 'elective-block-a');
  const blockB = programme.courseGroups.find((group) => group.id === 'elective-block-b');

  assert.equal(programme.creditsRequired, 24);
  assert.equal(programme.ruleReviewStatus, 'verified');
  assert.equal(programme.trackSelectionOptional, false);
  assert.equal(Object.keys(tracks).length, 4);
  assert.equal(tracks['No MPPM Specialisation'].type, 'Award Path');
  assert.deepEqual([core.creditsRequired, core.coursesRequired, core.courses.length], [12, 4, 4]);
  assert.deepEqual([blockA.creditsRequired, blockA.coursesRequired, blockA.courses.length], [3, 1, 3]);
  assert.deepEqual([blockB.creditsRequired, blockB.coursesRequired, blockB.courses.length], [9, 3, 18]);
  assert.equal(tpgService.flattenCourses(programme).length, 7);
  assert.equal(tpgService.flattenCourses(programme, '', tracks['Specialisation I in Governance and Public Management'].id).length, 14);
  assert.equal(tpgService.flattenCourses(programme, '', tracks['Specialisation II in Social Policy'].id).length, 13);
  assert.equal(tpgService.flattenCourses(programme, '', tracks['Specialisation III in Higher Education Policy and Management'].id).length, 13);
  assert.equal(tpgService.flattenCourses(programme, '', tracks['No MPPM Specialisation'].id).length, 25);
  assert.equal(tpgService.getProgrammeCourse(programme.id, 'PPG6004', tracks['Specialisation II in Social Policy'].id), null);
  assert.equal(tpgService.getProgrammeCourse(programme.id, 'PPG6026', tracks['Specialisation II in Social Policy'].id).credits, 3);
  assert.equal(tpgService.getProgrammeCourse(programme.id, 'PPG6026', tracks['Specialisation III in Higher Education Policy and Management'].id).credits, 3);
  assert.equal(tpgService.getProgrammeCourse(programme.id, 'PPG6032', tracks['No MPPM Specialisation'].id).name, 'Advanced Thesis in Public Policy and Management');
  assert.match(blockB.ruleText, /choose any three across the three Specialisations/);
});

test('EdUHK Educational Psychology preserves its complete 78-credit professional structure', () => {
  const programme = tpgService.getProgramme('EDUHK-TPG-DIR-MSOCSC-EP');
  const groups = Object.fromEntries(programme.courseGroups.map((group) => [group.id, group]));
  const courses = tpgService.flattenCourses(programme);

  assert.equal(programme.creditsRequired, 78);
  assert.equal(programme.ruleReviewStatus, 'verified');
  assert.deepEqual([groups['taught-courses'].creditsRequired, groups['taught-courses'].coursesRequired, groups['taught-courses'].courses.length], [45, 15, 15]);
  assert.deepEqual([groups['practicum-courses'].creditsRequired, groups['practicum-courses'].coursesRequired, groups['practicum-courses'].courses.length], [27, 5, 5]);
  assert.deepEqual([groups['research-experience-course'].creditsRequired, groups['research-experience-course'].coursesRequired, groups['research-experience-course'].courses.length], [6, 1, 1]);
  assert.equal(courses.length, 21);
  assert.equal(new Set(courses.map((course) => course.code)).size, 21);
  assert.deepEqual(groups['practicum-courses'].courses.map((course) => course.credits), [4, 2, 3, 9, 9]);
  assert.equal(tpgService.getProgrammeCourse(programme.id, 'PSY6125').credits, 6);
  assert.equal(programme.courseGroups.reduce((total, group) => total + group.creditsRequired, 0), 78);
  assert.match(groups['practicum-courses'].ruleText, /1,200 hours/);
});

test('EdUHK Psychology in Schools and Community Settings uses the current 21-plus-15 structure', () => {
  const programme = tpgService.getProgramme('EDUHK-TPG-DIR-MSOCSCP-SCS');
  const groups = Object.fromEntries(programme.courseGroups.map((group) => [group.id, group]));
  const courses = tpgService.flattenCourses(programme);

  assert.equal(programme.creditsRequired, 36);
  assert.equal(programme.ruleReviewStatus, 'manual_review_required');
  assert.equal(programme.courseSourceUrl, 'https://www.eduhk.hk/fehd/en/programmes.php?id=826');
  assert.deepEqual([groups['core-courses'].creditsRequired, groups['core-courses'].coursesRequired, groups['core-courses'].courses.length], [21, 7, 7]);
  assert.deepEqual([groups['elective-courses'].creditsRequired, groups['elective-courses'].courses.length], [15, 8]);
  assert.equal(groups['elective-courses'].coursesRequired, undefined);
  assert.equal(groups['conditional-bridging-course'].countsTowardProgrammeCredits, false);
  assert.equal(courses.length, 16);
  assert.equal(new Set(courses.map((course) => course.code)).size, 16);
  assert.equal(tpgService.getProgrammeCourse(programme.id, 'PSY6011').credits, 6);
  const bridging = tpgService.getProgrammeCourse(programme.id, 'PSY6009');
  assert.equal(bridging.countsTowardProgrammeCredits, false);
  assert.equal(tpgService.resolveAuditCredits(bridging), 0);
  assert.equal(programme.courseGroups.filter((group) => group.creditsRequired).reduce((total, group) => total + group.creditsRequired, 0), 36);
  assert.match(groups['elective-courses'].ruleText, /Research Project must not be treated as compulsory/);
});

test('EdUHK Educational Neuroscience preserves the current 18-plus-6 curriculum', () => {
  const programme = tpgService.getProgramme('EDUHK-TPG-DIR-MSC-EDN');
  const groups = Object.fromEntries(programme.courseGroups.map((group) => [group.id, group]));
  const courses = tpgService.flattenCourses(programme);

  assert.equal(programme.academicYear, '2026-27');
  assert.equal(programme.creditsRequired, 24);
  assert.equal(programme.ruleReviewStatus, 'verified');
  assert.equal(programme.courseSourceUrl, 'https://aedi.eduhk.hk/programmes/postgraduate-programmes/master-of-science-in-educational-neuroscience');
  assert.deepEqual([groups['core-courses'].creditsRequired, groups['core-courses'].coursesRequired, groups['core-courses'].courses.length], [18, 5, 5]);
  assert.deepEqual([groups['elective-courses'].creditsRequired, groups['elective-courses'].coursesRequired, groups['elective-courses'].courses.length], [6, 2, 4]);
  assert.equal(courses.length, 9);
  assert.equal(new Set(courses.map((course) => course.code)).size, 9);
  assert.deepEqual(
    courses.map((course) => course.code).sort(),
    ['EDS6010', 'EDS6011', 'EDS6012', 'EDS6013', 'EDS6014', 'EDT6004', 'PSY6092', 'PSY6093', 'PSY6094']
  );
  assert.equal(tpgService.getProgrammeCourse(programme.id, 'EDS6014').credits, 6);
  assert.equal(groups['core-courses'].courses.find((course) => course.code === 'EDS6014').name, 'Capstone Project');
  assert.equal(programme.courseGroups.reduce((total, group) => total + group.creditsRequired, 0), 24);
  assert.match(groups['elective-courses'].ruleText, /Choose any two/);
});

test('EdUHK E-Sports Management preserves its six-core and two-elective rule', () => {
  const programme = tpgService.getProgramme('EDUHK-TPG-DIR-MA-ESM');
  const groups = Object.fromEntries(programme.courseGroups.map((group) => [group.id, group]));
  const courses = tpgService.flattenCourses(programme);

  assert.equal(programme.academicYear, '2026-27');
  assert.equal(programme.creditsRequired, 24);
  assert.equal(programme.ruleReviewStatus, 'verified');
  assert.equal(programme.courseSourceUrl, 'https://aedi.eduhk.hk/programmes/postgraduate-programmes/master-of-arts-in-e-sports-management');
  assert.deepEqual([groups['core-courses'].creditsRequired, groups['core-courses'].coursesRequired, groups['core-courses'].courses.length], [18, 6, 6]);
  assert.deepEqual([groups['elective-courses'].creditsRequired, groups['elective-courses'].coursesRequired, groups['elective-courses'].courses.length], [6, 2, 4]);
  assert.deepEqual(
    courses.map((course) => course.code).sort(),
    ['ESM6001', 'ESM6002', 'ESM6003', 'ESM6004', 'ESM6005', 'ESM6006', 'ESM6007', 'ESM6008', 'ESM6009', 'ESM6010']
  );
  assert.equal(new Set(courses.map((course) => course.code)).size, 10);
  assert(courses.every((course) => course.credits === 3));
  assert.equal(programme.courseGroups.reduce((total, group) => total + group.creditsRequired, 0), 24);
  assert.equal(groups['elective-courses'].courses.some((course) => course.code === 'ESM6009'), true);
  assert.match(groups['elective-courses'].ruleText, /Choose any two/);
});

test('EdUHK EMPAL preserves the current five-core and three-of-nine elective rule', () => {
  const programme = tpgService.getProgramme('EDUHK-TPG-DIR-EMPAL');
  const groups = Object.fromEntries(programme.courseGroups.map((group) => [group.id, group]));
  const courses = tpgService.flattenCourses(programme);

  assert.equal(programme.academicYear, '2026-27');
  assert.equal(programme.creditsRequired, 24);
  assert.equal(programme.ruleReviewStatus, 'verified');
  assert.equal(programme.courseSourceUrl, 'https://aapsef.eduhk.hk/study/prospective-students/academic-programmes/empal');
  assert.deepEqual([groups['core-courses'].creditsRequired, groups['core-courses'].coursesRequired, groups['core-courses'].courses.length], [15, 5, 5]);
  assert.deepEqual([groups['elective-courses'].creditsRequired, groups['elective-courses'].coursesRequired, groups['elective-courses'].courses.length], [9, 3, 9]);
  assert.deepEqual(
    courses.map((course) => course.code).sort(),
    ['ECO6002', 'POS6016', 'POS6017', 'PUA6022', 'PUA6023', 'PUA6024', 'PUA6025', 'PUA6026', 'PUA6027', 'PUA6028', 'PUA6029', 'PUA6031', 'PUA6032', 'PUA6033']
  );
  assert.equal(new Set(courses.map((course) => course.code)).size, 14);
  assert(courses.every((course) => course.credits === 3));
  assert.equal(programme.courseGroups.reduce((total, group) => total + group.creditsRequired, 0), 24);
  assert.match(groups['elective-courses'].ruleText, /Choose any three/);
});

test('EdUHK Global Higher Education preserves the current four-core and four-of-six elective rule', () => {
  const programme = tpgService.getProgramme('EDUHK-TPG-DIR-MA-GLOBALHE');
  const groups = Object.fromEntries(programme.courseGroups.map((group) => [group.id, group]));
  const courses = tpgService.flattenCourses(programme);

  assert.equal(programme.academicYear, '2026-27');
  assert.equal(programme.creditsRequired, 24);
  assert.equal(programme.ruleReviewStatus, 'verified');
  assert.equal(programme.courseSourceUrl, 'https://aapsef.eduhk.hk/study/prospective-students/academic-programmes/master-of-arts-in-global-higher-education-maghe');
  assert.deepEqual([groups['core-courses'].creditsRequired, groups['core-courses'].coursesRequired, groups['core-courses'].courses.length], [12, 4, 4]);
  assert.deepEqual([groups['elective-courses'].creditsRequired, groups['elective-courses'].coursesRequired, groups['elective-courses'].courses.length], [12, 4, 6]);
  assert.deepEqual(
    courses.map((course) => course.code).sort(),
    ['PFS6061', 'PFS6068', 'PFS6069', 'PFS6070', 'PFS6071', 'PFS6072', 'PFS6073', 'PFS6075', 'PFS6076', 'PFS6077']
  );
  assert.equal(new Set(courses.map((course) => course.code)).size, 10);
  assert(courses.every((course) => course.credits === 3));
  assert.equal(programme.courseGroups.reduce((total, group) => total + group.creditsRequired, 0), 24);
  assert.match(groups['elective-courses'].ruleText, /Individual electives may not be offered every year/);
});

test('EdUHK Digital Governance preserves the elective or Independent Research routes', () => {
  const programme = tpgService.getProgramme('EDUHK-TPG-DIR-LLM-DG');
  const groups = Object.fromEntries(programme.courseGroups.map((group) => [group.id, group]));
  const courses = tpgService.flattenCourses(programme);

  assert.equal(programme.academicYear, '2026-27');
  assert.equal(programme.creditsRequired, 24);
  assert.equal(programme.ruleReviewStatus, 'manual_review_required');
  assert.equal(programme.courseSourceUrl, 'https://aapsef.eduhk.hk/study/prospective-students/academic-programmes/master-of-laws-in-digital-governance');
  assert.deepEqual([groups['core-courses'].creditsRequired, groups['core-courses'].coursesRequired, groups['core-courses'].courses.length], [12, 4, 4]);
  assert.deepEqual([groups['elective-courses-and-independent-research'].creditsRequired, groups['elective-courses-and-independent-research'].courses.length], [12, 7]);
  assert.equal(groups['elective-courses-and-independent-research'].coursesRequired, undefined);
  assert.deepEqual(
    courses.map((course) => course.code).sort(),
    ['LAW6001', 'LAW6002', 'LAW6003', 'LAW6004', 'LAW6005', 'LAW6006', 'LAW6007', 'LAW6008', 'LAW6009', 'LAW6010', 'LAW6011']
  );
  assert.equal(new Set(courses.map((course) => course.code)).size, 11);
  assert.equal(tpgService.getProgrammeCourse(programme.id, 'LAW6006').credits, 6);
  assert.equal(tpgService.getProgrammeCourse(programme.id, 'LAW6006').courseKind, 'project');
  assert.equal(programme.courseGroups.reduce((total, group) => total + group.creditsRequired, 0), 24);
  assert.match(groups['elective-courses-and-independent-research'].ruleText, /either four 3-credit Elective Courses, or two.*plus.*LAW6006/);
  assert.match(groups['elective-courses-and-independent-research'].ruleText, /requires manual audit review/);
});

test('EdUHK future-intake programmes retain their Programme-level academic year', () => {
  const programmes = tpgService.listProgrammes('EDUHK');
  const management = programmes.find((item) => item.programmeCode === 'MM');
  const globalManagement = programmes.find((item) => item.programmeCode === 'MGM');
  assert.equal(management.academicYear, '2027-28');
  assert.equal(globalManagement.academicYear, '2027-28');
  assert.equal(tpgService.getProfileSummary({
    profileType: 'tpg', programmeId: management.id
  }).yearLabel, '2027-28');
});

test('TPG programmes without official Tracks accept an empty Track selection only', () => {
  const programme = tpgService.getProgramme('POLYU-TPG-093');
  assert.deepEqual(tpgService.listTracks(programme), []);
  assert.equal(tpgService.isValidTrack(programme.id, ''), true);
  assert.equal(tpgService.isValidTrack(programme.id, 'PLACEHOLDER'), false);
});

test('PolyU Agentic AI Systems exposes the official 2027 curriculum choices', () => {
  const programme = tpgService.getProgramme('POLYU-TPG-093');
  const status = tpgService.getStatus(programme);
  const groupRequirements = Object.fromEntries(
    programme.courseGroups.map((group) => [group.name, group.creditsRequired])
  );

  assert.equal(programme.name, 'Agentic AI Systems');
  assert.equal(programme.dataLevel, 'structure');
  assert.equal(programme.creditsRequired, 31);
  assert.equal(programme.courseSourceUrl, 'https://www.polyu.edu.hk/comp/study/taught-postgraduate-programme/mscas/curriculum/?sc_lang=en');
  assert.equal(programme.courseVerifiedAt, '2026-07-11');
  assert.equal(programme.courseGroups.length, 4);
  assert.equal(status.hasCourseGroups, true);
  assert.equal(status.courseCount, 32);
  assert.deepEqual(groupRequirements, {
    'Core Subjects': 9,
    'Disciplinary-specific Electives': 9,
    'Elective / Project / Dissertation Options': 12,
    'Academic Integrity and Ethics': 1
  });
  assert.equal(tpgService.getProgrammeCourse(programme.id, 'COMP5583').credits, 3);
  assert.equal(tpgService.getProgrammeCourse(programme.id, 'COMP5584').credits, 3);
  assert.equal(tpgService.getProgrammeCourse(programme.id, 'COMP5934').credits, 6);
  assert.equal(tpgService.getProgrammeCourse(programme.id, 'COMP5940').credits, 9);
  assert.equal(tpgService.getProgrammeCourse(programme.id, 'DSAI5T09').credits, 1);
});

test('PolyU Blockchain Technology exposes official curriculum subjects', () => {
  const programme = tpgService.getProgramme('POLYU-TPG-090');
  const status = tpgService.getStatus(programme);
  const courses = tpgService.flattenCourses(programme);
  const coreCourses = tpgService.flattenCourses(programme, 'COMP5566');

  assert.equal(programme.name, 'Blockchain Technology');
  assert.equal(programme.dataLevel, 'structure');
  assert.equal(programme.courseGroups.length, 3);
  assert.equal(status.hasCourseGroups, true);
  assert.equal(status.courseCount, 36);
  assert.equal(courses.length, 36);
  assert.equal(coreCourses.length, 1);
  assert.equal(coreCourses[0].name, 'Blockchain and Smart Contract Security');
  assert.equal(tpgService.getProgrammeCourse(programme.id, 'COMP5521').credits, 3);
  assert.equal(tpgService.getProgrammeCourse(programme.id, 'COMP5221').credits, 3);
  assert.equal(tpgService.getProgrammeCourse(programme.id, 'COMP5933').credits, 6);
  assert.equal(tpgService.getProgrammeCourse(programme.id, 'COMP5940').credits, 9);
});

test('PolyU Vision Science and Innovation meets the verified structure threshold', () => {
  const programme = tpgService.getProgramme('POLYU-TPG-105');
  const status = tpgService.getStatus(programme);
  assert.equal(programme.creditsRequired, 31);
  assert.equal(programme.creditUnit, 'credits');
  assert.equal(programme.courseGroups.length, 4);
  assert.equal(status.isComplete, true);
  assert.equal(status.courseCount, 20);
  assert.equal(tpgService.getProgrammeCourse(programme.id, 'SO5100').credits, 6);
  assert.equal(tpgService.getProgrammeCourse(programme.id, 'HTI5T04').credits, 1);
});

test('TPG courses with unknown credits are not assigned invented defaults', () => {
  assert.equal(tpgService.resolveCourseCredits({ name: 'Ordinary Subject' }), null);
  assert.equal(tpgService.resolveCourseCredits({ name: 'Research Project' }), null);
  assert.equal(tpgService.resolveCourseCredits({ name: 'Dissertation' }), null);
  assert.equal(tpgService.resolveCourseCredits({ name: 'Official Subject', credits: 4 }), 4);
  assert.equal(tpgService.resolveCourseCredits({ name: 'Non-credit Course', credits: 0 }), 0);
  assert.equal(tpgService.resolveCourseCredits({ name: 'Variable Course', creditsMin: 1, creditsMax: 3 }), null);
  assert.equal(tpgService.getCourseCreditLabel({ creditsMin: 1, creditsMax: 3 }), '1–3 credits');
});

test('HKUST official catalog import exposes verified fixed and variable-credit structures', () => {
  const ai = tpgService.getProgramme('HKUST-TPG-027');
  const bigData = tpgService.getProgramme('HKUST-TPG-029');
  assert.equal(tpgService.getStatus(ai).isComplete, true);
  assert.equal(ai.creditsRequired, 30);
  assert.equal(tpgService.getProgrammeCourse(ai.id, 'ARIN 5101').name, 'Advanced Python Programming for Artificial Intelligence');
  assert.equal(tpgService.getProgrammeCourse(ai.id, 'ARIN 5101').credits, 3);
  assert.equal(tpgService.getStatus(bigData).isComplete, true);
  assert.equal(bigData.courseGroups.find((group) => group.name === 'Core Courses').creditsRequired, 12);
  assert.equal(tpgService.getProgrammeCourse(bigData.id, 'MSBD 5001').credits, 3);
});

test('TPG Track filtering keeps common courses and the selected Track only', () => {
  const programme = {
    courseGroups: [
      { name: 'Common', courses: [{ code: 'C1', name: 'Common', credits: 3 }] },
      { name: 'Track A', appliesToTrackIds: ['A'], courses: [{ code: 'A1', name: 'A', credits: 3 }] },
      { name: 'Shared', courses: [{ code: 'B1', name: 'B', credits: 3, appliesToTrackIds: ['B'] }] }
    ]
  };
  assert.deepEqual(tpgService.flattenCourses(programme, '', 'A').map((item) => item.code), ['C1', 'A1']);
  assert.deepEqual(tpgService.flattenCourses(programme, '', 'B').map((item) => item.code), ['C1', 'B1']);
  assert.deepEqual(tpgService.flattenCourses(programme).map((item) => item.code), ['C1']);
});

test('CityU Data Science preserves the current 15-plus-15 structure and optional Dissertation route', () => {
  const programme = tpgService.getProgramme('CITYU-TPG-022');
  const core = programme.courseGroups.find((group) => group.id === 'core');
  const elective = programme.courseGroups.find((group) => group.id === 'electives');
  const dissertation = tpgService.getProgrammeCourse(programme.id, 'SDSC6006');

  assert.equal(programme.creditsRequired, 30);
  assert.equal(tpgService.getStatus(programme).isComplete, true);
  assert.equal(tpgService.getStatus(programme).courseCount, 31);
  assert.equal(core.creditsRequired, 15);
  assert.equal(core.coursesRequired, 5);
  assert.equal(core.courses.length, 5);
  assert.equal(elective.creditsRequired, 15);
  assert.equal(elective.courses.length, 26);
  assert.equal(dissertation.name, 'Dissertation');
  assert.equal(dissertation.credits, 6);
  assert.match(elective.ruleText, /taught courses only.*taught courses plus.*Dissertation/);
  assert.equal(tpgService.getProgrammeCourse(programme.id, 'SDSC6019').name, 'Embodied AI and Applications');
  assert.equal(tpgService.getProgrammeCourse(programme.id, 'SDSC8016').credits, 3);
});

test('CityU Artificial Intelligence in Business keeps the Business Core as a choice pool', () => {
  const programme = tpgService.getProgramme('CITYU-TPG-019');
  const aiCore = programme.courseGroups.find((group) => group.id === 'ai-core');
  const businessCore = programme.courseGroups.find((group) => group.id === 'business-core');
  const elective = programme.courseGroups.find((group) => group.id === 'electives');

  assert.equal(programme.creditsRequired, 30);
  assert.equal(tpgService.getStatus(programme).isComplete, true);
  assert.equal(tpgService.getStatus(programme).courseCount, 22);
  assert.equal(aiCore.creditsRequired, 9);
  assert.equal(aiCore.coursesRequired, 3);
  assert.equal(aiCore.courses.length, 3);
  assert.equal(businessCore.creditsRequired, 9);
  assert.equal(businessCore.coursesRequired, 3);
  assert.equal(businessCore.courses.length, 6);
  assert.match(businessCore.ruleText, /choices, not all individually mandatory/);
  assert.equal(elective.creditsRequired, 12);
  assert.equal(tpgService.getProgrammeCourse(programme.id, 'IS6912').name, 'Information Systems Project');
  assert.equal(tpgService.getProgrammeCourse(programme.id, 'IS6912').credits, 6);
});

test('CityU Digital Transformation keeps its 18-plus-12 structure and Project option', () => {
  const programme = tpgService.getProgramme('CITYU-TPG-015');
  const core = programme.courseGroups.find((group) => group.id === 'core');
  const elective = programme.courseGroups.find((group) => group.id === 'electives');

  assert.equal(programme.creditsRequired, 30);
  assert.equal(tpgService.getStatus(programme).courseCount, 20);
  assert.equal(core.creditsRequired, 18);
  assert.equal(core.coursesRequired, 6);
  assert.equal(core.courses.length, 6);
  assert.equal(elective.creditsRequired, 12);
  assert.equal(elective.courses.length, 14);
  assert.equal(tpgService.getProgrammeCourse(programme.id, 'IS6608').name, 'Digital Transformation and Technological Innovation in the Organisation');
  assert.equal(tpgService.getProgrammeCourse(programme.id, 'IS6912').credits, 6);
});

test('CityU Venture Creation replaces the stale unknown title and preserves its 21-plus-6-plus-9 structure', () => {
  const programme = tpgService.getProgramme('CITYU-TPG-001');
  const core = programme.courseGroups.find((group) => group.id === 'core');
  const coreElectives = programme.courseGroups.find((group) => group.id === 'core-electives');
  const electives = programme.courseGroups.find((group) => group.id === 'electives');

  assert.equal(programme.name, 'MSc Venture Creation');
  assert.equal(programme.creditsRequired, 36);
  assert.equal(tpgService.getStatus(programme).courseCount, 30);
  assert.equal(core.creditsRequired, 21);
  assert.equal(core.coursesRequired, 4);
  assert.equal(tpgService.getProgrammeCourse(programme.id, 'CAI6001').credits, 9);
  assert.equal(tpgService.getProgrammeCourse(programme.id, 'CAI6003').credits, 6);
  assert.equal(coreElectives.creditsRequired, 6);
  assert.equal(coreElectives.coursesRequired, 2);
  assert.equal(coreElectives.courses.length, 3);
  assert.equal(electives.creditsMin, 9);
  assert.equal(electives.courses.length, 23);
});

test('CityU AI-Driven Innovation preserves the complete 12-plus-18 official pool', () => {
  const programme = tpgService.getProgramme('CITYU-TPG-037');
  const core = programme.courseGroups.find((group) => group.id === 'core');
  const electives = programme.courseGroups.find((group) => group.id === 'electives');

  assert.equal(programme.creditsRequired, 30);
  assert.equal(tpgService.getStatus(programme).courseCount, 37);
  assert.equal(core.creditsRequired, 12);
  assert.equal(core.coursesRequired, 4);
  assert.equal(core.courses.length, 4);
  assert.equal(electives.creditsRequired, 18);
  assert.equal(electives.coursesRequired, 6);
  assert.equal(electives.courses.length, 33);
  assert.equal(tpgService.getProgrammeCourse(programme.id, 'SYE6602').name, 'AI-Driven Innovation: Seminars and Projects');
  assert.equal(tpgService.getProgrammeCourse(programme.id, 'SYE6610').name, 'AI Innovation Internships');
  assert.equal(tpgService.getProgrammeCourse(programme.id, 'PH6204').credits, 3);
});

test('CityU Intelligent Semiconductor Manufacturing preserves the taught and Dissertation alternatives', () => {
  const programme = tpgService.getProgramme('CITYU-TPG-036');
  const core = programme.courseGroups.find((group) => group.id === 'core');
  const electives = programme.courseGroups.find((group) => group.id === 'electives');
  const dissertation = tpgService.getProgrammeCourse(programme.id, 'SYE6018');

  assert.equal(programme.creditsRequired, 30);
  assert.equal(tpgService.getStatus(programme).courseCount, 27);
  assert.equal(core.creditsRequired, 12);
  assert.equal(core.coursesRequired, 4);
  assert.equal(electives.creditsRequired, 18);
  assert.equal(electives.courses.length, 23);
  assert.equal(dissertation.name, 'Dissertation');
  assert.equal(dissertation.credits, 9);
  assert.match(electives.ruleText, /six 3-credit.*three 3-credit.*9-credit.*Dissertation/);
  assert.equal(tpgService.getProgrammeCourse(programme.id, 'SYE6203').name, 'Internship Scheme in Semiconductor Industry');
});

test('CityU Engineering Management preserves the SYE minimum and Dissertation alternative', () => {
  const programme = tpgService.getProgramme('CITYU-TPG-029');
  const core = programme.courseGroups.find((group) => group.id === 'core');
  const electives = programme.courseGroups.find((group) => group.id === 'electives');

  assert.equal(programme.creditsRequired, 30);
  assert.equal(tpgService.getStatus(programme).courseCount, 41);
  assert.equal(core.creditsRequired, 12);
  assert.equal(core.coursesRequired, 4);
  assert.equal(electives.creditsRequired, 18);
  assert.equal(electives.courses.length, 37);
  assert.match(electives.ruleText, /at least 12 credit units of SYE courses/);
  assert.equal(tpgService.getProgrammeCourse(programme.id, 'SYE6018').credits, 9);
  assert.equal(tpgService.getProgrammeCourse(programme.id, 'SYE8205').name, 'Managerial Economics');
});

test('CityU Psychology exposes official Streams and filters their course groups', () => {
  const programme = tpgService.getProgramme('CITYU-TPG-048');
  const appliedTrackId = 'CITYU-TPG-048-APPLIED-PSYCHOLOGY';
  const educationTrackId = 'CITYU-TPG-048-EDUCATION';
  const commonCourses = tpgService.flattenCourses(programme);
  const appliedCourses = tpgService.flattenCourses(programme, '', appliedTrackId);
  const educationCourses = tpgService.flattenCourses(programme, '', educationTrackId);

  assert.equal(programme.creditsRequired, 30);
  assert.equal(tpgService.listTracks(programme).length, 2);
  assert.equal(tpgService.getStatus(programme).isComplete, true);
  assert.equal(tpgService.getStatus(programme).courseCount, 16);
  assert.equal(commonCourses.length, 8);
  assert.equal(appliedCourses.length, 12);
  assert.equal(educationCourses.length, 12);
  assert.equal(appliedCourses.some((course) => course.code === 'SS5791'), true);
  assert.equal(appliedCourses.some((course) => course.code === 'SS5758'), false);
  assert.equal(educationCourses.some((course) => course.code === 'SS5758'), true);
  assert.equal(educationCourses.some((course) => course.code === 'SS5791'), false);
});

test('CityU Energy and Environment preserves all three official concentration choices', () => {
  const programme = tpgService.getProgramme('CITYU-TPG-057');
  const energy = tpgService.flattenCourses(programme, '', 'CITYU-TPG-057-ENERGY');
  const environment = tpgService.flattenCourses(programme, '', 'CITYU-TPG-057-ENVIRONMENT');
  const undeclared = tpgService.flattenCourses(programme, '', 'CITYU-TPG-057-NO-CONCENTRATION');

  assert.equal(programme.creditsRequired, 30);
  assert.equal(tpgService.getStatus(programme).courseCount, 24);
  assert.deepEqual(tpgService.listTracks(programme).map((track) => track.name), [
    'Energy',
    'Environment',
    'No declared concentration'
  ]);
  assert.equal(energy.length, 22);
  assert.equal(environment.length, 22);
  assert.equal(undeclared.length, 24);
  assert.equal(energy.some((course) => course.code === 'SEE6103'), true);
  assert.equal(energy.some((course) => course.code === 'SEE5211'), false);
  assert.equal(environment.some((course) => course.code === 'SEE5211'), true);
  assert.equal(environment.some((course) => course.code === 'SEE6103'), false);
  assert.equal(tpgService.getProgrammeCourse(programme.id, 'SEE6999', 'CITYU-TPG-057-ENERGY').credits, 6);
});

test('CityU Chemistry retains its official core and research elective credit rules', () => {
  const programme = tpgService.getProgramme('CITYU-TPG-053');
  const groups = Object.fromEntries(programme.courseGroups.map((group) => [group.id, group.creditsRequired || 0]));

  assert.equal(programme.creditsRequired, 30);
  assert.equal(tpgService.getStatus(programme).isComplete, true);
  assert.equal(tpgService.getStatus(programme).courseCount, 15);
  assert.deepEqual(groups, { core: 15, 'elective-group-a': 6, 'elective-group-b': 0 });
  assert.equal(tpgService.getProgrammeCourse(programme.id, 'CHEM6127').credits, 14);
  assert.equal(tpgService.getProgrammeCourse(programme.id, 'CHEM6129').credits, 6);
  assert.equal(tpgService.getProgrammeCourse(programme.id, 'CHEM6123').credits, 1);
  assert.equal(tpgService.getProgrammeCourse(programme.id, 'CHEM6134').name, 'AI for Chemistry');
});

test('CityU Mechanical Engineering filters the official Stream core and keeps shared electives', () => {
  const programme = tpgService.getProgramme('CITYU-TPG-034');
  const mechanical = tpgService.flattenCourses(programme, '', 'CITYU-TPG-034-MECHANICAL');
  const robotics = tpgService.flattenCourses(programme, '', 'CITYU-TPG-034-ROBOTICS');
  const nuclear = tpgService.flattenCourses(programme, '', 'CITYU-TPG-034-NUCLEAR');

  assert.equal(tpgService.getStatus(programme).courseCount, 26);
  assert.equal(mechanical.length, 20);
  assert.equal(robotics.length, 20);
  assert.equal(nuclear.length, 20);
  assert.equal(mechanical.some((course) => course.code === 'MNE6110'), true);
  assert.equal(mechanical.some((course) => course.code === 'MNE6130'), false);
  assert.equal(robotics.some((course) => course.code === 'MNE6130'), true);
  assert.equal(nuclear.some((course) => course.code === 'MNE6138'), true);
  assert.equal([mechanical, robotics, nuclear].every((courses) => courses.some((course) => course.code === 'MNE6116')), true);
  assert.equal(tpgService.getProgrammeCourse(programme.id, 'MNE6008', 'CITYU-TPG-034-ROBOTICS').credits, 9);
});

test('CityU Cybersecurity keeps its 31-credit core and bounded elective groups', () => {
  const programme = tpgService.getProgramme('CITYU-TPG-025');
  const groups = Object.fromEntries(programme.courseGroups.map((group) => [group.id, group.creditsRequired || 0]));

  assert.equal(programme.creditsRequired, 31);
  assert.equal(tpgService.getStatus(programme).courseCount, 21);
  assert.deepEqual(groups, { core: 10, 'elective-group-i': 12, 'elective-group-ii': 0 });
  assert.equal(tpgService.getProgrammeCourse(programme.id, 'CS5612').credits, 1);
  assert.equal(tpgService.getProgrammeCourse(programme.id, 'CS6531').credits, 6);
  assert.equal(tpgService.getProgrammeCourse(programme.id, 'CS6532').credits, 3);
  assert.equal(tpgService.getProgrammeCourse(programme.id, 'CS5288').name, 'Cryptography: Theory and Practice');
});

test('CityU Computer Science exposes the official Stream choices without hiding cross-Stream electives', () => {
  const programme = tpgService.getProgramme('CITYU-TPG-021');
  const tracks = tpgService.listTracks(programme);
  const aiCourses = tpgService.flattenCourses(programme, '', 'CITYU-TPG-021-AI');
  const noConcentrationCourses = tpgService.flattenCourses(programme, '', 'CITYU-TPG-021-NO-CONCENTRATION');

  assert.equal(programme.creditsRequired, 30);
  assert.equal(tpgService.getStatus(programme).courseCount, 36);
  assert.deepEqual(tracks.map((track) => track.name), [
    'Artificial Intelligence',
    'Data Science',
    'Information Security',
    'No declared concentration'
  ]);
  assert.equal(aiCourses.length, 36);
  assert.equal(noConcentrationCourses.length, 36);
  assert.equal(aiCourses.some((course) => course.code === 'CS5483'), true);
  assert.equal(tpgService.getProgrammeCourse(programme.id, 'CS6520', tracks[0].id).credits, 6);
  assert.equal(tpgService.getProgrammeCourse(programme.id, 'CS6538', tracks[0].id).credits, 3);
});

test('CityU Artificial Intelligence retains Stream choices and mutually exclusive project paths', () => {
  const programme = tpgService.getProgramme('CITYU-TPG-023');
  const tracks = tpgService.listTracks(programme);
  const generativeAiCourses = tpgService.flattenCourses(programme, '', 'CITYU-TPG-023-GENERATIVE-AI');

  assert.equal(programme.creditsRequired, 31);
  assert.equal(tpgService.getStatus(programme).courseCount, 24);
  assert.deepEqual(tracks.map((track) => track.name), [
    'Autonomous Driving',
    'Generative AI',
    'Trustworthy AI',
    'No declared concentration'
  ]);
  assert.equal(generativeAiCourses.length, 24);
  assert.equal(tpgService.getProgrammeCourse(programme.id, 'CS5611', tracks[1].id).credits, 1);
  assert.equal(tpgService.getProgrammeCourse(programme.id, 'CS6524', tracks[1].id).credits, 6);
  assert.equal(tpgService.getProgrammeCourse(programme.id, 'CS6525', tracks[1].id).credits, 6);
  assert.match(programme.courseGroups.find((group) => group.id === 'elective-group-i').ruleText, /mutually exclusive/);
});

test('CityU Materials Engineering uses the current admissions pool with official catalogue codes', () => {
  const programme = tpgService.getProgramme('CITYU-TPG-030');
  const electives = programme.courseGroups.find((group) => group.id === 'electives');

  assert.equal(programme.creditsRequired, 30);
  assert.equal(tpgService.getStatus(programme).courseCount, 18);
  assert.equal(programme.courseGroups.find((group) => group.id === 'core').creditsRequired, 9);
  assert.equal(electives.creditsRequired, 21);
  assert.equal(electives.courses.length, 15);
  assert.equal(tpgService.getProgrammeCourse(programme.id, 'MSE6309').credits, 9);
  assert.equal(tpgService.getProgrammeCourse(programme.id, 'MSE6265').name, 'Quantum Theory of Semiconductors');
  assert.equal(tpgService.getProgrammeCourse(programme.id, 'MSE6307'), null);
  assert.equal(tpgService.getProgrammeCourse(programme.id, 'EE6614'), null);
});

test('CityU Physics exposes the current data-modelling and quantum-technology curriculum', () => {
  const programme = tpgService.getProgramme('CITYU-TPG-052');
  const core = programme.courseGroups.find((group) => group.id === 'core');
  const electives = programme.courseGroups.find((group) => group.id === 'electives');

  assert.equal(programme.creditsRequired, 30);
  assert.equal(tpgService.getStatus(programme).courseCount, 23);
  assert.equal(core.creditsRequired, 12);
  assert.equal(core.courses.length, 4);
  assert.equal(electives.creditsRequired, 18);
  assert.equal(electives.courses.length, 19);
  assert.equal(tpgService.getProgrammeCourse(programme.id, 'PHY5503').credits, 3);
  assert.equal(tpgService.getProgrammeCourse(programme.id, 'PHY6604').name, 'Machine Learning in Physics');
  assert.equal(tpgService.getProgrammeCourse(programme.id, 'PHY6528').credits, 9);
});

test('CityU AI for Sciences strictly filters the four focused Track pools', () => {
  const programme = tpgService.getProgramme('CITYU-TPG-024');
  const scientific = tpgService.flattenCourses(programme, '', 'CITYU-TPG-024-SCIENTIFIC-DISCOVERY');
  const medicine = tpgService.flattenCourses(programme, '', 'CITYU-TPG-024-DIGITAL-MEDICINE');
  const sustainability = tpgService.flattenCourses(programme, '', 'CITYU-TPG-024-SUSTAINABILITY');
  const applied = tpgService.flattenCourses(programme, '', 'CITYU-TPG-024-APPLIED-AI');

  assert.equal(programme.creditsRequired, 30);
  assert.equal(tpgService.getStatus(programme).courseCount, 56);
  assert.equal(tpgService.listTracks(programme).length, 4);
  assert.deepEqual([scientific.length, medicine.length, sustainability.length, applied.length], [21, 18, 24, 14]);
  assert.equal(scientific.some((course) => course.code === 'MSE5301'), true);
  assert.equal(scientific.some((course) => course.code === 'BMS5001'), false);
  assert.equal(medicine.some((course) => course.code === 'BMS5011'), true);
  assert.equal(medicine.some((course) => course.code === 'SEE5201'), false);
  assert.equal(sustainability.some((course) => course.code === 'SEE5201'), true);
  assert.equal(applied.some((course) => course.code === 'DSC6030'), true);
  assert.equal([scientific, medicine, sustainability, applied].every((courses) => courses.some((course) => course.code === 'DSC6024')), true);
  assert.equal(tpgService.getProgrammeCourse(programme.id, 'DSC6024', 'CITYU-TPG-024-APPLIED-AI').credits, 6);
});

test('CityU Financial Mathematics and Statistics preserves its 30-or-31-credit elective rule', () => {
  const programme = tpgService.getProgramme('CITYU-TPG-054');
  const core = programme.courseGroups.find((group) => group.id === 'core');
  const electives = programme.courseGroups.find((group) => group.id === 'electives');

  assert.equal(programme.creditsRequired, 30);
  assert.equal(programme.ruleReviewStatus, 'manual_review_required');
  assert.equal(tpgService.getStatus(programme).courseCount, 19);
  assert.equal(core.creditsRequired, 15);
  assert.equal(core.courses.length, 5);
  assert.equal(electives.creditsRequired, 15);
  assert.equal(electives.courses.length, 14);
  assert.match(electives.ruleText, /30 or 31 credit units/);
  assert.equal(tpgService.getProgrammeCourse(programme.id, 'MA6616').credits, 1);
  assert.equal(tpgService.getProgrammeCourse(programme.id, 'MA6617').credits, 6);
  assert.equal(tpgService.getProgrammeCourse(programme.id, 'MA6635').name, 'Mathematical Foundations of Data Science');
});

test('CityU Biomedical Engineering preserves both official taught and dissertation paths', () => {
  const programme = tpgService.getProgramme('CITYU-TPG-002');
  const electives = programme.courseGroups.find((group) => group.id === 'electives');

  assert.equal(programme.creditsRequired, 30);
  assert.equal(programme.ruleReviewStatus, 'manual_review_required');
  assert.equal(tpgService.getStatus(programme).courseCount, 28);
  assert.equal(electives.creditsRequired, 30);
  assert.equal(electives.courses.length, 28);
  assert.match(electives.ruleText, /ten taught elective courses/);
  assert.match(electives.ruleText, /not guaranteed to run/);
  assert.equal(tpgService.getProgrammeCourse(programme.id, 'BME6008').credits, 9);
  assert.equal(tpgService.getProgrammeCourse(programme.id, 'BME6146').name, 'GenAI Technologies for Biomedical and Healthcare Applications');
  assert.equal(tpgService.getProgrammeCourse(programme.id, 'SYE6110').credits, 3);
});

test('CityU Health Sciences and Biomedicine filters both official Stream pools', () => {
  const programme = tpgService.getProgramme('CITYU-TPG-003');
  const research = tpgService.flattenCourses(programme, '', 'CITYU-TPG-003-BIOMEDICINE-RESEARCH');
  const health = tpgService.flattenCourses(programme, '', 'CITYU-TPG-003-HEALTH-SCIENCES');

  assert.equal(programme.creditsRequired, 30);
  assert.equal(tpgService.listTracks(programme).length, 2);
  assert.equal(tpgService.getStatus(programme).courseCount, 30);
  assert.deepEqual([research.length, health.length], [19, 28]);
  assert.equal(research.some((course) => course.code === 'BMS5100'), true);
  assert.equal(research.some((course) => course.code === 'BMS8112'), true);
  assert.equal(research.some((course) => course.code === 'BMS5101'), false);
  assert.equal(health.some((course) => course.code === 'BMS5101'), true);
  assert.equal(health.some((course) => course.code === 'BMS8112'), false);
  assert.equal([research, health].every((courses) => courses.some((course) => course.code === 'BMS5013')), true);
  assert.equal(tpgService.getProgrammeCourse(programme.id, 'BMS5100', 'CITYU-TPG-003-BIOMEDICINE-RESEARCH').credits, 9);
  assert.equal(tpgService.getProgrammeCourse(programme.id, 'BMS5101', 'CITYU-TPG-003-HEALTH-SCIENCES').credits, 6);
});

test('CityU Neuroscience exposes the approval-pending core and research elective structure', () => {
  const programme = tpgService.getProgramme('CITYU-TPG-004');
  const core = programme.courseGroups.find((group) => group.id === 'core');
  const electives = programme.courseGroups.find((group) => group.id === 'electives');

  assert.equal(programme.creditsRequired, 30);
  assert.equal(programme.ruleReviewStatus, 'manual_review_required');
  assert.equal(tpgService.getStatus(programme).courseCount, 13);
  assert.equal(core.creditsRequired, 15);
  assert.equal(core.courses.length, 5);
  assert.match(core.ruleText, /subject to University approval/);
  assert.equal(electives.creditsRequired, 15);
  assert.equal(electives.courses.length, 8);
  assert.equal(tpgService.getProgrammeCourse(programme.id, 'NS5001').credits, 3);
  assert.equal(tpgService.getProgrammeCourse(programme.id, 'NS6001').credits, 6);
  assert.match(electives.ruleText, /laboratory availability/);
});

test('CityU Operations and Supply Chain Management uses the current three-credit internship', () => {
  const programme = tpgService.getProgramme('CITYU-TPG-009');
  const core = programme.courseGroups.find((group) => group.id === 'core');
  const electives = programme.courseGroups.find((group) => group.id === 'required-electives');

  assert.equal(programme.creditsRequired, 30);
  assert.equal(tpgService.getStatus(programme).courseCount, 15);
  assert.equal(core.creditsRequired, 12);
  assert.equal(core.coursesRequired, 4);
  assert.equal(electives.creditsRequired, 18);
  assert.equal(electives.coursesRequired, 6);
  assert.equal(electives.courses.length, 11);
  assert.equal(tpgService.getProgrammeCourse(programme.id, 'MS6324').credits, 3);
  assert.equal(tpgService.getProgrammeCourse(programme.id, 'MS5215').name, 'AI-Enhanced Business Analytics with Excel and Python');
  assert.match(electives.ruleText, /no more than 6 credit units/);
});

test('CityU Global Business Management has a fully bounded 24-plus-3-plus-3 structure', () => {
  const programme = tpgService.getProgramme('CITYU-TPG-008');
  const core = programme.courseGroups.find((group) => group.id === 'core');
  const coreElective = programme.courseGroups.find((group) => group.id === 'core-elective');
  const elective = programme.courseGroups.find((group) => group.id === 'elective');

  assert.equal(programme.creditsRequired, 30);
  assert.equal(programme.ruleReviewStatus, 'verified');
  assert.equal(tpgService.getStatus(programme).courseCount, 16);
  assert.deepEqual([core.creditsRequired, coreElective.creditsRequired, elective.creditsRequired], [24, 3, 3]);
  assert.deepEqual([core.coursesRequired, coreElective.coursesRequired, elective.coursesRequired], [8, 1, 1]);
  assert.deepEqual([core.courses.length, coreElective.courses.length, elective.courses.length], [8, 2, 6]);
  assert.equal(tpgService.getProgrammeCourse(programme.id, 'MGT6904').credits, 3);
  assert.equal(tpgService.getProgrammeCourse(programme.id, 'IS6200').name, 'Blockchain Technology and Business Applications');
});

test('CityU Finance programmes preserve the official 24-plus-6 structure without inventing electives', () => {
  const finance = tpgService.getProgramme('CITYU-TPG-007');
  const financialEngineering = tpgService.getProgramme('CITYU-TPG-014');

  [finance, financialEngineering].forEach((programme) => {
    const core = programme.courseGroups.find((group) => group.id === 'core');
    const elective = programme.courseGroups.find((group) => group.id === 'elective');
    assert.equal(programme.creditsRequired, 30);
    assert.equal(programme.academicYear, '2026-27');
    assert.equal(programme.ruleReviewStatus, 'manual_review_required');
    assert.equal(core.creditsRequired, 24);
    assert.equal(core.coursesRequired, 8);
    assert.equal(core.courses.length, 8);
    assert.equal(elective.creditsRequired, 6);
    assert.equal(elective.coursesRequired, 2);
    assert.equal(elective.courses.length, 0);
    assert.match(elective.ruleText, /does not publish a fixed elective-code pool/);
  });

  assert.equal(tpgService.getProgrammeCourse(finance.id, 'EF5070').name, 'Financial Econometrics');
  assert.equal(tpgService.getProgrammeCourse(financialEngineering.id, 'EF5250').name, 'Stochastic Calculus for Finance');
  assert.equal(tpgService.getProgrammeCourse(financialEngineering.id, 'EF5213').credits, 3);
});

test('CityU Management and Innovation preserves its cross-pool elective minimum', () => {
  const programme = tpgService.getProgramme('CITYU-TPG-017');
  const core = programme.courseGroups.find((group) => group.id === 'core');
  const programmeElectives = programme.courseGroups.find((group) => group.id === 'programme-electives');
  const collegeElectives = programme.courseGroups.find((group) => group.id === 'college-business-electives');

  assert.equal(programme.creditsRequired, 30);
  assert.equal(programme.ruleReviewStatus, 'manual_review_required');
  assert.equal(tpgService.getStatus(programme).courseCount, 32);
  assert.equal(core.creditsRequired, 12);
  assert.equal(core.courses.length, 4);
  assert.equal(programmeElectives.creditsRequired, 6);
  assert.equal(programmeElectives.courses.length, 11);
  assert.equal(collegeElectives.courses.length, 17);
  assert.match(collegeElectives.ruleText, /18 elective credit units/);
  assert.equal(tpgService.getProgrammeCourse(programme.id, 'MGT6800').name, 'Entrepreneurial Project/Internship');
  assert.equal(tpgService.getProgrammeCourse(programme.id, 'MKT5649').credits, 3);
});

test('CityU Master of Social Work keeps zero-credit workshops outside elective credits', () => {
  const programme = tpgService.getProgramme('CITYU-TPG-047');
  const core = programme.courseGroups.find((group) => group.id === 'core');
  const electives = programme.courseGroups.find((group) => group.id === 'electives');
  const nonCredit = programme.courseGroups.find((group) => group.id === 'conditional-non-credit');

  assert.equal(programme.creditsRequired, 55);
  assert.equal(tpgService.getStatus(programme).courseCount, 24);
  assert.equal(core.creditsRequired, 49);
  assert.equal(core.courses.length, 15);
  assert.equal(electives.creditsRequired, 6);
  assert.equal(electives.courses.length, 8);
  assert.equal(nonCredit.courses.length, 1);
  assert.equal(tpgService.getProgrammeCourse(programme.id, 'SS6291').credits, 8);
  assert.equal(tpgService.getProgrammeCourse(programme.id, 'SS6219').credits, 1);
  assert.equal(tpgService.getProgrammeCourse(programme.id, 'SS5115').credits, 0);
  assert.match(nonCredit.ruleText, /does not satisfy the 6-credit elective requirement/);
});

test('CityU Civil and Architectural Engineering preserves both Streams and study-mode rules', () => {
  const programme = tpgService.getProgramme('CITYU-TPG-032');
  const civil = tpgService.flattenCourses(programme, '', 'CITYU-TPG-032-CIVIL-ENGINEERING');
  const building = tpgService.flattenCourses(programme, '', 'CITYU-TPG-032-BUILDING-ENVIRONMENT-SUSTAINABILITY');
  const civilCore = programme.courseGroups.find((group) => group.id === 'civil-core');
  const buildingCore = programme.courseGroups.find((group) => group.id === 'building-core');

  assert.equal(programme.creditsRequired, 30);
  assert.equal(programme.ruleReviewStatus, 'manual_review_required');
  assert.equal(tpgService.listTracks(programme).length, 2);
  assert.equal(tpgService.getStatus(programme).courseCount, 27);
  assert.deepEqual([civil.length, building.length], [14, 15]);
  assert.match(civilCore.ruleText, /full-time students complete 15 core credit units/);
  assert.match(buildingCore.ruleText, /Part-time students complete 6 core credit units/);
  assert.equal(civil.some((course) => course.code === 'CA6535'), true);
  assert.equal(civil.some((course) => course.code === 'CA6536'), false);
  assert.equal(building.some((course) => course.code === 'CA6536'), true);
  assert.equal(building.some((course) => course.code === 'CA6535'), false);
  assert.equal([civil, building].every((courses) => courses.some((course) => course.code === 'CA5217')), true);
  assert.equal(tpgService.getProgrammeCourse(programme.id, 'CA6535', 'CITYU-TPG-032-CIVIL-ENGINEERING').credits, 9);
  assert.equal(tpgService.getProgrammeCourse(programme.id, 'CA6536', 'CITYU-TPG-032-BUILDING-ENVIRONMENT-SUSTAINABILITY').credits, 9);
});

test('CityU Electronic Commerce preserves its 15-plus-18 structure and project lengths', () => {
  const programme = tpgService.getProgramme('CITYU-TPG-020');
  const core = programme.courseGroups.find((group) => group.id === 'core');
  const electives = programme.courseGroups.find((group) => group.id === 'electives');

  assert.equal(programme.creditsRequired, 33);
  assert.equal(programme.ruleReviewStatus, 'manual_review_required');
  assert.equal(tpgService.getStatus(programme).courseCount, 36);
  assert.equal(core.creditsRequired, 15);
  assert.equal(core.coursesRequired, 5);
  assert.equal(core.courses.length, 5);
  assert.equal(electives.creditsRequired, 18);
  assert.equal(electives.courses.length, 31);
  assert.match(electives.ruleText, /selected combination requires manual audit review/);
  assert.equal(tpgService.getProgrammeCourse(programme.id, 'CS6521').credits, 6);
  assert.equal(tpgService.getProgrammeCourse(programme.id, 'CS6538').credits, 3);
  assert.equal(tpgService.getProgrammeCourse(programme.id, 'EC6001').credits, 6);
  assert.equal(tpgService.getProgrammeCourse(programme.id, 'CS6290').name, 'Privacy-enhancing Technologies');
});

test('CityU Biostatistics uses the Year of Entry 2026 core and elective split', () => {
  const programme = tpgService.getProgramme('CITYU-TPG-026');
  const core = programme.courseGroups.find((group) => group.id === 'core');
  const electives = programme.courseGroups.find((group) => group.id === 'electives');

  assert.equal(programme.creditsRequired, 30);
  assert.equal(programme.ruleReviewStatus, 'verified');
  assert.equal(tpgService.getStatus(programme).courseCount, 19);
  assert.deepEqual([core.creditsRequired, core.coursesRequired, core.courses.length], [21, 7, 7]);
  assert.deepEqual([electives.creditsRequired, electives.coursesRequired, electives.courses.length], [9, 3, 12]);
  assert.match(electives.ruleText, /Year of Entry 2026/);
  assert.equal(tpgService.getProgrammeCourse(programme.id, 'BIOS6903').name, 'Communication and Project Study');
  assert.equal(tpgService.getProgrammeCourse(programme.id, 'PH6204').name, 'Public Health Surveillance and Risk Analysis');
  assert.equal(tpgService.getProgrammeCourse(programme.id, 'BIOS6905').credits, 3);
});

test('CityU Communication and New Media filters both current Stream compulsory groups', () => {
  const programme = tpgService.getProgramme('CITYU-TPG-039');
  const analytics = tpgService.flattenCourses(programme, '', 'CITYU-TPG-039-MEDIA-DATA-ANALYTICS');
  const digital = tpgService.flattenCourses(programme, '', 'CITYU-TPG-039-DIGITAL-MEDIA');
  const shared = programme.courseGroups.find((group) => group.id === 'shared-stream-electives');

  assert.equal(programme.creditsRequired, 30);
  assert.equal(programme.ruleReviewStatus, 'verified');
  assert.equal(tpgService.listTracks(programme).length, 2);
  assert.equal(tpgService.getStatus(programme).courseCount, 33);
  assert.deepEqual([analytics.length, digital.length], [30, 30]);
  assert.deepEqual([shared.creditsRequired, shared.coursesRequired, shared.courses.length], [9, 3, 23]);
  assert.equal(analytics.some((course) => course.code === 'COM5508'), true);
  assert.equal(analytics.some((course) => course.code === 'COM5108'), false);
  assert.equal(digital.some((course) => course.code === 'COM5108'), true);
  assert.equal(digital.some((course) => course.code === 'COM5508'), false);
  assert.equal([analytics, digital].every((courses) => courses.some((course) => course.code === 'COM6601')), true);
  assert.equal([analytics, digital].every((courses) => courses.some((course) => course.code === 'COM5603')), true);
});

test('CityU Integrated Marketing Communication keeps its bounded 21-plus-9 structure', () => {
  const programme = tpgService.getProgramme('CITYU-TPG-045');
  const core = programme.courseGroups.find((group) => group.id === 'core');
  const electives = programme.courseGroups.find((group) => group.id === 'electives');

  assert.equal(programme.creditsRequired, 30);
  assert.equal(programme.ruleReviewStatus, 'verified');
  assert.equal(tpgService.getStatus(programme).courseCount, 32);
  assert.deepEqual([core.creditsRequired, core.coursesRequired, core.courses.length], [21, 7, 7]);
  assert.deepEqual([electives.creditsRequired, electives.coursesRequired, electives.courses.length], [9, 3, 25]);
  assert.equal(tpgService.getProgrammeCourse(programme.id, 'COM6601').name, 'Capstone Project');
  assert.equal(tpgService.getProgrammeCourse(programme.id, 'COM5603').name, 'Dissertation');
  assert.equal(tpgService.getProgrammeCourse(programme.id, 'COM5604').credits, 3);
  assert.equal(tpgService.getProgrammeCourse(programme.id, 'COM5513').name, 'AI Communication Ethics and Governance');
});

test('CityU English Studies preserves all three study paths and the research alternative', () => {
  const programme = tpgService.getProgramme('CITYU-TPG-046');
  const core = programme.courseGroups.find((group) => group.id === 'core');
  const electives = programme.courseGroups.find((group) => group.id === 'electives');

  assert.equal(programme.creditsRequired, 30);
  assert.equal(programme.ruleReviewStatus, 'manual_review_required');
  assert.equal(tpgService.listTracks(programme).length, 3);
  assert.equal(tpgService.getStatus(programme).courseCount, 31);
  assert.deepEqual([core.creditsRequired, core.coursesRequired, core.courses.length], [12, 3, 4]);
  assert.deepEqual([electives.creditsRequired, electives.coursesRequired, electives.courses.length], [18, 6, 27]);
  assert.match(core.ruleText, /mutually exclusive/);
  assert.match(electives.ruleText, /TESL Stream students must include EN5465 and EN6495/);
  assert.match(electives.ruleText, /Literature, Language and Culture Stream students must include EN6508 and EN6509/);
  assert.equal(tpgService.getProgrammeCourse(programme.id, 'EN6941').credits, 6);
  assert.equal(tpgService.getProgrammeCourse(programme.id, 'EN6943').name, 'Capstone Project');
});

test('CityU International Studies preserves its conditional Thesis and Capstone paths', () => {
  const programme = tpgService.getProgramme('CITYU-TPG-044');
  const core = programme.courseGroups.find((group) => group.id === 'core');
  const electives = programme.courseGroups.find((group) => group.id === 'electives');

  assert.equal(programme.creditsRequired, 24);
  assert.equal(programme.ruleReviewStatus, 'manual_review_required');
  assert.equal(tpgService.getStatus(programme).courseCount, 25);
  assert.deepEqual([core.creditsRequired, core.coursesRequired, core.courses.length], [15, 5, 6]);
  assert.deepEqual([electives.creditsRequired, electives.coursesRequired, electives.courses.length], [9, 3, 19]);
  assert.match(core.ruleText, /either the 3-credit PIA6015 Master’s Thesis or the 3-credit PIA6018 MAIS Capstone Project/);
  assert.match(core.ruleText, /grade A or A\+/);
  assert.equal(tpgService.getProgrammeCourse(programme.id, 'PIA6015').credits, 3);
  assert.equal(tpgService.getProgrammeCourse(programme.id, 'PIA6018').name, 'MAIS Capstone Project');
  assert.equal(tpgService.getProgrammeCourse(programme.id, 'PIA5026').name, 'Research Design for the Social Sciences');
});

test('CityU Sustainability and Development Studies filters its Stream research paths', () => {
  const programme = tpgService.getProgramme('CITYU-TPG-043');
  const development = tpgService.flattenCourses(programme, '', 'CITYU-TPG-043-DEVELOPMENT-CHALLENGES');
  const sustainability = tpgService.flattenCourses(programme, '', 'CITYU-TPG-043-SUSTAINABILITY-STRATEGIES-POLICIES');
  const streamPool = programme.courseGroups.find((group) => group.id === 'stream-core-pool');

  assert.equal(programme.creditsRequired, 30);
  assert.equal(programme.ruleReviewStatus, 'manual_review_required');
  assert.equal(tpgService.listTracks(programme).length, 2);
  assert.equal(tpgService.getStatus(programme).courseCount, 29);
  assert.deepEqual([development.length, sustainability.length], [28, 27]);
  assert.deepEqual([streamPool.creditsRequired, streamPool.coursesRequired, streamPool.courses.length], [15, 5, 12]);
  assert.equal(development.some((course) => course.code === 'PIA6019'), true);
  assert.equal(development.some((course) => course.code === 'PIA6021'), true);
  assert.equal(development.some((course) => course.code === 'PIA6020'), false);
  assert.equal(sustainability.some((course) => course.code === 'PIA6020'), true);
  assert.equal(sustainability.some((course) => course.code === 'PIA6021'), false);
  assert.equal(tpgService.getProgrammeCourse(programme.id, 'PIA5058').credits, 2);
  assert.match(programme.courseGroups.find((group) => group.id === 'exceptional-substitute').ruleText, /does not add an extra graduation requirement/);
});

test('CityU Housing and Urban Management keeps cross-Stream core and elective roles unique', () => {
  const programme = tpgService.getProgramme('CITYU-TPG-050');
  const housing = tpgService.flattenCourses(programme, '', 'CITYU-TPG-050-HOUSING');
  const urban = tpgService.flattenCourses(programme, '', 'CITYU-TPG-050-URBAN-MANAGEMENT');
  const crossRole = programme.courseGroups.find((group) => group.id === 'cross-stream-role-courses');

  assert.equal(programme.creditsRequired, 30);
  assert.equal(programme.ruleReviewStatus, 'manual_review_required');
  assert.equal(tpgService.listTracks(programme).length, 2);
  assert.equal(tpgService.getStatus(programme).courseCount, 32);
  assert.deepEqual([housing.length, urban.length], [26, 22]);
  assert.equal(crossRole.courses.length, 2);
  assert.equal([housing, urban].every((courses) => courses.some((course) => course.code === 'LW5957')), true);
  assert.equal([housing, urban].every((courses) => courses.some((course) => course.code === 'PIA5504')), true);
  assert.equal(housing.some((course) => course.code === 'COM5101'), true);
  assert.equal(urban.some((course) => course.code === 'COM5101'), false);
  assert.equal(urban.some((course) => course.code === 'SDSC6004'), true);
  assert.equal(housing.some((course) => course.code === 'SDSC6004'), false);
  assert.equal(tpgService.getProgrammeCourse(programme.id, 'PIA6803').credits, 2);
  assert.equal(tpgService.getProgrammeCourse(programme.id, 'PIA6804').credits, 4);
});

test('CityU Patent Law Certificate resolves both 12-credit Track structures', () => {
  const programme = tpgService.getProgramme('CITYU-TPG-062');
  const trackA = tpgService.flattenCourses(programme, '', 'CITYU-TPG-062-TRACK-A');
  const trackB = tpgService.flattenCourses(programme, '', 'CITYU-TPG-062-TRACK-B');
  const status = tpgService.getStatus(programme);

  assert.equal(programme.creditsRequired, 12);
  assert.equal(programme.ruleReviewStatus, 'verified');
  assert.equal(tpgService.listTracks(programme).length, 2);
  assert.equal(status.courseCount, 10);
  assert.deepEqual([trackA.length, trackB.length], [7, 8]);

  assert.equal(trackA.some((course) => course.code === 'LW6196E'), true);
  assert.equal(trackA.some((course) => course.code === 'LW6210E'), false);
  assert.equal(trackA.some((course) => course.code === 'LW6102E'), false);
  assert.equal(trackB.some((course) => course.code === 'LW6196E'), false);
  assert.equal(trackB.some((course) => course.code === 'LW6210E'), true);
  assert.equal(trackB.some((course) => course.code === 'LW6102E'), true);

  for (const courses of [trackA, trackB]) {
    assert.equal(courses.some((course) => course.code === 'LW6208E'), true);
    assert.equal(courses.some((course) => course.code === 'LW6209E'), true);
    assert.equal(courses.some((course) => course.code === 'LW6113E'), true);
  }
  assert.equal(trackA.find((course) => course.code === 'LW6208E').credits, 1.5);
  assert.equal(trackB.find((course) => course.code === 'LW6102E').credits, 3);
});

test('CityU Language Studies preserves four Stream pools and cross-Stream course roles', () => {
  const programme = tpgService.getProgramme('CITYU-TPG-041');
  const trackIds = [
    'CITYU-TPG-041-GENERAL-LINGUISTICS',
    'CITYU-TPG-041-CORPUS-EMPIRICAL-LINGUISTICS',
    'CITYU-TPG-041-PEDAGOGICAL-LINGUISTICS',
    'CITYU-TPG-041-TRANSLATION-INTERPRETATION'
  ];
  const pools = trackIds.map((trackId) => tpgService.flattenCourses(programme, '', trackId));

  assert.equal(programme.creditsRequired, 30);
  assert.equal(programme.ruleReviewStatus, 'manual_review_required');
  assert.equal(tpgService.listTracks(programme).length, 4);
  assert.equal(tpgService.getStatus(programme).courseCount, 54);
  assert.deepEqual(pools.map((courses) => courses.length), [30, 27, 28, 24]);
  assert.equal(new Set(programme.courseGroups.flatMap((group) => group.courses.map((course) => course.code))).size, 54);

  assert.equal(pools[0].some((course) => course.code === 'LT5401'), true);
  assert.equal(pools[1].some((course) => course.code === 'LT5422'), true);
  assert.equal(pools[2].some((course) => course.code === 'LT5412'), true);
  assert.equal(pools[3].some((course) => course.code === 'LT5603'), true);
  assert.equal(pools[0].some((course) => course.code === 'LT5603'), false);
  assert.equal(pools[3].some((course) => course.code === 'LT5412'), false);
  assert.equal(pools.every((courses) => courses.some((course) => course.code === 'LT5413')), true);
  assert.equal(pools.every((courses) => courses.some((course) => course.code === 'LT6580')), true);
  assert.equal(pools[0].find((course) => course.code === 'LT6580').credits, 6);
  assert.equal(pools[0].find((course) => course.code === 'LT6582').credits, 3);
  assert.match(programme.courseGroups.find((group) => group.id === 'free-elective-requirement').ruleText, /Master's Project path/);
});

test('CityU Arbitration and Dispute Resolution resolves exempt and non-exempt Award Paths', () => {
  const programme = tpgService.getProgramme('CITYU-TPG-058');
  const exempt = tpgService.flattenCourses(programme, '', 'CITYU-TPG-058-EXEMPT');
  const nonExempt = tpgService.flattenCourses(programme, '', 'CITYU-TPG-058-NON-EXEMPT');

  assert.equal(programme.ruleReviewStatus, 'manual_review_required');
  assert.equal(tpgService.getCreditsRequired(programme, 'CITYU-TPG-058-EXEMPT'), 30);
  assert.equal(tpgService.getCreditsRequired(programme, 'CITYU-TPG-058-NON-EXEMPT'), 33);
  assert.equal(tpgService.getStatus(programme).courseCount, 14);
  assert.deepEqual([exempt.length, nonExempt.length], [12, 14]);
  assert.equal(exempt.some((course) => course.code === 'LW5303'), false);
  assert.equal(nonExempt.some((course) => course.code === 'LW5303'), true);
  assert.equal(nonExempt.some((course) => course.code === 'LW5400'), true);
  assert.equal(exempt.find((course) => course.code === 'LW6409A').credits, 6);
  assert.equal(exempt.find((course) => course.code === 'LW6409B').credits, 6);
  assert.match(programme.courseGroups.find((group) => group.id === 'masters-research-choice').ruleText, /mutually exclusive/);
});

test('CityU Applied Social Sciences filters three Streams without duplicating cross-role courses', () => {
  const programme = tpgService.getProgramme('CITYU-TPG-049');
  const sociology = tpgService.flattenCourses(programme, '', 'CITYU-TPG-049-SOCIOLOGY');
  const criminology = tpgService.flattenCourses(programme, '', 'CITYU-TPG-049-CRIMINOLOGY');
  const mentalHealth = tpgService.flattenCourses(programme, '', 'CITYU-TPG-049-CLINICAL-MENTAL-HEALTH');

  assert.equal(programme.creditsRequired, 30);
  assert.equal(programme.ruleReviewStatus, 'manual_review_required');
  assert.equal(tpgService.listTracks(programme).length, 3);
  assert.equal(tpgService.getStatus(programme).courseCount, 28);
  assert.deepEqual([sociology.length, criminology.length, mentalHealth.length], [13, 13, 12]);
  assert.equal(new Set(programme.courseGroups.flatMap((group) => group.courses.map((course) => course.code))).size, 28);
  assert.equal(sociology.some((course) => course.code === 'SS6591'), true);
  assert.equal(criminology.some((course) => course.code === 'SS6308'), true);
  assert.equal(mentalHealth.some((course) => course.code === 'SS6404'), true);
  assert.equal(sociology.some((course) => course.code === 'SS6308'), false);
  assert.equal(mentalHealth.some((course) => course.code === 'SS5302'), false);
  assert.equal(sociology.find((course) => course.code === 'SS6591').credits, 6);
  assert.equal(criminology.find((course) => course.code === 'SS6308').credits, 6);
});

test('CityU Counselling separates full-time Project and part-time Project or Practicum paths', () => {
  const programme = tpgService.getProgramme('CITYU-TPG-038');
  const fullTime = tpgService.flattenCourses(programme, '', 'CITYU-TPG-038-FULL-TIME-PROJECT');
  const partTimeProject = tpgService.flattenCourses(programme, '', 'CITYU-TPG-038-PART-TIME-PROJECT');
  const practicum = tpgService.flattenCourses(programme, '', 'CITYU-TPG-038-PART-TIME-PRACTICUM');

  assert.equal(programme.creditsRequired, 30);
  assert.equal(programme.ruleReviewStatus, 'manual_review_required');
  assert.equal(tpgService.listTracks(programme).length, 3);
  assert.equal(tpgService.getStatus(programme).courseCount, 21);
  assert.deepEqual([fullTime.length, partTimeProject.length, practicum.length], [19, 19, 19]);
  assert.equal(fullTime.some((course) => course.code === 'SS6805B'), true);
  assert.equal(fullTime.some((course) => course.code === 'SS6805'), false);
  assert.equal(partTimeProject.some((course) => course.code === 'SS6805'), true);
  assert.equal(practicum.some((course) => course.code === 'SS6806'), true);
  assert.equal(practicum.some((course) => course.code === 'SS6805B'), false);
  assert.equal(fullTime.find((course) => course.code === 'SS6805B').credits, 6);
  assert.equal(practicum.find((course) => course.code === 'SS6806').credits, 6);
});

test('CityU Business and Data Analytics filters the official IAM and QAB Stream pools', () => {
  const programme = tpgService.getProgramme('CITYU-TPG-018');
  const iam = tpgService.flattenCourses(programme, '', 'CITYU-TPG-018-IAM');
  const qab = tpgService.flattenCourses(programme, '', 'CITYU-TPG-018-QAB');
  const iamElectives = programme.courseGroups.find((group) => group.id === 'iam-stream-electives');
  const qabElectives = programme.courseGroups.find((group) => group.id === 'qab-stream-electives');

  assert.equal(programme.creditsRequired, 30);
  assert.equal(programme.ruleReviewStatus, 'manual_review_required');
  assert.equal(tpgService.listTracks(programme).length, 2);
  assert.equal(tpgService.getStatus(programme).courseCount, 31);
  assert.deepEqual([iam.length, qab.length], [20, 15]);
  assert.equal(new Set(programme.courseGroups.flatMap((group) => group.courses.map((course) => course.code))).size, 31);
  assert.equal(iam.some((course) => course.code === 'IS6941'), true);
  assert.equal(iam.some((course) => course.code === 'MS5218'), false);
  assert.equal(qab.some((course) => course.code === 'MS5218'), true);
  assert.equal(qab.some((course) => course.code === 'IS6941'), false);
  assert.equal(iam.find((course) => course.code === 'IS6912').credits, 6);
  assert.equal(iam.find((course) => course.code === 'IS6914').credits, 3);
  assert.match(iamElectives.ruleText, /At least 9 credit units/);
  assert.match(iamElectives.ruleText, /not compulsory Projects/);
  assert.match(qabElectives.ruleText, /At least 12 credit units/);
});

test('CityU MA Creative Media filters three Stream cores and shares the complete elective pool', () => {
  const programme = tpgService.getProgramme('CITYU-TPG-056');
  const technofutures = tpgService.flattenCourses(programme, '', 'CITYU-TPG-056-TECHNOFUTURES');
  const influencer = tpgService.flattenCourses(programme, '', 'CITYU-TPG-056-INFLUENCER-STUDIES');
  const curation = tpgService.flattenCourses(programme, '', 'CITYU-TPG-056-EXPANDED-CURATION');
  const electives = programme.courseGroups.find((group) => group.id === 'electives');

  assert.equal(programme.creditsRequired, 30);
  assert.equal(programme.ruleReviewStatus, 'verified');
  assert.equal(tpgService.listTracks(programme).length, 3);
  assert.equal(tpgService.getStatus(programme).courseCount, 51);
  assert.deepEqual([technofutures.length, influencer.length, curation.length], [43, 43, 43]);
  assert.equal(new Set(programme.courseGroups.flatMap((group) => group.courses.map((course) => course.code))).size, 51);
  assert.equal(technofutures.some((course) => course.code === 'SM5303'), true);
  assert.equal(technofutures.some((course) => course.code === 'SM5351'), false);
  assert.equal(influencer.some((course) => course.code === 'SM5351'), true);
  assert.equal(curation.some((course) => course.code === 'SM5348'), true);
  assert.equal([technofutures, influencer, curation].every((courses) => courses.some((course) => course.code === 'SM6317')), true);
  assert.equal(electives.courses.find((course) => course.code === 'SM6317').credits, 6);
  assert.equal(electives.creditsRequired, 18);
});

test('CityU Electrical and Electronic Engineering preserves three Award Paths and cross-pool rules', () => {
  const programme = tpgService.getProgramme('CITYU-TPG-028');
  const mseee = tpgService.flattenCourses(programme, '', 'CITYU-TPG-028-MSEEE');
  const industrialResearch = tpgService.flattenCourses(programme, '', 'CITYU-TPG-028-INDUSTRIAL-RESEARCH');
  const businessManagement = tpgService.flattenCourses(programme, '', 'CITYU-TPG-028-BUSINESS-MANAGEMENT');
  const core = programme.courseGroups.find((group) => group.id === 'core-courses');
  const technical = programme.courseGroups.find((group) => group.id === 'technical-electives');
  const business = programme.courseGroups.find((group) => group.id === 'business-management-electives');

  assert.equal(programme.ruleReviewStatus, 'manual_review_required');
  assert.equal(tpgService.getCreditsRequired(programme, 'CITYU-TPG-028-MSEEE'), 30);
  assert.equal(tpgService.getCreditsRequired(programme, 'CITYU-TPG-028-INDUSTRIAL-RESEARCH'), 45);
  assert.equal(tpgService.getCreditsRequired(programme, 'CITYU-TPG-028-BUSINESS-MANAGEMENT'), 45);
  assert.equal(tpgService.listTracks(programme).length, 3);
  assert.equal(tpgService.getStatus(programme).courseCount, 44);
  assert.deepEqual([mseee.length, industrialResearch.length, businessManagement.length], [43, 41, 43]);
  assert.equal(new Set(programme.courseGroups.flatMap((group) => group.courses.map((course) => course.code))).size, 44);
  assert.equal(industrialResearch.some((course) => course.code === 'EE6691'), true);
  assert.equal(mseee.some((course) => course.code === 'EE6691'), false);
  assert.equal(industrialResearch.some((course) => course.code === 'EE6680'), false);
  assert.equal(mseee.find((course) => course.code === 'EE6680').credits, 9);
  assert.equal(industrialResearch.find((course) => course.code === 'EE6691').credits, 15);
  assert.equal(core.creditsRequired, 9);
  assert.equal(technical.creditsRequired, null);
  assert.match(core.ruleText, /Core and Technical Elective courses.*24 credit units/);
  assert.match(business.ruleText, /at least 15 and no more than 18/);
});

test('CityU Computer and Information Engineering preserves EE minimums across three Award Paths', () => {
  const programme = tpgService.getProgramme('CITYU-TPG-031');
  const mscie = tpgService.flattenCourses(programme, '', 'CITYU-TPG-031-MSCIE');
  const industrialResearch = tpgService.flattenCourses(programme, '', 'CITYU-TPG-031-INDUSTRIAL-RESEARCH');
  const businessManagement = tpgService.flattenCourses(programme, '', 'CITYU-TPG-031-BUSINESS-MANAGEMENT');
  const core = programme.courseGroups.find((group) => group.id === 'core-courses');
  const technical = programme.courseGroups.find((group) => group.id === 'technical-electives');

  assert.equal(programme.ruleReviewStatus, 'manual_review_required');
  assert.equal(tpgService.getCreditsRequired(programme, 'CITYU-TPG-031-MSCIE'), 30);
  assert.equal(tpgService.getCreditsRequired(programme, 'CITYU-TPG-031-INDUSTRIAL-RESEARCH'), 45);
  assert.equal(tpgService.getCreditsRequired(programme, 'CITYU-TPG-031-BUSINESS-MANAGEMENT'), 45);
  assert.equal(tpgService.listTracks(programme).length, 3);
  assert.equal(tpgService.getStatus(programme).courseCount, 54);
  assert.deepEqual([mscie.length, industrialResearch.length, businessManagement.length], [53, 51, 53]);
  assert.equal(new Set(programme.courseGroups.flatMap((group) => group.courses.map((course) => course.code))).size, 54);
  assert.equal(industrialResearch.some((course) => course.code === 'EE6691'), true);
  assert.equal(mscie.some((course) => course.code === 'EE6691'), false);
  assert.equal(industrialResearch.some((course) => course.code === 'EE6680D'), false);
  assert.equal(mscie.find((course) => course.code === 'EE6680D').credits, 9);
  assert.equal(industrialResearch.find((course) => course.code === 'EE6691').credits, 15);
  assert.equal(core.creditsRequired, 9);
  assert.equal(technical.creditsRequired, null);
  assert.match(core.ruleText, /at least 18 credit units of EE courses/);
  assert.match(technical.ruleText, /EE6691 is excluded/);
});

test('CityU MFA Creative Media separates three Thesis Studio paths and shares electives', () => {
  const programme = tpgService.getProgramme('CITYU-TPG-055');
  const main = tpgService.flattenCourses(programme, '', 'CITYU-TPG-055-MAIN');
  const games = tpgService.flattenCourses(programme, '', 'CITYU-TPG-055-GAMES');
  const hci = tpgService.flattenCourses(programme, '', 'CITYU-TPG-055-HCI');
  const electives = programme.courseGroups.find((group) => group.id === 'electives');

  assert.equal(programme.creditsRequired, 54);
  assert.equal(programme.ruleReviewStatus, 'verified');
  assert.equal(tpgService.listTracks(programme).length, 3);
  assert.equal(tpgService.getStatus(programme).courseCount, 61);
  assert.deepEqual([main.length, games.length, hci.length], [50, 50, 50]);
  assert.equal(new Set(programme.courseGroups.flatMap((group) => group.courses.map((course) => course.code))).size, 61);
  assert.equal(main.some((course) => course.code === 'SM6300'), true);
  assert.equal(main.some((course) => course.code === 'SM6300A'), false);
  assert.equal(games.some((course) => course.code === 'SM6300A'), true);
  assert.equal(hci.some((course) => course.code === 'SM6300B'), true);
  assert.equal(main.some((course) => course.code === 'SM5345'), true);
  assert.equal(hci.some((course) => course.code === 'SM5345'), true);
  assert.equal(games.some((course) => course.code === 'SM5345'), false);
  assert.equal(main.find((course) => course.code === 'SM6302').credits, 6);
  assert.equal(electives.courses.find((course) => course.code === 'SM6317').credits, 6);
  assert.equal(electives.courses.find((course) => course.code === 'SM6342').credits, 6);
  assert.equal(electives.creditsRequired, 30);
});

test('CityU International Accounting uses the current 24-plus-6 structure', () => {
  const programme = tpgService.getProgramme('CITYU-TPG-006');
  const core = programme.courseGroups.find((group) => group.id === 'core-courses');
  const electives = programme.courseGroups.find((group) => group.id === 'electives');
  const courses = tpgService.flattenCourses(programme);

  assert.equal(programme.creditsRequired, 30);
  assert.equal(programme.ruleReviewStatus, 'manual_review_required');
  assert.equal(tpgService.listTracks(programme).length, 0);
  assert.equal(tpgService.getStatus(programme).courseCount, 15);
  assert.equal(courses.length, 15);
  assert.equal(new Set(courses.map((course) => course.code)).size, 15);
  assert.equal(core.creditsRequired, 24);
  assert.equal(core.coursesRequired, 8);
  assert.equal(electives.creditsRequired, 6);
  assert.equal(electives.coursesRequired, 2);
  assert.equal(core.courses.some((course) => course.code === 'AC6531'), true);
  assert.equal(core.courses.find((course) => course.code === 'EF5143').credits, 3);
  assert.equal(electives.courses.some((course) => course.code === 'AC6693'), true);
  assert.match(electives.ruleText, /broader College pool.*manually/);
});

test('CityU Marketing keeps the 18-plus-12 rule and external elective caveat', () => {
  const programme = tpgService.getProgramme('CITYU-TPG-016');
  const core = programme.courseGroups.find((group) => group.id === 'core-courses');
  const electives = programme.courseGroups.find((group) => group.id === 'programme-electives');
  const courses = tpgService.flattenCourses(programme);

  assert.equal(programme.creditsRequired, 30);
  assert.equal(programme.ruleReviewStatus, 'manual_review_required');
  assert.equal(tpgService.listTracks(programme).length, 0);
  assert.equal(tpgService.getStatus(programme).courseCount, 18);
  assert.equal(courses.length, 18);
  assert.equal(new Set(courses.map((course) => course.code)).size, 18);
  assert.equal(core.creditsRequired, 18);
  assert.equal(core.coursesRequired, 6);
  assert.equal(electives.creditsRequired, 12);
  assert.equal(electives.coursesRequired, 4);
  assert.equal(core.courses.find((course) => course.code === 'MKT5616').name, 'Marketing Innovation and Practicum');
  assert.equal(electives.courses.find((course) => course.code === 'MKT5648').name, 'Social Media Marketing');
  assert.match(electives.ruleText, /up to 3 credit units.*broader pool.*manually/);
});

test('CityU Professional Accounting and Corporate Governance filters both official Streams', () => {
  const programme = tpgService.getProgramme('CITYU-TPG-010');
  const core = programme.courseGroups.find((group) => group.id === 'programme-core');
  const streamPool = programme.courseGroups.find((group) => group.id === 'stream-course-pools');
  const pa = tpgService.flattenCourses(programme, '', 'CITYU-TPG-010-PA');
  const cg = tpgService.flattenCourses(programme, '', 'CITYU-TPG-010-CG');
  const allCodes = programme.courseGroups.flatMap((group) => group.courses.map((course) => course.code));

  assert.equal(programme.creditsRequired, 30);
  assert.equal(programme.ruleReviewStatus, 'manual_review_required');
  assert.equal(tpgService.listTracks(programme).length, 2);
  assert.equal(tpgService.getStatus(programme).courseCount, 19);
  assert.equal(new Set(allCodes).size, 19);
  assert.equal(core.creditsRequired, 12);
  assert.equal(streamPool.creditsRequired, 18);
  assert.equal(streamPool.coursesRequired, 6);
  assert.equal(pa.length, 17);
  assert.equal(cg.length, 15);
  assert.equal(pa.some((course) => course.code === 'AC5511'), true);
  assert.equal(cg.some((course) => course.code === 'AC5511'), false);
  assert.equal(cg.some((course) => course.code === 'AC5603'), true);
  assert.equal(pa.some((course) => course.code === 'AC5603'), false);
  assert.equal(pa.some((course) => course.code === 'AC5890'), true);
  assert.equal(cg.some((course) => course.code === 'AC5890'), true);
  assert.match(streamPool.ruleText, /mixed core\/elective roles require manual audit review/i);
});

test('CityU Construction Management preserves Stream and study-mode Dissertation branches', () => {
  const programme = tpgService.getProgramme('CITYU-TPG-027');
  const taught = programme.courseGroups.find((group) => group.id === 'stream-taught-course-pools');
  const dissertations = programme.courseGroups.find((group) => group.id === 'stream-dissertations');
  const cpm = tpgService.flattenCourses(programme, '', 'CITYU-TPG-027-CPM');
  const dcm = tpgService.flattenCourses(programme, '', 'CITYU-TPG-027-DCM');
  const allCodes = programme.courseGroups.flatMap((group) => group.courses.map((course) => course.code));

  assert.equal(programme.creditsRequired, 30);
  assert.equal(programme.ruleReviewStatus, 'manual_review_required');
  assert.equal(tpgService.listTracks(programme).length, 2);
  assert.equal(tpgService.getStatus(programme).courseCount, 23);
  assert.equal(new Set(allCodes).size, 23);
  assert.equal(cpm.length, 14);
  assert.equal(dcm.length, 14);
  assert.equal(cpm.some((course) => course.code === 'CA6537'), true);
  assert.equal(cpm.some((course) => course.code === 'CA6538'), false);
  assert.equal(dcm.some((course) => course.code === 'CA6538'), true);
  assert.equal(dcm.some((course) => course.code === 'CA6537'), false);
  assert.equal(dissertations.courses.find((course) => course.code === 'CA6537').credits, 9);
  assert.equal(dissertations.courses.find((course) => course.code === 'CA6538').credits, 9);
  assert.equal(taught.courses.find((course) => course.code === 'CA5603').credits, 3);
  assert.match(taught.ruleText, /part-time student.*not taking the Dissertation.*CA5603/i);
});

test('CityU Urban Design and Regional Planning preserves the equivalent Studio choice', () => {
  const programme = tpgService.getProgramme('CITYU-TPG-033');
  const fixedCore = programme.courseGroups.find((group) => group.id === 'fixed-core-courses');
  const studio = programme.courseGroups.find((group) => group.id === 'urban-design-studio-choice');
  const electives = programme.courseGroups.find((group) => group.id === 'electives');
  const courses = tpgService.flattenCourses(programme);

  assert.equal(programme.creditsRequired, 60);
  assert.equal(programme.ruleReviewStatus, 'manual_review_required');
  assert.equal(tpgService.listTracks(programme).length, 0);
  assert.equal(tpgService.getStatus(programme).courseCount, 36);
  assert.equal(courses.length, 36);
  assert.equal(new Set(courses.map((course) => course.code)).size, 36);
  assert.equal(fixedCore.creditsRequired, 24);
  assert.equal(fixedCore.coursesRequired, 7);
  assert.equal(studio.creditsRequired, 9);
  assert.equal(studio.coursesRequired, 1);
  assert.equal(studio.courses.length, 4);
  assert.equal(studio.courses.every((course) => course.credits === 9), true);
  assert.equal(electives.creditsRequired, 27);
  assert.equal(electives.coursesRequired, null);
  assert.equal(electives.courses.find((course) => course.code === 'CA6138').credits, 6);
  assert.equal(electives.courses.find((course) => course.code === 'CA6533').credits, 9);
  assert.match(electives.ruleText, /no fixed course count.*wider pool.*manual review/i);
});

test('CityU Master of Architecture preserves multi-credit Studios and Thesis courses', () => {
  const programme = tpgService.getProgramme('CITYU-TPG-035');
  const studios = programme.courseGroups.find((group) => group.id === 'themed-studios');
  const otherCore = programme.courseGroups.find((group) => group.id === 'other-core-courses');
  const electives = programme.courseGroups.find((group) => group.id === 'electives');
  const courses = tpgService.flattenCourses(programme);

  assert.equal(programme.creditsRequired, 55);
  assert.equal(programme.ruleReviewStatus, 'manual_review_required');
  assert.equal(tpgService.getStatus(programme).courseCount, 20);
  assert.equal(new Set(courses.map((course) => course.code)).size, 20);
  assert.equal(studios.creditsRequired, 12);
  assert.equal(studios.coursesRequired, 2);
  assert.equal(studios.courses.every((course) => course.credits === 6), true);
  assert.equal(otherCore.creditsRequired, 34);
  assert.equal(otherCore.coursesRequired, 9);
  assert.equal(otherCore.courses.find((course) => course.code === 'CA6164').credits, 6);
  assert.equal(otherCore.courses.find((course) => course.code === 'CA6200').credits, 1);
  assert.equal(otherCore.courses.find((course) => course.code === 'CA6304').credits, 9);
  assert.equal(electives.creditsRequired, 9);
  assert.equal(electives.coursesRequired, 3);
  assert.match(electives.ruleText, /wider approved pool requires manual review/i);
});

test('CityU Public Policy and Management filters four official Streams and research paths', () => {
  const programme = tpgService.getProgramme('CITYU-TPG-040');
  const pmPool = programme.courseGroups.find((group) => group.id === 'public-management-stream-pool');
  const smartPool = programme.courseGroups.find((group) => group.id === 'smart-cities-stream-pool');
  const research = programme.courseGroups.find((group) => group.id === 'research-elective');
  const pp = tpgService.flattenCourses(programme, '', 'CITYU-TPG-040-PP');
  const pm = tpgService.flattenCourses(programme, '', 'CITYU-TPG-040-PM');
  const smart = tpgService.flattenCourses(programme, '', 'CITYU-TPG-040-SC');
  const gc = tpgService.flattenCourses(programme, '', 'CITYU-TPG-040-GC');
  const allCodes = programme.courseGroups.flatMap((group) => group.courses.map((course) => course.code));

  assert.equal(programme.creditsRequired, 36);
  assert.equal(programme.ruleReviewStatus, 'manual_review_required');
  assert.equal(tpgService.listTracks(programme).length, 4);
  assert.equal(tpgService.getStatus(programme).courseCount, 32);
  assert.equal(new Set(allCodes).size, 32);
  assert.deepEqual([pp.length, pm.length, smart.length, gc.length], [16, 17, 19, 16]);
  assert.equal(pmPool.creditsRequired, 12);
  assert.equal(pmPool.coursesRequired, 4);
  assert.equal(pmPool.courses.some((course) => course.code === 'PIA6306'), true);
  assert.equal(smartPool.courses.some((course) => course.code === 'PIA6501'), true);
  assert.equal(research.creditsRequired, 3);
  assert.equal(research.coursesRequired, 1);
  assert.equal(research.courses.find((course) => course.code === 'PIA6604').credits, 3);
  assert.equal(research.courses.find((course) => course.code === 'PIA6903').credits, 3);
  assert.match(pmPool.ruleText, /which four.*manual confirmation/i);
  assert.match(smartPool.ruleText, /which four.*manual confirmation/i);
});

test('CityU source blockers remain explicit instead of publishing incomplete structures', () => {
  const economics = tpgService.getProgramme('CITYU-TPG-013');
  const chineseHistory = tpgService.getProgramme('CITYU-TPG-042');

  assert.equal(economics.courseVerificationStatus, 'blocked');
  assert.equal(tpgService.hasCourseGroups(economics), false);
  assert.match(economics.courseStatusNote, /30-credit.*only.*24|missing 6-credit/i);
  assert.equal(chineseHistory.courseVerificationStatus, 'blocked');
  assert.equal(tpgService.hasCourseGroups(chineseHistory), false);
  assert.match(chineseHistory.courseStatusNote, /Peking University.*without official course codes/i);
});

test('CityU PCLL preserves its mixed-credit 24-plus-6 structure', () => {
  const programme = tpgService.getProgramme('CITYU-TPG-060');
  const core = programme.courseGroups.find((group) => group.id === 'programme-core');
  const electives = programme.courseGroups.find((group) => group.id === 'programme-electives');
  const courses = tpgService.flattenCourses(programme);

  assert.equal(programme.creditsRequired, 30);
  assert.equal(programme.ruleReviewStatus, 'verified');
  assert.equal(tpgService.listTracks(programme).length, 0);
  assert.equal(tpgService.getStatus(programme).courseCount, 18);
  assert.equal(new Set(courses.map((course) => course.code)).size, 18);
  assert.equal(core.creditsRequired, 24);
  assert.equal(core.coursesRequired, 9);
  assert.equal(core.courses.find((course) => course.code === 'PLE5012').credits, 4);
  assert.equal(core.courses.find((course) => course.code === 'PLE5016').credits, 2);
  assert.equal(electives.creditsRequired, 6);
  assert.equal(electives.coursesRequired, 3);
  assert.equal(electives.courses.length, 9);
  assert.equal(electives.courses.every((course) => course.credits === 2), true);
});

test('CityU Juris Doctor preserves optional specializations and conditional PCLL requirements', () => {
  const programme = tpgService.getProgramme('CITYU-TPG-059');
  const tracks = tpgService.listTracks(programme);
  const courses = tpgService.flattenCourses(programme);
  const core = programme.courseGroups.find((group) => group.id === 'programme-core');
  const pcll = programme.courseGroups.find((group) => group.id === 'pcll-admission-path');
  const research = programme.courseGroups.find((group) => group.id === 'research-electives');
  const specializations = programme.courseGroups.find((group) => group.id === 'specialization-elective-pool');
  const intensiveSeminar = courses.find((course) => course.code === 'LW5663');
  const commercialLaw = courses.find((course) => course.code === 'LW6140E');

  assert.equal(programme.creditsRequired, 72);
  assert.equal(programme.trackSelectionOptional, true);
  assert.equal(programme.ruleReviewStatus, 'manual_review_required');
  assert.equal(tracks.length, 3);
  assert.deepEqual(tracks.map((track) => track.name), [
    'International Commercial Law',
    'Alternative Dispute Resolution',
    'Chinese and Comparative Law'
  ]);
  assert.equal(tpgService.getStatus(programme).courseCount, 94);
  assert.equal(courses.length, 94);
  assert.equal(new Set(courses.map((course) => course.code)).size, 94);
  assert.equal(core.creditsRequired, 6);
  assert.equal(core.coursesRequired, 2);
  assert.equal(pcll.creditsRequired, undefined);
  assert.match(pcll.ruleText, /required only.*intend to apply/i);
  assert.equal(research.courses.find((course) => course.code === 'LW6137E').credits, 6);
  assert.match(research.ruleText, /does not make either option compulsory/);
  assert.equal(specializations.creditsRequired, 12);
  assert.equal(specializations.coursesRequired, 4);
  assert.deepEqual([intensiveSeminar.creditsMin, intensiveSeminar.creditsMax], [1, 2]);
  assert.equal(intensiveSeminar.creditStatus, 'official_range');
  assert.equal(intensiveSeminar.creditLabel, '1–2 credits');
  assert.deepEqual(commercialLaw.countsTowardTrackIds, [
    'CITYU-TPG-059-INTERNATIONAL-COMMERCIAL-LAW',
    'CITYU-TPG-059-CHINESE-COMPARATIVE-LAW'
  ]);
  assert.equal(courses.find((course) => course.code === 'LW5649B').credits, 6);
  assert.equal(courses.find((course) => course.code === 'FB5040').credits, 2);
});

test('CityU Master of Laws preserves seven Streams and conditional Module rules', () => {
  const programme = tpgService.getProgramme('CITYU-TPG-061');
  const tracks = tpgService.listTracks(programme);
  const allCourses = tpgService.flattenCourses(programme);
  const chinese = tpgService.flattenCourses(programme, '', 'CITYU-TPG-061-CHINESE-COMPARATIVE-LAW');
  const international = tpgService.flattenCourses(programme, '', 'CITYU-TPG-061-INTERNATIONAL-ECONOMIC-LAW');
  const common = tpgService.flattenCourses(programme, '', 'CITYU-TPG-061-COMMON-LAW');
  const general = tpgService.flattenCourses(programme, '', 'CITYU-TPG-061-GENERAL');
  const maritime = tpgService.flattenCourses(programme, '', 'CITYU-TPG-061-MARITIME-TRANSPORTATION-LAW');
  const englishPool = programme.courseGroups.find((group) => group.id === 'english-module-required-elective-pool');
  const chinesePool = programme.courseGroups.find((group) => group.id === 'chinese-module-course-pool');
  const foundation = programme.courseGroups.find((group) => group.id === 'maritime-foundation');

  assert.equal(programme.creditsRequired, 24);
  assert.equal(programme.ruleReviewStatus, 'manual_review_required');
  assert.equal(tracks.length, 7);
  assert.deepEqual(tracks.map((track) => track.name), [
    'Chinese and Comparative Law',
    'International Economic Law',
    'Common Law',
    'Intellectual Property and Technology Law',
    'Corporate and Financial Law',
    'General',
    'Maritime and Transportation Law'
  ]);
  assert.equal(tpgService.getStatus(programme).courseCount, 62);
  assert.equal(allCourses.length, 45);
  assert.equal(new Set(programme.courseGroups.flatMap((group) => group.courses.map((course) => course.code))).size, 62);
  assert.deepEqual([chinese.length, international.length, common.length, general.length, maritime.length], [51, 51, 48, 57, 47]);
  assert.equal(englishPool.courses.length, 44);
  assert.equal(chinesePool.courses.length, 12);
  assert.equal(chinese.some((course) => course.code === 'LW6121C'), true);
  assert.equal(international.some((course) => course.code === 'LW6143C'), true);
  assert.equal(general.some((course) => course.code === 'LW6143C'), true);
  assert.equal(common.some((course) => course.code === 'LW6164E'), true);
  assert.equal(common.some((course) => course.code === 'LW5303'), false);
  assert.equal(maritime.some((course) => course.code === 'LW5303'), true);
  assert.equal(foundation.creditsRequired, 6);
  assert.match(foundation.ruleText, /do not have a law degree/);
  assert.equal(englishPool.courses.find((course) => course.code === 'LW6201E').credits, 1.5);
  assert.deepEqual(englishPool.courses.find((course) => course.code === 'LW6157E').countsTowardTrackIds, [
    'CITYU-TPG-061-IP-TECHNOLOGY-LAW',
    'CITYU-TPG-061-CORPORATE-FINANCIAL-LAW'
  ]);
});

test('CityU MBA publishes only the 2026 General Curriculum without stale Concentrations', () => {
  const programme = tpgService.getProgramme('CITYU-TPG-011');
  const courses = tpgService.flattenCourses(programme);
  const core = programme.courseGroups.find((group) => group.id === 'core-courses');
  const globalLearning = programme.courseGroups.find((group) => group.id === 'global-learning');
  const electives = programme.courseGroups.find((group) => group.id === 'mba-electives');

  assert.equal(programme.creditsRequired, 40);
  assert.equal(programme.ruleReviewStatus, 'manual_review_required');
  assert.equal(tpgService.listTracks(programme).length, 0);
  assert.equal(tpgService.getStatus(programme).courseCount, 57);
  assert.equal(courses.length, 57);
  assert.equal(new Set(courses.map((course) => course.code)).size, 57);
  assert.equal(core.creditsRequired, 19);
  assert.equal(core.coursesRequired, 10);
  assert.equal(core.courses.reduce((sum, course) => sum + course.credits, 0), 19);
  assert.equal(globalLearning.creditsMin, 6);
  assert.equal(electives.creditsMin, 6);
  assert.match(electives.ruleText, /No Concentration or Dual Degree Track is published for the 2026 intake/);
  assert.equal(courses.find((course) => course.code === 'FB5700').credits, 1);
  assert.equal(courses.find((course) => course.code === 'FB6712A').credits, 1);
  assert.equal(courses.find((course) => course.code === 'FB6700').credits, 3);
  assert.equal(courses.find((course) => course.code === 'FB6784').credits, 3);
  assert.equal(courses.some((course) => course.code === 'AC6513'), false);
});

test('CityU EMBA preserves its three Pillars and conditional DBA elective path', () => {
  const programme = tpgService.getProgramme('CITYU-TPG-012');
  const courses = tpgService.flattenCourses(programme);
  const residential = programme.courseGroups.find((group) => group.id === 'residential-courses');
  const online = programme.courseGroups.find((group) => group.id === 'online-courses');
  const tours = programme.courseGroups.find((group) => group.id === 'global-learning-tours');
  const electives = programme.courseGroups.find((group) => group.id === 'elective-courses');
  const dbaPath = programme.courseGroups.find((group) => group.id === 'dba-preparation-path');
  const dbaCodes = ['FB6812', 'FB8001D', 'FB8002D', 'FB8004D'];

  assert.equal(programme.creditsRequired, 40);
  assert.equal(programme.ruleReviewStatus, 'manual_review_required');
  assert.equal(tpgService.listTracks(programme).length, 0);
  assert.equal(tpgService.getStatus(programme).courseCount, 36);
  assert.equal(courses.length, 36);
  assert.equal(new Set(courses.map((course) => course.code)).size, 36);
  assert.equal(residential.creditsMin, 16);
  assert.equal(online.creditsMin, 8);
  assert.equal(tours.creditsMin, 4);
  assert.equal(residential.courses.every((course) => course.credits === 4), true);
  assert.equal(online.courses.every((course) => course.credits === 2), true);
  assert.equal(tours.courses.every((course) => course.credits === 4), true);
  assert.match(residential.ruleText, /FB6890.*is compulsory/);
  assert.deepEqual(dbaCodes.map((code) => electives.courses.find((course) => course.code === code).credits), [4, 3, 3, 2]);
  assert.equal(dbaPath.creditsRequired, undefined);
  assert.equal(dbaPath.courses.length, 0);
  assert.match(dbaPath.ruleText, /12 credit units/);
});

test('CityU Chinese EMBA keeps its cross-role Core options unique', () => {
  const programme = tpgService.getProgramme('CITYU-TPG-005');
  const courses = tpgService.flattenCourses(programme);
  const fixedCore = programme.courseGroups.find((group) => group.id === 'fixed-core-courses');
  const options = programme.courseGroups.find((group) => group.id === 'core-completion-options');
  const electives = programme.courseGroups.find((group) => group.id === 'elective-courses');

  assert.equal(programme.creditsRequired, 40);
  assert.equal(programme.ruleReviewStatus, 'manual_review_required');
  assert.equal(tpgService.listTracks(programme).length, 0);
  assert.equal(tpgService.getStatus(programme).courseCount, 60);
  assert.equal(courses.length, 60);
  assert.equal(new Set(courses.map((course) => course.code)).size, 60);
  assert.equal(fixedCore.creditsRequired, 16);
  assert.equal(fixedCore.coursesRequired, 9);
  assert.equal(fixedCore.courses.reduce((sum, course) => sum + course.credits, 0), 16);
  assert.equal(options.creditsMin, 3);
  assert.equal(options.coursesRequired, 1);
  assert.deepEqual(options.courses.map((course) => [course.code, course.credits]), [
    ['FB6816P', 3],
    ['FB6843P', 3],
    ['FB6812P', 4],
    ['FB6813P', 4]
  ]);
  assert.equal(electives.creditsMin, 20);
  assert.equal(electives.creditsMax, 21);
  assert.equal(electives.courses.length, 47);
  assert.equal(electives.courses.some((course) => course.code === 'FB6816P'), false);
  assert.match(electives.ruleText, /cross-role elective candidates/);
});

test('CityU Cross Sectoral Leadership preserves the cross-group elective rule', () => {
  const programme = tpgService.getProgramme('CITYU-TPG-051');
  const courses = tpgService.flattenCourses(programme);
  const core = programme.courseGroups.find((group) => group.id === 'core-courses');
  const electives = programme.courseGroups.find((group) => group.id === 'elective-courses');
  const experiential = programme.courseGroups.find((group) => group.id === 'experiential-learning');

  assert.equal(programme.creditsRequired, 30);
  assert.equal(programme.ruleReviewStatus, 'manual_review_required');
  assert.equal(tpgService.listTracks(programme).length, 0);
  assert.equal(tpgService.getStatus(programme).courseCount, 15);
  assert.equal(courses.length, 15);
  assert.equal(new Set(courses.map((course) => course.code)).size, 15);
  assert.equal(core.creditsRequired, 21);
  assert.equal(core.coursesRequired, 7);
  assert.equal(core.courses.every((course) => course.credits === 3), true);
  assert.equal(electives.creditsRequired, 6);
  assert.equal(electives.coursesRequired, 2);
  assert.equal(electives.courses.length, 6);
  assert.match(electives.ruleText, /two different groups/);
  assert.match(electives.ruleText, /COM5110 and COM5402 are taught in English/);
  assert.equal(experiential.creditsRequired, 3);
  assert.equal(experiential.coursesRequired, 1);
  assert.deepEqual(experiential.courses.map((course) => course.code), ['CLA5011', 'CLA5012']);
});

test('HKBU Data Analytics and Artificial Intelligence keeps categories as one free elective pool', () => {
  const programme = tpgService.getProgramme('HKBU-TPG-024');
  const courses = tpgService.flattenCourses(programme);
  const core = programme.courseGroups.find((group) => group.id === 'core-courses');
  const electives = programme.courseGroups.find((group) => group.id === 'elective-courses');

  assert.equal(programme.creditsRequired, 29);
  assert.equal(programme.creditUnit, 'units');
  assert.equal(programme.ruleReviewStatus, 'verified');
  assert.equal(tpgService.listTracks(programme).length, 0);
  assert.equal(tpgService.getStatus(programme).courseCount, 29);
  assert.equal(courses.length, 29);
  assert.equal(new Set(courses.map((course) => course.code)).size, 29);
  assert.equal(core.creditsRequired, 14);
  assert.equal(core.coursesRequired, 6);
  assert.equal(core.courses.reduce((sum, course) => sum + course.credits, 0), 14);
  assert.equal(electives.creditsRequired, 15);
  assert.equal(electives.coursesRequired, 5);
  assert.equal(electives.courses.length, 23);
  assert.match(electives.ruleText, /select freely across the categories/);
  assert.match(electives.ruleText, /not Tracks/);
  assert.equal(electives.courses.filter((course) => course.code === 'COMP7065').length, 1);
  assert.equal(electives.courses.find((course) => course.code === 'COMP7125').credits, 3);
  assert.equal(electives.courses.find((course) => course.code === 'COMP7280').name, 'MSc Practicum');
});

test('HKBU Information Technology Management preserves substitution and cross-stream rules', () => {
  const programme = tpgService.getProgramme('HKBU-TPG-019');
  const courses = tpgService.flattenCourses(programme);
  const core = programme.courseGroups.find((group) => group.id === 'core-courses');
  const electives = programme.courseGroups.find((group) => group.id === 'elective-courses');

  assert.equal(programme.creditsRequired, 29);
  assert.equal(programme.ruleReviewStatus, 'manual_review_required');
  assert.equal(tpgService.listTracks(programme).length, 0);
  assert.equal(tpgService.getStatus(programme).courseCount, 33);
  assert.equal(courses.length, 33);
  assert.equal(new Set(courses.map((course) => course.code)).size, 33);
  assert.equal(core.creditsRequired, 14);
  assert.equal(core.coursesRequired, 6);
  assert.equal(core.courses.reduce((sum, course) => sum + course.credits, 0), 14);
  assert.match(core.ruleText, /must substitute COMP7510/);
  assert.equal(electives.creditsRequired, 15);
  assert.equal(electives.coursesRequired, 5);
  assert.equal(electives.courses.length, 27);
  assert.match(electives.ruleText, /at least three of the four official elective streams/);
  assert.match(electives.ruleText, /not Programme Tracks/);
  assert.equal(electives.courses.filter((course) => course.code === 'COMP7650').length, 1);
  assert.equal(electives.courses.find((course) => course.code === 'COMP7730').name, 'MSc Project');
});

test('HKBU AI and Digital Media keeps its Programme-elective minimum and optional Project', () => {
  const programme = tpgService.getProgramme('HKBU-TPG-017');
  const courses = tpgService.flattenCourses(programme);
  const bridging = programme.courseGroups.find((group) => group.id === 'bridging-courses');
  const core = programme.courseGroups.find((group) => group.id === 'core-courses');
  const electives = programme.courseGroups.find((group) => group.id === 'elective-courses');

  assert.equal(programme.creditsRequired, 30);
  assert.equal(programme.ruleReviewStatus, 'manual_review_required');
  assert.equal(tpgService.listTracks(programme).length, 0);
  assert.equal(tpgService.getStatus(programme).courseCount, 25);
  assert.equal(courses.length, 25);
  assert.equal(new Set(courses.map((course) => course.code)).size, 25);
  assert.deepEqual([bridging.creditsRequired, core.creditsRequired, electives.creditsRequired], [6, 12, 12]);
  assert.deepEqual([bridging.coursesRequired, core.coursesRequired, electives.coursesRequired], [2, 4, 4]);
  assert.match(electives.ruleText, /at least 9 units from AIDM-coded/);
  assert.match(electives.ruleText, /no dissertation is compulsory/);
  assert.equal(electives.courses.filter((course) => course.code.startsWith('AIDM')).length, 14);
  assert.equal(electives.courses.find((course) => course.code === 'AIDM7460').name, 'Digital Media Research Project');
});

test('HKBU Operational Research and Business Statistics requires its full Dissertation sequence', () => {
  const programme = tpgService.getProgramme('HKBU-TPG-020');
  const courses = tpgService.flattenCourses(programme);
  const required = programme.courseGroups.find((group) => group.id === 'required-courses');
  const dissertation = programme.courseGroups.find((group) => group.id === 'dissertation');
  const electives = programme.courseGroups.find((group) => group.id === 'elective-courses');

  assert.equal(programme.creditsRequired, 40);
  assert.equal(programme.ruleReviewStatus, 'verified');
  assert.equal(tpgService.listTracks(programme).length, 0);
  assert.equal(tpgService.getStatus(programme).courseCount, 22);
  assert.equal(courses.length, 22);
  assert.equal(new Set(courses.map((course) => course.code)).size, 22);
  assert.deepEqual([required.creditsRequired, dissertation.creditsRequired, electives.creditsRequired], [25, 6, 9]);
  assert.deepEqual([required.coursesRequired, dissertation.coursesRequired, electives.coursesRequired], [8, 2, 3]);
  assert.equal(required.courses.reduce((sum, course) => sum + course.credits, 0), 25);
  assert.deepEqual(dissertation.courses.map((course) => [course.code, course.credits]), [
    ['MATH7941', 3],
    ['MATH7942', 3]
  ]);
  assert.equal(electives.courses.length, 12);
});

test('HKBU Mathematical Finance preserves mixed 4-unit and 3-unit Required Courses', () => {
  const programme = tpgService.getProgramme('HKBU-TPG-021');
  const courses = tpgService.flattenCourses(programme);
  const required = programme.courseGroups.find((group) => group.id === 'required-courses');
  const elective = programme.courseGroups.find((group) => group.id === 'elective-course');

  assert.equal(programme.creditsRequired, 39);
  assert.equal(programme.ruleReviewStatus, 'verified');
  assert.equal(tpgService.listTracks(programme).length, 0);
  assert.equal(tpgService.getStatus(programme).courseCount, 17);
  assert.equal(courses.length, 17);
  assert.equal(new Set(courses.map((course) => course.code)).size, 17);
  assert.equal(required.creditsRequired, 35);
  assert.equal(required.coursesRequired, 10);
  assert.equal(required.courses.reduce((sum, course) => sum + course.credits, 0), 35);
  assert.deepEqual(required.courses.map((course) => course.credits), [4, 4, 4, 4, 4, 3, 3, 3, 3, 3]);
  assert.equal(elective.creditsRequired, 4);
  assert.equal(elective.coursesRequired, 1);
  assert.equal(elective.courses.length, 7);
  assert.equal(elective.courses.every((course) => course.credits === 4), true);
});

test('HKBU Analytical Chemistry separates its compulsory Dissertation from taught requirements', () => {
  const programme = tpgService.getProgramme('HKBU-TPG-022');
  const courses = tpgService.flattenCourses(programme);
  const required = programme.courseGroups.find((group) => group.id === 'required-taught-laboratory-seminar');
  const dissertation = programme.courseGroups.find((group) => group.id === 'dissertation');
  const electives = programme.courseGroups.find((group) => group.id === 'elective-courses');

  assert.equal(programme.creditsRequired, 27);
  assert.equal(programme.ruleReviewStatus, 'verified');
  assert.equal(tpgService.listTracks(programme).length, 0);
  assert.equal(tpgService.getStatus(programme).courseCount, 23);
  assert.equal(courses.length, 23);
  assert.equal(new Set(courses.map((course) => course.code)).size, 23);
  assert.deepEqual([required.creditsRequired, dissertation.creditsRequired, electives.creditsRequired], [18, 6, 3]);
  assert.equal(required.courses.reduce((sum, course) => sum + course.credits, 0), 18);
  assert.deepEqual(required.courses.filter((course) => course.code.startsWith('CHEM740')).map((course) => course.credits), [0.5, 0.5, 0.5, 0.5]);
  assert.deepEqual(dissertation.courses.map((course) => [course.code, course.credits]), [
    ['CHEM7331', 3],
    ['CHEM7332', 3]
  ]);
  assert.equal(electives.coursesRequired, 3);
  assert.equal(electives.courses.every((course) => course.credits === 1), true);
});

test('HKBU Green Technology requires both Project courses without treating the elective pool as compulsory', () => {
  const programme = tpgService.getProgramme('HKBU-TPG-018');
  const courses = tpgService.flattenCourses(programme);
  const required = programme.courseGroups.find((group) => group.id === 'required-courses');
  const project = programme.courseGroups.find((group) => group.id === 'project');
  const electives = programme.courseGroups.find((group) => group.id === 'elective-courses');

  assert.equal(programme.creditsRequired, 30);
  assert.equal(programme.ruleReviewStatus, 'verified');
  assert.equal(tpgService.listTracks(programme).length, 0);
  assert.equal(tpgService.getStatus(programme).courseCount, 21);
  assert.equal(courses.length, 21);
  assert.equal(new Set(courses.map((course) => course.code)).size, 21);
  assert.deepEqual([required.creditsRequired, project.creditsRequired, electives.creditsRequired], [12, 6, 12]);
  assert.deepEqual(project.courses.map((course) => [course.code, course.credits]), [
    ['PHYS7371', 3],
    ['PHYS7372', 3]
  ]);
  assert.equal(electives.coursesRequired, 4);
  assert.equal(electives.courses.length, 15);
  assert.equal(electives.courses.every((course) => course.credits === 3), true);
});

test('HKBU Environmental and Public Health Management keeps the MSc Dissertation compulsory', () => {
  const programme = tpgService.getProgramme('HKBU-TPG-023');
  const courses = tpgService.flattenCourses(programme);
  const required = programme.courseGroups.find((group) => group.id === 'required-courses');
  const electives = programme.courseGroups.find((group) => group.id === 'elective-courses');
  const dissertation = programme.courseGroups.find((group) => group.id === 'dissertation');

  assert.equal(programme.creditsRequired, 27);
  assert.equal(programme.ruleReviewStatus, 'verified');
  assert.equal(tpgService.listTracks(programme).length, 0);
  assert.equal(tpgService.getStatus(programme).courseCount, 11);
  assert.equal(courses.length, 11);
  assert.equal(new Set(courses.map((course) => course.code)).size, 11);
  assert.deepEqual([required.creditsRequired, electives.creditsRequired, dissertation.creditsRequired], [6, 15, 6]);
  assert.deepEqual([required.coursesRequired, electives.coursesRequired, dissertation.coursesRequired], [2, 5, 2]);
  assert.equal(electives.courses.length, 7);
  assert.deepEqual(dissertation.courses.map((course) => [course.code, course.credits]), [
    ['EPHM7311', 3],
    ['EPHM7312', 3]
  ]);
  assert.match(dissertation.ruleText, /required for the MSc award/);
});

test('HKBU Master of Accountancy keeps its restricted Integrated Project inside the elective pool', () => {
  const programme = tpgService.getProgramme('HKBU-TPG-026');
  const courses = tpgService.flattenCourses(programme);
  const required = programme.courseGroups.find((group) => group.id === 'required-courses');
  const electives = programme.courseGroups.find((group) => group.id === 'elective-courses');

  assert.equal(programme.creditsRequired, 36);
  assert.equal(programme.name, 'Master of Accountancy (MAcc)');
  assert.equal(programme.creditUnit, 'units');
  assert.equal(programme.ruleReviewStatus, 'manual_review_required');
  assert.equal(tpgService.listTracks(programme).length, 0);
  assert.equal(tpgService.getStatus(programme).courseCount, 19);
  assert.equal(courses.length, 19);
  assert.equal(new Set(courses.map((course) => course.code)).size, 19);
  assert.deepEqual([required.creditsRequired, electives.creditsRequired], [21, 15]);
  assert.deepEqual([required.coursesRequired, electives.coursesRequired], [7, 5]);
  assert.equal(required.courses.every((course) => course.credits === 3), true);
  assert.equal(electives.courses.length, 12);
  assert.equal(electives.courses.every((course) => course.credits === 3), true);
  assert.match(required.ruleText, /pre-core programme requirements/);
  assert.match(required.ruleText, /non-unit-bearing/);
  assert.equal(electives.courses.find((course) => course.code === 'ACCT7550').name, 'Integrated Project');
  assert.match(electives.ruleText, /optional elective only/);
  assert.match(electives.ruleText, /not a compulsory Project or Dissertation/);
});

test('HKBU Applied Accounting and Finance preserves its zero-unit required workshop and restricted projects', () => {
  const programme = tpgService.getProgramme('HKBU-TPG-030');
  const courses = tpgService.flattenCourses(programme);
  const required = programme.courseGroups.find((group) => group.id === 'required-courses');
  const electives = programme.courseGroups.find((group) => group.id === 'elective-courses');
  const workshop = programme.courseGroups.find((group) => group.id === 'non-unit-bearing-course');

  assert.equal(programme.creditsRequired, 30);
  assert.equal(programme.name, 'Master of Science (MSc) in Applied Accounting and Finance');
  assert.equal(programme.ruleReviewStatus, 'manual_review_required');
  assert.equal(tpgService.listTracks(programme).length, 0);
  assert.equal(tpgService.getStatus(programme).courseCount, 19);
  assert.equal(courses.length, 19);
  assert.equal(new Set(courses.map((course) => course.code)).size, 19);
  assert.deepEqual([required.creditsRequired, electives.creditsRequired, workshop.creditsRequired], [24, 6, 0]);
  assert.deepEqual([required.coursesRequired, electives.coursesRequired, workshop.coursesRequired], [8, 2, 1]);
  assert.equal(required.courses.every((course) => course.credits === 3), true);
  assert.equal(electives.courses.length, 10);
  assert.equal(electives.courses.find((course) => course.code === 'ACCT7280').credits, 3);
  assert.equal(electives.courses.find((course) => course.code === 'FIN 7280').credits, 3);
  assert.match(electives.ruleText, /optional Independent Study\/Integrative Project/);
  assert.match(electives.ruleText, /neither is a compulsory Project or Dissertation/);
  assert.deepEqual(workshop.courses.map((course) => [course.code, course.credits]), [['BUS 7510', 0]]);
  assert.match(workshop.ruleText, /required but contributes zero units/);
});

test('HKBU Applied Economics preserves both mutually exclusive core choice pairs', () => {
  const programme = tpgService.getProgramme('HKBU-TPG-031');
  const courses = tpgService.flattenCourses(programme);
  const required = programme.courseGroups.find((group) => group.id === 'required-courses');
  const electives = programme.courseGroups.find((group) => group.id === 'elective-courses');

  assert.equal(programme.creditsRequired, 30);
  assert.equal(programme.name, 'Master of Science (MSc) in Applied Economics');
  assert.equal(programme.ruleReviewStatus, 'manual_review_required');
  assert.equal(tpgService.listTracks(programme).length, 0);
  assert.equal(tpgService.getStatus(programme).courseCount, 40);
  assert.equal(courses.length, 40);
  assert.equal(new Set(courses.map((course) => course.code)).size, 40);
  assert.deepEqual([required.creditsRequired, required.coursesRequired, required.courses.length], [15, 5, 7]);
  assert.deepEqual([electives.creditsRequired, electives.coursesRequired, electives.courses.length], [15, 5, 33]);
  assert.equal(courses.every((course) => course.credits === 3), true);
  assert.match(required.ruleText, /ECON7790 Microeconomics or ECON7820 Advanced Microeconomics/);
  assert.match(required.ruleText, /ECON7800 Macroeconomics or ECON7830 Advanced Macroeconomics/);
  assert.match(required.ruleText, /mutually exclusive choice pairs/);
  assert.equal(electives.courses.find((course) => course.code === 'ECON7440').name, 'Applied Economics Research Paper');
  assert.match(electives.ruleText, /one optional elective/);
  assert.match(electives.ruleText, /no Project or Dissertation is compulsory/);
});

test('HKBU Corporate Governance and Compliance keeps its Project optional', () => {
  const programme = tpgService.getProgramme('HKBU-TPG-033');
  const courses = tpgService.flattenCourses(programme);
  const required = programme.courseGroups.find((group) => group.id === 'required-courses');
  const electives = programme.courseGroups.find((group) => group.id === 'elective-courses');

  assert.equal(programme.creditsRequired, 30);
  assert.equal(programme.name, 'Master of Science (MSc) in Corporate Governance and Compliance');
  assert.equal(programme.ruleReviewStatus, 'verified');
  assert.equal(tpgService.listTracks(programme).length, 0);
  assert.equal(tpgService.getStatus(programme).courseCount, 18);
  assert.equal(courses.length, 18);
  assert.equal(new Set(courses.map((course) => course.code)).size, 18);
  assert.deepEqual([required.creditsRequired, required.coursesRequired, required.courses.length], [24, 8, 8]);
  assert.deepEqual([electives.creditsRequired, electives.coursesRequired, electives.courses.length], [6, 2, 10]);
  assert.equal(courses.every((course) => course.credits === 3), true);
  assert.match(required.ruleText, /Professional recognition by CGI and HKCGI is separate/);
  assert.equal(electives.courses.find((course) => course.code === 'ACCT7170').name, 'Project');
  assert.match(electives.ruleText, /optional elective/);
  assert.match(electives.ruleText, /not a compulsory Project or Dissertation/);
});

test('HKBU Data Analytics and Business Economics keeps Projects and Internship optional', () => {
  const programme = tpgService.getProgramme('HKBU-TPG-034');
  const courses = tpgService.flattenCourses(programme);
  const required = programme.courseGroups.find((group) => group.id === 'required-courses');
  const electives = programme.courseGroups.find((group) => group.id === 'elective-courses');

  assert.equal(programme.creditsRequired, 30);
  assert.equal(programme.name, 'Master of Science (MSc) in Data Analytics and Business Economics');
  assert.equal(programme.ruleReviewStatus, 'verified');
  assert.equal(tpgService.listTracks(programme).length, 0);
  assert.equal(tpgService.getStatus(programme).courseCount, 24);
  assert.equal(courses.length, 24);
  assert.equal(new Set(courses.map((course) => course.code)).size, 24);
  assert.deepEqual([required.creditsRequired, required.coursesRequired, required.courses.length], [15, 5, 5]);
  assert.deepEqual([electives.creditsRequired, electives.coursesRequired, electives.courses.length], [15, 5, 19]);
  assert.equal(courses.every((course) => course.credits === 3), true);
  assert.equal(electives.courses.find((course) => course.code === 'ECON7025').name, 'Business Economics Internship');
  assert.equal(electives.courses.find((course) => course.code === 'ECON7055').name, 'Projects for Data Analytics');
  assert.match(electives.ruleText, /optional electives/);
  assert.match(electives.ruleText, /no Project, Internship or Dissertation is compulsory/);
});

test('HKBU Finance preserves the approved two-part Industry Project substitution', () => {
  const programme = tpgService.getProgramme('HKBU-TPG-036');
  const courses = tpgService.flattenCourses(programme);
  const required = programme.courseGroups.find((group) => group.id === 'required-courses');
  const electives = programme.courseGroups.find((group) => group.id === 'elective-courses');

  assert.equal(programme.creditsRequired, 30);
  assert.equal(programme.name, 'Master of Science (MSc) in Finance (FinTech and Financial Analytics)');
  assert.equal(programme.ruleReviewStatus, 'manual_review_required');
  assert.equal(tpgService.listTracks(programme).length, 0);
  assert.equal(tpgService.getStatus(programme).courseCount, 16);
  assert.equal(courses.length, 16);
  assert.equal(new Set(courses.map((course) => course.code)).size, 16);
  assert.deepEqual([required.creditsRequired, required.coursesRequired, required.courses.length], [24, 8, 8]);
  assert.equal(electives.creditsRequired, 6);
  assert.equal(electives.coursesRequired, null);
  assert.equal(electives.courses.length, 8);
  assert.deepEqual(
    electives.courses.filter((course) => course.code === 'FIN 7911' || course.code === 'FIN 7912').map((course) => [course.code, course.credits]),
    [['FIN 7911', 1.5], ['FIN 7912', 1.5]]
  );
  assert.match(electives.ruleText, /together replace one 3-unit elective/);
  assert.match(electives.ruleText, /both Project parts plus one other 3-unit elective/);
  assert.match(required.ruleText, /preparatory study.*separate from the 30-unit award structure/);
});

test('TPG programme helpers expose course status and searchable courses', () => {
  const programme = tpgService.getProgramme('HKU-TPG-048');
  const university = tpgService.getProgrammeUniversity(programme);
  const status = tpgService.getStatus(programme);
  const courses = tpgService.flattenCourses(programme, 'ARIN7600');

  assert.equal(programme.name, 'Master of Science in Artificial Intelligence (MSc(AI))');
  assert.equal(university.code, 'HKU');
  assert.equal(status.hasCourseGroups, true);
  assert.equal(status.courseCount, 22);
  assert.equal(courses.length, 1);
  assert.equal(courses[0].name, 'Artificial intelligence project');
});

test('TPG programme search matches names, codes, faculties and course text', () => {
  const hkuProgrammes = tpgService.listProgrammes('HKU');

  assert(tpgService.searchProgrammes(hkuProgrammes, 'data science').some(
    (programme) => programme.name.includes('Master of Data Science')
  ));
  assert(tpgService.searchProgrammes(hkuProgrammes, 'COMP7404').some(
    (programme) => programme.name.includes('Computer Science')
  ));
});

test('TPG programmes can be filtered by course availability', () => {
  const hkuProgrammes = tpgService.listProgrammes('HKU');
  const withCourses = tpgService.filterProgrammesByAvailability(hkuProgrammes, 'courses');
  const pending = tpgService.filterProgrammesByAvailability(hkuProgrammes, 'pending');

  assert.equal(withCourses.length, 6);
  assert.equal(withCourses.every(tpgService.hasCourseGroups), true);
  assert.equal(pending.length, hkuProgrammes.length - withCourses.length);
  assert.equal(pending.some(tpgService.hasCourseGroups), false);
  assert.equal(tpgService.filterProgrammesByAvailability(hkuProgrammes, 'all').length, hkuProgrammes.length);
});

test('TPG programme source text is copyable even without a direct URL', () => {
  const programme = tpgService.getProgramme('HKU-TPG-001');
  const sourceText = tpgService.buildProgrammeSourceText(programme);

  assert(sourceText.includes('HKU · Master of Architecture'));
  assert(sourceText.includes('Source file: HKU_Master_Course_Guide.pdf'));
  assert(sourceText.includes('Academic year: 2025-26'));
  assert(sourceText.includes('For planning reference only'));
});
