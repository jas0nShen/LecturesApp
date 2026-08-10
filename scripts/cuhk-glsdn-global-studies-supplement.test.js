const assert = require('node:assert/strict');
const test = require('node:test');

const supplement = require('../data/ug-course-supplements/cuhk-glsdn-global-studies-courses-2025.json');
const {
  COURSE_ROWS,
  FACULTY_PACKAGE_CODES,
  REQUIRED_CODES,
  INTERNSHIP_CODES,
  CAPSTONE_CODES,
  buildCourses,
  buildSupplement,
} = require('./build-cuhk-glsdn-global-studies-supplement');

test('CUHK GLSDN supplement preserves the official 38-course GLSD list and browse-only boundary', () => {
  assert.deepEqual(supplement, buildSupplement());

  const entry = supplement.supplements[0];
  const courses = entry.courses;
  const byCode = Object.fromEntries(courses.map((course) => [course.code, course]));

  assert.equal(entry.programmeCode, 'GLSDN');
  assert.equal(entry.jupasCode, 'JS4892');
  assert.equal(entry.programmeId, 'CUHK-UG-GLSDN-76');
  assert.equal(entry.majorId, 'CUHK-UG-GLSDN-76-M1');
  assert.deepEqual(courses, buildCourses());
  assert.equal(COURSE_ROWS.length, 38);
  assert.equal(courses.length, 38);
  assert.equal(new Set(courses.map((course) => course.code)).size, 38);
  assert.equal(courses.every((course) => course.credits === 3), true);
  assert.equal(courses.filter((course) => course.courseType === 'core').length, 3);
  assert.equal(courses.filter((course) => course.courseType === 'internship').length, 1);
  assert.equal(courses.filter((course) => course.courseType === 'capstone').length, 4);
  assert.equal(courses.filter((course) => course.courseType === 'major_elective').length, 30);
  assert.equal(FACULTY_PACKAGE_CODES.size, 1);
  assert.equal(REQUIRED_CODES.size, 2);
  assert.equal(INTERNSHIP_CODES.size, 1);
  assert.equal(CAPSTONE_CODES.size, 4);

  assert.match(byCode.GLSD1001.group, /Faculty Package/);
  assert.match(byCode.GLSD1003.group, /Major Required/);
  assert.equal(byCode.GLSD3601.courseType, 'internship');
  assert.match(byCode.GLSD4001.group, /Thesis I\/II or Project I\/II/);
  assert.match(byCode.GLSD4004.group, /Thesis I\/II or Project I\/II/);
  assert.match(byCode.GLSD4402.group, /Official GLSD Course List/);
  assert.match(supplement.note, /60-unit Major/);
  assert.match(supplement.note, /incorrectly labels/);
  assert.match(supplement.note, /38-course official GLSD list/);
  assert.match(supplement.note, /browse-only/);
  assert.match(supplement.note, /totalCreditRequired=0/);
});
