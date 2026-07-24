const assert = require('node:assert/strict');
const test = require('node:test');
const supplementFile = require('../data/ug-course-supplements/hkust-civil-environmental-engineering-curriculum-2025.json');
const { addGenericCourseSupplements } = require('./generate-ug-catalog');
const { validateSupplement } = require('./validate-ug-supplements');

test('HKUST Civil and Environmental Engineering preserves the official alternatives, bounded elective list, and open-pool boundaries', () => {
  const supplement = {
    provider: supplementFile.provider,
    academicYear: supplementFile.academicYear,
    sourceUrl: supplementFile.sourceUrl,
    officialUrl: supplementFile.officialUrl,
    ...supplementFile.supplements[0]
  };
  validateSupplement(supplement, 0);

  const programmeId = 'HKUST-UG-JS5230-DEPARTMENT-OF-CIVIL-AND-ENVIRONMENTAL-ENG-11';
  const catalogue = {
    programmes: [{
      id: programmeId,
      universityCode: 'HKUST',
      nameEn: 'BEng in Civil and Environmental Engineering',
      sourceStatus: 'programme_summary_only',
      courseCount: 1,
      codedCourseCount: 0
    }],
    majors: [
      {
        id: `${programmeId}-M1`,
        programmeId,
        nameEn: 'BEng in Civil and Environmental Engineering',
        courseCount: 1,
        codedCourseCount: 0
      },
      {
        id: `${programmeId}-M2`,
        programmeId,
        nameEn: 'Synthetic isolation control',
        courseCount: 0,
        codedCourseCount: 0
      }
    ],
    courses: []
  };

  addGenericCourseSupplements(catalogue, [supplement]);
  const courses = catalogue.courses.filter((course) => course.majorId === `${programmeId}-M1`);
  const controlCourses = catalogue.courses.filter((course) => course.majorId === `${programmeId}-M2`);
  const byCode = Object.fromEntries(courses.map((course) => [course.courseCode, course]));
  const groupText = (code) => byCode[code].requirementGroups[0];

  assert.equal(catalogue.programmes[0].sourceStatus, 'course_codes_available');
  assert.equal(catalogue.programmes[0].codedCourseCount, 52);
  assert.equal(catalogue.majors[0].codedCourseCount, 52);
  assert.equal(courses.length, 52);
  assert.equal(new Set(courses.map((course) => course.courseCode)).size, 52);
  assert.equal(controlCourses.length, 0);
  assert.equal(courses.filter((course) => groupText(course.courseCode).startsWith('Engineering Fundamental')).length, 14);
  assert.equal(courses.filter((course) => groupText(course.courseCode).includes('Restricted Elective')).length, 11);
  assert.equal(courses.filter((course) => groupText(course.courseCode).startsWith('Research Option')).length, 2);
  assert(courses.every((course) => course.recommendedYear === 0));

  assert.equal(byCode.CIVL1000.credits, 0);
  assert.equal(byCode.CIVL2021.credits, 3);
  assert.equal(byCode.CIVL4900.credits, 0);
  assert.equal(byCode.COMP2012H.credits, 5);
  assert.match(groupText('CIVL1000'), /school-based admission are exempted/);
  assert.match(groupText('CIVL3210'), /choose CIVL3210 or CIVL3610/);
  assert.match(groupText('CIVL4920'), /Research Option students must take CIVL4920/);
  assert.match(groupText('CIVL4450'), /at least 1 of CIVL4450, CIVL5450, or CIVL5460/);
  assert.match(groupText('CIVL4900'), /CGA 3.15\+/);
  assert.match(groupText('CIVL4900'), /advisor-approved Advanced Elective/);
  assert.match(groupText('COMP1022P'), /last offered in 2024-25 and deleted subsequently/);
  assert.match(groupText('CIVL4520'), /last offered in 2020-21 and deleted subsequently/);

  assert.match(supplementFile.note, /other CIVL courses at 4000-level or above/);
  assert.match(supplementFile.note, /3000-level or above Engineering School courses outside CIVL/);
  assert.match(supplementFile.note, /advisor-approved Research Option courses at 4000- or PG level/);
  assert.match(supplementFile.note, /require manual review/);
  assert(!courses.some((course) => /^(?:CIVL|SENG)$/.test(course.courseCode)));
  assert(!courses.some((course) => /X{2,}/.test(course.courseCode)));
});
