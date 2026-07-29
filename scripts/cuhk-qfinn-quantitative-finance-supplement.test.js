const assert = require('node:assert/strict');
const test = require('node:test');
const supplementFile = require('../data/ug-course-supplements/cuhk-qfinn-quantitative-finance-courses-2025.json');
const { addGenericCourseSupplements } = require('./generate-ug-catalog');
const { validateSupplement } = require('./validate-ug-supplements');

const CAPSTONE_CODES = [
  'FINA4130',
  'FINA4140',
  'FINA4150',
  'FINA4160',
  'FINA4190',
  'FINA4370',
  'FINA4380',
  'FINA4390',
  'FINA4430'
];

test('CUHK Quantitative Finance exposes the complete current 136-course named scope as browse-only', () => {
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
      id: 'CUHK-UG-QFINN-26',
      universityCode: 'CUHK',
      code: 'QFINN',
      jupasCode: 'JS4252',
      nameEn: 'Quantitative Finance',
      sourceStatus: 'programme_summary_only',
      courseCount: 1,
      codedCourseCount: 0
    }],
    majors: [{
      id: 'CUHK-UG-QFINN-26-M1',
      programmeId: 'CUHK-UG-QFINN-26',
      nameEn: 'Quantitative Finance',
      courseCount: 1,
      codedCourseCount: 0
    }],
    courses: []
  };

  addGenericCourseSupplements(catalogue, [supplement]);

  const courses = catalogue.courses;
  const byCode = Object.fromEntries(courses.map((course) => [course.courseCode, course]));
  assert.equal(catalogue.programmes[0].sourceStatus, 'course_codes_available');
  assert.equal(catalogue.programmes[0].codedCourseCount, 136);
  assert.equal(catalogue.majors[0].codedCourseCount, 136);
  assert.equal(courses.length, 136);
  assert.equal(new Set(courses.map((course) => course.courseCode)).size, 136);

  assert.equal(courses.filter((course) => course.courseType === 'core').length, 31);
  assert.equal(courses.filter((course) => course.courseType === 'major_elective').length, 96);
  assert.equal(courses.filter((course) => course.courseType === 'capstone').length, 9);
  assert.deepEqual(
    courses.filter((course) => course.courseType === 'capstone').map((course) => course.courseCode).sort(),
    CAPSTONE_CODES
  );
  assert.equal(courses.filter((course) => course.credits === 1).length, 17);
  assert.equal(courses.filter((course) => course.credits === 2).length, 2);
  assert.equal(courses.filter((course) => course.credits === 3).length, 116);
  assert.equal(courses.filter((course) => course.credits === 4).length, 1);
  assert.equal(courses.filter((course) => course.requirementGroups[0].includes('Quantitative Methods')).length, 46);
  assert.equal(courses.filter((course) => course.requirementGroups[0].includes('Major Elective · Business')).length, 45);
  assert.equal(courses.filter((course) => course.requirementGroups[0].includes('Major Elective · Core pool')).length, 14);
  assert.match(byCode.MATH1530.requirementGroups[0], /Placement Test/);
  assert.match(byCode.DOTE2011.requirementGroups[0], /STAT2001 plus STAT2006/);
  assert.match(byCode.FINA3310.requirementGroups[0], /at most 6 one-unit courses/);
  assert.match(byCode.FINA4130.requirementGroups[0], /official Capstone course/);
  assert(courses.every((course) => course.sourceUrl === supplementFile.sourceUrl));

  assert.match(supplementFile.note, /72-unit Major/);
  assert.match(supplementFile.note, /135 unique course-list rows/);
  assert.match(supplementFile.note, /136-course official list/);
  assert.match(supplementFile.note, /browse-only/);
});
