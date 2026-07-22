const assert = require('node:assert/strict');
const test = require('node:test');
const supplementFile = require('../data/ug-course-supplements/eduhk-js8727-speech-pathology-rehabilitation-2026.json');
const { addGenericCourseSupplements } = require('./generate-ug-catalog');
const { validateSupplement } = require('./validate-ug-supplements');

test('EdUHK JS8727 exposes the official coded Major and Integrated Minor subset without inventing Practicum or FYP courses', () => {
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
      id: 'EDUHK-UG-JS8727-25',
      universityCode: 'EDUHK',
      code: 'JS8727',
      jupasCode: 'JS8727',
      nameEn: 'Bachelor of Science (Honours) in Speech Pathology and Rehabilitation',
      sourceStatus: 'programme_summary_only',
      courseCount: 0,
      codedCourseCount: 0
    }],
    majors: [{
      id: 'EDUHK-UG-JS8727-25-M1',
      programmeId: 'EDUHK-UG-JS8727-25',
      nameEn: 'Bachelor of Science (Honours) in Speech Pathology and Rehabilitation',
      courseCount: 0,
      codedCourseCount: 0
    }],
    courses: []
  };

  addGenericCourseSupplements(catalogue, [supplement]);

  const courses = catalogue.courses;
  const byCode = Object.fromEntries(courses.map((course) => [course.courseCode, course]));
  assert.equal(catalogue.programmes[0].sourceStatus, 'course_codes_available');
  assert.equal(catalogue.programmes[0].codedCourseCount, 23);
  assert.equal(catalogue.majors[0].codedCourseCount, 23);
  assert.equal(courses.length, 23);
  assert.equal(new Set(courses.map((course) => course.courseCode)).size, 23);
  assert.equal(courses.filter((course) => course.requirementGroups[0] === 'Major Course').length, 14);
  assert.equal(courses.filter((course) => course.requirementGroups[0] === 'Integrated Minor').length, 5);
  assert.equal(courses.filter((course) => course.requirementGroups[0].startsWith('Cross-Faculty Core Course')).length, 3);
  assert.equal(byCode.CFA1001.credits, 1);
  assert.equal(byCode.CFB3034.credits, 1);
  assert.equal(byCode.CFC3026.credits, 1);
  assert.equal(byCode.SPR1001.credits, 0);
  assert(courses.every((course) => course.recommendedYear === 0 && course.semester === ''));
  assert(!courses.some((course) => /Practicum|Honours Project|Capstone Project/i.test(`${course.courseCode} ${course.titleEn}`)));
  assert.match(supplement.evidenceNote, /do not identify Practicum or Final Year Project course codes/);
  assert.match(supplement.evidenceNote, /does not assert graduation completion or professional accreditation/);
});
