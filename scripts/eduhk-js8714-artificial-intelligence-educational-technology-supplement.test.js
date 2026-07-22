const assert = require('node:assert/strict');
const test = require('node:test');
const supplementFile = require('../data/ug-course-supplements/eduhk-js8714-artificial-intelligence-educational-technology-2026.json');
const { addGenericCourseSupplements } = require('./generate-ug-catalog');
const { validateSupplement } = require('./validate-ug-supplements');

test('EdUHK JS8714 preserves the official 2026/27 coded course groups without inventing credits or uncoded Cross-Faculty courses', () => {
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
      id: 'EDUHK-UG-JS8714-23',
      universityCode: 'EDUHK',
      code: 'JS8714',
      jupasCode: 'JS8714',
      nameEn: 'Bachelor of Science (Honours) in Artificial Intelligence and Educational Technology',
      sourceStatus: 'programme_summary_only',
      courseCount: 0,
      codedCourseCount: 0
    }],
    majors: [{
      id: 'EDUHK-UG-JS8714-23-M1',
      programmeId: 'EDUHK-UG-JS8714-23',
      nameEn: 'Bachelor of Science (Honours) in Artificial Intelligence and Educational Technology',
      courseCount: 0,
      codedCourseCount: 0
    }],
    courses: []
  };

  addGenericCourseSupplements(catalogue, [supplement]);

  const courses = catalogue.courses;
  const byCode = Object.fromEntries(courses.map((course) => [course.courseCode, course]));
  assert.equal(catalogue.programmes[0].sourceStatus, 'course_codes_available');
  assert.equal(catalogue.programmes[0].codedCourseCount, 27);
  assert.equal(catalogue.majors[0].codedCourseCount, 27);
  assert.equal(courses.length, 27);
  assert.equal(new Set(courses.map((course) => course.courseCode)).size, 27);
  assert(courses.every((course) => course.credits === 0));
  assert(courses.every((course) => course.recommendedYear === 0));
  assert(courses.every((course) => course.semester === ''));

  assert.equal(courses.filter((course) => course.requirementGroups[0] === 'Major Core').length, 11);
  assert.equal(courses.filter((course) => course.requirementGroups[0] === 'Major Elective Courses · choose 2 of 9').length, 9);
  assert.equal(courses.filter((course) => course.courseType === 'internship').length, 1);
  assert.equal(courses.filter((course) => course.courseType === 'capstone').length, 4);
  assert.equal(byCode.INT4099.requirementGroups[0], 'Major Interdisciplinary Course');
  assert.equal(byCode.INT3156.requirementGroups[0], 'Living and Working in Our Country');
  assert.equal(byCode.INT4100.titleEn, 'Internship');
  assert.equal(byCode.INT4101.requirementGroups[0], 'Final Year Project · Honours Project path');
  assert.equal(byCode.INT4103.requirementGroups[0], 'Final Year Project · Capstone Project path');
  assert(!courses.some((course) => /TBC/i.test(course.courseCode)));
  assert.match(supplement.evidenceNote, /three Cross-Faculty Core Course components have no course codes.*intentionally omitted/i);
  assert.match(supplement.evidenceNote, /does not assert graduation completion/);
});
