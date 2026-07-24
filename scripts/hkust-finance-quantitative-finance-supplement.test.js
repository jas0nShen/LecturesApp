const assert = require('node:assert/strict');
const test = require('node:test');
const supplementFile = require('../data/ug-course-supplements/hkust-finance-quantitative-finance-curricula-2025.json');
const { addGenericCourseSupplements } = require('./generate-ug-catalog');
const { validateSupplement } = require('./validate-ug-supplements');

function applySupplement(programmeName, programmeId) {
  const rawSupplement = supplementFile.supplements.find((item) => item.programmeName === programmeName);
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
      id: programmeId,
      universityCode: 'HKUST',
      nameEn: programmeName,
      sourceStatus: 'programme_summary_only',
      courseCount: 1,
      codedCourseCount: 0
    }],
    majors: [{
      id: `${programmeId}-M1`,
      programmeId,
      nameEn: programmeName,
      courseCount: 1,
      codedCourseCount: 0
    }],
    courses: []
  };
  addGenericCourseSupplements(catalogue, [supplement]);
  return catalogue;
}

test('HKUST BBA in Finance preserves the official required and alternative course codes', () => {
  const catalogue = applySupplement('BBA in Finance', 'HKUST-UG-JS5312-26');
  const courses = catalogue.courses;
  const byCode = Object.fromEntries(courses.map((course) => [course.courseCode, course]));

  assert.equal(catalogue.programmes[0].sourceStatus, 'course_codes_available');
  assert.equal(catalogue.programmes[0].codedCourseCount, 12);
  assert.equal(catalogue.majors[0].codedCourseCount, 12);
  assert.equal(courses.length, 12);
  assert.equal(new Set(courses.map((course) => course.courseCode)).size, 12);
  assert.equal(byCode.FINA3001.credits, 1);
  assert.equal(byCode.FINA3810.credits, 0);
  assert.match(byCode.ACCT3010.requirementGroups[0], /ACCT3010 and ACCT3020, or ACCT3030/);
  assert.match(byCode.COMP1023.requirementGroups[0], /choose one/);
  assert(!courses.some((course) => course.courseCode === 'FINA3XXX'));
});

test('HKUST BSc in Quantitative Finance preserves the bounded Area B and Area C pools', () => {
  const catalogue = applySupplement('BSc in Quantitative Finance', 'HKUST-UG-JS5332-45');
  const courses = catalogue.courses;
  const core = courses.filter((course) => course.courseType === 'core');
  const areaB = courses.filter((course) => course.requirementGroups[0].includes('Area B'));
  const areaC = courses.filter((course) => course.requirementGroups[0].includes('Area C'));
  const byCode = Object.fromEntries(courses.map((course) => [course.courseCode, course]));

  assert.equal(catalogue.programmes[0].sourceStatus, 'course_codes_available');
  assert.equal(catalogue.programmes[0].codedCourseCount, 40);
  assert.equal(catalogue.majors[0].codedCourseCount, 40);
  assert.equal(courses.length, 40);
  assert.equal(new Set(courses.map((course) => course.courseCode)).size, 40);
  assert.equal(core.length, 12);
  assert.equal(areaB.length, 12);
  assert.equal(areaC.length, 16);
  assert.equal(byCode.COMP2012H.credits, 5);
  assert.equal(byCode.MATH2023.credits, 4);
  assert.equal(byCode.FINA3810.credits, 0);
  assert(!courses.some((course) => /3000|4000/.test(course.courseCode)));
});
