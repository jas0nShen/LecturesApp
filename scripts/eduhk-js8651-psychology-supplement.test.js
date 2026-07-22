const assert = require('node:assert/strict');
const test = require('node:test');
const supplementFile = require('../data/ug-course-supplements/eduhk-js8651-psychology-2026.json');
const { addGenericCourseSupplements } = require('./generate-ug-catalog');
const { validateSupplement } = require('./validate-ug-supplements');

test('EdUHK JS8651 exposes the official 2026/27 coded Major subset without inventing unmapped curriculum groups', () => {
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
      id: 'EDUHK-UG-JS8651-14',
      universityCode: 'EDUHK',
      code: 'JS8651',
      jupasCode: 'JS8651',
      nameEn: 'Bachelor of Social Sciences (Honours) in Psychology',
      sourceStatus: 'programme_summary_only',
      courseCount: 0,
      codedCourseCount: 0
    }],
    majors: [{
      id: 'EDUHK-UG-JS8651-14-M1',
      programmeId: 'EDUHK-UG-JS8651-14',
      nameEn: 'Bachelor of Social Sciences (Honours) in Psychology',
      courseCount: 0,
      codedCourseCount: 0
    }],
    courses: []
  };

  addGenericCourseSupplements(catalogue, [supplement]);

  const courses = catalogue.courses;
  const byCode = Object.fromEntries(courses.map((course) => [course.courseCode, course]));
  const expectedCodes = [
    'PSY1030', 'PSY2001', 'PSY2007', 'PSY2008', 'PSY2020', 'PSY2031', 'PSY2032',
    'PSY3004', 'PSY3005', 'PSY3018', 'PSY3019', 'PSY3021', 'PSY3022', 'PSY3024',
    'PSY3025', 'PSY3026', 'PSY3027', 'PSY3033', 'PSY3082', 'PSY4023', 'PSY4028',
    'PSY4029', 'PSY4038', 'PSY4054', 'PSY4058', 'PSY4073', 'PSY4074', 'PSY4075',
    'PSY4083', 'CFA1001', 'CFB3013', 'CFC3018', 'CFC3024', 'CFC3026'
  ].sort();

  assert.equal(catalogue.programmes[0].sourceStatus, 'course_codes_available');
  assert.equal(catalogue.programmes[0].codedCourseCount, 34);
  assert.equal(catalogue.majors[0].codedCourseCount, 34);
  assert.equal(courses.length, 34);
  assert.deepEqual(courses.map((course) => course.courseCode).sort(), expectedCodes);
  assert.equal(new Set(courses.map((course) => course.courseCode)).size, 34);
  assert.equal(courses.filter((course) => course.courseCode.startsWith('PSY')).length, 29);
  assert.equal(courses.filter((course) => course.requirementGroups[0].startsWith('Major Course')).length, 29);
  assert.equal(courses.filter((course) => course.requirementGroups[0].startsWith('Cross-Faculty Core Course')).length, 5);
  assert.equal(courses.filter((course) => course.requirementGroups[0] === 'Cross-Faculty Core Course · Component III option (choose 1)').length, 3);
  assert.equal(byCode.PSY1030.requirementGroups[0], 'Major Course · Year 1 Admission only');
  assert.equal(byCode.PSY4038.credits, 3);
  assert.equal(byCode.PSY4074.credits, 3);
  assert.equal(byCode.CFA1001.credits, 1);
  assert.equal(byCode.CFB3013.credits, 1);
  assert.equal(byCode.CFC3018.credits, 1);
  assert.equal(byCode.PSY2001.credits, 0);
  assert.equal(byCode.PSY4073.credits, 0);
  assert(courses.every((course) => course.recommendedYear === 0 && course.semester === ''));
  assert.match(supplement.evidenceNote, /does not map the remaining PSY rows/);
  assert.match(supplement.evidenceNote, /does not assert a graduation path or completion decision/);
});
