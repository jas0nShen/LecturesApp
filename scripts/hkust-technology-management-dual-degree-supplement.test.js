const assert = require('node:assert/strict');
const test = require('node:test');
const supplementFile = require('../data/ug-course-supplements/hkust-technology-management-dual-degree-courses-2025.json');
const { addGenericCourseSupplements } = require('./generate-ug-catalog');
const { validateSupplement } = require('./validate-ug-supplements');

test('HKUST T&M dual degree exposes nine Programme-specific TEMG rows without merging component Majors', () => {
  const [rawSupplement] = supplementFile.supplements;
  const supplement = {
    provider: supplementFile.provider,
    academicYear: supplementFile.academicYear,
    sourceUrl: supplementFile.sourceUrl,
    officialUrl: supplementFile.officialUrl,
    ...rawSupplement
  };
  validateSupplement(supplement, 0);

  const programmeId = 'HKUST-UG-JS5901-18';
  const catalogue = {
    programmes: [{
      id: programmeId, universityCode: 'HKUST', code: 'JS5901', jupasCode: 'JS5901',
      nameEn: 'Dual Degree Program in Technology & Management', sourceStatus: 'programme_summary_only',
      courseCount: 1, codedCourseCount: 0
    }],
    majors: [{
      id: `${programmeId}-M1`, programmeId,
      nameEn: 'Dual Degree Program in Technology & Management', courseCount: 1, codedCourseCount: 0
    }],
    courses: []
  };

  addGenericCourseSupplements(catalogue, [supplement]);
  const courses = catalogue.courses;
  const byCode = Object.fromEntries(courses.map((course) => [course.courseCode, course]));
  assert.equal(catalogue.programmes[0].sourceStatus, 'course_codes_available');
  assert.equal(catalogue.programmes[0].codedCourseCount, 9);
  assert.equal(catalogue.majors[0].codedCourseCount, 9);
  assert.equal(courses.length, 9);
  assert.equal(new Set(courses.map((course) => course.courseCode)).size, 9);
  assert.deepEqual(
    ['TEMG1011', 'TEMG1012', 'TEMG1013', 'TEMG1014', 'TEMG1015'].map((code) => byCode[code].recommendedYear),
    [1, 2, 3, 4, 5]
  );
  assert.equal(byCode.TEMG3950.credits, 3);
  assert.equal(byCode.TEMG4940.credits, 0);
  assert.equal(byCode.TEMG4950.credits, 0);
  assert.equal(byCode.TEMG4970.credits, 0);
  assert.match(byCode.TEMG4940.requirementGroups[0], /3-5/);
  assert.match(byCode.TEMG4970.requirementGroups[0], /1-5/);
  assert.match(supplementFile.note, /14 listed BEng\/BSc options/);
  assert.match(supplementFile.note, /six listed BBA options/);
  assert.match(supplementFile.note, /totalCreditRequired=0/);
});
