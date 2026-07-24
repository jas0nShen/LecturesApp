const assert = require('node:assert/strict');
const test = require('node:test');
const supplementFile = require('../data/ug-course-supplements/eduhk-js8003-digital-chinese-culture-chinese-language-double-degree-2026.json');
const { addGenericCourseSupplements } = require('./generate-ug-catalog');
const { validateSupplement } = require('./validate-ug-supplements');

test('EdUHK JS8003 exposes only the official 2026/27 published double-degree course subset', () => {
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
      id: 'EDUHK-UG-JS8003-3',
      universityCode: 'EDUHK',
      code: 'JS8003',
      jupasCode: 'JS8003',
      nameEn: 'Bachelor of Arts (Honours) in Digital Chinese Culture and Communication and Bachelor of Education (Honours) (Chinese Language)',
      sourceStatus: 'programme_summary_only',
      courseCount: 0,
      codedCourseCount: 0
    }, {
      id: 'EDUHK-UG-JS8004-4',
      universityCode: 'EDUHK',
      code: 'JS8004',
      jupasCode: 'JS8004',
      nameEn: 'Bachelor of Arts (Honours) in English Studies and Digital Communication and Bachelor of Education (Honours) (English Language)',
      sourceStatus: 'programme_summary_only',
      courseCount: 0,
      codedCourseCount: 0
    }],
    majors: [{
      id: 'EDUHK-UG-JS8003-3-M1',
      programmeId: 'EDUHK-UG-JS8003-3',
      nameEn: 'Bachelor of Arts (Honours) in Digital Chinese Culture and Communication and Bachelor of Education (Honours) (Chinese Language)',
      courseCount: 0,
      codedCourseCount: 0
    }, {
      id: 'EDUHK-UG-JS8004-4-M1',
      programmeId: 'EDUHK-UG-JS8004-4',
      nameEn: 'Bachelor of Arts (Honours) in English Studies and Digital Communication and Bachelor of Education (Honours) (English Language)',
      courseCount: 0,
      codedCourseCount: 0
    }],
    courses: []
  };

  addGenericCourseSupplements(catalogue, [supplement]);

  const courses = catalogue.courses;
  const byCode = Object.fromEntries(courses.map((course) => [course.courseCode, course]));
  assert.equal(catalogue.programmes[0].sourceStatus, 'course_codes_available');
  assert.equal(catalogue.programmes[0].codedCourseCount, 40);
  assert.equal(catalogue.majors[0].codedCourseCount, 40);
  assert.equal(catalogue.programmes[1].codedCourseCount, 0);
  assert.equal(catalogue.majors[1].codedCourseCount, 0);
  assert.equal(courses.length, 40);
  assert.equal(new Set(courses.map((course) => course.courseCode)).size, 40);
  assert(courses.every((course) => course.programmeId === 'EDUHK-UG-JS8003-3'));
  assert(courses.every((course) => course.majorId === 'EDUHK-UG-JS8003-3-M1'));
  assert(courses.every((course) => /^[A-Z]{3}\d{4}$/.test(course.courseCode)));
  assert(courses.every((course) => course.credits === 0));
  assert(courses.every((course) => course.recommendedYear === 0));
  assert(courses.every((course) => course.semester === ''));

  assert.equal(courses.filter((course) => course.requirementGroups[0].startsWith('Major Course List')).length, 32);
  assert.equal(courses.filter((course) => course.requirementGroups[0].startsWith('Education Studies Course List')).length, 8);
  assert.equal(courses.filter((course) => course.courseType === 'programme_course').length, 30);
  assert.equal(courses.filter((course) => course.courseType === 'major_elective').length, 7);
  assert.equal(byCode.CHI3949.courseType, 'internship');
  assert.equal(byCode.CHI3665.requirementGroups[0], 'Major Course List - compulsory Immersion Programme');
  assert.equal(byCode.CHI3725.titleEn, 'Chinese Language Teaching and Literacy of Information Technology');
  assert.equal(byCode.TLS3092.titleEn, 'Effective Teaching and Positive Classroom Learning Environment');
  assert.match(supplement.evidenceNote, /40 unique coded courses/);
  assert.match(supplement.evidenceNote, /neither source publishes per-course credit points or Year\/Semester assignments/);
  assert.match(supplement.evidenceNote, /does not present it as a complete 156-cp graduation structure/);
});
