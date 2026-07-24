const assert = require('node:assert/strict');
const test = require('node:test');
const supplementFile = require('../data/ug-course-supplements/hkust-quantitative-social-analysis-curriculum-2025.json');
const { addGenericCourseSupplements } = require('./generate-ug-catalog');
const { validateSupplement } = require('./validate-ug-supplements');

test('HKUST Quantitative Social Analysis preserves the bounded official lists and exact Major identity', () => {
  const supplement = {
    provider: supplementFile.provider,
    academicYear: supplementFile.academicYear,
    sourceUrl: supplementFile.sourceUrl,
    officialUrl: supplementFile.officialUrl,
    ...supplementFile.supplements[0]
  };
  validateSupplement(supplement, 0);

  const programmeId = 'HKUST-UG-JS5412-46';
  const catalogue = {
    programmes: [{
      id: programmeId,
      universityCode: 'HKUST',
      nameEn: 'BSc in Quantitative Social Analysis',
      sourceStatus: 'programme_summary_only',
      courseCount: 1,
      codedCourseCount: 0
    }],
    majors: [
      {
        id: `${programmeId}-M1`,
        programmeId,
        nameEn: 'BSc in Quantitative Social Analysis',
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
  const foundations = targetCourses.filter((course) => course.requirementGroups[0].includes('Foundation'));
  const methodological = targetCourses.filter((course) => course.requirementGroups[0].includes('QSA Methodological'));

  assert.equal(catalogue.programmes[0].sourceStatus, 'course_codes_available');
  assert.equal(catalogue.programmes[0].codedCourseCount, 41);
  assert.equal(catalogue.majors[0].codedCourseCount, 41);
  assert.equal(targetCourses.length, 41);
  assert.equal(new Set(targetCourses.map((course) => course.courseCode)).size, 41);
  assert.equal(controlCourses.length, 0);
  assert.equal(foundations.length, 8);
  assert.equal(methodological.length, 17);
  assert.equal(byCode.SOSC3200.credits, 1);
  assert.equal(byCode.MATH2421.credits, 4);
  assert.equal(byCode.MARK3220.credits, 4);
  assert.match(byCode.SOSC1450.requirementGroups[0], /deleted subsequently/);
  assert.match(byCode.SOSC3600.requirementGroups[0], /deleted subsequently/);
  assert(!targetCourses.some((course) => course.courseCode === 'SOSCXXXX'));
});
