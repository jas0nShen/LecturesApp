const assert = require('node:assert/strict');
const test = require('node:test');
const supplementFile = require('../data/ug-course-supplements/cityu-js1210-materials-science-engineering-2026.json');
const { addGenericCourseSupplements } = require('./generate-ug-catalog');
const { validateSupplement } = require('./validate-ug-supplements');

test('CityU JS1210 keeps the official 2025/26-and-thereafter materials curriculum', () => {
  const [rawSupplement] = supplementFile.supplements;
  const supplement = {
    provider: supplementFile.provider,
    academicYear: supplementFile.academicYear,
    sourceUrl: supplementFile.sourceUrl,
    officialUrl: supplementFile.officialUrl,
    ...rawSupplement
  };
  validateSupplement(supplement, 0);

  const pseudoMajors = supplement.majorOverride.expectedMajorIds.map((id, index) => ({
    id,
    programmeId: 'CITYU-UG-BENGMASE-47',
    code: `FEATURE-${index + 1}`,
    nameEn: `Marketing feature ${index + 1}`,
    courseCount: 0,
    codedCourseCount: 0
  }));
  const catalogue = {
    programmes: [{
      id: 'CITYU-UG-BENGMASE-47',
      universityCode: 'CITYU',
      code: 'BEngMASE',
      jupasCode: 'JS1210',
      nameEn: 'BEng Materials Science and Engineering',
      sourceStatus: 'programme_summary_only',
      courseCount: 0,
      codedCourseCount: 0
    }],
    majors: pseudoMajors,
    courses: []
  };

  addGenericCourseSupplements(catalogue, [supplement]);

  const courses = catalogue.courses;
  const byCode = Object.fromEntries(courses.map((course) => [course.courseCode, course]));
  assert.equal(catalogue.majors.length, 1);
  assert.equal(catalogue.majors[0].code, 'MATERIALS-SCIENCE-AND-ENGINEERING');
  assert.equal(catalogue.programmes[0].sourceStatus, 'course_codes_available');
  assert.equal(catalogue.programmes[0].codedCourseCount, 50);
  assert.equal(catalogue.majors[0].codedCourseCount, 50);
  assert.equal(courses.length, 50);
  assert.equal(new Set(courses.map((course) => course.courseCode)).size, 50);
  assert(courses.every((course) => course.recommendedYear === 0));
  assert(courses.every((course) => course.semester === ''));

  assert.equal(courses.filter((course) => course.requirementGroups[0].startsWith('Major Core')).length, 23);
  assert.equal(courses.filter((course) => course.requirementGroups[0] === 'Major Elective - 12 credits required').length, 16);
  assert.equal(courses.filter((course) => course.courseType === 'capstone').length, 2);
  assert.equal(courses.filter((course) => course.courseType === 'internship').length, 2);
  assert.equal(byCode.MSE1001.credits, 0);
  assert.equal(byCode.MSE2066.titleEn, 'Materials Engineers in Society');
  assert.equal(byCode.MSE4116.credits, 6);
  assert.equal(byCode.FS4003.credits, 6);
  assert.equal(byCode.MSE3114.titleEn, 'Fundamentals of Scientific Computing: a Course Powered by AI');
  assert.match(supplement.evidenceNote, /2025\/26 and thereafter/);
  assert.match(supplement.evidenceNote, /MSE2066/);
  assert.match(supplement.evidenceNote, /not converted into study years/);
});
