const assert = require('node:assert/strict');
const test = require('node:test');
const supplementFile = require('../data/ug-course-supplements/eduhk-js8702-integrated-environmental-management-2026.json');
const { addGenericCourseSupplements } = require('./generate-ug-catalog');
const { validateSupplement } = require('./validate-ug-supplements');

test('EdUHK JS8702 preserves the official coded course groups without inventing per-course credits or the uncoded CFCC Component III', () => {
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
      id: 'EDUHK-UG-JS8702-22',
      universityCode: 'EDUHK',
      code: 'JS8702',
      jupasCode: 'JS8702',
      nameEn: 'Bachelor of Science (Honours) in Integrated Environmental Management',
      sourceStatus: 'programme_summary_only',
      courseCount: 0,
      codedCourseCount: 0
    }],
    majors: [{
      id: 'EDUHK-UG-JS8702-22-M1',
      programmeId: 'EDUHK-UG-JS8702-22',
      nameEn: 'Bachelor of Science (Honours) in Integrated Environmental Management',
      courseCount: 0,
      codedCourseCount: 0
    }],
    courses: []
  };

  addGenericCourseSupplements(catalogue, [supplement]);

  const courses = catalogue.courses;
  const byCode = Object.fromEntries(courses.map((course) => [course.courseCode, course]));
  assert.equal(catalogue.programmes[0].sourceStatus, 'course_codes_available');
  assert.equal(catalogue.programmes[0].codedCourseCount, 26);
  assert.equal(catalogue.majors[0].codedCourseCount, 26);
  assert.equal(courses.length, 26);
  assert.equal(new Set(courses.map((course) => course.courseCode)).size, 26);
  assert(courses.every((course) => course.credits === 0));
  assert(courses.every((course) => course.recommendedYear === 0));
  assert(courses.every((course) => course.semester === ''));

  assert.equal(courses.filter((course) => course.requirementGroups[0] === 'Major Core').length, 12);
  assert.equal(courses.filter((course) => course.courseType === 'major_elective').length, 4);
  assert.equal(courses.filter((course) => course.courseType === 'internship').length, 1);
  assert.equal(courses.filter((course) => course.courseType === 'capstone').length, 4);
  assert.equal(courses.filter((course) => course.requirementGroups[0].startsWith('Cross-Faculty Core Course')).length, 2);

  assert.equal(byCode.INS3068.requirementGroups[0], 'Overseas Field Trip');
  assert.equal(byCode.GGP2033.requirementGroups[0], 'Living and Working in Our Country');
  assert.equal(byCode.INS4065.requirementGroups[0], 'Major Interdisciplinary Course');
  assert.equal(byCode.INS4070.titleEn, 'Internship');
  assert.equal(byCode.INS4071.requirementGroups[0], 'Final Year Project · Honours Project path');
  assert.equal(byCode.INS4074.requirementGroups[0], 'Final Year Project · Capstone Project path');
  assert(!courses.some((course) => /TBC|Component III/i.test(`${course.courseCode} ${course.titleEn}`)));
  assert.match(supplement.evidenceNote, /Component III has no course code or fixed title and is intentionally omitted/);
  assert.match(supplement.evidenceNote, /does not allocate those totals to individual courses or assert graduation completion/);
});
