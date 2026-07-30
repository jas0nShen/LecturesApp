const assert = require('node:assert/strict');
const test = require('node:test');

const supplement = require('../data/ug-course-supplements/cuhk-htmgb-hospitality-real-estate-courses-2026.json');
const {
  BROCHURE_CODES,
  COURSE_ROWS,
  UNCODED_ELECTIVE_TITLES,
  buildCourses,
  buildSupplement,
} = require('./build-cuhk-htmgb-hospitality-real-estate-supplement');

test('CUHK HTMGB supplement matches the coded 2026-entry curriculum scope', () => {
  assert.deepEqual(supplement, buildSupplement());

  const entry = supplement.supplements[0];
  const courses = entry.courses;
  const byCode = Object.fromEntries(courses.map((course) => [course.code, course]));
  const actualCodes = courses.map((course) => course.code).sort();
  const brochureCodes = [...BROCHURE_CODES].sort();

  assert.equal(entry.programmeCode, 'HTMGB');
  assert.equal(entry.jupasCode, 'JS4226');
  assert.equal(entry.programmeId, 'CUHK-UG-HTMGB-21');
  assert.equal(entry.majorId, 'CUHK-UG-HTMGB-21-M1');
  assert.equal(COURSE_ROWS.length, 33);
  assert.deepEqual(courses, buildCourses());
  assert.equal(courses.length, 33);
  assert.equal(new Set(actualCodes).size, 33);
  assert.deepEqual(
    {
      missing: brochureCodes.filter((code) => !actualCodes.includes(code)),
      extra: actualCodes.filter((code) => !brochureCodes.includes(code)),
    },
    { missing: [], extra: [] }
  );

  assert.equal(courses.filter((course) => course.group.startsWith('Faculty Package')).length, 3);
  assert.equal(courses.filter((course) => course.group.startsWith('Core')).length, 19);
  assert.equal(courses.filter((course) => course.group.includes('Hospitality')).length, 5);
  assert.equal(courses.filter((course) => course.group.includes('Real Estate')).length, 5);
  assert.equal(courses.filter((course) => course.courseType === 'core').length, 30);
  assert.equal(courses.filter((course) => course.courseType === 'capstone').length, 1);
  assert.equal(courses.filter((course) => course.courseType === 'internship').length, 2);
  assert.equal(courses.filter((course) => course.credits === 0).length, 4);
  assert.equal(courses.filter((course) => course.credits === 1).length, 7);
  assert.equal(courses.filter((course) => course.credits === 3).length, 22);

  assert.equal(byCode.HTMG4900.courseType, 'capstone');
  assert.equal(byCode.HTMG2900.courseType, 'internship');
  assert.equal(byCode.HTMG3900.courseType, 'internship');
  assert.match(byCode.HTMG4600.group, /Hospitality and Real Estate shared/);
  assert.equal(byCode.HTMG1091.credits, 0);
  assert.equal(byCode.HTMG1092.credits, 1);
  assert.equal(byCode.HTMG2000.credits, 1);
  assert.equal(UNCODED_ELECTIVE_TITLES.length, 22);

  assert.match(supplement.note, /33 unique fixed codes/);
  assert.match(supplement.note, /22 three-unit module electives/);
  assert.match(supplement.note, /Executive-in-Residence/);
  assert.match(supplement.note, /browse-only/);
  assert.match(supplement.note, /totalCreditRequired=0/);
});
