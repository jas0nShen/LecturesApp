const assert = require('node:assert/strict');
const test = require('node:test');
const supplementFile = require('../data/ug-course-supplements/hkust-information-systems-curriculum-2025.json');
const { addGenericCourseSupplements } = require('./generate-ug-catalog');
const { validateSupplement } = require('./validate-ug-supplements');

const PROGRAMME_ID = 'HKUST-UG-JS5314-33';
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
      nameEn: 'BBA in Information Systems',
      sourceStatus: 'programme_summary_only',
      courseCount: 1,
      codedCourseCount: 0
    }],
    majors: [
      {
        id: MAJOR_ID,
        programmeId: PROGRAMME_ID,
        nameEn: 'BBA in Information Systems',
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

test('HKUST BBA in Information Systems binds the 2025-26 supplement to M1 without polluting M2', () => {
  const { catalogue, supplement } = applySupplement();
  const targetCourses = catalogue.courses.filter((course) => course.majorId === MAJOR_ID);
  const extendedMajorCourses = catalogue.courses.filter((course) => course.majorId === EXTENDED_MAJOR_ID);

  assert.equal(supplementFile.academicYear, '2025/26');
  assert.equal(supplement.programmeId, PROGRAMME_ID);
  assert.equal(supplement.majorId, MAJOR_ID);
  assert.equal(catalogue.programmes[0].sourceStatus, 'course_codes_available');
  assert.equal(catalogue.programmes[0].codedCourseCount, 9);
  assert.equal(catalogue.majors.find((major) => major.id === MAJOR_ID).codedCourseCount, 9);
  assert.equal(catalogue.majors.find((major) => major.id === EXTENDED_MAJOR_ID).codedCourseCount, 0);
  assert.equal(targetCourses.length, 9);
  assert.equal(new Set(targetCourses.map((course) => course.courseCode)).size, 9);
  assert.equal(extendedMajorCourses.length, 0);
});

test('HKUST BBA in Information Systems preserves explicit Major, optional Option, and open-pool boundaries', () => {
  const { catalogue, supplement } = applySupplement();
  const courses = catalogue.courses.filter((course) => course.majorId === MAJOR_ID);
  const byCode = Object.fromEntries(courses.map((course) => [course.courseCode, course]));
  const businessAnalytics = courses.filter((course) => (
    course.requirementGroups[0].startsWith('Optional Business Analytics Option')
  ));
  const auditing = courses.filter((course) => (
    course.requirementGroups[0].startsWith('Optional Information Systems Auditing Option')
  ));

  assert.deepEqual(
    courses.filter((course) => course.requirementGroups[0].startsWith('Major Required'))
      .map((course) => course.courseCode),
    ['ISOM3210', 'ISOM3260', 'ISOM3320', 'ISOM3400']
  );
  assert.deepEqual(businessAnalytics.map((course) => course.courseCode), ['ISOM3360', 'ISOM3900']);
  assert.deepEqual(auditing.map((course) => course.courseCode), ['ISOM4100', 'ISOM4300']);
  assert.match(byCode.ISOM3320.requirementGroups[0], /COMP 1021.*prior-course trigger/);
  assert.match(byCode.ISOM3400.requirementGroups[0], /COMP 1022P.*prior-course trigger/);
  assert.match(byCode.ISOM4400.requirementGroups[0], /at least 3 ISOM courses totaling at least 10 credits/);
  assert.match(byCode.ISOM4400.requirementGroups[0], /may reduce the minimum course count by one/);
  assert.match(byCode.ISOM4400.requirementGroups[0], /Option Required Courses may not be counted/);
  assert.match(byCode.ISOM4400.requirementGroups[0], /not a permanent closed elective pool/);
  assert.equal(byCode.ISOM4400.credits, 6);
  assert.match(byCode.ISOM4400.description, /anonymous IS elective credits/);
  assert(!byCode.COMP1021);
  assert(!byCode.COMP1022P);
  assert(!byCode.ISOM3000);
  assert(!byCode.ISOM4000);
  assert(!byCode.ISOM4490);
  assert.match(supplementFile.note, /ISOM 3000 and ISOM 4000 at 0-4 credits/);
  assert.match(supplementFile.note, /ISOM 4490 at 1-4 credits/);
  assert.match(supplementFile.note, /2026-27 catalog-linked pathway URL currently returns 404/);
  assert.equal(
    supplement.unavailable2026PathwayUrl,
    'https://ugadmin.hkust.edu.hk/prog_crs/ug/202627/pdf/26-27pw_is.pdf'
  );
});

test('HKUST BBA in Information Systems assigns only code-specific 2025-26 normative pathway placements', () => {
  const { catalogue } = applySupplement();
  const courses = catalogue.courses.filter((course) => course.majorId === MAJOR_ID);
  const byCode = Object.fromEntries(courses.map((course) => [course.courseCode, course]));

  assert.deepEqual([byCode.ISOM3210.recommendedYear, byCode.ISOM3210.semester], [3, 'Fall']);
  assert.deepEqual([byCode.ISOM3260.recommendedYear, byCode.ISOM3260.semester], [3, 'Spring']);
  assert.deepEqual([byCode.ISOM3320.recommendedYear, byCode.ISOM3320.semester], [2, 'Spring']);
  assert.deepEqual([byCode.ISOM3400.recommendedYear, byCode.ISOM3400.semester], [2, 'Spring']);
  assert.deepEqual([byCode.ISOM4100.recommendedYear, byCode.ISOM4100.semester], [4, 'Fall']);
  assert.deepEqual([byCode.ISOM4300.recommendedYear, byCode.ISOM4300.semester], [3, 'Spring']);
  assert.equal(byCode.ISOM4400.recommendedYear, 0);
  assert.equal(byCode.ISOM4400.semester, '');
  assert.equal(byCode.ISOM3360.recommendedYear, 0);
  assert.equal(byCode.ISOM3900.recommendedYear, 0);
  assert.match(byCode.ISOM4100.requirementGroups[0], /Year 3 Fall as another offered term/);
  assert.match(byCode.ISOM4300.requirementGroups[0], /Year 2 Spring as another offered term/);
});
