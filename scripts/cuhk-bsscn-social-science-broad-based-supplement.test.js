const assert = require('node:assert/strict');
const test = require('node:test');
const supplementFile = require('../data/ug-course-supplements/cuhk-bsscn-social-science-broad-based-faculty-package-2026.json');
const { addGenericCourseSupplements } = require('./generate-ug-catalog');
const { validateSupplement } = require('./validate-ug-supplements');

const EXPECTED_CODES = `
ARCH1001 ARCH1002 ARCH1003 COMM1110 COMM1120 COMM1150 COMM1500 DSPS1001
DSPS1003 DSPS1004 ECON1210 ECON1220 ECON2011 GLSD1001 GPAD1020 GPAD1076
GPAD1077 GRMD1302 GRMD1401 GRMD1402 PSYC1000 PSYC1630 SOCI1001 SOCI1201
SOSC1001 SOSC1002 SOSC1003 SOWK1001 SOWK1113 SOWK1114 URSP1001
`.trim().split(/\s+/).sort();

test('CUHK BSSCN exposes the complete 2026-27 Social Science Faculty Package without merging destination Majors', () => {
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
      id: 'CUHK-UG-BSSCN-80', universityCode: 'CUHK', code: 'BSSCN', jupasCode: 'JS4801',
      nameEn: 'Social Science (Broad-based)', sourceStatus: 'programme_summary_only',
      courseCount: 1, codedCourseCount: 0
    }],
    majors: [{
      id: 'CUHK-UG-BSSCN-80-M1', programmeId: 'CUHK-UG-BSSCN-80',
      nameEn: 'Social Science (Broad-based)', courseCount: 1, codedCourseCount: 0
    }],
    courses: []
  };

  addGenericCourseSupplements(catalogue, [supplement]);

  const courses = catalogue.courses;
  const byCode = Object.fromEntries(courses.map((course) => [course.courseCode, course]));
  assert.equal(catalogue.programmes[0].sourceStatus, 'course_codes_available');
  assert.equal(catalogue.programmes[0].codedCourseCount, 31);
  assert.equal(catalogue.majors[0].codedCourseCount, 31);
  assert.equal(courses.length, 31);
  assert.deepEqual(courses.map((course) => course.courseCode).sort(), EXPECTED_CODES);
  assert.equal(new Set(courses.map((course) => course.courseCode)).size, 31);
  assert(courses.every((course) => course.credits === 3));
  assert(courses.every((course) => course.courseType === 'foundation'));
  assert(courses.every((course) => course.recommendedYear === 1));
  assert.equal(byCode.PSYC1630.titleEn, 'Communication for Healthy Relationship');
  assert.match(byCode.PSYC1630.requirementGroups[0], /preserve the title/);
  assert.equal(byCode.SOSC1003.titleEn, 'Introduction to Art Tech Design and Interactivity');
  assert(courses.every((course) => course.sourceUrl === supplementFile.sourceUrl));

  assert.match(supplementFile.note, /complete 31-row code-title-unit Course List/);
  assert.match(supplementFile.note, /courses from the selectable destination Majors are not copied/);
  assert.match(supplementFile.note, /totalCreditRequired=0/);
});
