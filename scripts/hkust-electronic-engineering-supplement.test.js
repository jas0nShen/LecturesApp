const assert = require('node:assert/strict');
const test = require('node:test');
const supplementFile = require('../data/ug-course-supplements/hkust-electronic-engineering-curriculum-2025.json');
const { addGenericCourseSupplements } = require('./generate-ug-catalog');
const { validateSupplement } = require('./validate-ug-supplements');

test('HKUST Electronic Engineering preserves explicit courses and isolates the shared JS5250 entry', () => {
  const supplement = {
    provider: supplementFile.provider,
    academicYear: supplementFile.academicYear,
    sourceUrl: supplementFile.sourceUrl,
    officialUrl: supplementFile.officialUrl,
    ...supplementFile.supplements[0]
  };
  validateSupplement(supplement, 0);

  const programmeId = 'HKUST-UG-JS5250-DEPARTMENT-OF-ELECTRONIC-AND-COMPUTER-ENG-21';
  const microelectronicsId = 'HKUST-UG-JS5250-DEPARTMENT-OF-ELECTRONIC-AND-COMPUTER-ENG-40';
  const catalogue = {
    programmes: [
      {
        id: programmeId,
        universityCode: 'HKUST',
        nameEn: 'BEng in Electronic Engineering',
        sourceStatus: 'programme_summary_only',
        courseCount: 1,
        codedCourseCount: 0
      },
      {
        id: microelectronicsId,
        universityCode: 'HKUST',
        nameEn: 'BEng in Microelectronics and Integrated Circuits',
        sourceStatus: 'programme_summary_only',
        courseCount: 1,
        codedCourseCount: 0
      }
    ],
    majors: [
      {
        id: `${programmeId}-M1`,
        programmeId,
        nameEn: 'BEng in Electronic Engineering',
        courseCount: 1,
        codedCourseCount: 0
      },
      {
        id: `${microelectronicsId}-M1`,
        programmeId: microelectronicsId,
        nameEn: 'BEng in Microelectronics and Integrated Circuits',
        courseCount: 1,
        codedCourseCount: 0
      }
    ],
    courses: []
  };

  addGenericCourseSupplements(catalogue, [supplement]);
  const courses = catalogue.courses.filter((course) => course.programmeId === programmeId);
  const microelectronicsCourses = catalogue.courses.filter((course) => course.programmeId === microelectronicsId);
  const byCode = Object.fromEntries(courses.map((course) => [course.courseCode, course]));

  assert.equal(catalogue.programmes[0].sourceStatus, 'course_codes_available');
  assert.equal(catalogue.programmes[0].codedCourseCount, 34);
  assert.equal(catalogue.majors[0].codedCourseCount, 34);
  assert.equal(courses.length, 34);
  assert.equal(new Set(courses.map((course) => course.courseCode)).size, 34);
  assert.equal(microelectronicsCourses.length, 0);
  assert.equal(byCode.ELEC1910.credits, 0);
  assert.equal(byCode.COMP2012H.credits, 5);
  assert.match(byCode.ELEC4901.requirementGroups[0], /Research Option students/);
  assert.match(byCode.ELEC5900.requirementGroups[0], /advisor-approved/);
  assert(!courses.some((course) => course.courseCode === 'ELEC4940'));
  assert(!courses.some((course) => course.courseCode === 'ELEC3XXX'));
});
