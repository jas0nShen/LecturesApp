const assert = require('node:assert/strict');
const test = require('node:test');
const supplementFile = require('../data/ug-course-supplements/cuhk-socin-sociology-courses-2025.json');
const { addGenericCourseSupplements } = require('./generate-ug-catalog');
const { validateSupplement } = require('./validate-ug-supplements');

const EXPECTED_CODES = `
SOCI1001 SOCI1002 SOCI2003 SOCI2004 SOCI2104 SOCI3003 SOCI3223 SOCI3231 SOCI4010 SOCI4020
SOCI2101 SOCI2103 SOCI2106 SOCI2116 SOCI2203 SOCI2208 SOCI2216 SOCI2218 SOCI2219 SOCI2220
SOCI3001 SOCI3002 SOCI3102 SOCI3204 SOCI3207 SOCI3208 SOCI3221 SOCI3224 SOCI3225 SOCI3226
SOCI3227 SOCI3229 SOCI3230 SOCI3233 SOCI3234 SOCI3235 SOCI3236 SOCI3237 SOCI3238 SOCI3239
SOCI3240 SOCI3241 SOCI3242 SOCI3243 SOCI3244 SOCI3245 SOCI3451 SOCI3452 SOCI3453
SOCI4201 SOCI4202 SOCI4204 SOCI4205 SOCI4208 SOCI4209 SOCI4210 SOCI4211
SOCI4351 SOCI4352 SOCI4353 SOCI4410 SOCI4420
`.trim().split(/\s+/).sort();

test('CUHK Sociology preserves the 2025-26 62-course Major pool as browse-only', () => {
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
      id: 'CUHK-UG-SOCIN-83',
      universityCode: 'CUHK',
      code: 'SOCIN',
      jupasCode: 'JS4886',
      nameEn: 'Sociology',
      sourceStatus: 'programme_summary_only',
      courseCount: 1,
      codedCourseCount: 0
    }],
    majors: [{
      id: 'CUHK-UG-SOCIN-83-M1',
      programmeId: 'CUHK-UG-SOCIN-83',
      nameEn: 'Sociology',
      courseCount: 1,
      codedCourseCount: 0
    }],
    courses: []
  };

  addGenericCourseSupplements(catalogue, [supplement]);

  const courses = catalogue.courses;
  const byCode = Object.fromEntries(courses.map((course) => [course.courseCode, course]));

  assert.equal(catalogue.programmes[0].sourceStatus, 'course_codes_available');
  assert.equal(catalogue.programmes[0].codedCourseCount, 62);
  assert.equal(catalogue.majors[0].codedCourseCount, 62);
  assert.equal(courses.length, 62);
  assert.deepEqual(courses.map((course) => course.courseCode).sort(), EXPECTED_CODES);

  assert.equal(courses.filter((course) => course.courseType === 'core').length, 8);
  assert.equal(courses.filter((course) => course.courseType === 'capstone').length, 2);
  assert.equal(courses.filter((course) => course.courseType === 'internship').length, 1);
  assert.equal(courses.filter((course) => course.courseType === 'major_elective').length, 51);
  assert(courses.every((course) => course.credits === 3));

  assert.equal(byCode.SOCI1001.recommendedYear, 1);
  assert.equal(byCode.SOCI2003.semester, 'Term 1');
  assert.equal(byCode.SOCI4010.courseType, 'capstone');
  assert.equal(byCode.SOCI4020.semester, 'Term 2');
  assert.equal(byCode.SOCI4211.courseType, 'internship');
  assert.match(byCode.SOCI3245.requirementGroups[0], /supervisor review/);
  assert.equal(byCode.SOCI1102, undefined);

  assert.match(supplementFile.note, /minimum of 69 units/);
  assert.match(supplementFile.note, /assigning 3 units/);
  assert.match(supplementFile.note, /browse-only/);
});
