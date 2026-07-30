const assert = require('node:assert/strict');
const test = require('node:test');

const supplement = require('../data/ug-course-supplements/cuhk-iergn-information-engineering-courses-2025.json');
const {
  EXCLUDED_COURSE_LIST_CODES,
  PDF_COURSE_ROWS,
  buildSupplement,
} = require('./build-cuhk-iergn-information-engineering-supplement');

test('CUHK Information Engineering supplement matches the official 2025-26 evidence scope', () => {
  assert.deepEqual(supplement, buildSupplement());
  assert.equal(PDF_COURSE_ROWS.length, 122);
  assert.equal(EXCLUDED_COURSE_LIST_CODES.size, 5);

  const entry = supplement.supplements[0];
  const courses = entry.courses;
  const byCode = Object.fromEntries(courses.map((course) => [course.code, course]));

  assert.equal(entry.programmeCode, 'IERGN');
  assert.equal(entry.jupasCode, 'JS4446');
  assert.equal(entry.programmeId, 'CUHK-UG-IERGN-47');
  assert.equal(entry.majorId, 'CUHK-UG-IERGN-47-M1');
  assert.equal(courses.length, 135);
  assert.equal(new Set(courses.map((course) => course.code)).size, 135);
  assert.equal(courses.filter((course) => course.courseType === 'core').length, 41);
  assert.equal(courses.filter((course) => course.courseType === 'major_elective').length, 92);
  assert.equal(courses.filter((course) => course.courseType === 'capstone').length, 2);
  assert.equal(courses.filter((course) => course.credits === 0).length, 1);
  assert.equal(courses.filter((course) => course.credits === 1).length, 9);
  assert.equal(courses.filter((course) => course.credits === 2).length, 4);
  assert.equal(courses.filter((course) => course.credits === 3).length, 121);

  assert.equal(byCode.ENGG1111.title, 'AI Literacy Workshop');
  assert.equal(byCode.ENGG1111.credits, 0);
  assert.match(byCode.ENGG2440.group, /Foundation Courses · 11 units/);
  assert.match(byCode.IERG3840.group, /choose IERG3840 or IERG3842/);
  assert.match(byCode.IERG4998.group, /Research Component Courses/);
  assert.match(byCode.CSCI4180.group, /optional 12-unit Stream pool/);
  assert.equal(
    byCode.IERG5360.title,
    'Program Representation, Modeling and Understanding for Software Security'
  );
  assert.equal(byCode.IERG5470.credits, 3);

  for (const code of EXCLUDED_COURSE_LIST_CODES) {
    assert.equal(byCode[code], undefined);
  }
  for (const omittedCode of ['ESTR3102', 'ESTR3104', 'ESTR4106', 'ELEG5491']) {
    assert.equal(byCode[omittedCode], undefined);
  }
  assert.match(supplement.note, /browse-only/);
  assert.match(supplement.note, /must not produce a graduation completion percentage/);
});
