const assert = require('node:assert/strict');
const test = require('node:test');
const supplementFile = require('../data/ug-course-supplements/cuhk-relsn-religious-studies-courses-2025.json');
const { addGenericCourseSupplements } = require('./generate-ug-catalog');
const { validateSupplement } = require('./validate-ug-supplements');

test('CUHK Religious Studies exposes all 63 current Religious Studies Area courses as browse-only', () => {
  const [rawSupplement] = supplementFile.supplements;
  const supplement = {
    provider: supplementFile.provider,
    academicYear: supplementFile.academicYear,
    sourceUrl: supplementFile.sourceUrl,
    officialUrl: supplementFile.officialUrl,
    ...rawSupplement
  };
  validateSupplement(supplement, 0);

  const catalogue = {
    programmes: [{
      id: 'CUHK-UG-RELSN-14',
      universityCode: 'CUHK',
      code: 'RELSN',
      jupasCode: 'JS4109',
      nameEn: 'Religious Studies',
      sourceStatus: 'programme_summary_only',
      courseCount: 1,
      codedCourseCount: 0
    }],
    majors: [{
      id: 'CUHK-UG-RELSN-14-M1',
      programmeId: 'CUHK-UG-RELSN-14',
      nameEn: 'Religious Studies',
      courseCount: 1,
      codedCourseCount: 0
    }],
    courses: []
  };

  addGenericCourseSupplements(catalogue, [supplement]);

  const courses = catalogue.courses;
  const byCode = Object.fromEntries(courses.map((course) => [course.courseCode, course]));
  assert.equal(catalogue.programmes[0].sourceStatus, 'course_codes_available');
  assert.equal(catalogue.programmes[0].codedCourseCount, 63);
  assert.equal(catalogue.majors[0].codedCourseCount, 63);
  assert.equal(courses.length, 63);
  assert.equal(new Set(courses.map((course) => course.courseCode)).size, 63);

  assert.equal(courses.filter((course) => course.courseType === 'core').length, 19);
  assert.equal(courses.filter((course) => course.courseType === 'capstone').length, 2);
  assert.equal(courses.filter((course) => course.courseType === 'major_elective').length, 42);
  assert(courses.every((course) => course.credits === 3));
  assert.equal(byCode.CURE1110.recommendedYear, 1);
  assert.equal(byCode.CURE1123.semester, 'Fall');
  assert.equal(byCode.CURE2170.semester, 'Spring');
  assert.equal(byCode.CURE4153.courseType, 'capstone');
  assert.equal(byCode.CURE4159.courseType, 'capstone');
  assert.match(byCode.CURE2113.requirementGroups[0], /choose 1 from CURE2113/);
  assert.match(byCode.CURE2226.requirementGroups[0], /Arab Studies concentration required/);
  assert.match(byCode.CURE3144.requirementGroups[0], /Religion and Health concentration required/);
  assert.match(byCode.THEO3215.requirementGroups[0], /Religious Studies Area 4/);

  ['CURE1009', 'CURE2019', 'ARAB1000', 'ANTH4330', 'EDUC2000', 'PHIL1110', 'PSYC3720'].forEach((courseCode) => {
    assert.equal(byCode[courseCode], undefined);
  });
  assert(courses.every((course) => course.sourceUrl === supplementFile.sourceUrl));

  assert.match(supplementFile.note, /66-unit standard Major/);
  assert.match(supplementFile.note, /51-unit senior-entry Major/);
  assert.match(supplementFile.note, /all 63 courses/);
  assert.match(supplementFile.note, /Cultural Studies Area electives/);
  assert.match(supplementFile.note, /browse-only/);
});
