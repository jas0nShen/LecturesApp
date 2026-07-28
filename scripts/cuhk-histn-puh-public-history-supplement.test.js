const assert = require('node:assert/strict');
const test = require('node:test');
const supplementFile = require('../data/ug-course-supplements/cuhk-histn-puh-public-history-highlights-2026.json');
const { addGenericCourseSupplements } = require('./generate-ug-catalog');
const { validateSupplement } = require('./validate-ug-supplements');

test('CUHK Public History publishes only the official course highlights as a read-only list', () => {
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
      id: 'CUHK-UG-HISTN-PUH-12',
      universityCode: 'CUHK',
      code: 'HISTN-PUH',
      nameEn: 'Public History',
      sourceStatus: 'programme_summary_only',
      courseCount: 1,
      codedCourseCount: 0
    }],
    majors: [{
      id: 'CUHK-UG-HISTN-PUH-12-M1',
      programmeId: 'CUHK-UG-HISTN-PUH-12',
      nameEn: 'Public History',
      courseCount: 1,
      codedCourseCount: 0
    }],
    courses: []
  };

  addGenericCourseSupplements(catalogue, [supplement]);

  const courses = catalogue.courses;
  const byCode = Object.fromEntries(courses.map((course) => [course.courseCode, course]));
  assert.equal(catalogue.programmes[0].sourceStatus, 'course_codes_available');
  assert.equal(catalogue.programmes[0].codedCourseCount, 10);
  assert.equal(catalogue.majors[0].codedCourseCount, 10);
  assert.equal(courses.length, 10);
  assert.equal(new Set(courses.map((course) => course.courseCode)).size, 10);
  assert(courses.every((course) => course.credits === 0));
  assert(courses.every((course) => course.recommendedYear === 0));
  assert(courses.every((course) => course.semester === ''));

  assert.equal(courses.filter((course) => course.courseType === 'core').length, 2);
  assert.equal(courses.filter((course) => course.courseType === 'major_elective').length, 8);
  assert.equal(byCode.HIST4702.titleEn, 'Digital History');
  assert.match(byCode.HIST4702.requirementGroups[0], /HIST4702RS/);
  assert.equal(byCode.HIST4180RH.titleEn, 'Ordinary Voices, Extraordinary Stories: History and Memory in Documentaries and Biographies');
  assert.match(byCode.HIST4180RH.requirementGroups[0], /stable base code not published/);

  assert.match(supplementFile.note, /minimum 57-unit Major Programme Requirement/i);
  assert.match(supplementFile.note, /partial read-only planning list/i);
  assert.match(supplementFile.note, /must not be treated as the complete 57-unit curriculum/i);
});
