const assert = require('node:assert/strict');
const test = require('node:test');

const supplement = require('../data/ug-course-supplements/cuhk-glefn-global-economics-finance-courses-2025.json');
const {
  COURSE_ROWS,
  OFFICIAL_COURSE_LIST_CODES,
  buildCourses,
  buildSupplement,
} = require('./build-cuhk-glefn-global-economics-finance-supplement');

test('CUHK GLEFN supplement matches the official 2025-26 Study Scheme and Course List', () => {
  assert.deepEqual(supplement, buildSupplement());

  const entry = supplement.supplements[0];
  const courses = entry.courses;
  const byCode = Object.fromEntries(courses.map((course) => [course.code, course]));
  const actualCodes = courses.map((course) => course.code).sort();
  const officialCodes = [...OFFICIAL_COURSE_LIST_CODES].sort();

  assert.equal(entry.programmeCode, 'GLEFN');
  assert.equal(entry.jupasCode, 'JS4254');
  assert.equal(entry.programmeId, 'CUHK-UG-GLEFN-20');
  assert.equal(entry.majorId, 'CUHK-UG-GLEFN-20-M1');
  assert.equal(COURSE_ROWS.length, 117);
  assert.deepEqual(courses, buildCourses());
  assert.equal(courses.length, 117);
  assert.equal(new Set(actualCodes).size, 117);
  assert.deepEqual(
    {
      missing: officialCodes.filter((code) => !actualCodes.includes(code)),
      extra: actualCodes.filter((code) => !officialCodes.includes(code)),
    },
    { missing: [], extra: [] }
  );

  assert.equal(courses.filter((course) => course.group.startsWith('Faculty Package')).length, 31);
  assert.equal(
    courses.filter((course) =>
      course.group.startsWith('Faculty of Business Administration Co-curricular Course')
    ).length,
    3
  );
  assert.equal(courses.filter((course) => course.group.startsWith('Major Required')).length, 13);
  assert.equal(
    courses.filter((course) => course.group.includes('Major Elective · Economics')).length,
    25
  );
  assert.equal(
    courses.filter((course) => course.group.includes('Major Elective · Finance and Business'))
      .length,
    43
  );
  assert.equal(courses.filter((course) => course.courseType === 'capstone').length, 2);
  assert.equal(courses.filter((course) => course.credits === 1).length, 17);
  assert.equal(courses.filter((course) => course.credits === 2).length, 4);
  assert.equal(courses.filter((course) => course.credits === 3).length, 95);
  assert.equal(courses.filter((course) => course.credits === 4).length, 1);

  assert.match(byCode.DOTE1030.group, /ECON2011/);
  assert.match(byCode.DOTE2011.group, /ECON2121/);
  assert.match(byCode.DOTE2021.group, /ECON3121/);
  assert.match(byCode.FINA3310.group, /no more than six 1-unit FINA courses/);
  assert.match(byCode.GLEF4070.group, /Co-operative Education/);
  assert.equal(byCode.DOTE2011.credits, 4);
  assert.equal(byCode.ECON1101.credits, 2);
  assert.equal(byCode.ACCT2151.credits, 2);

  assert.match(supplement.note, /67 units/);
  assert.match(supplement.note, /117 unique code-title-unit rows/);
  assert.match(supplement.note, /Overseas Experience/);
  assert.match(supplement.note, /browse-only/);
  assert.match(supplement.note, /totalCreditRequired=0/);
});
