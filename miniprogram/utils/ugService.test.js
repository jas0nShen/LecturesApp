const assert = require('node:assert/strict');
const { test } = require('node:test');

const ugService = require('./ugService');

test('UG catalogue summarizes current undergraduate seed data', () => {
  const summary = ugService.getCatalogueSummary();

  assert.equal(summary.universityCount, 8);
  assert(summary.facultyCount > 20);
  assert(summary.programmeCount >= 445);
  assert(summary.majorCount >= 690);
  assert.equal(summary.requirementCount, 4);
  assert(summary.courseCount >= 292);
  assert.equal(summary.sourceProgrammeCount, 444);
  assert.equal(summary.codedCourseCount, 278);
});

test('UG catalogue exposes the multi-school hierarchy needed for onboarding', () => {
  const universities = ugService.listUniversities();
  const university = universities.find((item) => item.code === 'POLYU');
  const faculty = ugService.listFaculties(university.id)[0];
  const programme = ugService.listProgrammes({ universityId: university.id, facultyId: faculty.id })[0];
  const major = ugService.listMajors(programme.id)[0];

  assert.deepEqual(universities.map((item) => item.code), ['HKU', 'CUHK', 'HKUST', 'POLYU', 'CITYU', 'HKBU', 'EDUHK', 'LINGNAN']);
  assert.equal(university.nameZh, '香港理工大学');
  assert(programme.nameEn);
  assert(major.nameEn);
  assert.deepEqual(ugService.listCurriculumYears(programme.id, major.id), ['2026']);
});

test('UG per-school coverage stays visible for setup validation', () => {
  const coverage = Object.fromEntries(ugService.listUniversities().map((university) => {
    const programmes = ugService.listProgrammes({ universityId: university.id, degreeLevel: 'undergraduate' });
    const majors = programmes.flatMap((programme) => ugService.listMajors(programme.id));
    const codedCourseCount = programmes.reduce((sum, programme) => sum + (programme.codedCourseCount || 0), 0);
    return [university.code, {
      programmeCount: programmes.length,
      majorCount: majors.length,
      codedCourseCount
    }];
  }));

  assert.deepEqual(coverage, {
    HKU: { programmeCount: 137, majorCount: 137, codedCourseCount: 112 },
    CUHK: { programmeCount: 84, majorCount: 84, codedCourseCount: 0 },
    HKUST: { programmeCount: 50, majorCount: 64, codedCourseCount: 0 },
    POLYU: { programmeCount: 46, majorCount: 110, codedCourseCount: 166 },
    CITYU: { programmeCount: 58, majorCount: 201, codedCourseCount: 0 },
    HKBU: { programmeCount: 22, majorCount: 46, codedCourseCount: 0 },
    EDUHK: { programmeCount: 25, majorCount: 25, codedCourseCount: 0 },
    LINGNAN: { programmeCount: 23, majorCount: 23, codedCourseCount: 0 }
  });
});

test('UG school coverage summarizes imported source data for the status page', () => {
  const coverage = ugService.getSchoolCoverage();
  const hku = coverage.find((school) => school.code === 'HKU');
  const polyu = coverage.find((school) => school.code === 'POLYU');

  assert.equal(coverage.length, 8);
  assert.equal(hku.programmeCount, 136);
  assert.equal(hku.majorCount, 136);
  assert.equal(hku.programmeWithCoursesCount, 2);
  assert.equal(hku.codedCourseCount, 112);
  assert.equal(hku.badge, 'COURSES');
  assert.equal(polyu.programmeWithCoursesCount, 1);
  assert.equal(polyu.codedCourseCount, 166);
  assert.equal(polyu.badge, 'COURSES');
  assert(polyu.coverageLabel.includes('课程代码'));
});

test('HKU Computing and Data Science catalogue profiles expose official course offerings', () => {
  const hku = ugService.listUniversities().find((item) => item.code === 'HKU');
  const programmes = ugService.listProgrammes({ universityId: hku.id, degreeLevel: 'undergraduate' });
  const cds = programmes.find((programme) => programme.nameEn === 'Computing and Data Science');
  const delta = programmes.find((programme) => programme.nameEn === 'Computing and Data Science (Delta+)');
  const major = ugService.listMajors(cds.id)[0];
  const profile = ugService.getMajorProfile(cds.id, major.id, '2026');
  const machineLearning = ugService.listMajorCourses(cds.id, major.id, { keyword: 'machine learning' });

  assert.equal(cds.sourceStatus, 'course_codes_available');
  assert.equal(cds.codedCourseCount, 56);
  assert.equal(delta.codedCourseCount, 56);
  assert.equal(profile.courseCount, 56);
  assert.equal(profile.codedCourseCount, 56);
  assert(machineLearning.some((course) => course.courseCode === 'COMP3314'));
});

test('UG major profile groups requirements with traceable courses and sources', () => {
  const profile = ugService.getMajorProfile(1, 1, '2025-26');
  const capstone = profile.requirementGroups.find((group) => group.type === 'capstone');

  assert.equal(profile.university.code, 'HKU');
  assert.equal(profile.faculty.nameEn, 'Faculty of Engineering');
  assert.equal(profile.programme.code, 'BENG');
  assert.equal(profile.major.code, 'COMP');
  assert.equal(profile.totalCreditRequired, 240);
  assert.equal(profile.courseCount, 14);
  assert.equal(profile.trackedRequirementCount, 4);
  assert(profile.trackedCredits > 0);
  assert(profile.sourceUrl.startsWith('https://'));
  assert.equal(capstone.requiredCredits, 12);
  assert.deepEqual(capstone.courses.map((course) => course.courseCode), ['COMP4801']);
});

test('UG course and major search support the next import workflow', () => {
  assert.deepEqual(
    ugService.listMajorCourses(1, 1, { courseType: 'core', recommendedYear: 3 })
      .map((course) => course.courseCode),
    ['COMP3230', 'COMP3234', 'COMP3251', 'COMP3297']
  );
  assert.deepEqual(
    ugService.listMajorCourses(1, 1, { keyword: 'machine learning' })
      .map((course) => course.courseCode),
    ['COMP3314']
  );
  assert(ugService.searchMajors('engineering').some((major) => major.code === 'COMP'));
  assert.equal(ugService.getMajorProfile(1, 999), null);
});

test('imported UG programme profiles preserve source status without faking course rules', () => {
  const hku = ugService.listUniversities().find((item) => item.code === 'HKU');
  const programmes = ugService.listProgrammes({ universityId: hku.id, degreeLevel: 'undergraduate' });
  const hkuArchitecture = programmes.find((programme) => programme.code === '6004');
  const major = ugService.listMajors(hkuArchitecture.id)[0];
  const profile = ugService.getMajorProfile(hkuArchitecture.id, major.id, '2026');

  assert.equal(programmes.filter((programme) => typeof programme.id === 'string').length, 136);
  assert.equal(profile.sourceStatus, 'programme_summary_only');
  assert.equal(profile.codedCourseCount, 0);
  assert.equal(profile.trackedRequirementCount, 0);
  assert.equal(profile.courseCount, 0);
  assert(profile.sourceUrl.startsWith('https://'));
});

test('imported UG coded courses are searchable when public course rows exist', () => {
  const polyu = ugService.listUniversities().find((item) => item.code === 'POLYU');
  const programmes = ugService.listProgrammes({ universityId: polyu.id, degreeLevel: 'undergraduate' });
  const computing = programmes.find((programme) => programme.code === 'JS3868');
  const computerScience = ugService.listMajors(computing.id).find((major) => major.nameEn === 'Computer Science');
  const profile = ugService.getMajorProfile(computing.id, computerScience.id, '2026');

  assert(profile.codedCourseCount > 0);
  assert(ugService.listMajorCourses(computing.id, computerScience.id, { keyword: 'Artificial Intelligence' }).length > 0);
});

test('imported UG coded courses are deduplicated by course code within a major', () => {
  const polyu = ugService.listUniversities().find((item) => item.code === 'POLYU');
  const programmes = ugService.listProgrammes({ universityId: polyu.id, degreeLevel: 'undergraduate' });
  const computing = programmes.find((programme) => programme.code === 'JS3868');
  const computerScience = ugService.listMajors(computing.id).find((major) => major.nameEn === 'Computer Science');
  const courses = ugService.listMajorCourses(computing.id, computerScience.id);
  const comp1004 = courses.filter((course) => course.courseCode === 'COMP1004');

  assert.equal(computing.codedCourseCount, 166);
  assert.equal(computerScience.codedCourseCount, 83);
  assert.equal(courses.length, 83);
  assert.equal(comp1004.length, 1);
  assert.equal(comp1004[0].semester, 'Semester 1 / Semester 2');
});

test('imported UG programmes can be searched by title, code and faculty', () => {
  const hku = ugService.listUniversities().find((item) => item.code === 'HKU');
  const hkuProgrammes = ugService.listProgrammes({ universityId: hku.id, degreeLevel: 'undergraduate' });
  const architecture = ugService.searchProgrammes(hkuProgrammes, '6004');
  const engineering = ugService.searchProgrammes(hkuProgrammes, 'Engineering');

  assert(architecture.some((programme) => programme.nameEn === 'Bachelor of Arts in Architectural Studies'));
  assert(engineering.length > 0);
  assert(ugService.searchProgrammes(hkuProgrammes, '').length >= hkuProgrammes.length);
});
