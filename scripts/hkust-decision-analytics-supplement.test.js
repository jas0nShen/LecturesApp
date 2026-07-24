const assert = require('node:assert/strict');
const test = require('node:test');
const supplementFile = require('../data/ug-course-supplements/hkust-decision-analytics-curriculum-2025.json');
const { addGenericCourseSupplements } = require('./generate-ug-catalog');
const { validateSupplement } = require('./validate-ug-supplements');

test('HKUST Decision Analytics preserves the two bounded elective areas and exact Major identity', () => {
  const supplement = {
    provider: supplementFile.provider,
    academicYear: supplementFile.academicYear,
    sourceUrl: supplementFile.sourceUrl,
    officialUrl: supplementFile.officialUrl,
    ...supplementFile.supplements[0]
  };
  validateSupplement(supplement, 0);

  const programmeId = 'HKUST-UG-JS5260-DEPARTMENT-OF-INDUSTRIAL-ENGINEERING-AND--17';
  const catalogue = {
    programmes: [{
      id: programmeId,
      universityCode: 'HKUST',
      nameEn: 'BEng in Decision Analytics',
      sourceStatus: 'programme_summary_only',
      courseCount: 1,
      codedCourseCount: 0
    }],
    majors: [
      {
        id: `${programmeId}-M1`,
        programmeId,
        nameEn: 'BEng in Decision Analytics',
        courseCount: 1,
        codedCourseCount: 0
      },
      {
        id: `${programmeId}-M2`,
        programmeId,
        nameEn: 'Synthetic isolation control',
        courseCount: 0,
        codedCourseCount: 0
      }
    ],
    courses: []
  };

  addGenericCourseSupplements(catalogue, [supplement]);
  const targetCourses = catalogue.courses.filter((course) => course.majorId === `${programmeId}-M1`);
  const controlCourses = catalogue.courses.filter((course) => course.majorId === `${programmeId}-M2`);
  const byCode = Object.fromEntries(targetCourses.map((course) => [course.courseCode, course]));
  const financialEngineering = targetCourses.filter((course) => (
    course.requirementGroups[0].includes('Financial Engineering')
  ));
  const consultingServices = targetCourses.filter((course) => (
    course.requirementGroups[0].includes('Consulting Services')
  ));
  const sourceIeda4000 = supplement.courses.find((course) => course.code === 'IEDA4000');

  assert.equal(catalogue.programmes[0].sourceStatus, 'course_codes_available');
  assert.equal(catalogue.programmes[0].codedCourseCount, 41);
  assert.equal(catalogue.majors[0].codedCourseCount, 41);
  assert.equal(targetCourses.length, 41);
  assert.equal(new Set(targetCourses.map((course) => course.courseCode)).size, 41);
  assert.equal(controlCourses.length, 0);
  assert.equal(financialEngineering.length, 7);
  assert.equal(consultingServices.length, 7);
  assert.equal(targetCourses.filter((course) => course.courseCode === 'IEDA4510').length, 1);
  assert.match(byCode.IEDA4510.requirementGroups[0], /Financial Engineering or Consulting Services/);
  assert.match(byCode.IEDA3180.requirementGroups[0], /last offered in 2024-25 and deleted subsequently/);
  assert.equal(sourceIeda4000.creditRange, '1-3');
  assert.equal(byCode.IEDA4000.credits, 0);
  assert.match(byCode.IEDA4000.description, /0 means unknown/);
  assert.equal(byCode.IEDA4901.credits, 6);
  assert.equal(byCode.COMP2012H.credits, 5);
  assert(!targetCourses.some((course) => course.courseCode === 'IEDAXXXX'));
});
