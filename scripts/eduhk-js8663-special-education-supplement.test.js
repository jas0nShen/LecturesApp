const assert = require('node:assert/strict');
const test = require('node:test');
const supplementFile = require('../data/ug-course-supplements/eduhk-js8663-special-education-2026.json');
const { addGenericCourseSupplements } = require('./generate-ug-catalog');
const { validateSupplement } = require('./validate-ug-supplements');

test('EdUHK JS8663 preserves the official 2026/27 admission paths and alternatives without inventing course codes or completion rules', () => {
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
      id: 'EDUHK-UG-JS8663-15',
      universityCode: 'EDUHK',
      code: 'JS8663',
      jupasCode: 'JS8663',
      nameEn: 'Bachelor of Arts (Honours) in Special Education',
      sourceStatus: 'programme_summary_only',
      courseCount: 0,
      codedCourseCount: 0
    }],
    majors: [{
      id: 'EDUHK-UG-JS8663-15-M1',
      programmeId: 'EDUHK-UG-JS8663-15',
      nameEn: 'Bachelor of Arts (Honours) in Special Education',
      courseCount: 0,
      codedCourseCount: 0
    }],
    courses: []
  };

  addGenericCourseSupplements(catalogue, [supplement]);

  const courses = catalogue.courses;
  const byCode = Object.fromEntries(courses.map((course) => [course.courseCode, course]));
  assert.equal(catalogue.programmes[0].sourceStatus, 'course_codes_available');
  assert.equal(catalogue.programmes[0].codedCourseCount, 25);
  assert.equal(catalogue.majors[0].codedCourseCount, 25);
  assert.equal(courses.length, 25);
  assert.equal(new Set(courses.map((course) => course.courseCode)).size, 25);

  assert.equal(courses.filter((course) => course.requirementGroups[0] === 'Major Course · Year 1 Admission only').length, 8);
  assert.equal(courses.filter((course) => course.requirementGroups[0] === 'Major Course · Senior Year Admission only').length, 2);
  assert.equal(courses.filter((course) => course.requirementGroups[0] === 'Major Course').length, 6);
  assert.equal(courses.filter((course) => course.courseType === 'fieldwork').length, 1);
  assert.equal(courses.filter((course) => course.courseType === 'capstone').length, 3);
  assert.equal(courses.filter((course) => course.requirementGroups[0].includes('Component III option')).length, 3);

  assert.equal(byCode.SED4060.requirementGroups[0], 'Practicum');
  assert.equal(byCode.SED4094.requirementGroups[0], 'Final Year Project · Common preparation');
  assert.equal(byCode.SED4095.requirementGroups[0], 'Final Year Project · Honours Project path');
  assert.equal(byCode.SED4096.requirementGroups[0], 'Final Year Project · Capstone Project path');
  assert.equal(byCode.CFA1001.credits, 1);
  assert.equal(byCode.CFC3026.credits, 1);
  assert.equal(byCode.SED4094.credits, 0);
  assert.equal(courses.filter((course) => course.credits === 1).length, 5);
  assert(courses.every((course) => course.recommendedYear === 0 && course.semester === ''));

  assert(!courses.some((course) => /to be provided|TBC/i.test(course.courseCode)));
  assert(!courses.some((course) => course.titleEn === 'Special Education in Mainland China'));
  assert.match(supplement.evidenceNote, /25 usable course codes and titles/i);
  assert.match(supplement.evidenceNote, /code 'To be provided'/i);
  assert.match(supplement.evidenceNote, /without asserting one fixed graduation path or completion/i);
});
