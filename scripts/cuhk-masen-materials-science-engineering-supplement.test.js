const assert = require('node:assert/strict');
const test = require('node:test');

const supplement = require('../data/ug-course-supplements/cuhk-masen-materials-science-engineering-courses.json');
const {
  COURSE_GROUPS,
  buildCourses,
  buildSupplement,
} = require('./build-cuhk-masen-materials-science-engineering-supplement');

test('CUHK Materials Science and Engineering supplement matches the official department course scope', () => {
  assert.deepEqual(supplement, buildSupplement());

  const entry = supplement.supplements[0];
  const courses = entry.courses;
  const byCode = Object.fromEntries(courses.map((course) => [course.code, course]));

  assert.equal(entry.programmeCode, 'MASEN');
  assert.equal(entry.jupasCode, 'JS4470');
  assert.equal(entry.programmeId, 'CUHK-UG-MASEN-48');
  assert.equal(entry.majorId, 'CUHK-UG-MASEN-48-M1');
  assert.equal(Object.values(COURSE_GROUPS).reduce((sum, rows) => sum + rows.length, 0), 46);
  assert.deepEqual(courses, buildCourses());
  assert.equal(courses.length, 58);
  assert.equal(new Set(courses.map((course) => course.code)).size, 58);
  assert.equal(courses.filter((course) => course.courseType === 'core').length, 25);
  assert.equal(courses.filter((course) => course.courseType === 'major_elective').length, 30);
  assert.equal(courses.filter((course) => course.courseType === 'capstone').length, 2);
  assert.equal(courses.filter((course) => course.courseType === 'internship').length, 1);
  assert(courses.every((course) => course.credits === 0));

  assert.match(byCode.ENGG1110.group, /slash-separated ENGG\/ESTR codes are alternatives/);
  assert.match(byCode.ENGG2780.group, /Foundation Courses · 14 units/);
  assert.match(byCode.MASE4998.group, /compulsory internship and research project/);
  assert.equal(byCode.MASE4998.courseType, 'capstone');
  assert.equal(byCode.ENGG1820.courseType, 'internship');
  assert.match(byCode.CSCI1120.title, /Introduction to Computing Using C\+\+/);
  assert.equal(
    byCode.MASE4202.title,
    'Semiconductor Microfabrication Principles and Technologies'
  );
  assert.match(supplement.note, /58 unique course codes/);
  assert.match(supplement.note, /credits=0/);
  assert.match(supplement.note, /browse-only/);
  assert.match(supplement.note, /must not produce a graduation completion percentage/);
});
