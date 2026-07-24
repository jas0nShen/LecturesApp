const assert = require('node:assert/strict');
const test = require('node:test');
const supplementFile = require('../data/ug-course-supplements/hkust-mechanical-engineering-curriculum-2025.json');
const { addGenericCourseSupplements } = require('./generate-ug-catalog');
const { validateSupplement } = require('./validate-ug-supplements');

const PROGRAMME_ID = 'HKUST-UG-JS5270-DEPARTMENT-OF-MECHANICAL-AND-AEROSPACE-EN-39';
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
      nameEn: 'BEng in Mechanical Engineering',
      sourceStatus: 'programme_summary_only',
      courseCount: 1,
      codedCourseCount: 0
    }],
    majors: [
      {
        id: MAJOR_ID,
        programmeId: PROGRAMME_ID,
        nameEn: 'BEng in Mechanical Engineering',
        courseCount: 1,
        codedCourseCount: 0
      },
      {
        id: EXTENDED_MAJOR_ID,
        programmeId: PROGRAMME_ID,
        nameEn: 'Engineering with Extended Major in Artificial Intelligence',
        courseCount: 0,
        codedCourseCount: 0
      }
    ],
    courses: []
  };

  addGenericCourseSupplements(catalogue, [supplement]);
  return { catalogue, supplement };
}

test('HKUST Mechanical Engineering binds all 55 explicit codes to M1 without polluting the Extended Major', () => {
  const { catalogue, supplement } = applySupplement();
  const targetCourses = catalogue.courses.filter((course) => course.majorId === MAJOR_ID);
  const extendedMajorCourses = catalogue.courses.filter((course) => course.majorId === EXTENDED_MAJOR_ID);

  assert.equal(supplementFile.academicYear, '2025/26');
  assert.equal(supplement.programmeId, PROGRAMME_ID);
  assert.equal(supplement.majorId, MAJOR_ID);
  assert.equal(catalogue.programmes[0].sourceStatus, 'course_codes_available');
  assert.equal(catalogue.programmes[0].codedCourseCount, 55);
  assert.equal(catalogue.majors.find((major) => major.id === MAJOR_ID).codedCourseCount, 55);
  assert.equal(catalogue.majors.find((major) => major.id === EXTENDED_MAJOR_ID).codedCourseCount, 0);
  assert.equal(targetCourses.length, 55);
  assert.equal(new Set(targetCourses.map((course) => course.courseCode)).size, 55);
  assert.equal(extendedMajorCourses.length, 0);
});

test('HKUST Mechanical Engineering preserves Engineering Fundamental and Major Required alternatives', () => {
  const { catalogue } = applySupplement();
  const courses = catalogue.courses.filter((course) => course.majorId === MAJOR_ID);
  const byCode = Object.fromEntries(courses.map((course) => [course.courseCode, course]));

  assert.match(byCode.COMP2012H.requirementGroups[0], /3-5 credits attained/);
  assert.equal(byCode.COMP2012H.credits, 5);
  assert.match(byCode.MATH1020.requirementGroups[0], /MATH 1013 or MATH 1023/);
  assert.equal(byCode.MATH1020.credits, 4);
  assert.match(byCode.MATH2351.requirementGroups[0], /choose MATH 2111, MATH 2350 or MATH 2351/);
  assert.match(byCode.PHYS1101.requirementGroups[0], /Science 1000-level course/);
  assert.equal(byCode.PHYS1101.credits, 4);
  assert.match(byCode.MECH3300.requirementGroups[0], /choose MECH 3300, MECH 3420 or MECH 3710/);
  assert.equal(byCode.MECH4900.credits, 6);
  assert.equal(byCode.MECH1001.credits, 0);
  assert.equal(byCode.MECH1990.credits, 0);
  assert.equal(byCode.MECH2002.credits, 0);
});

test('HKUST Mechanical Engineering preserves all four optional Options and no-double-count boundaries', () => {
  const { catalogue } = applySupplement();
  const courses = catalogue.courses.filter((course) => course.majorId === MAJOR_ID);
  const byCode = Object.fromEntries(courses.map((course) => [course.courseCode, course]));
  const energy = courses.filter((course) => course.requirementGroups[0].includes('Energy Option'));
  const design = courses.filter((course) => course.requirementGroups[0].includes('Engineering Design Option'));
  const materials = courses.filter((course) => course.requirementGroups[0].includes('Materials Option'));
  const research = courses.filter((course) => course.requirementGroups[0].includes('Research Option'));

  assert.equal(energy.length, 10);
  assert.equal(design.length, 6);
  assert.equal(materials.length, 7);
  assert.deepEqual(research.map((course) => course.courseCode), ['MECH4995']);
  assert.equal(courses.filter((course) => course.courseCode === 'MECH3420').length, 1);
  assert.equal(courses.filter((course) => course.courseCode === 'MECH4450').length, 1);
  assert.match(byCode.MECH3420.requirementGroups[0], /Energy Option/);
  assert.match(byCode.MECH3420.requirementGroups[0], /Materials Option/);
  assert.match(byCode.MECH4450.requirementGroups[0], /Engineering Design Option/);
  assert.match(byCode.MECH4450.requirementGroups[0], /Materials Option/);
  assert(energy.every((course) => /may not be counted/.test(course.requirementGroups[0])));
  assert(design.every((course) => /may not be counted/.test(course.requirementGroups[0])));
  assert(materials.every((course) => /may not be counted/.test(course.requirementGroups[0])));
});

test('HKUST Mechanical Engineering keeps open completion and conflicting pathway rows outside the closed code set', () => {
  const { catalogue } = applySupplement();
  const courses = catalogue.courses.filter((course) => course.majorId === MAJOR_ID);
  const byCode = Object.fromEntries(courses.map((course) => [course.courseCode, course]));

  assert(!byCode.MECH2300);
  assert(!byCode.MATH1006);
  assert(!byCode.LANG1402);
  assert(!byCode.LANG1407);
  assert.match(supplementFile.note, /MECH 2300.*unresolved official-source conflict/);
  assert.match(supplementFile.note, /any HKUST-offered Free Elective courses/);
  assert.match(supplementFile.note, /not converted into a permanent closed graduation list/);
  assert.match(supplementFile.note, /All 55 explicit rows have fixed official credits/);
  assert(!supplementFile.supplements[0].courses.some((course) => course.creditRange));
});

test('HKUST Mechanical Engineering assigns only official code-specific pathway placements', () => {
  const { catalogue } = applySupplement();
  const courses = catalogue.courses.filter((course) => course.majorId === MAJOR_ID);
  const byCode = Object.fromEntries(courses.map((course) => [course.courseCode, course]));
  const optionOnly = courses.filter((course) => course.courseType === 'major_elective');

  assert.deepEqual([byCode.MECH1910.recommendedYear, byCode.MECH1910.semester], [1, 'Fall']);
  assert.deepEqual([byCode.MECH2020.recommendedYear, byCode.MECH2020.semester], [2, 'Fall']);
  assert.deepEqual([byCode.MECH2040.recommendedYear, byCode.MECH2040.semester], [2, 'Spring']);
  assert.deepEqual([byCode.MECH3300.recommendedYear, byCode.MECH3300.semester], [3, 'Fall']);
  assert.deepEqual([byCode.MECH3630.recommendedYear, byCode.MECH3630.semester], [3, 'Spring']);
  assert.deepEqual([byCode.MECH4900.recommendedYear, byCode.MECH4900.semester], [4, 'Fall / Spring']);
  assert.deepEqual([byCode.MATH1013.recommendedYear, byCode.MATH1013.semester], [1, 'Fall / Spring']);
  assert.deepEqual([byCode.MATH1014.recommendedYear, byCode.MATH1014.semester], [1, 'Spring / Summer']);
  assert.equal(byCode.MECH1001.recommendedYear, 0);
  assert.equal(byCode.MECH2002.recommendedYear, 0);
  assert(optionOnly.every((course) => course.recommendedYear === 0 && course.semester === ''));
});
