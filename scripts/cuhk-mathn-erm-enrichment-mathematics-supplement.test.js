const assert = require('node:assert/strict');
const test = require('node:test');
const supplementFile = require('../data/ug-course-supplements/cuhk-mathn-erm-enrichment-mathematics-courses-2026.json');
const { addGenericCourseSupplements } = require('./generate-ug-catalog');
const { validateSupplement } = require('./validate-ug-supplements');

const FIRST_YEAR_CODES = [
  'MATH1010', 'MATH1018', 'MATH1025', 'MATH1028',
  'MATH1030', 'MATH1038', 'MATH1090', 'MATH1098'
];
const C0_CODES = [
  'MATH2010', 'MATH2018', 'MATH2020', 'MATH2028',
  'MATH2040', 'MATH2048', 'MATH2221', 'MATH4400', 'MATH4900'
];
const C1_CODES = [
  'MATH2050', 'MATH2058', 'MATH2060', 'MATH2068',
  'MATH2070', 'MATH2078', 'MATH2230'
];
const STREAM_POOL_CODES = [
  'MATH3030', 'MATH3040', 'MATH3060', 'MATH3070', 'MATH3093',
  'MATH3230', 'MATH3240', 'MATH3270', 'MATH3280', 'MATH3320',
  'MATH3340', 'MATH4010', 'MATH4030', 'MATH4050', 'MATH4060',
  'MATH4080', 'MATH4220', 'MATH4230', 'MATH4280', 'MATH5011',
  'MATH5012', 'MATH5021', 'MATH5022', 'MATH5031', 'MATH5032',
  'MATH5051', 'MATH5052', 'MATH5061', 'MATH5062', 'MATH5070'
];
const EXPECTED_CODES = [...FIRST_YEAR_CODES, ...C0_CODES, ...C1_CODES, ...STREAM_POOL_CODES].sort();

test('CUHK Enrichment Mathematics exposes the current 54-course named MATH scope as browse-only', () => {
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
      id: 'CUHK-UG-MATHN-ERM-64',
      universityCode: 'CUHK',
      code: 'MATHN-ERM',
      jupasCode: 'JS4682',
      nameEn: 'Enrichment Mathematics',
      sourceStatus: 'programme_summary_only',
      courseCount: 1,
      codedCourseCount: 0
    }],
    majors: [{
      id: 'CUHK-UG-MATHN-ERM-64-M1',
      programmeId: 'CUHK-UG-MATHN-ERM-64',
      nameEn: 'Enrichment Mathematics',
      courseCount: 1,
      codedCourseCount: 0
    }],
    courses: []
  };

  addGenericCourseSupplements(catalogue, [supplement]);

  const courses = catalogue.courses;
  const byCode = Object.fromEntries(courses.map((course) => [course.courseCode, course]));
  assert.equal(catalogue.programmes[0].sourceStatus, 'course_codes_available');
  assert.equal(catalogue.programmes[0].codedCourseCount, 54);
  assert.equal(catalogue.majors[0].codedCourseCount, 54);
  assert.equal(courses.length, 54);
  assert.deepEqual(courses.map((course) => course.courseCode).sort(), EXPECTED_CODES);

  assert.equal(courses.filter((course) => course.courseType === 'core').length, 22);
  assert.equal(courses.filter((course) => course.courseType === 'major_elective').length, 30);
  assert.equal(courses.filter((course) => course.courseType === 'capstone').length, 2);
  assert.equal(courses.filter((course) => course.credits === 2).length, 1);
  assert.equal(courses.filter((course) => course.credits === 3).length, 53);
  assert.equal(byCode.MATH1018.recommendedYear, 1);
  assert.equal(byCode.MATH1018.semester, 'Term 1');
  assert.equal(byCode.MATH2221.credits, 2);
  assert.match(byCode.MATH1018.requirementGroups[0], /may opt out to MATH1010/);
  assert.match(byCode.MATH2078.requirementGroups[0], /MATH2230 is required/);
  assert.match(byCode.MATH4400.requirementGroups[0], /MATH4400 or MATH4900/);
  assert.match(byCode.MATH5011.requirementGroups[0], /Department permission/);
  assert(courses.every((course) => course.sourceUrl === supplementFile.sourceUrl));

  assert.match(supplementFile.note, /54 unique/);
  assert.match(supplementFile.note, /33-unit Stream structure/);
  assert.match(supplementFile.note, /level 3000 or above/);
  assert.match(supplementFile.note, /browse-only/);
});
