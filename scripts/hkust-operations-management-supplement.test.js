const assert = require('node:assert/strict');
const test = require('node:test');
const supplementFile = require('../data/ug-course-supplements/hkust-operations-management-curriculum-2025.json');
const { addGenericCourseSupplements } = require('./generate-ug-catalog');
const { validateSupplement } = require('./validate-ug-supplements');

const PROGRAMME_ID = 'HKUST-UG-JS5317-42';
const MAJOR_ID = `${PROGRAMME_ID}-M1`;
const EXTENDED_MAJOR_ID = `${PROGRAMME_ID}-M2`;

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
      nameEn: 'BBA in Operations Management',
      sourceStatus: 'programme_summary_only',
      courseCount: 1,
      codedCourseCount: 0
    }],
    majors: [
      {
        id: MAJOR_ID,
        programmeId: PROGRAMME_ID,
        nameEn: 'BBA in Operations Management',
        courseCount: 1,
        codedCourseCount: 0
      },
      {
        id: EXTENDED_MAJOR_ID,
        programmeId: PROGRAMME_ID,
        nameEn: 'Business with Extended Major in AI / DMCA / SUST',
        courseCount: 1,
        codedCourseCount: 0
      }
    ],
    courses: []
  };

  addGenericCourseSupplements(catalogue, [supplement]);
  return { catalogue, supplement };
}

test('HKUST BBA in Operations Management binds all explicit rows only to the plain M1 Major', () => {
  const { catalogue, supplement } = applySupplement();
  const targetCourses = catalogue.courses.filter((course) => course.majorId === MAJOR_ID);
  const extendedMajorCourses = catalogue.courses.filter((course) => course.majorId === EXTENDED_MAJOR_ID);

  assert.equal(supplementFile.academicYear, '2025/26');
  assert.equal(supplement.programmeId, PROGRAMME_ID);
  assert.equal(supplement.majorId, MAJOR_ID);
  assert.equal(catalogue.programmes[0].sourceStatus, 'course_codes_available');
  assert.equal(catalogue.programmes[0].codedCourseCount, 19);
  assert.equal(catalogue.majors.find((major) => major.id === MAJOR_ID).codedCourseCount, 19);
  assert.equal(catalogue.majors.find((major) => major.id === EXTENDED_MAJOR_ID).codedCourseCount, 0);
  assert.equal(targetCourses.length, 19);
  assert.equal(new Set(targetCourses.map((course) => course.courseCode)).size, 19);
  assert.equal(extendedMajorCourses.length, 0);
});

test('HKUST BBA in Operations Management preserves the restricted pool and both optional Options', () => {
  const { catalogue } = applySupplement();
  const courses = catalogue.courses.filter((course) => course.majorId === MAJOR_ID);
  const byCode = Object.fromEntries(courses.map((course) => [course.courseCode, course]));
  const required = courses.filter((course) => course.courseType === 'core');
  const restricted = courses.filter((course) => course.requirementGroups[0].startsWith('Restricted OM elective list'));
  const businessAnalyticsRequired = courses.filter((course) => course.requirementGroups[0].startsWith('Optional Business Analytics'));
  const supplyChainOnly = courses.filter((course) => course.requirementGroups[0].startsWith('Optional Supply Chain'));

  assert.deepEqual(required.map((course) => course.courseCode), ['ISOM3710', 'ISOM3770']);
  assert.equal(restricted.length, 12);
  assert.deepEqual(businessAnalyticsRequired.map((course) => course.courseCode), ['ISOM3360', 'ISOM3900']);
  assert.deepEqual(supplyChainOnly.map((course) => course.courseCode), ['ISOM3730', 'ISOM4750', 'ISOM3760']);
  assert.match(byCode.ISOM4740.requirementGroups[0], /also one of four alternatives/);
  assert.match(byCode.ISOM4780.requirementGroups[0], /no duplicate counting/);
  assert.match(byCode.ISOM3360.requirementGroups[0], /may not count toward the OM elective requirement/);
  assert.equal(byCode.ISOM3530.credits, 4);
  assert.equal(byCode.ISOM3540.credits, 3);
});

test('HKUST BBA in Operations Management keeps the no-Option range open instead of fabricating rows', () => {
  const { catalogue } = applySupplement();
  const courses = catalogue.courses.filter((course) => course.majorId === MAJOR_ID);

  assert.match(supplementFile.note, /3500-3999 except ISOM 3780, or 4500-4999/);
  assert.match(supplementFile.note, /not converted into a permanent closed graduation pool/);
  assert(!courses.some((course) => course.courseCode === 'ISOM3780'));
  assert(!courses.some((course) => /3XXX|4XXX/.test(course.courseCode)));
  assert(courses.every((course) => course.recommendedYear === 0));
});
