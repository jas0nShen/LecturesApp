const assert = require('node:assert/strict');
const test = require('node:test');
const supplementFile = require('../data/ug-course-supplements/cuhk-econn-economics-courses-2024.json');
const { addGenericCourseSupplements } = require('./generate-ug-catalog');
const { validateSupplement } = require('./validate-ug-supplements');

const FIXED_CODES = `
ECON2011 ECON1101 ECON1902 ECON1111 ECON2021 ECON2121
ECON2901 ECON3011 ECON3021 ECON3121 ECON4901 ECON4903
`.trim().split(/\s+/).sort();

const EXCLUDED_LOWER_LEVEL_CODES = [
  'ECON1010',
  'ECON1210',
  'ECON1220',
  'ECON1310',
  'ECON1420'
];

test('CUHK Economics exposes the official 61-course Major pool as browse-only', () => {
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
      id: 'CUHK-UG-ECONN-71',
      universityCode: 'CUHK',
      code: 'ECONN',
      jupasCode: 'JS4824',
      nameEn: 'Economics',
      sourceStatus: 'programme_summary_only',
      courseCount: 1,
      codedCourseCount: 0
    }],
    majors: [{
      id: 'CUHK-UG-ECONN-71-M1',
      programmeId: 'CUHK-UG-ECONN-71',
      nameEn: 'Economics',
      courseCount: 1,
      codedCourseCount: 0
    }],
    courses: []
  };

  addGenericCourseSupplements(catalogue, [supplement]);

  const courses = catalogue.courses;
  const byCode = Object.fromEntries(courses.map((course) => [course.courseCode, course]));
  const fixedCourses = courses
    .filter((course) => course.courseType === 'core' || course.courseType === 'capstone')
    .map((course) => course.courseCode)
    .sort();

  assert.equal(catalogue.programmes[0].sourceStatus, 'course_codes_available');
  assert.equal(catalogue.programmes[0].codedCourseCount, 61);
  assert.equal(catalogue.majors[0].codedCourseCount, 61);
  assert.equal(courses.length, 61);
  assert.deepEqual(fixedCourses, FIXED_CODES);
  assert.equal(courses.filter((course) => course.courseType === 'core').length, 11);
  assert.equal(courses.filter((course) => course.courseType === 'capstone').length, 1);
  assert.equal(courses.filter((course) => course.courseType === 'major_elective').length, 49);

  assert.equal(byCode.ECON1101.credits, 2);
  assert.equal(byCode.ECON4903.courseType, 'capstone');
  assert.equal(byCode.ECON3610.titleEn, 'International Trade');
  assert.match(byCode.ECON4120.requirementGroups[0], /Data Analytics/);
  assert.match(byCode.ECON4810.requirementGroups[0], /Department approval/);
  for (const code of EXCLUDED_LOWER_LEVEL_CODES) assert.equal(byCode[code], undefined);

  assert.match(supplementFile.note, /minimum of 72 units/);
  assert.match(supplementFile.note, /61-course list/);
  assert.match(supplementFile.note, /browse-only/);
});
