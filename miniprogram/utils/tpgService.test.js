const assert = require('node:assert/strict');
const { test } = require('node:test');

const tpgService = require('./tpgService');
const tpgCourseShards = require('./tpgCourseShards');

test('TPG catalogue coverage summarizes eight-school MVP data', () => {
  const coverage = tpgService.getSchoolCoverage();

  assert.equal(coverage.schoolCount, 8);
  assert.equal(coverage.programmeCount, 448);
  assert.equal(coverage.programmeWithCoursesCount, 76);
  assert.equal(coverage.courseCount, 1499);
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
  assert.equal(tpgCourseShards.getProgrammeCount(), 76);
  assert.equal(rows.length, 76);
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
