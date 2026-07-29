const assert = require('node:assert/strict');
const test = require('node:test');
const supplementFile = require('../data/ug-course-supplements/cuhk-rmscn-risk-management-science-courses-2025.json');
const { addGenericCourseSupplements } = require('./generate-ug-catalog');
const { validateSupplement } = require('./validate-ug-supplements');

const EXPECTED_CODES = [
  'RMSC1101',
  'RMSC2001',
  'RMSC2101',
  'RMSC3001',
  'RMSC3101',
  'RMSC4001',
  'RMSC4002',
  'RMSC4003',
  'RMSC4004',
  'RMSC4005',
  'RMSC4006',
  'RMSC4007',
  'RMSC4102',
  'RMSC4112',
  'RMSC4202',
  'RMSC4212'
];

test('CUHK Risk Management Science exposes the complete 16-course RMSC list as browse-only', () => {
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
      id: 'CUHK-UG-RMSCN-67',
      universityCode: 'CUHK',
      code: 'RMSCN',
      jupasCode: 'JS4719',
      nameEn: 'Risk Management Science',
      sourceStatus: 'programme_summary_only',
      courseCount: 1,
      codedCourseCount: 0
    }],
    majors: [{
      id: 'CUHK-UG-RMSCN-67-M1',
      programmeId: 'CUHK-UG-RMSCN-67',
      nameEn: 'Risk Management Science',
      courseCount: 1,
      codedCourseCount: 0
    }],
    courses: []
  };

  addGenericCourseSupplements(catalogue, [supplement]);

  const courses = catalogue.courses;
  const byCode = Object.fromEntries(courses.map((course) => [course.courseCode, course]));
  assert.equal(catalogue.programmes[0].sourceStatus, 'course_codes_available');
  assert.equal(catalogue.programmes[0].codedCourseCount, 16);
  assert.equal(catalogue.majors[0].codedCourseCount, 16);
  assert.equal(courses.length, 16);
  assert.deepEqual(courses.map((course) => course.courseCode).sort(), EXPECTED_CODES);

  assert.equal(courses.filter((course) => course.courseType === 'core').length, 7);
  assert.equal(courses.filter((course) => course.courseType === 'major_elective').length, 5);
  assert.equal(courses.filter((course) => course.courseType === 'capstone').length, 4);
  assert.equal(courses.filter((course) => course.credits === 1).length, 3);
  assert.equal(courses.filter((course) => course.credits === 3).length, 13);
  assert.equal(byCode.RMSC1101.recommendedYear, 1);
  assert.equal(byCode.RMSC4003.semester, 'Term 1');
  assert.match(byCode.RMSC3001.requirementGroups[0], /may replace FINA3080/);
  assert.match(byCode.RMSC4002.requirementGroups[0], /at least two RMSC courses/);
  assert.match(byCode.RMSC4002.requirementGroups[0], /Risk Analytics Stream/);
  assert.match(byCode.RMSC4102.requirementGroups[0], /RMSC4102 or RMSC4202/);
  assert.match(byCode.RMSC4112.requirementGroups[0], /RMSC4112 or RMSC4212/);
  assert(courses.every((course) => course.sourceUrl === supplementFile.sourceUrl));

  assert.match(supplementFile.note, /two 72-unit Major paths/);
  assert.match(supplementFile.note, /42 units of Required Courses/);
  assert.match(supplementFile.note, /48 units of Required Courses/);
  assert.match(supplementFile.note, /all 16 RMSC courses/);
  assert.match(supplementFile.note, /browse-only/);
});
