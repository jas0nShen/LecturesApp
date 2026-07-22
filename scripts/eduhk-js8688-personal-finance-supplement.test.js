const assert = require('node:assert/strict');
const test = require('node:test');
const supplementFile = require('../data/ug-course-supplements/eduhk-js8688-personal-finance-2026.json');
const { addGenericCourseSupplements } = require('./generate-ug-catalog');
const { validateSupplement } = require('./validate-ug-supplements');

test('EdUHK JS8688 preserves the official 2026/27 coded course groups without inventing credits or the TBC code', () => {
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
      id: 'EDUHK-UG-JS8688-21',
      universityCode: 'EDUHK',
      code: 'JS8688',
      jupasCode: 'JS8688',
      nameEn: 'Bachelor of Arts (Honours) in Personal Finance',
      sourceStatus: 'programme_summary_only',
      courseCount: 0,
      codedCourseCount: 0
    }],
    majors: [{
      id: 'EDUHK-UG-JS8688-21-M1',
      programmeId: 'EDUHK-UG-JS8688-21',
      nameEn: 'Bachelor of Arts (Honours) in Personal Finance',
      courseCount: 0,
      codedCourseCount: 0
    }],
    courses: []
  };

  addGenericCourseSupplements(catalogue, [supplement]);

  const courses = catalogue.courses;
  const byCode = Object.fromEntries(courses.map((course) => [course.courseCode, course]));
  assert.equal(catalogue.programmes[0].sourceStatus, 'course_codes_available');
  assert.equal(catalogue.programmes[0].codedCourseCount, 23);
  assert.equal(catalogue.majors[0].codedCourseCount, 23);
  assert.equal(courses.length, 23);
  assert.equal(new Set(courses.map((course) => course.courseCode)).size, 23);
  assert(courses.every((course) => course.credits === 0));
  assert(courses.every((course) => course.recommendedYear === 0));
  assert(courses.every((course) => course.semester === ''));

  assert.equal(courses.filter((course) => course.requirementGroups[0] === 'Major Course').length, 14);
  assert.equal(courses.filter((course) => course.courseType === 'internship').length, 1);
  assert.equal(courses.filter((course) => course.courseType === 'capstone').length, 4);
  assert.equal(courses.filter((course) => course.requirementGroups[0].startsWith('Cross-Faculty Core Course')).length, 2);
  assert.equal(byCode.BUS3055.titleEn, 'Internship');
  assert.equal(byCode.INS4084.requirementGroups[0], 'Major Interdisciplinary Course');
  assert.equal(byCode.BUS2072.requirementGroups[0], 'Living and Working in Our Country');
  assert.equal(byCode.BUS4061.requirementGroups[0], 'Final Year Project · Honours Project path');
  assert.equal(byCode.BUS4064.requirementGroups[0], 'Final Year Project · Capstone Project path');
  assert(!courses.some((course) => /TBC/i.test(course.courseCode)));
  assert.match(supplement.evidenceNote, /twenty-fourth row.*TBC.*intentionally omitted/i);
  assert.match(supplement.evidenceNote, /does not assert graduation completion/);
});
