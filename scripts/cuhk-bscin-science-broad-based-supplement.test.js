const assert = require('node:assert/strict');
const test = require('node:test');
const supplementFile = require('../data/ug-course-supplements/cuhk-bscin-science-broad-based-faculty-package-2026.json');
const { addGenericCourseSupplements } = require('./generate-ug-catalog');
const { validateSupplement } = require('./validate-ug-supplements');

const SCIENCE_CODES = `
LSCI1001 LSCI1002 LSCI1012 CHEM1070 CHEM1072 CHEM1280 MATH1010 MATH1018
MATH1030 MATH1038 MATH1520 MATH1525 MATH1550 PHYS1001 PHYS1002 PHYS1111
PHYS1113 STAT1011 STAT1012
`.trim().split(/\s+/);
const BUSINESS_OPTION_CODES = ['DOTE1031', 'DOTE1040', 'HTMG1010', 'MGNT1020'];
const EXPECTED_CODES = [...SCIENCE_CODES, ...BUSINESS_OPTION_CODES].sort();

test('CUHK BSCIN exposes the complete 2026-27 Faculty Package without merging destination Majors', () => {
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
      id: 'CUHK-UG-BSCIN-68', universityCode: 'CUHK', code: 'BSCIN', jupasCode: 'JS4601',
      nameEn: 'Science', sourceStatus: 'programme_summary_only', courseCount: 1, codedCourseCount: 0
    }],
    majors: [{
      id: 'CUHK-UG-BSCIN-68-M1', programmeId: 'CUHK-UG-BSCIN-68',
      nameEn: 'Science', courseCount: 1, codedCourseCount: 0
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
  assert.deepEqual(courses.map((course) => course.courseCode).sort(), EXPECTED_CODES);
  assert.equal(new Set(courses.map((course) => course.courseCode)).size, 23);
  assert(courses.every((course) => course.credits === 3));
  assert(courses.every((course) => course.courseType === 'foundation'));
  assert(courses.every((course) => course.recommendedYear === 0));
  assert.equal(byCode.PHYS1111.titleEn, 'Introduction to Mechanics, Fluids, and Waves (University Physics I)');
  assert.equal(byCode.PHYS1113.titleEn, 'Mechanics, Fluids and Waves (University Physics I)');
  assert.match(byCode.DOTE1031.requirementGroups[0], /Risk Management Science/);
  assert.match(byCode.DOTE1031.sourceUrl, /id=1789/);
  assert.match(byCode.LSCI1001.sourceUrl, /id=1793/);

  assert.match(supplementFile.note, /19 Science code-title-unit rows/);
  assert.match(supplementFile.note, /complete 23-course Faculty Package scope/);
  assert.match(supplementFile.note, /destination-Major curricula are not copied/);
  assert.match(supplementFile.note, /totalCreditRequired=0/);
});
