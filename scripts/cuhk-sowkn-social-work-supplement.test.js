const assert = require('node:assert/strict');
const test = require('node:test');
const supplementFile = require('../data/ug-course-supplements/cuhk-sowkn-social-work-courses-2026.json');
const { addGenericCourseSupplements } = require('./generate-ug-catalog');
const { validateSupplement } = require('./validate-ug-supplements');

const EXPECTED_CODES = `
SOWK1001 SOWK2001 SOWK2020 SOWK2050 SOWK2110 SOWK2140
SOWK2210 SOWK2220 SOWK2230 SOWK2430
SOWK3240 SOWK3250 SOWK3310 SOWK3320 SOWK3340 SOWK3410 SOWK3420
SOWK4020 SOWK4030 SOWK4350 SOWK4410 SOWK4420
SOWK4510 SOWK4520 SOWK4530 SOWK4540 SOWK4550 SOWK4570
SOWK4580 SOWK4590 SOWK4591 SOWK4592
`.trim().split(/\s+/).sort();

test('CUHK Social Work preserves the current 32-course Study Scheme list as browse-only', () => {
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
      id: 'CUHK-UG-SOWKN-81',
      universityCode: 'CUHK',
      code: 'SOWKN',
      jupasCode: 'JS4874',
      nameEn: 'Social Work',
      sourceStatus: 'programme_summary_only',
      courseCount: 1,
      codedCourseCount: 0
    }],
    majors: [{
      id: 'CUHK-UG-SOWKN-81-M1',
      programmeId: 'CUHK-UG-SOWKN-81',
      nameEn: 'Social Work',
      courseCount: 1,
      codedCourseCount: 0
    }],
    courses: []
  };

  addGenericCourseSupplements(catalogue, [supplement]);

  const courses = catalogue.courses;
  const byCode = Object.fromEntries(courses.map((course) => [course.courseCode, course]));

  assert.equal(catalogue.programmes[0].sourceStatus, 'course_codes_available');
  assert.equal(catalogue.programmes[0].codedCourseCount, 32);
  assert.equal(catalogue.majors[0].codedCourseCount, 32);
  assert.equal(courses.length, 32);
  assert.deepEqual(courses.map((course) => course.courseCode).sort(), EXPECTED_CODES);

  assert.equal(courses.filter((course) => course.courseType === 'core').length, 14);
  assert.equal(courses.filter((course) => course.courseType === 'internship').length, 4);
  assert.equal(courses.filter((course) => course.courseType === 'major_elective').length, 14);
  assert.equal(courses.filter((course) => /Year 4 option pool/.test(course.requirementGroups[0])).length, 11);
  assert.equal(courses.filter((course) => /Major Required choice/.test(course.requirementGroups[0])).length, 2);

  assert.equal(byCode.SOWK1001.credits, 3);
  assert.equal(byCode.SOWK1001.semester, 'Term 1');
  assert.equal(byCode.SOWK2050.recommendedYear, 2);
  assert.equal(byCode.SOWK3410.credits, 4);
  assert.equal(byCode.SOWK4580.credits, 0);
  assert.match(byCode.SOWK4580.description, /units cell blank/);
  assert(courses.every((course) => course.sourceUrl.startsWith('https://web.swk.cuhk.edu.hk/')));

  assert.match(supplementFile.note, /minimum 72-unit Study Scheme/);
  assert.match(supplementFile.note, /SOWK4580 units cell blank/);
  assert.match(supplementFile.note, /browse-only/);
});
