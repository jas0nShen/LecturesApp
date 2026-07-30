const assert = require('node:assert/strict');
const test = require('node:test');

const supplement = require('../data/ug-course-supplements/cuhk-ifaab-insurance-financial-actuarial-analysis-courses-2025.json');
const {
  COURSE_ROWS,
  buildCourses,
  buildSupplement,
} = require('./build-cuhk-ifaab-insurance-financial-actuarial-analysis-supplement');

test('CUHK IFAAB supplement matches the official 2025-26 Student Scheme and course list', () => {
  assert.deepEqual(supplement, buildSupplement());

  const entry = supplement.supplements[0];
  const courses = entry.courses;
  const byCode = Object.fromEntries(courses.map((course) => [course.code, course]));

  assert.equal(entry.programmeCode, 'IFAAB');
  assert.equal(entry.jupasCode, 'JS4238');
  assert.equal(entry.programmeId, 'CUHK-UG-IFAAB-22');
  assert.equal(entry.majorId, 'CUHK-UG-IFAAB-22-M1');
  assert.equal(COURSE_ROWS.length, 57);
  assert.deepEqual(courses, buildCourses());
  assert.equal(courses.length, 57);
  assert.equal(new Set(courses.map((course) => course.code)).size, 57);
  assert.equal(courses.filter((course) => course.courseType === 'foundation').length, 4);
  assert.equal(courses.filter((course) => course.courseType === 'core').length, 19);
  assert.equal(courses.filter((course) => course.courseType === 'major_elective').length, 30);
  assert.equal(courses.filter((course) => course.courseType === 'capstone').length, 4);

  assert.match(byCode.MATH1530.group, /not counted in the 78-unit Major/);
  assert.match(byCode.MATH1010.group, /Placement Test/);
  assert.match(byCode.CSCI1510.group, /choose one of/);
  assert.match(byCode.CSCI2520.group, /CSCI2100 or CSCI2520/);
  assert.match(byCode.FINA4110.group, /FINA3250 or FINA4110/);
  assert.equal(byCode.DOTE3010.title, 'Artificial Intelligence Empowered Business');
  assert.equal(byCode.FINA3260.credits, 1);
  assert.equal(byCode.FINA4215.credits, 1);
  assert.equal(byCode.MGNT2611.credits, 2);
  assert.equal(byCode.FINA4290.courseType, 'capstone');
  assert.match(supplement.note, /minimum 78-unit Major/);
  assert.match(supplement.note, /78-81 units/);
  assert.match(supplement.note, /all 57 unique course codes/);
  assert.match(supplement.note, /browse-only/);
  assert.match(supplement.note, /totalCreditRequired=0/);
});
