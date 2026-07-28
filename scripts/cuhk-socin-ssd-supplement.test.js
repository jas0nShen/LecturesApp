const assert = require('node:assert/strict');
const test = require('node:test');
const supplementFile = require('../data/ug-course-supplements/cuhk-socin-ssd-sociology-courses-2026.json');
const { addGenericCourseSupplements } = require('./generate-ug-catalog');
const { validateSupplement } = require('./validate-ug-supplements');

test('CUHK Society and Sustainable Development publishes the verified Sociology portion without inferring missing units', () => {
  const [rawSupplement] = supplementFile.supplements;
  const supplement = {
    provider: supplementFile.provider,
    academicYear: supplementFile.academicYear,
    sourceUrl: supplementFile.sourceUrl,
    officialUrl: supplementFile.officialUrl,
    ...rawSupplement
  };
  validateSupplement(supplement, 0);

  const catalogue = {
    programmes: [{
      id: 'CUHK-UG-SOCIN-SSD-82',
      universityCode: 'CUHK',
      code: 'SOCIN-SSD',
      nameEn: 'Society and Sustainable Development',
      sourceStatus: 'programme_summary_only',
      courseCount: 0,
      codedCourseCount: 0
    }],
    majors: [{
      id: 'CUHK-UG-SOCIN-SSD-82-M1',
      programmeId: 'CUHK-UG-SOCIN-SSD-82',
      nameEn: 'Society and Sustainable Development',
      courseCount: 0,
      codedCourseCount: 0
    }],
    courses: []
  };

  addGenericCourseSupplements(catalogue, [supplement]);

  const courses = catalogue.courses;
  const byCode = Object.fromEntries(courses.map((course) => [course.courseCode, course]));
  assert.equal(catalogue.programmes[0].sourceStatus, 'course_codes_available');
  assert.equal(catalogue.programmes[0].codedCourseCount, 33);
  assert.equal(catalogue.majors[0].codedCourseCount, 33);
  assert.equal(courses.length, 33);
  assert.equal(new Set(courses.map((course) => course.courseCode)).size, 33);
  assert(courses.every((course) => course.credits === 0));
  assert(courses.every((course) => course.recommendedYear === 0));
  assert(courses.every((course) => course.semester === ''));

  assert.equal(courses.filter((course) => course.courseType === 'core').length, 8);
  assert.equal(courses.filter((course) => course.courseType === 'capstone').length, 2);
  assert.equal(courses.filter((course) => course.courseType === 'internship').length, 1);
  assert.equal(courses.filter((course) => course.courseType === 'major_elective').length, 22);
  assert.match(byCode.SOCI4020.requirementGroups[0], /Required Course and conditional Sociology elective/);
  assert.match(byCode.SOCI4211.requirementGroups[0], /supervisor-endorsement rules apply/);
  ['SOCI2203', 'SOCI2219', 'SOCI3240', 'SOCI3241'].forEach((code) => {
    assert.match(byCode[code].requirementGroups[0], /2024-25 consideration annotation/);
  });

  assert.match(supplementFile.note, /complete 33-code Sociology portion/i);
  assert.match(supplementFile.note, /credits, recommendedYear and semester remain unknown instead of being inferred/i);
  assert.match(supplementFile.note, /Earth System Science and Diversity-cluster rows are excluded/i);
  assert.match(supplementFile.note, /partial read-only planning list/i);
});
