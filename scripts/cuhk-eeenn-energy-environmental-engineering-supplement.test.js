const assert = require('node:assert/strict');
const test = require('node:test');

const supplement = require('../data/ug-course-supplements/cuhk-eeenn-energy-environmental-engineering-courses-2025.json');
const {
  ELECTIVE_ROWS,
  FACULTY_PACKAGE_ROWS,
  FOUNDATION_ROWS,
  REQUIRED_ROWS,
  buildCourses,
  buildSupplement,
} = require('./build-cuhk-eeenn-energy-environmental-engineering-supplement');

test('CUHK Energy and Environmental Engineering supplement matches the official 2025 leaflet', () => {
  assert.deepEqual(supplement, buildSupplement());

  const entry = supplement.supplements[0];
  const courses = entry.courses;
  const byCode = Object.fromEntries(courses.map((course) => [course.code, course]));

  assert.equal(entry.programmeCode, 'EEENN');
  assert.equal(entry.jupasCode, 'JS4462');
  assert.equal(entry.programmeId, 'CUHK-UG-EEENN-45');
  assert.equal(entry.majorId, 'CUHK-UG-EEENN-45-M1');
  assert.equal(
    FACULTY_PACKAGE_ROWS.length +
      FOUNDATION_ROWS.length +
      REQUIRED_ROWS.length +
      ELECTIVE_ROWS.length,
    66
  );
  assert.deepEqual(courses, buildCourses());
  assert.equal(courses.length, 66);
  assert.equal(new Set(courses.map((course) => course.code)).size, 66);
  assert.equal(courses.filter((course) => course.courseType === 'core').length, 20);
  assert.equal(courses.filter((course) => course.courseType === 'major_elective').length, 42);
  assert.equal(courses.filter((course) => course.courseType === 'capstone').length, 2);
  assert.equal(courses.filter((course) => course.courseType === 'internship').length, 2);

  assert.equal(byCode.ENGG1111.credits, 0);
  assert.equal(byCode.EEEN2602.credits, 1);
  assert.equal(byCode.CHEM4280.credits, 2);
  assert.equal(byCode.EEEN4998.courseType, 'capstone');
  assert.equal(byCode.ENGG1820.courseType, 'internship');
  assert.match(byCode.EEEN4020.group, /Sustainable Energy Technology Stream/);
  assert.match(byCode.EEEN3010.group, /Green Building Technology Stream/);
  assert.match(byCode.EESC4240.group, /Environmental Engineering Stream/);
  assert.equal(byCode.MAEG5150.title, 'Advanced Heat Transfer and Fluid Mechanics');
  assert.match(supplement.note, /66 unique named course codes/);
  assert.match(supplement.note, /totalCreditRequired=0/);
  assert.match(supplement.note, /browse-only/);
  assert.match(supplement.note, /must not produce a graduation completion percentage/);
});
