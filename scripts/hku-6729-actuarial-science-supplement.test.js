const assert = require('node:assert/strict');
const test = require('node:test');
const supplementFile = require('../data/ug-course-supplements/hku-6729-actuarial-science-curriculum-2025.json');
const { addGenericCourseSupplements } = require('./generate-ug-catalog');
const { validateSupplement } = require('./validate-ug-supplements');

test('HKU BSc in Actuarial Science preserves the complete 132-credit disciplinary structure', () => {
  const [supplement] = supplementFile.supplements;
  validateSupplement({
    provider: supplementFile.provider,
    academicYear: supplementFile.academicYear,
    sourceUrl: supplementFile.sourceUrl,
    officialUrl: supplementFile.officialUrl,
    ...supplement
  }, 0);

  const catalogue = {
    programmes: [{
      id: 'HKU-UG-6729-67',
      universityCode: 'HKU',
      code: '6729',
      nameEn: 'Bachelor of Science in Actuarial Science',
      sourceStatus: 'programme_summary_only',
      courseCount: 1,
      codedCourseCount: 0
    }],
    majors: [{
      id: 'HKU-UG-6729-67-M1',
      programmeId: 'HKU-UG-6729-67',
      nameEn: 'Bachelor of Science in Actuarial Science',
      courseCount: 1,
      codedCourseCount: 0
    }],
    courses: []
  };

  addGenericCourseSupplements(catalogue, [{
    provider: supplementFile.provider,
    academicYear: supplementFile.academicYear,
    sourceUrl: supplementFile.sourceUrl,
    officialUrl: supplementFile.officialUrl,
    ...supplement
  }]);

  const programme = catalogue.programmes[0];
  const major = catalogue.majors[0];
  const courses = catalogue.courses;
  const core = courses.filter((course) => course.courseType === 'core');
  const electives = courses.filter((course) => course.courseType === 'major_elective');
  const capstones = courses.filter((course) => course.courseType === 'capstone');
  const coreCredits = core.reduce((total, course) => total + course.credits, 0);

  assert.equal(programme.sourceStatus, 'course_codes_available');
  assert.equal(programme.codedCourseCount, 30);
  assert.equal(major.codedCourseCount, 30);
  assert.equal(courses.length, 30);
  assert.equal(new Set(courses.map((course) => course.courseCode)).size, 30);
  assert.equal(core.length, 19);
  assert.equal(coreCredits, 114);
  assert.equal(electives.length, 8);
  assert(electives.every((course) => course.credits === 6 && course.recommendedYear === 4));
  assert.equal(capstones.length, 3);
  assert(capstones.every((course) => course.credits === 6 && course.recommendedYear === 4));
  assert.equal(coreCredits + 12 + 6, 132);
  assert(courses.every((course) => course.semester === ''));
  assert(['ACCT1101', 'MATH1821', 'SDST3901', 'SDST4904', 'SDST4903', 'SDST4798']
    .every((code) => courses.some((course) => course.courseCode === code)));
  assert(!courses.some((course) => /Common Core|Free Elective|AILTxxxx/i.test(course.courseCode)));
});
