const assert = require('node:assert/strict');
const test = require('node:test');
const supplementFile = require('../data/ug-course-supplements/hkust-data-analytics-artificial-intelligence-science-curriculum-2025.json');
const { addGenericCourseSupplements } = require('./generate-ug-catalog');
const { validateSupplement } = require('./validate-ug-supplements');

test('HKUST Data Analytics and Artificial Intelligence in Science preserves all four closed Tracks', () => {
  const supplement = {
    provider: supplementFile.provider,
    academicYear: supplementFile.academicYear,
    sourceUrl: supplementFile.sourceUrl,
    officialUrl: supplementFile.officialUrl,
    ...supplementFile.supplements[0]
  };
  validateSupplement(supplement, 0);

  const programmeId = 'HKUST-UG-JS5102-SCIENCE-GROUP-A-15';
  const catalogue = {
    programmes: [{
      id: programmeId,
      universityCode: 'HKUST',
      nameEn: 'BSc in Data Analytics and Artificial Intelligence in Science',
      sourceStatus: 'programme_summary_only',
      courseCount: 1,
      codedCourseCount: 0
    }],
    majors: [{
      id: `${programmeId}-M1`,
      programmeId,
      nameEn: 'BSc in Data Analytics and Artificial Intelligence in Science',
      courseCount: 1,
      codedCourseCount: 0
    }],
    courses: []
  };

  addGenericCourseSupplements(catalogue, [supplement]);
  const courses = catalogue.courses;
  const byCode = Object.fromEntries(courses.map((course) => [course.courseCode, course]));
  const countGroup = (group) => courses.filter((course) => course.requirementGroups[0].includes(group)).length;

  assert.equal(catalogue.programmes[0].sourceStatus, 'course_codes_available');
  assert.equal(catalogue.programmes[0].codedCourseCount, 46);
  assert.equal(catalogue.majors[0].codedCourseCount, 46);
  assert.equal(courses.length, 46);
  assert.equal(new Set(courses.map((course) => course.courseCode)).size, 46);
  assert.equal(countGroup('Applied Biosciences Track'), 6);
  assert.equal(countGroup('Environmental Science Track'), 6);
  assert.equal(countGroup('Information Science Track'), 9);
  assert.equal(countGroup('Molecular Science and Cheminformatics Track'), 7);
  assert.equal(byCode.DASC2210.credits, 1);
  assert.equal(byCode.LIFS3140.credits, 4);
  assert.equal(byCode.CHEM3030.credits, 4);
  assert.match(byCode.LIFS1901.requirementGroups[0], /exempted/);
  assert.match(byCode.PHYS1111.requirementGroups[0], /choose PHYS1111, PHYS1112, or PHYS1312/);
});
