const assert = require('node:assert/strict');
const test = require('node:test');
const supplementFile = require('../data/ug-course-supplements/cuhk-theon-theology-courses-2025.json');
const { addGenericCourseSupplements } = require('./generate-ug-catalog');
const { validateSupplement } = require('./validate-ug-supplements');

const EXPECTED_CODES = `
CURE1122 PHIL1110
THEO1211 THEO1212 THEO2211 THEO2212 THEO2213 THEO2214 THEO2215 THEO2216
THEO2221 THEO2224 THEO2231 THEO2234 THEO2235 THEO2236 THEO2241 THEO2251
THEO3213 THEO3214 THEO3215 THEO3216 THEO3217 THEO3218
THEO3220 THEO3221 THEO3222 THEO3229 THEO3235 THEO3236
THEO3240 THEO3241 THEO3242 THEO3244 THEO3245 THEO3246 THEO3247 THEO3248
THEO3252 THEO3254 THEO3255 THEO3256 THEO4241 THEO4242
`.trim().split(/\s+/).sort();

test('CUHK Theology preserves the current 44-course BA Major and Area list as browse-only', () => {
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
      id: 'CUHK-UG-THEON-15',
      universityCode: 'CUHK',
      code: 'THEON',
      jupasCode: 'JS4111',
      nameEn: 'Theology',
      sourceStatus: 'programme_summary_only',
      courseCount: 1,
      codedCourseCount: 0
    }],
    majors: [{
      id: 'CUHK-UG-THEON-15-M1',
      programmeId: 'CUHK-UG-THEON-15',
      nameEn: 'Theology',
      courseCount: 1,
      codedCourseCount: 0
    }],
    courses: []
  };

  addGenericCourseSupplements(catalogue, [supplement]);

  const courses = catalogue.courses;
  const byCode = Object.fromEntries(courses.map((course) => [course.courseCode, course]));
  const areaCount = (area) => courses.filter((course) => course.requirementGroups.some((group) => group.includes(`Area ${area}:`))).length;

  assert.equal(catalogue.programmes[0].sourceStatus, 'course_codes_available');
  assert.equal(catalogue.programmes[0].codedCourseCount, 44);
  assert.equal(catalogue.majors[0].codedCourseCount, 44);
  assert.equal(courses.length, 44);
  assert.deepEqual(courses.map((course) => course.courseCode).sort(), EXPECTED_CODES);

  assert.equal(courses.filter((course) => course.courseType === 'core').length, 10);
  assert.equal(courses.filter((course) => course.courseType === 'major_elective').length, 34);
  assert.equal(areaCount(1), 14);
  assert.equal(areaCount(2), 6);
  assert.equal(areaCount(3), 6);
  assert.equal(areaCount(4), 11);
  assert.equal(areaCount(5), 5);
  assert.equal(courses.filter((course) => course.credits === 2).length, 3);
  assert.equal(courses.filter((course) => /repeatable in different terms/.test(course.requirementGroups[0])).length, 10);

  assert.equal(byCode.THEO2224.credits, 3);
  assert.equal(byCode.THEO2234.titleEn, 'Catholic Dogmatics');
  assert.equal(byCode.THEO3245.credits, 2);
  assert.equal(byCode.THEO4241.recommendedYear, 4);
  assert(courses.every((course) => course.sourceUrl === supplementFile.sourceUrl));

  assert.match(supplementFile.note, /44 unique courses/);
  assert.match(supplementFile.note, /THEO2224 unit cell blank/);
  assert.match(supplementFile.note, /Catholic Dogmatics/);
  assert.match(supplementFile.note, /browse-only/);
});
