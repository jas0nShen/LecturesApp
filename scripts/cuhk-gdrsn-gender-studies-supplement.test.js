const assert = require('node:assert/strict');
const test = require('node:test');
const supplementFile = require('../data/ug-course-supplements/cuhk-gdrsn-gender-studies-courses-2026.json');
const { addGenericCourseSupplements } = require('./generate-ug-catalog');
const { validateSupplement } = require('./validate-ug-supplements');

test('CUHK Gender Studies publishes the current course list without resolving official unit conflicts', () => {
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
      id: 'CUHK-UG-GDRSN-73',
      universityCode: 'CUHK',
      code: 'GDRSN',
      nameEn: 'Gender Studies',
      sourceStatus: 'programme_summary_only',
      courseCount: 0,
      codedCourseCount: 0
    }],
    majors: [{
      id: 'CUHK-UG-GDRSN-73-M1',
      programmeId: 'CUHK-UG-GDRSN-73',
      nameEn: 'Gender Studies',
      courseCount: 0,
      codedCourseCount: 0
    }],
    courses: []
  };

  addGenericCourseSupplements(catalogue, [supplement]);

  const courses = catalogue.courses;
  const byCode = Object.fromEntries(courses.map((course) => [course.courseCode, course]));
  assert.equal(catalogue.programmes[0].sourceStatus, 'course_codes_available');
  assert.equal(catalogue.programmes[0].codedCourseCount, 62);
  assert.equal(catalogue.majors[0].codedCourseCount, 62);
  assert.equal(courses.length, 62);
  assert.equal(new Set(courses.map((course) => course.courseCode)).size, 62);
  assert(courses.every((course) => course.credits === 0));
  assert(courses.every((course) => course.recommendedYear === 0));
  assert(courses.every((course) => course.semester === ''));

  assert.equal(courses.filter((course) => course.courseType === 'core').length, 5);
  assert.equal(courses.filter((course) => course.courseType === 'capstone').length, 2);
  assert.equal(courses.filter((course) => course.courseType === 'internship').length, 1);
  assert.equal(courses.filter((course) => course.courseType === 'major_elective').length, 54);
  assert.equal(byCode.GDRD3002.titleEn, 'Gender Studies: Special Topic II');
  assert.match(byCode.GDRD3002.requirementGroups[0], /preserved from both current official tables/);
  assert.match(byCode.GDRS4009.requirementGroups[0], /choose Internship or Thesis I and Thesis II/);
  assert.match(byCode.ANTH1310.requirementGroups[0], /maximum 6 non-GDRS units/);
  assert.match(byCode.ANTH2310.requirementGroups[0], /official # marker/);
  assert.match(byCode.ANTH2310.requirementGroups[0], /included in Major GPA calculation/);

  assert.match(supplementFile.note, /all 62 unique current course codes/i);
  assert.match(supplementFile.note, /Required table labels the listed block as 18 units/i);
  assert.match(supplementFile.note, /Elective table labels the pool as 36 units/i);
  assert.match(supplementFile.note, /GDRD3002 is preserved verbatim/i);
  assert.match(supplementFile.note, /partial read-only planning list/i);
});
