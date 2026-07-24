const assert = require('node:assert/strict');
const test = require('node:test');
const supplementFile = require('../data/ug-course-supplements/hkust-global-business-curriculum-2025.json');
const { addGenericCourseSupplements } = require('./generate-ug-catalog');
const { validateSupplement } = require('./validate-ug-supplements');

const PROGRAMME_ID = 'HKUST-UG-JS5313-28';
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
      nameEn: 'BBA in Global Business',
      sourceStatus: 'programme_summary_only',
      courseCount: 1,
      codedCourseCount: 0
    }],
    majors: [
      {
        id: MAJOR_ID,
        programmeId: PROGRAMME_ID,
        nameEn: 'BBA in Global Business',
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

test('HKUST BBA in Global Business binds all 43 explicit codes to M1 without polluting M2', () => {
  const { catalogue, supplement } = applySupplement();
  const targetCourses = catalogue.courses.filter((course) => course.majorId === MAJOR_ID);
  const extendedMajorCourses = catalogue.courses.filter((course) => course.majorId === EXTENDED_MAJOR_ID);

  assert.equal(supplementFile.academicYear, '2025/26');
  assert.equal(supplement.programmeId, PROGRAMME_ID);
  assert.equal(supplement.majorId, MAJOR_ID);
  assert.equal(catalogue.programmes[0].sourceStatus, 'course_codes_available');
  assert.equal(catalogue.programmes[0].codedCourseCount, 43);
  assert.equal(catalogue.majors.find((major) => major.id === MAJOR_ID).codedCourseCount, 43);
  assert.equal(catalogue.majors.find((major) => major.id === EXTENDED_MAJOR_ID).codedCourseCount, 0);
  assert.equal(targetCourses.length, 43);
  assert.equal(new Set(targetCourses.map((course) => course.courseCode)).size, 43);
  assert.equal(extendedMajorCourses.length, 0);
});

test('HKUST BBA in Global Business preserves required alternatives and both bounded elective areas', () => {
  const { catalogue } = applySupplement();
  const courses = catalogue.courses.filter((course) => course.majorId === MAJOR_ID);
  const byCode = Object.fromEntries(courses.map((course) => [course.courseCode, course]));
  const required = courses.filter((course) => course.requirementGroups[0].startsWith('Major Required'));
  const areaA = courses.filter((course) => course.requirementGroups[0].includes('Area A:'));
  const areaB = courses.filter((course) => course.requirementGroups[0].includes('Area B:'));

  assert.deepEqual(
    required.map((course) => course.courseCode),
    ['GBUS1000', 'GBUS2010', 'GBUS2040', 'GBUS3030', 'ISOM4780', 'GBUS4910']
  );
  assert.equal(areaA.length, 16);
  assert.equal(areaB.length, 22);
  assert.equal(courses.filter((course) => course.courseCode === 'ISOM4780').length, 1);
  assert.match(byCode.ISOM4780.requirementGroups[0], /choose GBUS 3030 or ISOM 4780/);
  assert.match(byCode.ISOM4780.requirementGroups[0], /Area B: Business Strategy and Innovation/);
  assert(areaA.every((course) => /at least 6 credits from each area/.test(course.requirementGroups[0])));
  assert(areaB.every((course) => /at least 2 GBUS-offered courses/.test(course.requirementGroups[0])));
  assert(areaA.every((course) => /additional SBM major may not be counted/.test(course.requirementGroups[0])));
  assert.match(byCode.MARK4290F.requirementGroups[0], /MARK 4290 Special Topics umbrella/);
});

test('HKUST BBA in Global Business keeps ranged and variable-credit boundaries without fabricated rows', () => {
  const { catalogue, supplement } = applySupplement();
  const courses = catalogue.courses.filter((course) => course.majorId === MAJOR_ID);
  const byCode = Object.fromEntries(courses.map((course) => [course.courseCode, course]));
  const sourceTemg = supplement.courses.find((course) => course.code === 'TEMG4950');

  assert.match(byCode.GBUS2040.requirementGroups[0], /SBMT 2100-2110/);
  assert.match(byCode.GBUS2040.requirementGroups[0], /not expanded into fabricated individual course codes/);
  assert(!courses.some((course) => /^SBMT21(?:0\\d|10)$/.test(course.courseCode)));
  assert.equal(sourceTemg.creditRange, '3-5');
  assert.equal(sourceTemg.creditsMin, 3);
  assert.equal(sourceTemg.creditsMax, 5);
  assert.equal(byCode.TEMG4950.credits, 0);
  assert.match(byCode.TEMG4950.description, /0 means unknown/);
  assert.match(supplementFile.note, /One regular term of study abroad/);
  assert.match(supplementFile.note, /additional electives used to reach 120 credits/);
});

test('HKUST BBA in Global Business assigns only unambiguous code-specific pathway placements', () => {
  const { catalogue } = applySupplement();
  const courses = catalogue.courses.filter((course) => course.majorId === MAJOR_ID);
  const byCode = Object.fromEntries(courses.map((course) => [course.courseCode, course]));
  const placedCodes = courses
    .filter((course) => course.recommendedYear > 0)
    .map((course) => course.courseCode);

  assert.deepEqual(placedCodes, ['GBUS2010', 'GBUS4910']);
  assert.deepEqual([byCode.GBUS2010.recommendedYear, byCode.GBUS2010.semester], [2, 'Spring']);
  assert.deepEqual([byCode.GBUS4910.recommendedYear, byCode.GBUS4910.semester], [4, 'Fall']);
  assert.match(byCode.GBUS4910.requirementGroups[0], /Year 4 Spring as another offered term/);
  assert.equal(byCode.GBUS1000.recommendedYear, 0);
  assert.equal(byCode.GBUS2040.recommendedYear, 0);
  assert.equal(byCode.GBUS3030.recommendedYear, 0);
  assert.equal(byCode.ISOM4780.recommendedYear, 0);
  assert(courses.filter((course) => course.courseType === 'major_elective')
    .every((course) => course.recommendedYear === 0 && course.semester === ''));
});
