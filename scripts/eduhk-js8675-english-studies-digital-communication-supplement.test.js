const assert = require('node:assert/strict');
const test = require('node:test');
const supplementFile = require('../data/ug-course-supplements/eduhk-js8675-english-studies-digital-communication-2026.json');
const { addGenericCourseSupplements } = require('./generate-ug-catalog');
const { validateSupplement } = require('./validate-ug-supplements');

test('EdUHK JS8675 preserves the official 2026/27 coded Major Course List without inventing unmapped domains or study years', () => {
  const [rawSupplement] = supplementFile.supplements;
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
      id: 'EDUHK-UG-JS8675-17',
      universityCode: 'EDUHK',
      code: 'JS8675',
      jupasCode: 'JS8675',
      nameEn: 'Bachelor of Arts (Honours) in English Studies and Digital Communication',
      sourceStatus: 'programme_summary_only',
      courseCount: 0,
      codedCourseCount: 0
    }],
    majors: [{
      id: 'EDUHK-UG-JS8675-17-M1',
      programmeId: 'EDUHK-UG-JS8675-17',
      nameEn: 'Bachelor of Arts (Honours) in English Studies and Digital Communication',
      courseCount: 0,
      codedCourseCount: 0
    }],
    courses: []
  };

  addGenericCourseSupplements(catalogue, [supplement]);

  const courses = catalogue.courses;
  const byCode = Object.fromEntries(courses.map((course) => [course.courseCode, course]));
  assert.equal(catalogue.programmes[0].sourceStatus, 'course_codes_available');
  assert.equal(catalogue.programmes[0].codedCourseCount, 22);
  assert.equal(catalogue.majors[0].codedCourseCount, 22);
  assert.equal(courses.length, 22);
  assert.equal(new Set(courses.map((course) => course.courseCode)).size, 22);
  assert(courses.every((course) => course.recommendedYear === 0));
  assert(courses.every((course) => course.semester === ''));
  assert.equal(courses.filter((course) => course.credits > 0).length, 1);
  assert.equal(byCode.LIN3048.credits, 3);
  assert.equal(byCode.LIN3048.courseType, 'internship');
  assert.equal(courses.filter((course) => course.requirementGroups[0].includes('Component II shared-title')).length, 3);
  assert.equal(courses.filter((course) => course.requirementGroups[0].includes('Component III option')).length, 4);
  assert.equal(byCode.INS4085.titleEn, byCode.INS4086.titleEn);
  assert.match(supplement.evidenceNote, /does not map the listed courses/);
  assert.match(supplement.evidenceNote, /coded Final Year Project/);
});
