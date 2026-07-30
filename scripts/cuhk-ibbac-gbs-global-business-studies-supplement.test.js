const assert = require('node:assert/strict');
const test = require('node:test');

const supplement = require('../data/ug-course-supplements/cuhk-ibbac-gbs-global-business-studies-courses-2026.json');
const {
  COURSE_ROWS,
  OFFICIAL_NAMED_CODES,
  buildCourses,
  buildSupplement,
} = require('./build-cuhk-ibbac-gbs-global-business-studies-supplement');

test('CUHK IBBAC-GBS supplement matches the current curriculum and official course catalogue', () => {
  assert.deepEqual(supplement, buildSupplement());

  const entry = supplement.supplements[0];
  const courses = entry.courses;
  const byCode = Object.fromEntries(courses.map((course) => [course.code, course]));
  const actualCodes = courses.map((course) => course.code).sort();
  const officialCodes = [...OFFICIAL_NAMED_CODES].sort();

  assert.equal(entry.programmeCode, 'IBBAC-GBS');
  assert.equal(entry.jupasCode, 'JS4214');
  assert.equal(entry.programmeId, 'CUHK-UG-IBBAC-GBS-19');
  assert.equal(entry.majorId, 'CUHK-UG-IBBAC-GBS-19-M1');
  assert.equal(COURSE_ROWS.length, 21);
  assert.deepEqual(courses, buildCourses());
  assert.equal(courses.length, 21);
  assert.equal(new Set(actualCodes).size, 21);
  assert.deepEqual(
    {
      missing: officialCodes.filter((code) => !actualCodes.includes(code)),
      extra: actualCodes.filter((code) => !officialCodes.includes(code)),
    },
    { missing: [], extra: [] }
  );

  assert.equal(courses.filter((course) => course.group.startsWith('Faculty Package')).length, 3);
  assert.equal(courses.filter((course) => course.group.startsWith('Major Required')).length, 18);
  assert.equal(courses.filter((course) => course.courseType === 'core').length, 20);
  assert.equal(courses.filter((course) => course.courseType === 'capstone').length, 1);
  assert.equal(courses.filter((course) => course.credits === 1).length, 3);
  assert.equal(courses.filter((course) => course.credits === 2).length, 2);
  assert.equal(courses.filter((course) => course.credits === 3).length, 15);
  assert.equal(courses.filter((course) => course.credits === 4).length, 1);

  assert.match(byCode.ACCT2151.group, /ACCT2151 or ACCT3151/);
  assert.equal(byCode.IBBA4010.credits, 3);
  assert.equal(byCode.DOTE2030.credits, 3);
  assert.equal(byCode.MGNT4510.title, 'China Business');
  assert.equal(byCode.MGNT4510.credits, 3);
  assert.equal(byCode.MKTG3010.credits, 3);
  assert.equal(byCode.MKTG4070.credits, 3);
  assert.equal(byCode.MGNT4010.courseType, 'capstone');

  assert.match(supplement.note, /123-unit curriculum/);
  assert.match(supplement.note, /21 unique codes/);
  assert.match(supplement.note, /MGTNT 4510/);
  assert.match(supplement.note, /browse-only/);
  assert.match(supplement.note, /totalCreditRequired=0/);
});
