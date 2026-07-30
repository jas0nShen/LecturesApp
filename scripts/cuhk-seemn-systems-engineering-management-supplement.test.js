const assert = require('node:assert/strict');
const test = require('node:test');

const supplement = require('../data/ug-course-supplements/cuhk-seemn-systems-engineering-management-courses-2025.json');
const {
  buildCourses,
  buildSupplement,
} = require('./build-cuhk-seemn-systems-engineering-management-supplement');

test('CUHK Systems Engineering and Engineering Management supplement matches the official 2025 leaflet', () => {
  assert.deepEqual(supplement, buildSupplement());

  const entry = supplement.supplements[0];
  const courses = entry.courses;
  const byCode = Object.fromEntries(courses.map((course) => [course.code, course]));

  assert.equal(entry.programmeCode, 'SEEMN');
  assert.equal(entry.jupasCode, 'JS4458');
  assert.equal(entry.programmeId, 'CUHK-UG-SEEMN-51');
  assert.equal(entry.majorId, 'CUHK-UG-SEEMN-51-M1');
  assert.deepEqual(courses, buildCourses());
  assert.equal(courses.length, 83);
  assert.equal(new Set(courses.map((course) => course.code)).size, 83);
  assert.equal(courses.filter((course) => course.courseType === 'core').length, 44);
  assert.equal(courses.filter((course) => course.courseType === 'major_elective').length, 35);
  assert.equal(courses.filter((course) => course.courseType === 'capstone').length, 2);
  assert.equal(courses.filter((course) => course.courseType === 'internship').length, 2);
  assert.equal(courses.filter((course) => course.credits === 1).length, 1);
  assert.equal(courses.filter((course) => course.credits === 0).length, 82);

  assert.equal(byCode.ENGG1111.credits, 0);
  assert.equal(byCode.ENGG1820.credits, 1);
  assert.equal(byCode.SEEM4998.courseType, 'capstone');
  assert.equal(byCode.SEEM2602.courseType, 'internship');
  assert.match(byCode.SEEM3430.group, /Business Information Systems Stream/);
  assert.match(byCode.SEEM3620.group, /Decision Analytics Stream/);
  assert.match(byCode.FTEC4005.group, /Business Information Systems and Decision Analytics Streams/);
  assert.equal(byCode.ESTR4508.title, 'Data Analytics Models and Methods for Financial Engineering and Fintech');
  assert.match(supplement.note, /83 unique course codes/);
  assert.match(supplement.note, /credits=0/);
  assert.match(supplement.note, /browse-only/);
  assert.match(supplement.note, /must not produce a graduation completion percentage/);
});
