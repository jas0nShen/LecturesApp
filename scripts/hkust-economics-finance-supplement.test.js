const assert = require('node:assert/strict');
const test = require('node:test');
const supplementFile = require('../data/ug-course-supplements/hkust-economics-finance-curriculum-2025.json');
const { addGenericCourseSupplements } = require('./generate-ug-catalog');
const { validateSupplement } = require('./validate-ug-supplements');

const PROGRAMME_ID = 'HKUST-UG-JS5331-20';
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
      nameEn: 'BSc in Economics and Finance',
      sourceStatus: 'programme_summary_only',
      courseCount: 1,
      codedCourseCount: 0
    }],
    majors: [
      {
        id: MAJOR_ID,
        programmeId: PROGRAMME_ID,
        nameEn: 'BSc in Economics and Finance',
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

test('HKUST ECOF binds the 2025-26 supplement to the exact plain Major only', () => {
  const { catalogue, supplement } = applySupplement();
  const targetCourses = catalogue.courses.filter((course) => course.majorId === MAJOR_ID);
  const extendedMajorCourses = catalogue.courses.filter((course) => course.majorId === EXTENDED_MAJOR_ID);

  assert.equal(supplementFile.academicYear, '2025/26');
  assert.match(supplementFile.note, /cohort-specific to students admitted in 2025-26/);
  assert.equal(supplement.programmeId, PROGRAMME_ID);
  assert.equal(supplement.majorId, MAJOR_ID);
  assert.equal(catalogue.programmes[0].sourceStatus, 'course_codes_available');
  assert.equal(catalogue.programmes[0].codedCourseCount, 68);
  assert.equal(catalogue.majors.find((major) => major.id === MAJOR_ID).codedCourseCount, 68);
  assert.equal(catalogue.majors.find((major) => major.id === EXTENDED_MAJOR_ID).codedCourseCount, 0);
  assert.equal(targetCourses.length, 68);
  assert.equal(new Set(targetCourses.map((course) => course.courseCode)).size, 68);
  assert.equal(extendedMajorCourses.length, 0);
});

test('HKUST ECOF preserves exact Major and applicable BSc School requirement codes', () => {
  const { catalogue } = applySupplement();
  const courses = catalogue.courses.filter((course) => course.majorId === MAJOR_ID);
  const byCode = Object.fromEntries(courses.map((course) => [course.courseCode, course]));
  const majorRequired = courses.filter((course) => course.requirementGroups[0].startsWith('Major Required'));
  const schoolRequirements = courses.filter((course) => course.requirementGroups[0].startsWith('School Requirements'));

  assert.deepEqual(
    majorRequired.map((course) => course.courseCode),
    ['ECON2174', 'MATH2023', 'ECON3113', 'ECON3133', 'ECON3143', 'ECON3334', 'FINA3103']
  );
  assert.equal(schoolRequirements.length, 15);
  assert.match(byCode.ECON2174.requirementGroups[0], /choose ECON2174 or MATH2023/);
  assert.match(byCode.ECON3123.requirementGroups[0], /BSc ECOF students can only use ECON3123/);
  assert(!byCode.ECON2123);
  assert(!byCode.ACCT2200);
  assert(!byCode.ISOM2700);
  assert(!byCode.MARK2120);
  assert(!byCode.MGMT2110);
});

test('HKUST ECOF keeps both numbered elective pools open and avoids duplicating FINA3103', () => {
  const { catalogue } = applySupplement();
  const courses = catalogue.courses.filter((course) => course.majorId === MAJOR_ID);
  const econPool = courses.filter((course) => course.requirementGroups[0].startsWith('ECON Major Elective open pool'));
  const finaPool = courses.filter((course) => course.requirementGroups[0].startsWith('FINA Major Elective open pool'));

  assert.equal(econPool.length, 22);
  assert.equal(finaPool.length, 24);
  assert(econPool.every((course) => /choose any 3 courses \/ minimum 11 credits/.test(course.requirementGroups[0])));
  assert(finaPool.every((course) => /choose any 2 courses \/ minimum 6 credits/.test(course.requirementGroups[0])));
  assert([...econPool, ...finaPool].every((course) => /not a permanent closed graduation pool/.test(course.requirementGroups[0])));
  assert.equal(courses.filter((course) => course.courseCode === 'FINA3103').length, 1);
  assert.equal(courses.find((course) => course.courseCode === 'FINA3103').courseType, 'core');
  assert(!courses.some((course) => /XXXX|3000-LEVEL|4000-LEVEL/.test(course.courseCode)));
  assert.match(supplementFile.note, /not permanent closed graduation pools/);
});

test('HKUST ECOF preserves all official variable-credit ranges without inflating known totals', () => {
  const { catalogue, supplement } = applySupplement();
  const courses = catalogue.courses.filter((course) => course.majorId === MAJOR_ID);
  const byCode = Object.fromEntries(courses.map((course) => [course.courseCode, course]));
  const sourceByCode = Object.fromEntries(supplement.courses.map((course) => [course.code, course]));

  assert.equal(sourceByCode.ECON4959.creditRange, '1-4');
  assert.equal(sourceByCode.ECON4999.creditRange, '1-4');
  assert.equal(sourceByCode.FINA4919.creditRange, '1-4');
  assert.equal(sourceByCode.FINA4929.creditRange, '0-4');
  assert.equal(sourceByCode.FINA4929.creditsMin, 0);
  assert.equal(sourceByCode.FINA4929.creditsMax, 4);
  ['ECON4959', 'ECON4999', 'FINA4919', 'FINA4929'].forEach((code) => {
    assert.equal(byCode[code].credits, 0);
    assert.match(byCode[code].description, /variable/);
  });
});

test('HKUST ECOF assigns only code-specific 2025-26 normative pathway placements', () => {
  const { catalogue } = applySupplement();
  const courses = catalogue.courses.filter((course) => course.majorId === MAJOR_ID);
  const byCode = Object.fromEntries(courses.map((course) => [course.courseCode, course]));
  const openPools = courses.filter((course) => course.requirementGroups[0].includes('Elective open pool'));

  assert.deepEqual([byCode.ECON2174.recommendedYear, byCode.ECON2174.semester], [2, 'Fall']);
  assert.deepEqual([byCode.ECON3113.recommendedYear, byCode.ECON3113.semester], [2, 'Spring']);
  assert.deepEqual([byCode.ECON3133.recommendedYear, byCode.ECON3133.semester], [3, 'Fall']);
  assert.deepEqual([byCode.ECON3143.recommendedYear, byCode.ECON3143.semester], [3, 'Fall']);
  assert.deepEqual([byCode.ECON3334.recommendedYear, byCode.ECON3334.semester], [2, 'Fall']);
  assert.deepEqual([byCode.FINA3103.recommendedYear, byCode.FINA3103.semester], [2, 'Spring']);
  assert.deepEqual([byCode.ECON3123.recommendedYear, byCode.ECON3123.semester], [2, 'Spring']);
  assert.equal(byCode.MATH2023.recommendedYear, 0);
  assert.equal(byCode.ECON2113.recommendedYear, 0);
  assert.equal(byCode.MATH1013.recommendedYear, 0);
  assert(openPools.every((course) => course.recommendedYear === 0 && course.semester === ''));
});
