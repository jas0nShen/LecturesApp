const assert = require('node:assert/strict');
const test = require('node:test');
const supplementFile = require('../data/ug-course-supplements/eduhk-js8674-digital-chinese-culture-communication-2026.json');
const { addGenericCourseSupplements } = require('./generate-ug-catalog');
const { validateSupplement } = require('./validate-ug-supplements');

test('EdUHK JS8674 preserves the official 2026/27 coded course list and Cross-Faculty choices without inventing credits or study years', () => {
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
      id: 'EDUHK-UG-JS8674-16',
      universityCode: 'EDUHK',
      code: 'JS8674',
      jupasCode: 'JS8674',
      nameEn: 'Bachelor of Arts (Honours) in Digital Chinese Culture and Communication',
      sourceStatus: 'programme_summary_only',
      courseCount: 0,
      codedCourseCount: 0
    }],
    majors: [{
      id: 'EDUHK-UG-JS8674-16-M1',
      programmeId: 'EDUHK-UG-JS8674-16',
      nameEn: 'Bachelor of Arts (Honours) in Digital Chinese Culture and Communication',
      courseCount: 0,
      codedCourseCount: 0
    }],
    courses: []
  };

  addGenericCourseSupplements(catalogue, [supplement]);

  const courses = catalogue.courses;
  const byCode = Object.fromEntries(courses.map((course) => [course.courseCode, course]));
  assert.equal(catalogue.programmes[0].sourceStatus, 'course_codes_available');
  assert.equal(catalogue.programmes[0].codedCourseCount, 24);
  assert.equal(catalogue.majors[0].codedCourseCount, 24);
  assert.equal(courses.length, 24);
  assert.equal(new Set(courses.map((course) => course.courseCode)).size, 24);
  assert(courses.every((course) => course.credits === 0));
  assert(courses.every((course) => course.recommendedYear === 0));
  assert(courses.every((course) => course.semester === ''));

  assert.equal(courses.filter((course) => course.requirementGroups[0].startsWith('Major Course List')).length, 16);
  assert.equal(courses.filter((course) => course.requirementGroups[0].includes('Component II option')).length, 3);
  assert.equal(courses.filter((course) => course.requirementGroups[0].includes('Component III option')).length, 4);
  assert.equal(courses.filter((course) => course.courseType === 'internship').length, 1);
  assert.equal(byCode.CHI3949.titleEn, 'Internship');
  assert.equal(byCode.CFB3004.titleEn, byCode.CFB3032.titleEn);
  assert.match(byCode.INS4086.titleEn, /Pearl River Delta/);
  assert.match(supplement.evidenceNote, /does not publish per-course credit points/);
  assert.match(supplement.evidenceNote, /uncoded domains are not invented/);
});
