const assert = require('node:assert/strict');
const test = require('node:test');

const supplement = require('../data/ug-course-supplements/cuhk-behmn-biotechnology-entrepreneurship-healthcare-management-courses-2026.json');
const {
  COURSE_ROWS,
  CURRENT_PAGE_TITLES,
  buildCourses,
  buildSupplement,
  getUnresolvedTitles,
} = require('./build-cuhk-behmn-biotechnology-entrepreneurship-healthcare-management-supplement');

test('CUHK BEHMN supplement exposes only current titles with cross-verified official codes', () => {
  assert.deepEqual(supplement, buildSupplement());

  const entry = supplement.supplements[0];
  const courses = entry.courses;
  const byCode = Object.fromEntries(courses.map((course) => [course.code, course]));

  assert.equal(entry.programmeCode, 'BEHMN');
  assert.equal(entry.jupasCode, 'JS4725');
  assert.equal(entry.programmeId, 'CUHK-UG-BEHMN-18');
  assert.equal(entry.majorId, 'CUHK-UG-BEHMN-18-M1');
  assert.deepEqual(courses, buildCourses());
  assert.equal(CURRENT_PAGE_TITLES.length, 53);
  assert.equal(COURSE_ROWS.length, 17);
  assert.equal(courses.length, 17);
  assert.equal(new Set(courses.map((course) => course.code)).size, 17);
  assert.equal(getUnresolvedTitles().length, 36);

  assert.equal(courses.filter((course) => course.group.startsWith('Faculty Package')).length, 3);
  assert.equal(courses.filter((course) => course.group.startsWith('Major Required')).length, 8);
  assert.equal(courses.filter((course) => course.group.startsWith('Concentration A Required')).length, 4);
  assert.equal(courses.filter((course) => course.group.startsWith('Concentration B Elective')).length, 2);
  assert.equal(courses.filter((course) => course.courseType === 'core').length, 15);
  assert.equal(courses.filter((course) => course.courseType === 'major_elective').length, 2);
  assert.equal(courses.filter((course) => course.credits === 2).length, 3);
  assert.equal(courses.filter((course) => course.credits === 3).length, 13);
  assert.equal(courses.filter((course) => course.credits === 4).length, 1);

  assert.equal(byCode.LSCI1002.title, 'Introduction to Biological Sciences');
  assert.equal(byCode.MEDF1012.title, 'Foundation Course for Health Sciences II');
  assert.equal(byCode.MBTE2000.credits, 2);
  assert.equal(byCode.ACCT2151.credits, 2);
  assert.match(byCode.MGNT4090.group, /Concentration A Required/);
  assert.match(byCode.DOTE4220.group, /Concentration B Elective/);

  assert.match(supplement.note, /53 unique visible course titles/);
  assert.match(supplement.note, /17 current rows/);
  assert.match(supplement.note, /remaining 36 named rows/);
  assert.match(supplement.note, /browse-only/);
  assert.match(supplement.note, /totalCreditRequired=0/);
});
