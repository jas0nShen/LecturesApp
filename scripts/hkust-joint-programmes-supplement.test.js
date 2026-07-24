const assert = require('node:assert/strict');
const test = require('node:test');
const supplementFile = require('../data/ug-course-supplements/hkust-joint-programmes-curricula-2025.json');
const { addGenericCourseSupplements } = require('./generate-ug-catalog');
const { validateSupplement } = require('./validate-ug-supplements');

const EXPECTED = {
  'HKUST-UG-JS5813-BSC-IN-MATHEMATICS-AND-ECONOMICS-38': 45,
  'HKUST-UG-JS5814-BSC-IN-RISK-MANAGEMENT-AND-BUSINESS-INTEL-47': 85,
  'HKUST-UG-JS5822-BSC-IN-SUSTAINABLE-AND-GREEN-FINANCE-49': 33
};

function validateAndApply(supplement) {
  validateSupplement({
    provider: supplementFile.provider,
    academicYear: supplementFile.academicYear,
    ...supplement
  }, 0);

  const majorIds = supplement.programmeId.includes('JS5814')
    ? [supplement.majorId, `${supplement.programmeId}-M2`]
    : [supplement.majorId];
  const catalogue = {
    programmes: [{
      id: supplement.programmeId,
      universityCode: 'HKUST',
      nameEn: supplement.programmeName,
      sourceStatus: 'programme_summary_only',
      courseCount: majorIds.length,
      codedCourseCount: 0
    }],
    majors: majorIds.map((id, index) => ({
      id,
      programmeId: supplement.programmeId,
      nameEn: index === 0 ? supplement.programmeName : 'Dual Degree 4+1 Pathway',
      courseCount: 1,
      codedCourseCount: 0
    })),
    courses: []
  };
  addGenericCourseSupplements(catalogue, [{
    provider: supplementFile.provider,
    academicYear: supplementFile.academicYear,
    ...supplement
  }]);
  return catalogue;
}

test('HKUST joint Programme supplements validate and contain the exact bounded code sets', () => {
  assert.equal(supplementFile.academicYear, '2025/26');
  assert.match(supplementFile.note, /2026-27 requirements for the 2025-26 intake/);
  assert.equal(supplementFile.supplements.length, 3);

  for (const supplement of supplementFile.supplements) {
    validateSupplement({
      provider: supplementFile.provider,
      academicYear: supplementFile.academicYear,
      ...supplement
    }, 0);
    const expected = EXPECTED[supplement.programmeId];
    const codes = supplement.courses.map((course) => course.code);
    assert.equal(supplement.courses.length, expected);
    assert.equal(new Set(codes).size, expected);
    assert.equal(supplement.majorId, `${supplement.programmeId}-M1`);
    assert(!codes.some((code) => /(?:ECON|FINA)(?:3|4)XXX/.test(code)));
  }
});

test('MAEC preserves alternatives, elective minimums, and the deleted LIFS 1030 row', () => {
  const supplement = supplementFile.supplements.find((item) => item.programmeId.includes('JS5813'));
  const catalogue = validateAndApply(supplement);
  const byCode = Object.fromEntries(catalogue.courses.map((course) => [course.courseCode, course]));

  assert.equal(catalogue.courses.length, 45);
  assert.equal(catalogue.programmes[0].codedCourseCount, 45);
  assert.equal(catalogue.majors[0].codedCourseCount, 45);
  assert.equal(byCode.ECON4670.credits, 0);
  assert.equal(byCode.PHYS1101.credits, 4);
  assert.match(byCode.MATH1013.requirementGroups[0], /MATH 1020 · 4-6 credits/);
  assert.match(byCode.MATH3423.requirementGroups[0], /minimum 6 credits/);
  assert.match(byCode.LIFS1030.requirementGroups[0], /last offered in 2020-21 and deleted subsequently/);
  assert.match(supplementFile.note, /ECON 4000-level-or-above elective requirement is 8 credits/);
});

test('RMBI applies all 85 unique codes to M1 only and leaves Dual Degree M2 untouched', () => {
  const supplement = supplementFile.supplements.find((item) => item.programmeId.includes('JS5814'));
  const catalogue = validateAndApply(supplement);
  const m1Courses = catalogue.courses.filter((course) => course.majorId === supplement.majorId);
  const m2Courses = catalogue.courses.filter((course) => course.majorId === `${supplement.programmeId}-M2`);
  const byCode = Object.fromEntries(m1Courses.map((course) => [course.courseCode, course]));
  const rawByCode = Object.fromEntries(supplement.courses.map((course) => [course.code, course]));

  assert.equal(m1Courses.length, 85);
  assert.equal(m2Courses.length, 0);
  assert.equal(catalogue.majors[0].codedCourseCount, 85);
  assert.equal(catalogue.majors[1].codedCourseCount, 0);
  assert.equal(rawByCode.RMBI3000.creditRange, '0-4');
  assert.match(supplement.note, /must complete all Option requirements in addition/);
  assert.equal(byCode.RMBI2001.credits, 0);
  assert.equal(byCode.COMP2012.credits, 4);
  assert.match(byCode.RMBI3020.requirementGroups[0], /last offered in 2021-22 and deleted subsequently/);
  assert.match(byCode.RMBI4220.requirementGroups[0], /Area 1: Risk Management/);
  assert.match(byCode.RMBI4220.requirementGroups[0], /Financial Technology Option Electives/);
  assert.match(byCode.RMBI3010.requirementGroups[0], /Area 2: Business Intelligence/);
  assert.match(byCode.ISOM3350.requirementGroups[0], /choose ISOM 3350 or IEDA 4500/);
  assert.match(byCode.ISOM3350.requirementGroups[0], /minimum 6 credits/);
});

test('SGFN preserves the calculus alternative, deleted MATH 1012 row, and sustainability minimum', () => {
  const supplement = supplementFile.supplements.find((item) => item.programmeId.includes('JS5822'));
  const catalogue = validateAndApply(supplement);
  const byCode = Object.fromEntries(catalogue.courses.map((course) => [course.courseCode, course]));

  assert.equal(catalogue.courses.length, 33);
  assert.equal(catalogue.programmes[0].codedCourseCount, 33);
  assert.equal(catalogue.majors[0].codedCourseCount, 33);
  assert.equal(byCode.FINA3810.credits, 0);
  assert.equal(byCode.MATH1012.credits, 4);
  assert.match(byCode.MATH1012.requirementGroups[0], /last offered in 2024-25 and deleted subsequently/);
  assert.match(byCode.MATH1003.requirementGroups[0], /3-4 credits attained/);
  assert.match(byCode.ENVR3220.requirementGroups[0], /minimum 3 credits/);
  assert.match(supplementFile.note, /FINA 3000-\/4000-level elective requirement is 3 credits/);
});
