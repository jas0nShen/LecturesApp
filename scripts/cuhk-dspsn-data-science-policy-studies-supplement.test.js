const assert = require('node:assert/strict');
const test = require('node:test');

const supplement = require('../data/ug-course-supplements/cuhk-dspsn-data-science-policy-studies-courses-2023.json');
const {
  COURSE_ROWS,
  FACULTY_PACKAGE_CODES,
  REQUIRED_CODES,
  METHODS_AND_TOOLS_CODES,
  POLICY_APPLICATION_GROUPS,
  RECOMMENDED_SCHEDULE,
  buildCourses,
  buildSupplement,
} = require('./build-cuhk-dspsn-data-science-policy-studies-supplement');

test('CUHK DSPSN supplement preserves the official 2023-24 Course List and source conflicts', () => {
  assert.deepEqual(supplement, buildSupplement());

  const entry = supplement.supplements[0];
  const courses = entry.courses;
  const byCode = Object.fromEntries(courses.map((course) => [course.code, course]));

  assert.equal(entry.programmeCode, 'DSPSN');
  assert.equal(entry.jupasCode, 'JS4893');
  assert.equal(entry.programmeId, 'CUHK-UG-DSPSN-70');
  assert.equal(entry.majorId, 'CUHK-UG-DSPSN-70-M1');
  assert.deepEqual(courses, buildCourses());
  assert.equal(COURSE_ROWS.length, 61);
  assert.equal(courses.length, 61);
  assert.equal(new Set(courses.map((course) => course.code)).size, 61);
  assert.equal(courses.filter((course) => course.credits === 3).length, 5);
  assert.equal(courses.filter((course) => course.credits === 0).length, 56);
  assert.equal(FACULTY_PACKAGE_CODES.size, 1);
  assert.equal(REQUIRED_CODES.size, 5);
  assert.equal(METHODS_AND_TOOLS_CODES.length, 18);
  assert.deepEqual(
    Object.fromEntries(
      Object.entries(POLICY_APPLICATION_GROUPS).map(([group, codes]) => [group, codes.length])
    ),
    {
      'Policy Applications · Policy Science and Public Governance': 13,
      'Policy Applications · Global Relationship': 4,
      'Policy Applications · Human Resources': 3,
      'Policy Applications · Social Problems, Deviance, Law and Order': 5,
      'Policy Applications · Sustainable Smart Cities': 12,
    }
  );
  assert.equal(Object.keys(RECOMMENDED_SCHEDULE).length, 8);

  assert.equal(byCode.DSPS1001.courseType, 'core');
  assert.equal(byCode.DSPS1001.credits, 0);
  assert.match(byCode.DSPS1001.group, /Faculty Package/);
  assert.equal(byCode.DSPS3801.courseType, 'internship');
  assert.equal(byCode.DSPS3801.credits, 3);
  assert.equal(byCode.DSPS4801.courseType, 'capstone');
  assert.equal(byCode.DSPS4802.courseType, 'capstone');
  assert.equal(byCode.DSPS2730.title, 'Calculus for Data Science');
  assert.equal(byCode.DSPS2830.title, 'Linear Algebra for Data Science');
  assert.match(byCode.DSPS3202.group, /Source conflict/);
  assert.match(byCode.DSPS3501.group, /Source conflict/);
  assert.deepEqual([byCode.DSPS4801.recommendedYear, byCode.DSPS4801.semester], [4, 'Term 1']);
  assert.match(supplement.note, /61 unique code-title pairs/);
  assert.match(supplement.note, /26 external candidate codes/);
  assert.match(supplement.note, /pages 2-5 repeat/);
  assert.match(supplement.note, /DSPS2730 Calculus/);
  assert.match(supplement.note, /DSPS3202 and DSPS3501/);
  assert.match(supplement.note, /totalCreditRequired remains 0/);
});
