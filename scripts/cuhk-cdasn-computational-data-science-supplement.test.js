const assert = require('node:assert/strict');
const test = require('node:test');

const supplement = require('../data/ug-course-supplements/cuhk-cdasn-computational-data-science-courses-2025.json');
const {
  COURSE_ROWS,
  buildCourses,
  buildSupplement,
} = require('./build-cuhk-cdasn-computational-data-science-supplement');

test('CUHK Computational Data Science supplement matches the official 2025-entry course list', () => {
  assert.deepEqual(supplement, buildSupplement());

  const entry = supplement.supplements[0];
  const courses = entry.courses;
  const byCode = Object.fromEntries(courses.map((course) => [course.code, course]));

  assert.equal(entry.programmeCode, 'CDASN');
  assert.equal(entry.jupasCode, 'JS4416');
  assert.equal(entry.programmeId, 'CUHK-UG-CDASN-40');
  assert.equal(entry.majorId, 'CUHK-UG-CDASN-40-M1');
  assert.equal(COURSE_ROWS.length, 33);
  assert.deepEqual(courses, buildCourses());
  assert.equal(courses.length, 33);
  assert.equal(new Set(courses.map((course) => course.code)).size, 33);
  assert.equal(courses.filter((course) => course.courseType === 'foundation').length, 16);
  assert.equal(courses.filter((course) => course.courseType === 'core').length, 15);
  assert.equal(courses.filter((course) => course.courseType === 'capstone').length, 2);

  assert.equal(byCode.ENGG1111.credits, 0);
  assert.match(byCode.MATH1030.group, /ENGG1120, ESTR1005 or MATH1030/);
  assert.match(byCode.STAT3010.group, /Sampling and Computing Methods/);
  assert.equal(byCode.STAT4010, undefined);
  assert.equal(byCode.CDAS4998.courseType, 'capstone');
  assert.equal(byCode.CDAS4999.semester, 'Term 2');
  assert.match(supplement.note, /2025 entry only/);
  assert.match(supplement.note, /33 unique codes/);
  assert.match(supplement.note, /does not publish closed course-code lists/);
  assert.match(supplement.note, /STAT4010 once/);
  assert.match(supplement.note, /totalCreditRequired=0/);
  assert.match(supplement.note, /browse-only/);
  assert.match(supplement.note, /must not produce a graduation completion percentage/);
});
