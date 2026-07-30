const assert = require('node:assert/strict');
const test = require('node:test');

const supplement = require('../data/ug-course-supplements/cuhk-ftecn-financial-technology-courses-2025.json');
const {
  buildCourses,
  buildSupplement,
} = require('./build-cuhk-ftecn-financial-technology-supplement');

test('CUHK Financial Technology supplement matches the official 2025 leaflet', () => {
  assert.deepEqual(supplement, buildSupplement());

  const entry = supplement.supplements[0];
  const courses = entry.courses;
  const byCode = Object.fromEntries(courses.map((course) => [course.code, course]));

  assert.equal(entry.programmeCode, 'FTECN');
  assert.equal(entry.jupasCode, 'JS4428');
  assert.equal(entry.programmeId, 'CUHK-UG-FTECN-46');
  assert.equal(entry.majorId, 'CUHK-UG-FTECN-46-M1');
  assert.deepEqual(courses, buildCourses());
  assert.equal(courses.length, 85);
  assert.equal(new Set(courses.map((course) => course.code)).size, 85);
  assert.equal(courses.filter((course) => course.courseType === 'core').length, 35);
  assert.equal(courses.filter((course) => course.courseType === 'major_elective').length, 46);
  assert.equal(courses.filter((course) => course.courseType === 'capstone').length, 2);
  assert.equal(courses.filter((course) => course.courseType === 'internship').length, 2);
  assert.equal(courses.filter((course) => course.credits === 2).length, 7);
  assert.equal(courses.filter((course) => course.credits === 1).length, 2);
  assert.equal(courses.filter((course) => course.credits === 0).length, 76);

  assert.equal(byCode.ENGG1110.title, 'Problem Solving By Programming');
  assert.equal(byCode.ACCT2111.title, 'Introductory Financial Accounting');
  assert.equal(byCode.IERG4004.title, 'E-payment Systems and Cryptocurrency Technologies');
  assert.equal(courses.filter((course) => course.code === 'IERG4004').length, 1);
  assert.equal(byCode.FTEC4998.courseType, 'capstone');
  assert.equal(byCode.FTEC2602.courseType, 'internship');
  assert.equal(byCode.ENGG1820.courseType, 'internship');
  assert.equal(byCode.FTEC2001.credits, 2);
  assert.equal(byCode.CSCI2040.credits, 2);
  assert.equal(byCode.ENGG1820.credits, 1);
  assert.match(byCode.ESTR4508.group, /Elective Courses/);
  assert.match(supplement.note, /85 unique course codes/);
  assert.match(supplement.note, /truncates ENGG1110 to ENGG110 and ACCT2111 to ACCT211/);
  assert.match(supplement.note, /credits=0/);
  assert.match(supplement.note, /browse-only/);
  assert.match(supplement.note, /must not produce a graduation completion percentage/);
});
