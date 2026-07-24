const assert = require('node:assert/strict');
const test = require('node:test');
const supplementFile = require('../data/ug-course-supplements/hkust-microelectronics-integrated-circuits-curriculum-2025.json');
const { addGenericCourseSupplements } = require('./generate-ug-catalog');
const { validateSupplement } = require('./validate-ug-supplements');

const PROGRAMME_ID = 'HKUST-UG-JS5250-DEPARTMENT-OF-ELECTRONIC-AND-COMPUTER-ENG-40';
const MAJOR_ID = `${PROGRAMME_ID}-M1`;

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
      nameEn: 'BEng in Microelectronics and Integrated Circuits',
      sourceStatus: 'programme_summary_only',
      courseCount: 1,
      codedCourseCount: 0
    }],
    majors: [{
      id: MAJOR_ID,
      programmeId: PROGRAMME_ID,
      nameEn: 'BEng in Microelectronics and Integrated Circuits',
      courseCount: 1,
      codedCourseCount: 0
    }],
    courses: []
  };

  addGenericCourseSupplements(catalogue, [supplement]);
  return { catalogue, supplement };
}

test('HKUST MEIC binds all 55 explicit 2025-26 codes to the exact Programme and Major', () => {
  const { catalogue, supplement } = applySupplement();
  const courses = catalogue.courses.filter((course) => course.majorId === MAJOR_ID);

  assert.equal(supplement.programmeId, PROGRAMME_ID);
  assert.equal(supplement.majorId, MAJOR_ID);
  assert.equal(catalogue.programmes[0].sourceStatus, 'course_codes_available');
  assert.equal(catalogue.programmes[0].codedCourseCount, 55);
  assert.equal(catalogue.majors[0].codedCourseCount, 55);
  assert.equal(courses.length, 55);
  assert.equal(new Set(courses.map((course) => course.courseCode)).size, 55);
});

test('HKUST MEIC preserves Engineering Fundamental and both 9-credit capstone paths', () => {
  const { catalogue } = applySupplement();
  const courses = catalogue.courses;
  const byCode = Object.fromEntries(courses.map((course) => [course.courseCode, course]));
  const engineeringFundamentals = courses.filter((course) => course.requirementGroups[0].startsWith('Engineering Fundamental'));
  const capstones = courses.filter((course) => course.courseType === 'capstone');

  assert.equal(engineeringFundamentals.length, 15);
  assert.equal(capstones.length, 7);
  assert.match(byCode.MATH1013.requirementGroups[0], /or take MATH 1020/);
  assert.match(byCode.ELEC4901.requirementGroups[0], /Research Option students must take ELEC 4901/);
  assert.match(byCode.ELEC4930.requirementGroups[0], /capstone path B/);
  assert.deepEqual([byCode.ELEC1910.credits, byCode.ELEC2910.credits, byCode.ELEC2992.credits, byCode.ELEC3910.credits], [0, 0, 0, 0]);
});

test('HKUST MEIC preserves the bounded ELEC pool and the deliberately open Research Option PG boundary', () => {
  const { catalogue } = applySupplement();
  const courses = catalogue.courses;
  const byCode = Object.fromEntries(courses.map((course) => [course.courseCode, course]));
  const electives = courses.filter((course) => course.requirementGroups[0].startsWith('ELEC Electives'));
  const urop = courses.filter((course) => course.requirementGroups[0].startsWith('Optional Research Option UROP'));

  assert.equal(electives.length, 16);
  assert.equal(electives.filter((course) => /^ELEC4/.test(course.courseCode)).length, 12);
  assert.equal(urop.length, 5);
  assert.match(byCode.ELEC3300.requirementGroups[0], /at least 2 courses must be 4000-level/);
  assert.match(byCode.UROP1000.requirementGroups[0], /incomplete open PG pool, manual confirmation required/);
  assert.match(supplementFile.note, /no PG course is invented/);
  assert.equal(byCode.UROP1000.credits, 0);
  assert(courses.every((course) => course.recommendedYear === 0));
});
