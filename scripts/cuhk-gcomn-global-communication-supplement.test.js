const assert = require('node:assert/strict');
const test = require('node:test');

const supplement = require('../data/ug-course-supplements/cuhk-gcomn-global-communication-courses-2026.json');
const {
  FACULTY_PACKAGE_CODES,
  REQUIRED_ALTERNATIVE_CODES,
  REQUIRED_FIXED_CODES,
  ELECTIVE_GROUPS,
  EXTERNAL_ELECTIVE_ROWS,
  buildCourses,
  buildSupplement,
} = require('./build-cuhk-gcomn-global-communication-supplement');

test('CUHK GCOMN supplement preserves the complete 2026-27 named local course pool', () => {
  assert.deepEqual(supplement, buildSupplement());

  const entry = supplement.supplements[0];
  const courses = entry.courses;
  const byCode = Object.fromEntries(courses.map((course) => [course.code, course]));

  assert.equal(entry.programmeCode, 'GCOMN');
  assert.equal(entry.jupasCode, 'JS4858');
  assert.equal(entry.programmeId, 'CUHK-UG-GCOMN-75');
  assert.equal(entry.majorId, 'CUHK-UG-GCOMN-75-M1');
  assert.deepEqual(courses, buildCourses());
  assert.equal(courses.length, 137);
  assert.equal(new Set(courses.map((course) => course.code)).size, 137);
  assert.equal(courses.filter((course) => course.code.startsWith('COMM')).length, 99);
  assert.equal(courses.filter((course) => course.courseType === 'core').length, 34);
  assert.equal(courses.filter((course) => course.courseType === 'capstone').length, 1);
  assert.equal(courses.filter((course) => course.courseType === 'internship').length, 1);
  assert.equal(courses.filter((course) => course.courseType === 'major_elective').length, 101);
  assert.equal(courses.filter((course) => course.credits === 0).length, 11);
  assert.equal(FACULTY_PACKAGE_CODES.length, 28);
  assert.equal(REQUIRED_ALTERNATIVE_CODES.length, 2);
  assert.equal(REQUIRED_FIXED_CODES.length, 5);
  assert.equal(Object.keys(ELECTIVE_GROUPS).length, 5);
  assert.equal(EXTERNAL_ELECTIVE_ROWS.length, 11);

  assert.equal(byCode.COMM1500.courseType, 'core');
  assert.match(byCode.COMM1500.group, /fixed course/);
  assert.match(byCode.COMM2160.group, /COMM2160 or COMM3650/);
  assert.match(byCode.COMM3650.group, /Journalism/);
  assert.equal(byCode.COMM4150.courseType, 'capstone');
  assert.equal(byCode.COMM3200.courseType, 'internship');
  assert.equal(byCode.ECON1210.title, 'Economics and Society');
  assert.equal(byCode.ECON1210.credits, 3);
  assert.equal(byCode.GLSD3106.credits, 0);
  assert.match(byCode.GLSD3106.group, /Global Communication/);
  assert.match(byCode.CSAT3002.group, /Creative and New Media/);
  assert.match(supplement.note, /minimum 72-unit Major/);
  assert.match(supplement.note, /137 unique named course codes/);
  assert.match(supplement.note, /credits=0/);
  assert.match(supplement.note, /browse-only/);
  assert.match(supplement.note, /totalCreditRequired=0/);
});
