const assert = require('node:assert/strict');
const test = require('node:test');
const supplementFile = require('../data/ug-course-supplements/cuhk-psycn-psychology-courses-current.json');
const { addGenericCourseSupplements } = require('./generate-ug-catalog');
const { validateSupplement } = require('./validate-ug-supplements');

const MAJOR_CODES = `
PSYC1000 PSYC1030 PSYC1040 PSYC1050 PSYC1091 PSYC1620 PSYC1630 PSYC2010
PSYC2020 PSYC2050 PSYC2070 PSYC2190 PSYC2240 PSYC2300 PSYC2350 PSYC2540
PSYC2620 PSYC2650 PSYC2780 PSYC3001 PSYC3002 PSYC3003 PSYC3004 PSYC3005
PSYC3360 PSYC3370 PSYC3430 PSYC3440 PSYC3450 PSYC3460 PSYC3470 PSYC3550
PSYC3610 PSYC3630 PSYC3640 PSYC3660 PSYC3700 PSYC3720 PSYC3730 PSYC3740
PSYC3750 PSYC3760 PSYC3770 PSYC3810 PSYC3820 PSYC4900 PSYC4901 PSYC4902
PSYC4903 PSYC4904 PSYC4905 PSYC4906 PSYC4909 PSYC4910 PSYC4920
`.trim().split(/\s+/);
const FACULTY_ONLY_CODES = `
ARCH1001 ARCH1002 COMM1110 COMM1120 ECON1210 ECON1220 ECON2011 GPAD1001
GPAD1020 GPAD1076 GPAD1077 GRMD1401 GRMD1402 GRMD1404 SOCI1001 SOCI1201
SOWK1001 SOWK1113 SOWK1114 URSP1001 URSP1002
`.trim().split(/\s+/);
const EXPECTED_CODES = [...MAJOR_CODES, ...FACULTY_ONLY_CODES].sort();

test('CUHK PSYCN exposes the complete current Major and Faculty Package code-title scope with unknown units', () => {
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
      id: 'CUHK-UG-PSYCN-79', universityCode: 'CUHK', code: 'PSYCN', jupasCode: 'JS4862',
      nameEn: 'Psychology', sourceStatus: 'programme_summary_only', courseCount: 1, codedCourseCount: 0
    }],
    majors: [{
      id: 'CUHK-UG-PSYCN-79-M1', programmeId: 'CUHK-UG-PSYCN-79',
      nameEn: 'Psychology', courseCount: 1, codedCourseCount: 0
    }],
    courses: []
  };

  addGenericCourseSupplements(catalogue, [supplement]);

  const courses = catalogue.courses;
  const byCode = Object.fromEntries(courses.map((course) => [course.courseCode, course]));
  assert.equal(catalogue.programmes[0].sourceStatus, 'course_codes_available');
  assert.equal(catalogue.programmes[0].codedCourseCount, 76);
  assert.equal(catalogue.majors[0].codedCourseCount, 76);
  assert.equal(courses.length, 76);
  assert.deepEqual(courses.map((course) => course.courseCode).sort(), EXPECTED_CODES);
  assert.equal(new Set(courses.map((course) => course.courseCode)).size, 76);
  assert.equal(courses.filter((course) => course.courseType === 'programme_course').length, 55);
  assert.equal(courses.filter((course) => course.courseType === 'foundation').length, 21);
  assert(courses.every((course) => course.credits === 0));
  assert.match(byCode.PSYC1000.requirementGroups[0], /also listed in Faculty Package/);
  assert.equal(byCode.PSYC1630.titleEn, 'Positive Communication for Healthy Relationships');
  assert.match(byCode.PSYC1630.requirementGroups[0], /shorter title/);
  assert.equal(byCode.GPAD1001.titleEn, 'Introduction to Global Studies I');
  assert(courses.every((course) => course.sourceUrl === supplementFile.sourceUrl));

  assert.match(supplementFile.note, /55 unique Psychology Major code-title rows/);
  assert.match(supplementFile.note, /23 Faculty Package rows/);
  assert.match(supplementFile.note, /76 unique Programme-local codes/);
  assert.match(supplementFile.note, /credits=0 as unknown/);
  assert.match(supplementFile.note, /totalCreditRequired=0/);
});
