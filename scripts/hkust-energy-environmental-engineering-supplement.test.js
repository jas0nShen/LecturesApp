const assert = require('node:assert/strict');
const test = require('node:test');
const supplementFile = require('../data/ug-course-supplements/hkust-energy-environmental-engineering-curriculum-2025.json');
const { addGenericCourseSupplements } = require('./generate-ug-catalog');
const { validateSupplement } = require('./validate-ug-supplements');

test('HKUST Energy and Environmental Engineering preserves the bounded Area lists and exact Major identity', () => {
  const supplement = {
    provider: supplementFile.provider,
    academicYear: supplementFile.academicYear,
    sourceUrl: supplementFile.sourceUrl,
    officialUrl: supplementFile.officialUrl,
    ...supplementFile.supplements[0]
  };
  validateSupplement(supplement, 0);

  const programmeId = 'HKUST-UG-JS5220-DEPARTMENT-OF-CHEMICAL-AND-BIOLOGICAL-ENG-22';
  const catalogue = {
    programmes: [{
      id: programmeId,
      universityCode: 'HKUST',
      nameEn: 'BEng in Energy and Environmental Engineering',
      sourceStatus: 'programme_summary_only',
      courseCount: 1,
      codedCourseCount: 0
    }],
    majors: [
      {
        id: `${programmeId}-M1`,
        programmeId,
        nameEn: 'BEng in Energy and Environmental Engineering',
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
  const targetCourses = catalogue.courses.filter((course) => course.majorId === `${programmeId}-M1`);
  const controlCourses = catalogue.courses.filter((course) => course.majorId === `${programmeId}-M2`);
  const byCode = Object.fromEntries(targetCourses.map((course) => [course.courseCode, course]));
  const area1 = targetCourses.filter((course) => course.requirementGroups[0].includes('Area 1:'));
  const area2 = targetCourses.filter((course) => course.requirementGroups[0].includes('Area 2:'));
  const area3 = targetCourses.filter((course) => course.requirementGroups[0].includes('Area 3:'));
  const sourceEneg4000 = supplement.courses.find((course) => course.code === 'ENEG4000');

  assert.equal(catalogue.programmes[0].sourceStatus, 'course_codes_available');
  assert.equal(catalogue.programmes[0].codedCourseCount, 63);
  assert.equal(catalogue.majors[0].codedCourseCount, 63);
  assert.equal(targetCourses.length, 63);
  assert.equal(new Set(targetCourses.map((course) => course.courseCode)).size, 63);
  assert.equal(controlCourses.length, 0);
  assert.equal(area1.length, 10);
  assert.equal(area2.length, 9);
  assert.equal(area3.length, 10);
  assert.match(byCode.COMP1022P.requirementGroups[0], /last offered in 2024-25 and deleted subsequently/);
  assert.match(byCode.CENG4160.requirementGroups[0], /last offered in 2022-23 and deleted subsequently/);
  assert.match(byCode.MECH4902.requirementGroups[0], /last offered in 2021-22 and deleted subsequently/);
  assert.match(byCode.ENEG3910.requirementGroups[0], /Fall 2027-28/);
  assert.equal(byCode.ENEG3910.credits, 3);
  assert.equal(sourceEneg4000.creditRange, '1-4');
  assert.equal(byCode.ENEG4000.credits, 0);
  assert.match(byCode.ENEG4000.description, /0 means unknown/);
  assert.equal(byCode.CENG5930.credits, 3);
  assert(!targetCourses.some((course) => course.courseCode === 'ENEGXXXX'));
});
