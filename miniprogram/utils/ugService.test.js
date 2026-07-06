const assert = require('node:assert/strict');
const { test } = require('node:test');

const ugService = require('./ugService');

test('UG catalogue summarizes current undergraduate seed data', () => {
  assert.deepEqual(ugService.getCatalogueSummary(), {
    universityCount: 1,
    facultyCount: 1,
    programmeCount: 1,
    majorCount: 1,
    courseCount: 14,
    requirementCount: 4
  });
});

test('UG catalogue exposes the hierarchy needed for future imports', () => {
  const university = ugService.listUniversities()[0];
  const faculty = ugService.listFaculties(university.id)[0];
  const programme = ugService.listProgrammes({ universityId: university.id, facultyId: faculty.id })[0];
  const major = ugService.listMajors(programme.id)[0];

  assert.equal(university.code, 'HKU');
  assert.equal(faculty.nameEn, 'Faculty of Engineering');
  assert.equal(programme.nameEn, 'Bachelor of Engineering');
  assert.equal(major.nameEn, 'Computer Science');
  assert.deepEqual(ugService.listCurriculumYears(programme.id, major.id), ['2025-26']);
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
  assert.deepEqual(ugService.searchMajors('engineering').map((major) => major.code), ['COMP']);
  assert.equal(ugService.getMajorProfile(1, 999), null);
});
