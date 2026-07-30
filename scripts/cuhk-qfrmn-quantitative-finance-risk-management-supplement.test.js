const assert = require('node:assert/strict');
const test = require('node:test');

const supplement = require('../data/ug-course-supplements/cuhk-qfrmn-quantitative-finance-risk-management-courses-2025.json');
const {
  COURSE_ROWS,
  buildCourses,
  buildSupplement,
} = require('./build-cuhk-qfrmn-quantitative-finance-risk-management-supplement');

test('CUHK QFRMN supplement matches the official 2025-26 Study Scheme and Course List', () => {
  assert.deepEqual(supplement, buildSupplement());

  const entry = supplement.supplements[0];
  const courses = entry.courses;
  const byCode = Object.fromEntries(courses.map((course) => [course.code, course]));

  assert.equal(entry.programmeCode, 'QFRMN');
  assert.equal(entry.jupasCode, 'JS4276');
  assert.equal(entry.programmeId, 'CUHK-UG-QFRMN-27');
  assert.equal(entry.majorId, 'CUHK-UG-QFRMN-27-M1');
  assert.equal(COURSE_ROWS.length, 122);
  assert.deepEqual(courses, buildCourses());
  assert.equal(courses.length, 122);
  assert.equal(new Set(courses.map((course) => course.code)).size, 122);

  assert.equal(courses.filter((course) => course.courseType === 'core').length, 32);
  assert.equal(courses.filter((course) => course.courseType === 'major_elective').length, 79);
  assert.equal(courses.filter((course) => course.courseType === 'capstone').length, 11);
  assert.equal(
    courses.filter((course) => course.group.includes('Major Elective · Business')).length,
    48
  );
  assert.equal(
    courses.filter((course) => course.group.includes('Major Elective · Quantitative Finance'))
      .length,
    6
  );
  assert.equal(
    courses.filter((course) => course.group.includes('Major Elective · Risk Management Science'))
      .length,
    25
  );
  assert.equal(courses.filter((course) => course.credits === 1).length, 17);
  assert.equal(courses.filter((course) => course.credits === 2).length, 2);
  assert.equal(courses.filter((course) => course.credits === 3).length, 103);

  assert.match(byCode.MATH1530.group, /not counted in the 84-unit Major/);
  assert.match(byCode.MATH1010.group, /Placement Test/);
  assert.match(byCode.CSCI1550.group, /choose one of/);
  assert.match(byCode.DOTE2051.group, /CSCI2100/);
  assert.match(byCode.ACCT2151.group, /ACCT2151 or ACCT3151/);
  assert.match(byCode.ACCT4214.group, /ACCT4212, ACCT4213 or ACCT4214/);
  assert.match(byCode.FINA3310.group, /no more than six 1-unit courses/);
  assert.match(byCode.FINA4110.group, /choose at least 9 units/);
  assert.match(byCode.RMSC4005.group, /Risk Management Science/);
  assert.match(byCode.FINA4390.group, /Co-operative Education/);
  assert.equal(byCode.ACCT2151.credits, 2);
  assert.equal(byCode.MGNT2611.credits, 2);
  assert.equal(byCode.FINA6232.courseType, 'capstone');

  assert.match(supplement.note, /84-unit standard Major/);
  assert.match(supplement.note, /121 unique code-title-unit rows/);
  assert.match(supplement.note, /122-code browsable scope/);
  assert.match(supplement.note, /University of Edinburgh dual-degree transfer pattern/);
  assert.match(supplement.note, /browse-only/);
  assert.match(supplement.note, /totalCreditRequired=0/);
});
