const assert = require('node:assert/strict');
const test = require('node:test');
const supplementFile = require('../data/ug-course-supplements/hkust-economics-curriculum-2025.json');
const { addGenericCourseSupplements } = require('./generate-ug-catalog');
const { validateSupplement } = require('./validate-ug-supplements');

const PROGRAMME_ID = 'HKUST-UG-JS5311-19';
const MAJOR_ID = `${PROGRAMME_ID}-M1`;
const EXTENDED_MAJOR_ID = `${PROGRAMME_ID}-M2`;

function applySupplement() {
  const rawSupplement = supplementFile.supplements[0];
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
      id: PROGRAMME_ID,
      universityCode: 'HKUST',
      nameEn: 'BBA in Economics',
      sourceStatus: 'programme_summary_only',
      courseCount: 1,
      codedCourseCount: 0
    }],
    majors: [
      {
        id: MAJOR_ID,
        programmeId: PROGRAMME_ID,
        nameEn: 'BBA in Economics',
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

test('HKUST BBA in Economics binds the 2025-26 cohort supplement to the exact plain Major only', () => {
  const { catalogue, supplement } = applySupplement();
  const targetCourses = catalogue.courses.filter((course) => course.majorId === MAJOR_ID);
  const extendedMajorCourses = catalogue.courses.filter((course) => course.majorId === EXTENDED_MAJOR_ID);

  assert.equal(supplementFile.academicYear, '2025/26');
  assert.match(supplementFile.note, /cohort-specific to students admitted in 2025-26/);
  assert.equal(supplement.programmeId, PROGRAMME_ID);
  assert.equal(supplement.majorId, MAJOR_ID);
  assert.equal(catalogue.programmes[0].sourceStatus, 'course_codes_available');
  assert.equal(catalogue.programmes[0].codedCourseCount, 45);
  assert.equal(catalogue.majors.find((major) => major.id === MAJOR_ID).codedCourseCount, 45);
  assert.equal(catalogue.majors.find((major) => major.id === EXTENDED_MAJOR_ID).codedCourseCount, 0);
  assert.equal(targetCourses.length, 45);
  assert.equal(new Set(targetCourses.map((course) => course.courseCode)).size, 45);
  assert.equal(extendedMajorCourses.length, 0);
});

test('HKUST BBA in Economics preserves Major, School and BBA-only requirement groups', () => {
  const { catalogue } = applySupplement();
  const courses = catalogue.courses.filter((course) => course.majorId === MAJOR_ID);
  const byCode = Object.fromEntries(courses.map((course) => [course.courseCode, course]));
  const majorRequired = courses.filter((course) => course.requirementGroups[0].startsWith('Major Required'));
  const schoolRequirements = courses.filter((course) => course.requirementGroups[0].startsWith('School Requirements'));

  assert.deepEqual(majorRequired.map((course) => course.courseCode), ['ECON3014', 'ECON3024', 'ECON3334']);
  assert.equal(schoolRequirements.length, 20);
  assert.equal(byCode.ISOM2020.credits, 1);
  assert.equal(byCode.ISOM2600.credits, 1);
  assert.equal(byCode.MATH1020.credits, 4);
  assert.match(byCode.ECON2103.requirementGroups[0], /choose ECON2103 or ECON2113/);
  assert.match(byCode.ECON3123.requirementGroups[0], /other students should take ECON2123/);
  assert.match(byCode.ACCT2200.requirementGroups[0], /BBA majors required/);
});

test('HKUST BBA in Economics keeps the 2025-26 4000-level catalog snapshot open and cohort-bounded', () => {
  const { catalogue } = applySupplement();
  const courses = catalogue.courses.filter((course) => course.majorId === MAJOR_ID);
  const openPool = courses.filter((course) => course.requirementGroups[0].startsWith('Major Elective open pool'));
  const byCode = Object.fromEntries(openPool.map((course) => [course.courseCode, course]));

  assert.equal(openPool.length, 22);
  assert(openPool.every((course) => /choose any 3 courses \/ minimum 11 credits/.test(course.requirementGroups[0])));
  assert(openPool.every((course) => /not a permanent closed graduation pool/.test(course.requirementGroups[0])));
  assert.equal(byCode.ECON4284.credits, 4);
  assert.match(byCode.ECON4284.requirementGroups[0], /retained for the 2025-26 cohort and deleted from the 2026-27 catalog/);
  assert(!byCode.ECON4255);
  assert(!courses.some((course) => /XXXX|4000-LEVEL/.test(course.courseCode)));
  assert.match(supplementFile.note, /not a permanent closed graduation pool/);
});

test('HKUST BBA in Economics preserves variable credits without inflating known-credit totals', () => {
  const { catalogue, supplement } = applySupplement();
  const courses = catalogue.courses.filter((course) => course.majorId === MAJOR_ID);
  const byCode = Object.fromEntries(courses.map((course) => [course.courseCode, course]));
  const source4959 = supplement.courses.find((course) => course.code === 'ECON4959');
  const source4999 = supplement.courses.find((course) => course.code === 'ECON4999');

  assert.equal(source4959.creditRange, '1-4');
  assert.equal(source4959.creditsMin, 1);
  assert.equal(source4959.creditsMax, 4);
  assert.equal(source4999.creditRange, '1-4');
  assert.equal(byCode.ECON4959.credits, 0);
  assert.equal(byCode.ECON4999.credits, 0);
  assert.match(byCode.ECON4959.description, /0 means unknown/);
  assert.match(byCode.ECON4999.description, /0 means unknown/);
  assert.equal(byCode.ECON4670.credits, 0);
  assert.equal(byCode.ECON4800.credits, 3);
});

test('HKUST BBA in Economics assigns only code-specific 2025-26 normative pathway placements', () => {
  const { catalogue } = applySupplement();
  const courses = catalogue.courses.filter((course) => course.majorId === MAJOR_ID);
  const byCode = Object.fromEntries(courses.map((course) => [course.courseCode, course]));
  const openPool = courses.filter((course) => course.requirementGroups[0].startsWith('Major Elective open pool'));

  assert.deepEqual(
    [byCode.ECON3014.recommendedYear, byCode.ECON3014.semester],
    [2, 'Spring']
  );
  assert.deepEqual(
    [byCode.ECON3024.recommendedYear, byCode.ECON3024.semester],
    [3, 'Spring']
  );
  assert.deepEqual(
    [byCode.ECON3334.recommendedYear, byCode.ECON3334.semester],
    [3, 'Fall']
  );
  assert.deepEqual(
    [byCode.ACCT2010.recommendedYear, byCode.ACCT2010.semester],
    [1, 'Fall']
  );
  assert.deepEqual(
    [byCode.ACCT2200.recommendedYear, byCode.ACCT2200.semester],
    [2, 'Spring']
  );
  assert.equal(byCode.ECON2113.recommendedYear, 0);
  assert.equal(byCode.ECON3123.recommendedYear, 0);
  assert.equal(byCode.MATH1013.recommendedYear, 0);
  assert(openPool.every((course) => course.recommendedYear === 0 && course.semester === ''));
});
