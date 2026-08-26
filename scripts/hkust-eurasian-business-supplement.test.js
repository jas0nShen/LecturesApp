const assert = require('node:assert/strict');
const test = require('node:test');
const supplementFile = require('../data/ug-course-supplements/hkust-eurasian-business-curriculum-current.json');
const { addGenericCourseSupplements } = require('./generate-ug-catalog');
const { validateSupplement } = require('./validate-ug-supplements');

test('HKUST Eurasian Business exposes 33 official coded rows without expanding its open elective pools', () => {
  const [rawSupplement] = supplementFile.supplements;
  const supplement = {
    provider: supplementFile.provider,
    academicYear: supplementFile.academicYear,
    sourceUrl: supplementFile.sourceUrl,
    officialUrl: supplementFile.officialUrl,
    ...rawSupplement
  };
  validateSupplement(supplement, 0);

  const programmeId = 'HKUST-UG-BBA-IN-EURASIAN-BUSINESS-25';
  const catalogue = {
    programmes: [{
      id: programmeId, universityCode: 'HKUST', code: '', jupasCode: '',
      nameEn: 'BBA in Eurasian Business', sourceStatus: 'programme_summary_only',
      courseCount: 1, codedCourseCount: 0
    }],
    majors: [{
      id: `${programmeId}-M1`, programmeId,
      nameEn: 'BBA in Eurasian Business', courseCount: 1, codedCourseCount: 0
    }],
    courses: []
  };

  addGenericCourseSupplements(catalogue, [supplement]);
  const courses = catalogue.courses;
  const byCode = Object.fromEntries(courses.map((course) => [course.courseCode, course]));
  assert.equal(catalogue.programmes[0].sourceStatus, 'course_codes_available');
  assert.equal(catalogue.programmes[0].codedCourseCount, 33);
  assert.equal(catalogue.majors[0].codedCourseCount, 33);
  assert.equal(courses.length, 33);
  assert.equal(new Set(courses.map((course) => course.courseCode)).size, 33);
  assert.equal(courses.filter((course) => course.requirementGroups[0].includes('business core')).length, 16);
  assert.equal(courses.filter((course) => course.requirementGroups[0].includes('business major')).length, 10);
  assert.equal(courses.filter((course) => course.requirementGroups[0].includes('bounded NUGSB')).length, 6);
  assert.equal(byCode.ISOM2600.credits, 1);
  assert.equal(byCode.MATH161.credits, 4);
  assert.equal(byCode.MGMT2130.credits, 2);
  assert.equal(byCode.LEGL1000.credits, 0);
  assert(['KAZ150', 'KAZ201', 'KAZ202', 'RFL103'].every((code) => byCode[code]));
  assert.match(byCode.EABU3040.requirementGroups[0], /Asia rather than Eurasia/);
  assert.match(supplementFile.note, /120-credit structure/);
  assert.match(supplementFile.note, /33 unique explicit codes/);
  assert.match(supplementFile.note, /totalCreditRequired=0/);
});
