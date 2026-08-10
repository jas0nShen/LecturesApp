const assert = require('node:assert/strict');
const test = require('node:test');

const supplement = require('../data/ug-course-supplements/cuhk-commn-journalism-communication-courses-2026.json');
const {
  COURSE_ROWS,
  REQUIRED_ROLES,
  buildCourses,
  buildSupplement,
} = require('./build-cuhk-commn-journalism-communication-supplement');

test('CUHK COMMN supplement preserves the current School course list and explicit brochure roles', () => {
  assert.deepEqual(supplement, buildSupplement());

  const entry = supplement.supplements[0];
  const courses = entry.courses;
  const byCode = Object.fromEntries(courses.map((course) => [course.code, course]));

  assert.equal(entry.programmeCode, 'COMMN');
  assert.equal(entry.jupasCode, 'JS4850');
  assert.equal(entry.programmeId, 'CUHK-UG-COMMN-78');
  assert.equal(entry.majorId, 'CUHK-UG-COMMN-78-M1');
  assert.equal(COURSE_ROWS.length, 114);
  assert.equal(Object.keys(REQUIRED_ROLES).length, 8);
  assert.deepEqual(courses, buildCourses());
  assert.equal(courses.length, 114);
  assert.equal(new Set(courses.map((course) => course.code)).size, 114);

  assert.equal(courses.filter((course) => course.courseType === 'core').length, 6);
  assert.equal(courses.filter((course) => course.courseType === 'internship').length, 1);
  assert.equal(courses.filter((course) => course.courseType === 'capstone').length, 1);
  assert.equal(courses.filter((course) => course.courseType === 'major_elective').length, 106);
  assert.equal(courses.filter((course) => course.credits === 2).length, 1);
  assert.equal(courses.filter((course) => course.credits === 3).length, 113);

  assert.equal(byCode.COMM1120.courseType, 'core');
  assert.equal(byCode.COMM3200.courseType, 'internship');
  assert.equal(byCode.COMM4150.courseType, 'capstone');
  assert.match(byCode.COMM3600.group, /COMM3600 or COMM3710/);
  assert.match(byCode.COMM3710.group, /COMM3600 or COMM3710/);
  assert.equal(byCode.COMM3888.credits, 2);
  assert.equal(byCode.COMM4962.title, 'Advanced Photography');

  assert.match(supplement.note, /114 unique COMM course rows/);
  assert.match(supplement.note, /eight unique fixed Major codes/);
  assert.match(supplement.note, /four practicum paths/);
  assert.match(supplement.note, /browse-only elective pool/);
  assert.match(supplement.note, /totalCreditRequired=0/);
});
