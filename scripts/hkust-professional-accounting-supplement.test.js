const assert = require('node:assert/strict');
const test = require('node:test');
const supplementFile = require('../data/ug-course-supplements/hkust-professional-accounting-curriculum-2025.json');
const { addGenericCourseSupplements } = require('./generate-ug-catalog');
const { validateSupplement } = require('./validate-ug-supplements');

const PROGRAMME_ID = 'HKUST-UG-JS5318-44';
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
      nameEn: 'BBA in Professional Accounting',
      sourceStatus: 'programme_summary_only',
      courseCount: 1,
      codedCourseCount: 0
    }],
    majors: [
      {
        id: MAJOR_ID,
        programmeId: PROGRAMME_ID,
        nameEn: 'BBA in Professional Accounting',
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

test('HKUST Professional Accounting binds the 2025-26 supplement to the exact plain Major only', () => {
  const { catalogue, supplement } = applySupplement();
  const targetCourses = catalogue.courses.filter((course) => course.majorId === MAJOR_ID);
  const extendedMajorCourses = catalogue.courses.filter((course) => course.majorId === EXTENDED_MAJOR_ID);

  assert.equal(supplementFile.academicYear, '2025/26');
  assert.match(supplementFile.note, /cohort-specific to students admitted in 2025-26/);
  assert.equal(supplement.programmeId, PROGRAMME_ID);
  assert.equal(supplement.majorId, MAJOR_ID);
  assert.equal(catalogue.programmes[0].sourceStatus, 'course_codes_available');
  assert.equal(catalogue.programmes[0].codedCourseCount, 37);
  assert.equal(catalogue.majors.find((major) => major.id === MAJOR_ID).codedCourseCount, 37);
  assert.equal(catalogue.majors.find((major) => major.id === EXTENDED_MAJOR_ID).codedCourseCount, 0);
  assert.equal(targetCourses.length, 37);
  assert.equal(new Set(targetCourses.map((course) => course.courseCode)).size, 37);
  assert.equal(extendedMajorCourses.length, 0);
});

test('HKUST Professional Accounting preserves Major, BBA School and accounting qualification boundaries', () => {
  const { catalogue } = applySupplement();
  const courses = catalogue.courses.filter((course) => course.majorId === MAJOR_ID);
  const byCode = Object.fromEntries(courses.map((course) => [course.courseCode, course]));
  const pdfRequired = courses.filter((course) => /explicitly named by the 2025-26 Major Requirements PDF/.test(course.requirementGroups[0]));
  const schoolRequirements = courses.filter((course) => course.requirementGroups[0].startsWith('School Requirements'));

  assert.deepEqual(
    pdfRequired.map((course) => course.courseCode),
    ['ACCT3010', 'ACCT3020', 'ACCT3210', 'ACCT3610', 'ACCT3880', 'ACCT4010', 'ACCT4510']
  );
  assert.equal(schoolRequirements.length, 20);
  assert.match(byCode.ECON2123.requirementGroups[0], /BBA majors should take ECON2123/);
  assert.match(byCode.ECON3123.requirementGroups[0], /only BSc ECOF students may use ECON3123/);
  assert.match(byCode.ECON3123.requirementGroups[0], /complete official alternative list/);
  assert(!byCode.ACCT3030);
  assert.match(supplementFile.note, /ACCT 3030 is excluded/);
});

test('HKUST Professional Accounting keeps the ACCT4410 source conflict explicit', () => {
  const { catalogue } = applySupplement();
  const course = catalogue.courses.find((item) => item.majorId === MAJOR_ID && item.courseCode === 'ACCT4410');

  assert(course);
  assert.equal(course.courseType, 'core');
  assert.equal(course.credits, 3);
  assert.deepEqual([course.recommendedYear, course.semester], [4, 'Spring']);
  assert.match(course.requirementGroups[0], /normative pathway lists Major Required/);
  assert.match(course.requirementGroups[0], /Major Requirements PDF omits ACCT4410/);
  assert.match(course.requirementGroups[0], /manual review required/);
  assert.match(supplementFile.note, /official sources conflict on ACCT 4410/);
});

test('HKUST Professional Accounting preserves the optional Accounting Analytics Option and no-reuse rule', () => {
  const { catalogue } = applySupplement();
  const courses = catalogue.courses.filter((course) => course.majorId === MAJOR_ID);
  const optionCourses = courses.filter((course) => course.courseType === 'option');
  const byCode = Object.fromEntries(optionCourses.map((course) => [course.courseCode, course]));

  assert.deepEqual(optionCourses.map((course) => course.courseCode), ['ACCT4710', 'ISOM3400']);
  assert(optionCourses.every((course) => /both ACCT4710 and ISOM3400 required/.test(course.requirementGroups[0])));
  assert(optionCourses.every((course) => /6 credits in addition to the Major/.test(course.requirementGroups[0])));
  assert(optionCourses.every((course) => /may not be reused for the Major elective/.test(course.requirementGroups[0])));
  assert.deepEqual([byCode.ACCT4710.recommendedYear, byCode.ACCT4710.semester], [4, 'Fall']);
  assert.deepEqual([byCode.ISOM3400.recommendedYear, byCode.ISOM3400.semester], [3, 'Fall']);
});

test('HKUST Professional Accounting keeps the dated open pool and variable credits without closing the rule', () => {
  const { catalogue, supplement } = applySupplement();
  const courses = catalogue.courses.filter((course) => course.majorId === MAJOR_ID);
  const openPool = courses.filter((course) => course.requirementGroups[0].startsWith('Major Elective open pool'));
  const byCode = Object.fromEntries(courses.map((course) => [course.courseCode, course]));
  const source4980 = supplement.courses.find((course) => course.code === 'ACCT4980');

  assert.equal(openPool.length, 7);
  assert(openPool.every((course) => /choose 1 course \/ minimum 3 credits/.test(course.requirementGroups[0])));
  assert(openPool.every((course) => /not a permanent closed graduation pool/.test(course.requirementGroups[0])));
  assert.equal(source4980.creditRange, '1-4');
  assert.equal(source4980.creditsMin, 1);
  assert.equal(source4980.creditsMax, 4);
  assert.equal(byCode.ACCT4980.credits, 0);
  assert.match(byCode.ACCT4980.description, /0 means unknown/);
  assert(!courses.some((course) => /XXXX|3000-LEVEL/.test(course.courseCode)));
});

test('HKUST Professional Accounting assigns only code-specific 2025-26 pathway placements', () => {
  const { catalogue } = applySupplement();
  const courses = catalogue.courses.filter((course) => course.majorId === MAJOR_ID);
  const byCode = Object.fromEntries(courses.map((course) => [course.courseCode, course]));
  const openPool = courses.filter((course) => course.requirementGroups[0].startsWith('Major Elective open pool'));

  assert.deepEqual([byCode.ACCT3010.recommendedYear, byCode.ACCT3010.semester], [3, 'Fall']);
  assert.deepEqual([byCode.ACCT3020.recommendedYear, byCode.ACCT3020.semester], [3, 'Spring']);
  assert.deepEqual([byCode.ACCT3210.recommendedYear, byCode.ACCT3210.semester], [3, 'Spring']);
  assert.deepEqual([byCode.ACCT3610.recommendedYear, byCode.ACCT3610.semester], [3, 'Fall']);
  assert.deepEqual([byCode.ACCT4010.recommendedYear, byCode.ACCT4010.semester], [4, 'Fall']);
  assert.deepEqual([byCode.ACCT4510.recommendedYear, byCode.ACCT4510.semester], [4, 'Fall']);
  assert.equal(byCode.ECON2113.recommendedYear, 0);
  assert.equal(byCode.MATH1013.recommendedYear, 0);
  assert(openPool.every((course) => course.recommendedYear === 0 && course.semester === ''));
});
