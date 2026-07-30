const assert = require('node:assert/strict');
const test = require('node:test');

const supplement = require('../data/ug-course-supplements/cuhk-miegn-mathematics-information-engineering-courses-2025.json');
const {
  CSE_COURSE_ROWS,
  PDF_COURSE_ROWS,
  buildSupplement,
} = require('./build-cuhk-miegn-mathematics-information-engineering-supplement');

test('CUHK Mathematics and Information Engineering matches the official 2025-26 evidence scope', () => {
  assert.deepEqual(supplement, buildSupplement());
  assert.equal(PDF_COURSE_ROWS.length, 160);
  assert.equal(CSE_COURSE_ROWS.length, 18);

  const entry = supplement.supplements[0];
  const courses = entry.courses;
  const byCode = Object.fromEntries(courses.map((course) => [course.code, course]));

  assert.equal(entry.programmeCode, 'MIEGN');
  assert.equal(entry.jupasCode, 'JS4733');
  assert.equal(entry.programmeId, 'CUHK-UG-MIEGN-49');
  assert.equal(entry.majorId, 'CUHK-UG-MIEGN-49-M1');
  assert.equal(courses.length, 178);
  assert.equal(new Set(courses.map((course) => course.code)).size, 178);
  assert.equal(courses.filter((course) => course.courseType === 'core').length, 52);
  assert.equal(courses.filter((course) => course.courseType === 'major_elective').length, 123);
  assert.equal(courses.filter((course) => course.courseType === 'capstone').length, 2);
  assert.equal(courses.filter((course) => course.courseType === 'internship').length, 1);
  assert.equal(courses.filter((course) => course.credits === 1).length, 6);
  assert.equal(courses.filter((course) => course.credits === 2).length, 2);
  assert.equal(courses.filter((course) => course.credits === 3).length, 170);

  assert.equal(byCode.AIST1110.title, 'Introduction to Computing using Python');
  assert.match(byCode.CSCI1120.group, /Foundation choice/);
  assert.match(byCode.CSCI2100.group, /54-unit block/);
  assert.equal(byCode.CSCI5030.title, 'Machine Learning Theory');
  assert.equal(
    byCode.CSCI5150.title,
    'Machine Learning Algorithms and Applications'
  );
  assert.equal(byCode.ENGG1820.courseType, 'internship');
  assert.equal(byCode.IERG4998.courseType, 'capstone');
  assert.equal(byCode.MATH3250.title, 'Discrete Mathematics');
  assert.equal(byCode.MIEG2440.title, 'Discrete Structures and Probability');

  for (const omittedCode of [
    'PHYS1001',
    'PHYS1002',
    'PHYS1111',
    'STAT1011',
    'CSCI5320',
    'FTEC4004',
  ]) {
    assert.equal(byCode[omittedCode], undefined);
  }
  assert.match(supplement.note, /178 evidence-backed unique courses/);
  assert.match(supplement.note, /browse-only/);
  assert.match(supplement.note, /must not produce a graduation completion percentage/);
});
