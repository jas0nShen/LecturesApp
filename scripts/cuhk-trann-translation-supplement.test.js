const assert = require('node:assert/strict');
const test = require('node:test');
const supplementFile = require('../data/ug-course-supplements/cuhk-trann-translation-courses-2025.json');
const { addGenericCourseSupplements } = require('./generate-ug-catalog');
const { validateSupplement } = require('./validate-ug-supplements');

const EXPECTED_CODES = `
TRAN1010 TRAN1030 TRAN2070 TRAN2610 TRAN4510 TRAN4520 TRAN4900
TRAN2120 TRAN3080 TRAN3720 TRAN4070 TRAN4210
TRAN2140 TRAN2150 TRAN2240 TRAN2250 TRAN3240
TRAN1120 TRAN1130 TRAN2020 TRAN2050 TRAN2110 TRAN2130 TRAN2840
TRAN3170 TRAN3180 TRAN3270 TRAN3280 TRAN3620 TRAN3800 TRAN3810
TRAN3820 TRAN3830 TRAN3844 TRAN3845 TRAN3850 TRAN3860 TRAN3870
TRAN3880 TRAN3890 TRAN4800
`.trim().split(/\s+/).sort();

test('CUHK Translation preserves the current 41-course Major list as browse-only', () => {
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
      id: 'CUHK-UG-TRANN-16',
      universityCode: 'CUHK',
      code: 'TRANN',
      jupasCode: 'JS4123',
      nameEn: 'Translation',
      sourceStatus: 'programme_summary_only',
      courseCount: 1,
      codedCourseCount: 0
    }],
    majors: [{
      id: 'CUHK-UG-TRANN-16-M1',
      programmeId: 'CUHK-UG-TRANN-16',
      nameEn: 'Translation',
      courseCount: 1,
      codedCourseCount: 0
    }],
    courses: []
  };

  addGenericCourseSupplements(catalogue, [supplement]);

  const courses = catalogue.courses;
  const byCode = Object.fromEntries(courses.map((course) => [course.courseCode, course]));
  assert.equal(catalogue.programmes[0].sourceStatus, 'course_codes_available');
  assert.equal(catalogue.programmes[0].codedCourseCount, 41);
  assert.equal(catalogue.majors[0].codedCourseCount, 41);
  assert.equal(courses.length, 41);
  assert.deepEqual(courses.map((course) => course.courseCode).sort(), EXPECTED_CODES);

  assert.equal(courses.filter((course) => course.courseType === 'core').length, 4);
  assert.equal(courses.filter((course) => course.courseType === 'capstone').length, 3);
  assert.equal(courses.filter((course) => course.courseType === 'major_elective').length, 34);
  assert.equal(courses.filter((course) => /Cluster A: Translation Studies/.test(course.requirementGroups[0])).length, 5);
  assert.equal(courses.filter((course) => /Cluster B: Interpreting/.test(course.requirementGroups[0])).length, 5);
  assert(courses.every((course) => course.credits === 3));
  assert.equal(byCode.TRAN1010.recommendedYear, 1);
  assert.equal(byCode.TRAN2610.recommendedYear, 2);
  assert.equal(byCode.TRAN4510.recommendedYear, 4);
  assert.match(byCode.TRAN4900.requirementGroups[0], /thesis language/);
  assert.equal(byCode.TRAN4120, undefined);
  assert.equal(byCode.TRAN4050, undefined);
  assert.equal(byCode.TRAN4840, undefined);
  assert.equal(byCode.TRAN1000, undefined);
  assert(courses.every((course) => course.sourceUrl === supplementFile.sourceUrl));

  assert.match(supplementFile.note, /66-unit Translation Major/);
  assert.match(supplementFile.note, /all 41 current departmental courses/);
  assert.match(supplementFile.note, /TRAN4120/);
  assert.match(supplementFile.note, /TRAN4050 and TRAN4840/);
  assert.match(supplementFile.note, /browse-only/);
});
