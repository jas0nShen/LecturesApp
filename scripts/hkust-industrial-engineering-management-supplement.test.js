const assert = require('node:assert/strict');
const test = require('node:test');
const supplementFile = require('../data/ug-course-supplements/hkust-industrial-engineering-management-curriculum-2025.json');
const { addGenericCourseSupplements } = require('./generate-ug-catalog');
const { validateSupplement } = require('./validate-ug-supplements');

const PROGRAMME_ID = 'HKUST-UG-JS5260-DEPARTMENT-OF-INDUSTRIAL-ENGINEERING-AND--32';
const MAJOR_ID = `${PROGRAMME_ID}-M1`;

function applySupplement() {
  const supplement = {
    provider: supplementFile.provider,
    academicYear: supplementFile.academicYear,
    sourceUrl: supplementFile.sourceUrl,
    officialUrl: supplementFile.officialUrl,
    ...supplementFile.supplements[0]
  };
  validateSupplement(supplement, 0);

  const catalogue = {
    programmes: [{
      id: PROGRAMME_ID,
      universityCode: 'HKUST',
      nameEn: 'BEng in Industrial Engineering and Engineering Management',
      sourceStatus: 'programme_summary_only',
      courseCount: 1,
      codedCourseCount: 0
    }],
    majors: [{
      id: MAJOR_ID,
      programmeId: PROGRAMME_ID,
      nameEn: 'BEng in Industrial Engineering and Engineering Management',
      courseCount: 1,
      codedCourseCount: 0
    }],
    courses: []
  };

  addGenericCourseSupplements(catalogue, [supplement]);
  return { catalogue, supplement };
}

test('HKUST IEEM binds all 49 explicit 2025-26 codes to the exact Programme and Major', () => {
  const { catalogue, supplement } = applySupplement();
  const courses = catalogue.courses.filter((course) => course.majorId === MAJOR_ID);

  assert.equal(supplement.programmeId, PROGRAMME_ID);
  assert.equal(supplement.majorId, MAJOR_ID);
  assert.equal(catalogue.programmes[0].sourceStatus, 'course_codes_available');
  assert.equal(catalogue.programmes[0].codedCourseCount, 49);
  assert.equal(catalogue.majors[0].codedCourseCount, 49);
  assert.equal(courses.length, 49);
  assert.equal(new Set(courses.map((course) => course.courseCode)).size, 49);
});

test('HKUST IEEM preserves Engineering Fundamental and Major Required alternatives', () => {
  const { catalogue } = applySupplement();
  const courses = catalogue.courses;
  const byCode = Object.fromEntries(courses.map((course) => [course.courseCode, course]));
  const engineeringFundamentals = courses.filter((course) => course.requirementGroups[0].startsWith('Engineering Fundamental'));

  assert.equal(engineeringFundamentals.length, 13);
  assert.match(byCode.MATH1013.requirementGroups[0], /together with MATH 1014 or MATH 1024, or take MATH 1020/);
  assert.match(byCode.IEDA4901.requirementGroups[0], /Research Option students must take IEDA 4901/);
  assert.match(byCode.IEDA4960.requirementGroups[0], /unavailable to Research Option students/);
  assert.match(byCode.ECON2103.requirementGroups[0], /ECON 2103 or ECON 2113/);
  assert.deepEqual([byCode.IEDA1010.credits, byCode.IEDA1020.credits, byCode.IEDA1901.credits], [0, 0, 0]);
});

test('HKUST IEEM preserves its bounded elective list, variable credits, and both optional Options', () => {
  const { catalogue } = applySupplement();
  const courses = catalogue.courses;
  const byCode = Object.fromEntries(courses.map((course) => [course.courseCode, course]));
  const industrialElectives = courses.filter((course) => course.requirementGroups[0].startsWith('Industrial Engineering Electives'));
  const financialOption = courses.filter((course) => course.requirementGroups[0].startsWith('Optional Financial Engineering'));
  const researchOption = courses.filter((course) => course.requirementGroups[0].startsWith('Optional Research Option'));

  assert.equal(industrialElectives.length, 12);
  assert.equal(financialOption.length, 5);
  assert.equal(researchOption.length, 3);
  assert.equal(byCode.IEDA4000.credits, 0);
  assert.match(byCode.IEDA4000.requirementGroups[0], /variable credit range 1-3/);
  assert.match(byCode.IEDA3330.requirementGroups[0], /CGA 3.0 or above/);
  assert.match(byCode.IEDA4900.requirementGroups[0], /advisor-approved/);
  assert.equal(byCode.ISOM4530.credits, 4);
  assert(courses.every((course) => course.recommendedYear === 0));
});
