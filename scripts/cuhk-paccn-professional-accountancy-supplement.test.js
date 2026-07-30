const assert = require('node:assert/strict');
const test = require('node:test');

const supplement = require('../data/ug-course-supplements/cuhk-paccn-professional-accountancy-courses-2025.json');
const {
  COURSE_ROWS,
  buildCourses,
  buildSupplement,
} = require('./build-cuhk-paccn-professional-accountancy-supplement');

test('CUHK Professional Accountancy supplement matches the official PACC Curriculum 2025', () => {
  assert.deepEqual(supplement, buildSupplement());

  const entry = supplement.supplements[0];
  const courses = entry.courses;
  const byCode = Object.fromEntries(courses.map((course) => [course.code, course]));
  const standardRequiredCredits = courses
    .filter(
      (course) =>
        course.courseType !== 'major_elective' &&
        course.code !== 'ACCT3004'
    )
    .reduce((sum, course) => sum + course.credits, 0);

  assert.equal(entry.programmeCode, 'PACCN');
  assert.equal(entry.jupasCode, 'JS4240');
  assert.equal(entry.programmeId, 'CUHK-UG-PACCN-25');
  assert.equal(entry.majorId, 'CUHK-UG-PACCN-25-M1');
  assert.equal(COURSE_ROWS.length, 49);
  assert.deepEqual(courses, buildCourses());
  assert.equal(courses.length, 49);
  assert.equal(new Set(courses.map((course) => course.code)).size, 49);
  assert.equal(courses.filter((course) => course.courseType === 'foundation').length, 3);
  assert.equal(courses.filter((course) => course.courseType === 'core').length, 19);
  assert.equal(courses.filter((course) => course.courseType === 'capstone').length, 1);
  assert.equal(courses.filter((course) => course.courseType === 'major_elective').length, 26);
  assert.equal(standardRequiredCredits, 60);

  assert.equal(byCode.ACCT3003.credits, 1);
  assert.equal(byCode.ACCT3004.credits, 2);
  assert.match(byCode.ACCT3004.group, /Global Accounting Stream only/);
  assert.equal(byCode.DOTE2011.credits, 4);
  assert.equal(byCode.ACCT4001.courseType, 'capstone');
  assert.equal(byCode.ACCT3005.credits, 2);
  assert.match(byCode.ACCT4215.group, /Global Accounting Stream only/);
  assert.match(byCode.ACCT3241.group, /available as of 01\/07\/2024/);
  assert.match(byCode.MATH1620.group, /annual offering not guaranteed/);
  assert.match(supplement.note, /49 unique codes/);
  assert.match(supplement.note, /total exactly 60 units/);
  assert.match(supplement.note, /complete 49-code course list remains browse-only/);
  assert.match(supplement.note, /totalCreditRequired=0/);
});
