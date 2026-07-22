const assert = require('node:assert/strict');
const test = require('node:test');
const supplementFile = require('../data/ug-course-supplements/eduhk-js8005-heam-chinese-history-double-degree-2026.json');
const { addGenericCourseSupplements } = require('./generate-ug-catalog');
const { validateSupplement } = require('./validate-ug-supplements');

test('EdUHK JS8005 exposes only the official 2026/27 published double-degree course subset', () => {
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
      id: 'EDUHK-UG-JS8005-5',
      universityCode: 'EDUHK',
      code: 'JS8005',
      jupasCode: 'JS8005',
      nameEn: 'Bachelor of Arts (Honours) in Heritage Education and Arts Management and Bachelor of Education (Honours) (Chinese History)',
      sourceStatus: 'programme_summary_only',
      courseCount: 0,
      codedCourseCount: 0
    }],
    majors: [{
      id: 'EDUHK-UG-JS8005-5-M1',
      programmeId: 'EDUHK-UG-JS8005-5',
      nameEn: 'Bachelor of Arts (Honours) in Heritage Education and Arts Management and Bachelor of Education (Honours) (Chinese History)',
      courseCount: 0,
      codedCourseCount: 0
    }],
    courses: []
  };

  addGenericCourseSupplements(catalogue, [supplement]);

  const courses = catalogue.courses;
  const byCode = Object.fromEntries(courses.map((course) => [course.courseCode, course]));
  assert.equal(catalogue.programmes[0].sourceStatus, 'course_codes_available');
  assert.equal(catalogue.programmes[0].codedCourseCount, 41);
  assert.equal(catalogue.majors[0].codedCourseCount, 41);
  assert.equal(courses.length, 41);
  assert.equal(new Set(courses.map((course) => course.courseCode)).size, 41);
  assert(courses.every((course) => course.credits === 0));
  assert(courses.every((course) => course.recommendedYear === 0));
  assert(courses.every((course) => course.semester === ''));

  assert.equal(courses.filter((course) => course.requirementGroups[0] === 'Discipline Studies Major (Core)').length, 11);
  assert.equal(courses.filter((course) => course.requirementGroups[0].startsWith('Discipline Studies Major (Elective)')).length, 3);
  assert.equal(courses.filter((course) => course.requirementGroups[0] === 'Education Major').length, 11);
  assert.equal(courses.filter((course) => course.requirementGroups[0].startsWith('Cross-faculty Core Course')).length, 8);
  assert.equal(courses.filter((course) => course.requirementGroups[0] === 'Education Studies (Core)').length, 6);
  assert.equal(courses.filter((course) => course.requirementGroups[0] === 'Pedagogy for Major').length, 2);
  assert.equal(byCode.HEM3002.courseType, 'internship');
  assert.equal(byCode.HIS3079.titleEn, 'Special Topics on Chinese History: History of Political and Legal Systems in China');
  assert.equal(byCode.CFC3035.courseType, 'major_elective');
  assert.match(supplement.evidenceNote, /only the verified published course subset/);
  assert.match(supplement.evidenceNote, /does not present it as a complete 156-cp graduation structure/);
});
