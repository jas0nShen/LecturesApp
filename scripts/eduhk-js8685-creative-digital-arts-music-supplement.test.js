const assert = require('node:assert/strict');
const test = require('node:test');
const supplementFile = require('../data/ug-course-supplements/eduhk-js8685-creative-digital-arts-music-2026.json');
const { addGenericCourseSupplements } = require('./generate-ug-catalog');
const { validateSupplement } = require('./validate-ug-supplements');

test('EdUHK JS8685 preserves the official 2026/27 Music and shared course groups without inventing credits or study years', () => {
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
      id: 'EDUHK-UG-JS8685-18',
      universityCode: 'EDUHK',
      code: 'JS8685',
      jupasCode: 'JS8685',
      nameEn: 'Bachelor of Arts (Honours) in Creative and Digital Arts (Music)',
      sourceStatus: 'programme_summary_only',
      courseCount: 0,
      codedCourseCount: 0
    }],
    majors: [{
      id: 'EDUHK-UG-JS8685-18-M1',
      programmeId: 'EDUHK-UG-JS8685-18',
      nameEn: 'Bachelor of Arts (Honours) in Creative and Digital Arts (Music)',
      courseCount: 0,
      codedCourseCount: 0
    }],
    courses: []
  };

  addGenericCourseSupplements(catalogue, [supplement]);

  const courses = catalogue.courses;
  const byCode = Object.fromEntries(courses.map((course) => [course.courseCode, course]));
  assert.equal(catalogue.programmes[0].sourceStatus, 'course_codes_available');
  assert.equal(catalogue.programmes[0].codedCourseCount, 29);
  assert.equal(catalogue.majors[0].codedCourseCount, 29);
  assert.equal(courses.length, 29);
  assert.equal(new Set(courses.map((course) => course.courseCode)).size, 29);
  assert(courses.every((course) => course.credits === 0));
  assert(courses.every((course) => course.recommendedYear === 0));
  assert(courses.every((course) => course.semester === ''));

  assert.equal(courses.filter((course) => course.requirementGroups[0] === 'Foundation Courses').length, 2);
  assert.equal(courses.filter((course) => course.requirementGroups[0] === 'Compulsory Courses · Arts Management and Entrepreneurship').length, 3);
  assert.equal(courses.filter((course) => course.requirementGroups[0] === 'Compulsory Courses · Music Subject Focus').length, 5);
  assert.equal(courses.filter((course) => course.requirementGroups[0] === 'Major Elective Courses').length, 10);
  assert.equal(courses.filter((course) => course.courseType === 'internship').length, 1);
  assert.equal(courses.filter((course) => course.courseType === 'capstone').length, 4);

  assert.equal(byCode.MUS1346.requirementGroups[0], 'Foundation Courses · Music students only');
  assert.equal(byCode.CDA3006.requirementGroups[0], 'Major Elective Courses');
  assert.equal(byCode.INS3087.titleEn, 'Internship (including pre-internship workshops)');
  assert.equal(byCode.INS4059.requirementGroups[0], 'Final Year Project · Honours Project path');
  assert.equal(byCode.INS4062.requirementGroups[0], 'Final Year Project · Capstone Project path');

  assert(!courses.some((course) => ['ART1232', 'ART2234', 'ART3235', 'ART3236', 'ART4233', 'ART4237'].includes(course.courseCode)));
  assert(!courses.some((course) => /TBC/i.test(course.courseCode)));
  assert.match(supplement.evidenceNote, /representative linked official course synopsis pages independently confirm/i);
  assert.match(supplement.evidenceNote, /uncoded 3-cp Cross-Faculty Core Course/i);
  assert.match(supplement.evidenceNote, /does not publish per-course credit points or a recommended year\/semester study pattern/i);
  assert.match(supplement.evidenceNote, /without asserting graduation completion/i);
});
