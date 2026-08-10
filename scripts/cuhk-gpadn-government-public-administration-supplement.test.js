const assert = require('node:assert/strict');
const test = require('node:test');

const supplement = require('../data/ug-course-supplements/cuhk-gpadn-government-public-administration-courses-2024.json');
const {
  COURSE_ROWS,
  FACULTY_PACKAGE_CODES,
  REQUIRED_CODES,
  FIELD_GROUPS,
  CAPSTONE_CODES,
  PRACTICUM_CODES,
  RECOMMENDED_SCHEDULE,
  buildCourses,
  buildSupplement,
} = require('./build-cuhk-gpadn-government-public-administration-supplement');

test('CUHK GPADN supplement preserves the official 2024-25 GPAD Course List and path boundaries', () => {
  assert.deepEqual(supplement, buildSupplement());

  const entry = supplement.supplements[0];
  const courses = entry.courses;
  const byCode = Object.fromEntries(courses.map((course) => [course.code, course]));

  assert.equal(entry.programmeCode, 'GPADN');
  assert.equal(entry.jupasCode, 'JS4848');
  assert.equal(entry.programmeId, 'CUHK-UG-GPADN-77');
  assert.equal(entry.majorId, 'CUHK-UG-GPADN-77-M1');
  assert.deepEqual(courses, buildCourses());
  assert.equal(COURSE_ROWS.length, 82);
  assert.equal(courses.length, 82);
  assert.equal(new Set(courses.map((course) => course.code)).size, 82);
  assert.equal(courses.filter((course) => course.credits === 3).length, 80);
  assert.equal(courses.filter((course) => course.credits === 0).length, 1);
  assert.equal(courses.filter((course) => course.credits === 6).length, 1);
  assert.equal(courses.filter((course) => course.courseType === 'core').length, 9);
  assert.equal(courses.filter((course) => course.courseType === 'internship').length, 2);
  assert.equal(FACULTY_PACKAGE_CODES.size, 1);
  assert.equal(REQUIRED_CODES.size, 8);
  assert.equal(Object.keys(FIELD_GROUPS).length, 6);
  assert.equal(CAPSTONE_CODES.size, 20);
  assert.equal(PRACTICUM_CODES.size, 2);
  assert.equal(Object.keys(RECOMMENDED_SCHEDULE).length, 9);

  assert.equal(byCode.GPAD1020.courseType, 'core');
  assert.match(byCode.GPAD1020.group, /Faculty Package/);
  assert.deepEqual([byCode.GPAD1020.recommendedYear, byCode.GPAD1020.semester], [1, 'Term 1']);
  assert.match(byCode.GPAD2300.group, /Comparative Politics/);
  assert.match(byCode.GPAD2300.group, /Political Theory/);
  assert.match(byCode.GPAD2300.group, /International Relations/);
  assert.equal(byCode.GPAD4801.courseType, 'internship');
  assert.match(byCode.GPAD4801.group, /Capstone candidate/);
  assert.equal(byCode.GPAD4701.courseType, 'capstone');
  assert.equal(byCode.GPAD4701.credits, 0);
  assert.equal(byCode.GPAD4702.credits, 6);
  assert.match(supplement.note, /standard Major totals 72 units/);
  assert.match(supplement.note, /senior-entry route totals 57 units/);
  assert.match(supplement.note, /GPAD4010/);
  assert.match(supplement.note, /82-course GPAD Course List/);
  assert.match(supplement.note, /browse-only/);
  assert.match(supplement.note, /totalCreditRequired=0/);
});
