const assert = require('node:assert/strict');
const test = require('node:test');
const supplementFile = require('../data/ug-course-supplements/hkust-general-business-management-curriculum-2025.json');
const { addGenericCourseSupplements } = require('./generate-ug-catalog');
const { validateSupplement } = require('./validate-ug-supplements');

const PROGRAMME_ID = 'HKUST-UG-BBA-IN-GENERAL-BUSINESS-MANAGEMENT-27';
const MAJOR_ID = `${PROGRAMME_ID}-M1`;
const OTHER_PROGRAMME_ID = 'HKUST-UG-SYNTHETIC-GBM-CONTROL';

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
    programmes: [
      {
        id: PROGRAMME_ID,
        universityCode: 'HKUST',
        nameEn: 'BBA in General Business Management',
        sourceStatus: 'programme_summary_only',
        courseCount: 1,
        codedCourseCount: 0
      },
      {
        id: OTHER_PROGRAMME_ID,
        universityCode: 'HKUST',
        nameEn: 'Control Programme',
        sourceStatus: 'programme_summary_only',
        courseCount: 1,
        codedCourseCount: 0
      }
    ],
    majors: [
      {
        id: MAJOR_ID,
        programmeId: PROGRAMME_ID,
        nameEn: 'BBA in General Business Management',
        courseCount: 1,
        codedCourseCount: 0
      },
      {
        id: `${OTHER_PROGRAMME_ID}-M1`,
        programmeId: OTHER_PROGRAMME_ID,
        nameEn: 'Control Major',
        courseCount: 1,
        codedCourseCount: 0
      }
    ],
    courses: []
  };

  addGenericCourseSupplements(catalogue, [supplement]);
  return { catalogue, supplement };
}

test('HKUST General Business Management binds the complete dated snapshot only to its exact Major', () => {
  const { catalogue, supplement } = applySupplement();
  const targetCourses = catalogue.courses.filter((course) => course.majorId === MAJOR_ID);
  const controlCourses = catalogue.courses.filter((course) => course.programmeId === OTHER_PROGRAMME_ID);

  assert.equal(supplementFile.academicYear, '2025/26');
  assert.match(supplementFile.note, /cohort-specific to students admitted in 2025-26/);
  assert.equal(supplement.programmeId, PROGRAMME_ID);
  assert.equal(supplement.majorId, MAJOR_ID);
  assert.equal(catalogue.programmes[0].sourceStatus, 'course_codes_available');
  assert.equal(catalogue.programmes[0].codedCourseCount, 198);
  assert.equal(catalogue.majors[0].codedCourseCount, 198);
  assert.equal(targetCourses.length, 198);
  assert.equal(new Set(targetCourses.map((course) => course.courseCode)).size, 198);
  assert.equal(controlCourses.length, 0);
});

test('HKUST General Business Management preserves every official School requirement and alternative', () => {
  const { catalogue } = applySupplement();
  const courses = catalogue.courses.filter((course) => course.majorId === MAJOR_ID);
  const schoolCourses = courses.filter((course) => course.requirementGroups[0].startsWith('School Requirements'));
  const byCode = Object.fromEntries(courses.map((course) => [course.courseCode, course]));

  assert.equal(schoolCourses.length, 20);
  assert.deepEqual(
    schoolCourses.map((course) => course.courseCode),
    [
      'ACCT2010', 'ACCT2200',
      'ECON2103', 'ECON2113', 'ECON2123', 'ECON3123',
      'FINA2303',
      'ISOM2010', 'ISOM2020', 'ISOM2500', 'ISOM2600', 'ISOM2700',
      'MARK2120',
      'MGMT2010', 'MGMT2110', 'MGMT2130',
      'MATH1003', 'MATH1013', 'MATH1020', 'MATH1023'
    ]
  );
  assert.match(byCode.ECON2103.requirementGroups[0], /choose ECON2103 or ECON2113/);
  assert.match(byCode.ECON3123.requirementGroups[0], /only BSc ECOF students may use ECON3123/);
  assert.match(byCode.ECON3123.requirementGroups[0], /GBM students should take ECON2123/);
  assert.match(byCode.MATH1020.requirementGroups[0], /3-4 credits attained/);
  assert.equal(byCode.MATH1020.credits, 4);
  assert(schoolCourses.every((course) => /may not be reused for the Major/.test(course.requirementGroups[0])));
  assert.match(supplementFile.note, /total 39-40 credits/);
});

test('HKUST General Business Management keeps the six-department elective snapshot and open boundary exact', () => {
  const { catalogue } = applySupplement();
  const courses = catalogue.courses.filter((course) => course.majorId === MAJOR_ID);
  const pool = courses.filter((course) => course.courseType === 'major_elective');
  const counts = Object.fromEntries(
    ['ACCT', 'ECON', 'FINA', 'ISOM', 'MARK', 'MGMT']
      .map((prefix) => [prefix, pool.filter((course) => course.courseCode.startsWith(prefix)).length])
  );

  assert.equal(pool.length, 178);
  assert.deepEqual(counts, {
    ACCT: 19,
    ECON: 35,
    FINA: 28,
    ISOM: 60,
    MARK: 15,
    MGMT: 21
  });
  assert(pool.every((course) => /any 9 SB&M courses \/ minimum 29 credits/.test(course.requirementGroups[0])));
  assert(pool.every((course) => /at least 4 courses at 3000-level or above/.test(course.requirementGroups[0])));
  assert(pool.every((course) => /not a permanent closed graduation pool/.test(course.requirementGroups[0])));
  assert(pool.every((course) => /prerequisites, exclusions, offering and the no-reuse rule/.test(course.requirementGroups[0])));
  assert(!pool.some((course) => ['ACCT2010', 'ECON2103', 'ISOM2010', 'MGMT2110'].includes(course.courseCode)));
});

test('HKUST General Business Management preserves variable-credit ranges without inflating known totals', () => {
  const { catalogue, supplement } = applySupplement();
  const courses = catalogue.courses.filter((course) => course.majorId === MAJOR_ID);
  const byCode = Object.fromEntries(courses.map((course) => [course.courseCode, course]));
  const sourceByCode = Object.fromEntries(supplement.courses.map((course) => [course.code, course]));
  const variableCodes = supplement.courses.filter((course) => course.creditRange).map((course) => course.code);

  assert.equal(variableCodes.length, 16);
  assert.deepEqual(
    [sourceByCode.ACCT4980.creditsMin, sourceByCode.ACCT4980.creditsMax, sourceByCode.ACCT4980.creditRange],
    [1, 4, '1-4']
  );
  assert.deepEqual(
    [sourceByCode.FINA4929.creditsMin, sourceByCode.FINA4929.creditsMax, sourceByCode.FINA4929.creditRange],
    [0, 4, '0-4']
  );
  assert.deepEqual(
    [sourceByCode.MARK4980.creditsMin, sourceByCode.MARK4980.creditsMax, sourceByCode.MARK4980.creditRange],
    [2, 4, '2-4']
  );
  assert.equal(byCode.ACCT4980.credits, 0);
  assert.equal(byCode.FINA4929.credits, 0);
  assert.equal(byCode.MARK4980.credits, 0);
  assert.match(byCode.ACCT4980.description, /0 means unknown/);
});

test('HKUST General Business Management assigns only code-specific School pathway placements', () => {
  const { catalogue } = applySupplement();
  const courses = catalogue.courses.filter((course) => course.majorId === MAJOR_ID);
  const byCode = Object.fromEntries(courses.map((course) => [course.courseCode, course]));
  const pool = courses.filter((course) => course.courseType === 'major_elective');

  assert.deepEqual([byCode.ACCT2010.recommendedYear, byCode.ACCT2010.semester], [1, 'Fall']);
  assert.deepEqual([byCode.ACCT2200.recommendedYear, byCode.ACCT2200.semester], [2, 'Spring']);
  assert.deepEqual([byCode.ECON2103.recommendedYear, byCode.ECON2103.semester], [1, 'Spring']);
  assert.deepEqual([byCode.ECON2123.recommendedYear, byCode.ECON2123.semester], [2, 'Fall']);
  assert.deepEqual([byCode.MGMT2130.recommendedYear, byCode.MGMT2130.semester], [3, 'Fall']);
  assert.deepEqual([byCode.MATH1003.recommendedYear, byCode.MATH1003.semester], [1, 'Fall']);
  assert.equal(byCode.ECON2113.recommendedYear, 0);
  assert.equal(byCode.ECON3123.recommendedYear, 0);
  assert.equal(byCode.MATH1013.recommendedYear, 0);
  assert(pool.every((course) => course.recommendedYear === 0 && course.semester === ''));
  assert.match(supplementFile.note, /anonymous GBM elective blocks of 8, 7, 8 and 6 credits/);
});
