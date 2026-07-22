const assert = require('node:assert/strict');
const test = require('node:test');
const supplementFile = require('../data/ug-course-supplements/eduhk-js8001-creative-digital-arts-music-double-degree-2026.json');
const { addGenericCourseSupplements } = require('./generate-ug-catalog');
const { validateSupplement } = require('./validate-ug-supplements');

test('EdUHK JS8001 exposes the official 2026/27 published double-degree course subset', () => {
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
      id: 'EDUHK-UG-JS8001-1',
      universityCode: 'EDUHK',
      code: 'JS8001',
      jupasCode: 'JS8001',
      nameEn: 'Bachelor of Arts (Honours) in Creative and Digital Arts and Bachelor of Education (Honours) (Music)',
      sourceStatus: 'programme_summary_only',
      courseCount: 0,
      codedCourseCount: 0
    }],
    majors: [{
      id: 'EDUHK-UG-JS8001-1-M1',
      programmeId: 'EDUHK-UG-JS8001-1',
      nameEn: 'Bachelor of Arts (Honours) in Creative and Digital Arts and Bachelor of Education (Honours) (Music)',
      courseCount: 0,
      codedCourseCount: 0
    }],
    courses: []
  };

  addGenericCourseSupplements(catalogue, [supplement]);

  const courses = catalogue.courses;
  const byCode = Object.fromEntries(courses.map((course) => [course.courseCode, course]));
  assert.equal(catalogue.programmes[0].sourceStatus, 'course_codes_available');
  assert.equal(catalogue.programmes[0].codedCourseCount, 68);
  assert.equal(catalogue.majors[0].codedCourseCount, 68);
  assert.equal(courses.length, 68);
  assert.equal(new Set(courses.map((course) => course.courseCode)).size, 68);
  assert(courses.every((course) => course.credits === 0));
  assert(courses.every((course) => course.recommendedYear === 0));
  assert(courses.every((course) => course.semester === ''));

  assert.equal(courses.filter((course) => course.requirementGroups[0].startsWith('Music Studies')).length, 11);
  assert.equal(courses.filter((course) => course.requirementGroups[0] === 'Discipline Major - Foundation Courses').length, 3);
  assert.equal(courses.filter((course) => course.requirementGroups[0].includes('Compulsory Course')).length, 3);
  assert.equal(courses.filter((course) => course.requirementGroups[0] === 'Discipline Major - Subject Focus - Music').length, 4);
  assert.equal(courses.filter((course) => course.requirementGroups[0] === 'Discipline Major - Major Elective Course published pool').length, 16);
  assert.equal(courses.filter((course) => course.requirementGroups[0].startsWith('Education Studies Course List')).length, 30);
  assert.equal(byCode.INS3087.courseType, 'internship');
  assert.equal(byCode.MUS3350.requirementGroups[0], 'Music Studies · Subject Focus - Music');
  assert.equal(byCode.MUS2250.requirementGroups[0], 'Music Studies · Major Elective Course published pool');
  assert.match(supplement.evidenceNote, /68 unique coded courses/);
  assert.match(supplement.evidenceNote, /does not present it as a complete 156-cp graduation structure/);
});
