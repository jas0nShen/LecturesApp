const assert = require('node:assert/strict');
const test = require('node:test');
const supplementFile = require('../data/ug-course-supplements/hkust-individualized-interdisciplinary-major-framework-2025.json');
const { addGenericCourseSupplements } = require('./generate-ug-catalog');
const { validateSupplement } = require('./validate-ug-supplements');

const COMPUTING = 'COMP1021 COMP1022P COMP1023 ISOM2010'.split(' ');
const MATHEMATICS = 'MATH1003 MATH1005 MATH1006 MATH1013 MATH1020 MATH1023'.split(' ');

test('HKUST IIM exposes the 13 official coded rows without fabricating the individualized curriculum', () => {
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
      id: 'HKUST-UG-N-A-31', universityCode: 'HKUST', code: 'N/A', jupasCode: 'N/A',
      nameEn: 'BSc in Individualized Interdisciplinary Major', sourceStatus: 'programme_summary_only',
      courseCount: 1, codedCourseCount: 0
    }],
    majors: [{
      id: 'HKUST-UG-N-A-31-M1', programmeId: 'HKUST-UG-N-A-31',
      nameEn: 'BSc in Individualized Interdisciplinary Major', courseCount: 1, codedCourseCount: 0
    }],
    courses: []
  };

  addGenericCourseSupplements(catalogue, [supplement]);
  const courses = catalogue.courses;
  const byCode = Object.fromEntries(courses.map((course) => [course.courseCode, course]));
  assert.equal(catalogue.programmes[0].sourceStatus, 'course_codes_available');
  assert.equal(catalogue.programmes[0].codedCourseCount, 13);
  assert.equal(catalogue.majors[0].codedCourseCount, 13);
  assert.equal(courses.length, 13);
  assert.equal(new Set(courses.map((course) => course.courseCode)).size, 13);
  assert(COMPUTING.every((code) => byCode[code].requirementGroups[0].includes('computing fundamental')));
  assert(MATHEMATICS.every((code) => byCode[code].requirementGroups[0].includes('mathematics fundamental')));
  assert.equal(courses.filter((course) => course.courseType === 'capstone').length, 2);
  assert.equal(byCode.IIMP2000.credits, 0);
  assert.match(byCode.COMP1022P.requirementGroups[0], /deleted subsequently/);
  assert(courses.every((course) => course.sourceUrl === supplementFile.sourceUrl));
  assert.match(supplementFile.note, /13 unique coded rows/);
  assert.match(supplementFile.note, /at least 48 required credits and 18 elective credits/);
  assert.match(supplementFile.note, /totalCreditRequired=0/);
});
