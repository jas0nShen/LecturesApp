const assert = require('node:assert/strict');
const test = require('node:test');
const supplementFile = require('../data/ug-course-supplements/eduhk-js8687-heritage-education-arts-management-2026.json');
const { addGenericCourseSupplements } = require('./generate-ug-catalog');
const { validateSupplement } = require('./validate-ug-supplements');

test('EdUHK JS8687 preserves the official 2026/27 coded course groups without inventing credits or study years', () => {
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
      id: 'EDUHK-UG-JS8687-20',
      universityCode: 'EDUHK',
      code: 'JS8687',
      jupasCode: 'JS8687',
      nameEn: 'Bachelor of Arts (Honours) in Heritage Education and Arts Management',
      sourceStatus: 'programme_summary_only',
      courseCount: 0,
      codedCourseCount: 0
    }],
    majors: [{
      id: 'EDUHK-UG-JS8687-20-M1',
      programmeId: 'EDUHK-UG-JS8687-20',
      nameEn: 'Bachelor of Arts (Honours) in Heritage Education and Arts Management',
      courseCount: 0,
      codedCourseCount: 0
    }],
    courses: []
  };

  addGenericCourseSupplements(catalogue, [supplement]);

  const courses = catalogue.courses;
  const byCode = Object.fromEntries(courses.map((course) => [course.courseCode, course]));
  assert.equal(catalogue.programmes[0].sourceStatus, 'course_codes_available');
  assert.equal(catalogue.programmes[0].codedCourseCount, 30);
  assert.equal(catalogue.majors[0].codedCourseCount, 30);
  assert.equal(courses.length, 30);
  assert.equal(new Set(courses.map((course) => course.courseCode)).size, 30);
  assert(courses.every((course) => course.credits === 0));
  assert(courses.every((course) => course.recommendedYear === 0));
  assert(courses.every((course) => course.semester === ''));

  assert.equal(courses.filter((course) => course.requirementGroups[0] === 'Interdisciplinary Major (Foundation)').length, 6);
  assert.equal(courses.filter((course) => course.requirementGroups[0] === 'Interdisciplinary Major').length, 10);
  assert.equal(courses.filter((course) => course.requirementGroups[0] === 'Programme Package').length, 4);
  assert.equal(courses.filter((course) => course.courseType === 'internship').length, 1);
  assert.equal(courses.filter((course) => course.courseType === 'capstone').length, 4);
  assert.equal(courses.filter((course) => course.requirementGroups[0].includes('Component III option')).length, 3);

  assert.equal(byCode.HEM3002.titleEn, 'Internship');
  assert.equal(byCode.PRJ4005.requirementGroups[0], 'Final Year Project · Honours Project path');
  assert.equal(byCode.PRJ4008.requirementGroups[0], 'Final Year Project · Capstone Project path');
  assert.match(supplement.evidenceNote, /not per-course credit points or a recommended year\/semester study pattern/);
  assert(!courses.some((course) => course.sourceUrl.includes('JS8005')));
});
