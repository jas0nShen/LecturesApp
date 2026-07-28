const assert = require('node:assert/strict');
const test = require('node:test');
const sourceReviews = require('../data/ug-source-reviews.json');
const supplementFile = require('../data/ug-course-supplements/cuhk-engen-english-courses-2026.json');
const { addGenericCourseSupplements } = require('./generate-ug-catalog');
const { validateSupplement } = require('./validate-ug-supplements');

test('CUHK English preserves the current departmental pool without inventing Faculty Package courses', () => {
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
      id: 'CUHK-UG-ENGEN-5',
      universityCode: 'CUHK',
      code: 'ENGEN',
      nameEn: 'English',
      sourceStatus: 'programme_summary_only',
      courseCount: 1,
      codedCourseCount: 0
    }],
    majors: [{
      id: 'CUHK-UG-ENGEN-5-M1',
      programmeId: 'CUHK-UG-ENGEN-5',
      nameEn: 'English',
      courseCount: 1,
      codedCourseCount: 0
    }],
    courses: []
  };

  addGenericCourseSupplements(catalogue, [supplement]);

  const courses = catalogue.courses;
  const byCode = Object.fromEntries(courses.map((course) => [course.courseCode, course]));
  const required = courses.filter((course) => (
    course.courseCode !== 'ENGE1000'
    && course.requirementGroups.some((group) => group.startsWith('Required Courses'))
  ));
  const electivePool = courses.filter((course) => (
    course.requirementGroups.some((group) => group.startsWith('Major Elective Courses'))
  ));

  assert.equal(catalogue.programmes[0].sourceStatus, 'course_codes_available');
  assert.equal(catalogue.programmes[0].codedCourseCount, 57);
  assert.equal(catalogue.majors[0].codedCourseCount, 57);
  assert.equal(courses.length, 57);
  assert.equal(new Set(courses.map((course) => course.courseCode)).size, 57);
  assert.equal(required.length, 7);
  assert.equal(required.reduce((sum, course) => sum + course.credits, 0), 21);
  assert.equal(electivePool.length, 49);
  assert.equal(byCode.ENGE1000.credits, 3);
  assert.match(byCode.ENGE1000.requirementGroups[0], /non-ENGE choices not imported/);
  assert.equal(byCode.ENGE4701.courseType, 'capstone');
  assert.equal(byCode.ENGE4701.credits, 1);
  assert.equal(byCode.ENGE4702.courseType, 'capstone');
  assert.equal(byCode.ENGE4702.credits, 5);
  assert.equal(byCode.ENGE3900.courseType, 'internship');
  assert.equal(byCode.ENGE3900.credits, 3);
  assert.equal(byCode.ENGE4700, undefined);
  assert.match(supplementFile.note, /partial read-only planning list/i);
  assert.match(supplementFile.note, /must not be presented as the complete 66-unit graduation structure/i);
});

test('CUHK articulation health programmes remain source-reviewed without fabricated courses', () => {
  const communityHealth = sourceReviews.find((item) => (
    item.universityCode === 'CUHK' && item.programmeCode === 'CHPRN'
  ));
  const gerontology = sourceReviews.find((item) => (
    item.universityCode === 'CUHK' && item.programmeCode === 'BSCGB'
  ));

  assert.equal(communityHealth.status, 'no_public_course_codes');
  assert.match(communityHealth.note, /minimum 69-unit graduation requirement/i);
  assert.match(communityHealth.note, /220 hours of supervised field work/i);
  assert.match(communityHealth.note, /accordion bodies are empty/i);

  assert.equal(gerontology.status, 'no_public_course_codes');
  assert.match(gerontology.note, /minimum 69-unit graduation requirement/i);
  assert.match(gerontology.note, /180-hour Gerontological Practicum/i);
  assert.match(gerontology.note, /accordion bodies are empty/i);
});
