const assert = require('node:assert/strict');
const test = require('node:test');
const supplementFile = require('../data/ug-course-supplements/hkust-environmental-management-technology-curriculum-2025.json');
const { addGenericCourseSupplements } = require('./generate-ug-catalog');
const { validateSupplement } = require('./validate-ug-supplements');

test('HKUST Environmental Management and Technology preserves explicit requirements without fabricating the open ENVR pool', () => {
  const supplement = {
    provider: supplementFile.provider,
    academicYear: supplementFile.academicYear,
    sourceUrl: supplementFile.sourceUrl,
    officialUrl: supplementFile.officialUrl,
    ...supplementFile.supplements[0]
  };
  validateSupplement(supplement, 0);

  const programmeId = 'HKUST-UG-JS5812-24';
  const catalogue = {
    programmes: [{
      id: programmeId,
      universityCode: 'HKUST',
      nameEn: 'BSc in Environmental Management and Technology',
      sourceStatus: 'programme_summary_only',
      courseCount: 1,
      codedCourseCount: 0
    }],
    majors: [{
      id: `${programmeId}-M1`,
      programmeId,
      nameEn: 'BSc in Environmental Management and Technology',
      courseCount: 1,
      codedCourseCount: 0
    }],
    courses: []
  };

  addGenericCourseSupplements(catalogue, [supplement]);
  const courses = catalogue.courses;
  const byCode = Object.fromEntries(courses.map((course) => [course.courseCode, course]));
  const electiveGroups = courses
    .filter((course) => course.courseType === 'major_elective')
    .map((course) => course.requirementGroups[0]);

  assert.equal(catalogue.programmes[0].sourceStatus, 'course_codes_available');
  assert.equal(catalogue.programmes[0].codedCourseCount, 56);
  assert.equal(catalogue.majors[0].codedCourseCount, 56);
  assert.equal(courses.length, 56);
  assert.equal(new Set(courses.map((course) => course.courseCode)).size, 56);
  assert.equal(electiveGroups.filter((group) => group.includes('Environmental Science Courses')).length, 6);
  assert.equal(electiveGroups.filter((group) => group.includes('Environmental Control Courses')).length, 6);
  assert.equal(electiveGroups.filter((group) => group.includes('Environmental Business Courses')).length, 6);
  assert.equal(electiveGroups.filter((group) => group.includes('Social Science Courses')).length, 7);
  assert.equal(byCode.ENVR2001.credits, 1);
  assert.equal(byCode.MGMT3120.credits, 4);
  assert.match(byCode.COMP1022P.requirementGroups[0], /deleted subsequently/);
  assert.match(byCode.SOSC4290.requirementGroups[0], /deleted subsequently/);
  assert(!courses.some((course) => course.courseCode === 'ENVRXXXX'));
});
