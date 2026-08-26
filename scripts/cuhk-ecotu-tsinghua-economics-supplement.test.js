const assert = require('node:assert/strict');
const test = require('node:test');
const supplementFile = require('../data/ug-course-supplements/cuhk-ecotu-tsinghua-economics-courses-2026.json');
const { addGenericCourseSupplements } = require('./generate-ug-catalog');
const { validateSupplement } = require('./validate-ug-supplements');

const CUHK_REQUIRED = 'ECON2011 ECON1101 ECON1111 ECON1902 ECON2021 ECON2121 ECON2901 ECON3011 MATH1550'.split(' ');
const CUHK_FACULTY_PACKAGE = `
ARCH1001 ARCH1002 ARCH1003 COMM1110 COMM1120 COMM1150 COMM1500
DSPS1001 DSPS1003 DSPS1004 GLSD1001 GPAD1020 GPAD1076 GPAD1077
GRMD1302 GRMD1401 GRMD1402 PSYC1000 PSYC1630 SOCI1001 SOCI1201
SOSC1001 SOSC1002 SOSC1003 SOWK1001 SOWK1113 SOWK1114 URSP1001
`.trim().split(/\s+/);
const CUHK_ELECTIVES = `
ECON3140 ECON3150 ECON3160 ECON3230 ECON3240 ECON3250 ECON3260 ECON3310 ECON3320 ECON3350
ECON3360 ECON3370 ECON3380 ECON3410 ECON3420 ECON3430 ECON3440 ECON3460 ECON3470 ECON3480
ECON3500 ECON3510 ECON3520 ECON3530 ECON3540 ECON3570 ECON3580 ECON3590 ECON3610 ECON3620
ECON3630 ECON4010 ECON4020 ECON4110 ECON4120 ECON4130 ECON4140 ECON4430 ECON4450 ECON4460 ECON4470
`.trim().split(/\s+/);
const THU_REQUIRED = '30510763 30510053 40511033 40512423'.split(' ');
const THU_ELECTIVES = `
40510763 30510073 30511053 40511103 40511003 40511202 30510523 40511133 40511223 30510863
40510943 40512413 40511263 40511423 30510732 40510973 40512103 40510173 30511013 30510893
30510962 40510673 40512603 40512593 30510883
`.trim().split(/\s+/);
const THU_SELF_DEVELOPMENT = `
30510992 30510812 40512452 40512492 40512533 40512572 40512643 40512633
30690552 40160522 40470243 40661373 40661512 30690524 40690952 10700073
40700693 40910222 40700573 00701601 30700313 40701261 00701643 00030272
`.trim().split(/\s+/);
const EXPECTED_CODES = [
  ...CUHK_REQUIRED,
  ...CUHK_FACULTY_PACKAGE,
  ...CUHK_ELECTIVES,
  ...THU_REQUIRED,
  ...THU_ELECTIVES,
  ...THU_SELF_DEVELOPMENT
].sort();

test('CUHK ECOTU exposes the 131 unambiguous DDP curriculum rows as browse-only', () => {
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
      id: 'CUHK-UG-ECOTU-72', universityCode: 'CUHK', code: 'ECOTU', jupasCode: 'JS4824',
      nameEn: 'Economics (CUHK-Tsinghua University Dual Undergraduate Degree Programme)',
      sourceStatus: 'programme_summary_only', courseCount: 1, codedCourseCount: 0
    }],
    majors: [{
      id: 'CUHK-UG-ECOTU-72-M1', programmeId: 'CUHK-UG-ECOTU-72',
      nameEn: 'Economics (CUHK-Tsinghua University Dual Undergraduate Degree Programme)',
      courseCount: 1, codedCourseCount: 0
    }],
    courses: []
  };

  addGenericCourseSupplements(catalogue, [supplement]);

  const courses = catalogue.courses;
  const byCode = Object.fromEntries(courses.map((course) => [course.courseCode, course]));
  const sumCredits = (codes) => codes.reduce((sum, code) => sum + byCode[code].credits, 0);
  assert.equal(catalogue.programmes[0].sourceStatus, 'course_codes_available');
  assert.equal(catalogue.programmes[0].codedCourseCount, 131);
  assert.equal(catalogue.majors[0].codedCourseCount, 131);
  assert.equal(courses.length, 131);
  assert.equal(new Set(courses.map((course) => course.courseCode)).size, 131);
  assert.deepEqual(courses.map((course) => course.courseCode).sort(), EXPECTED_CODES);
  assert.equal(courses.filter((course) => course.courseType === 'core').length, 41);
  assert.equal(courses.filter((course) => course.courseType === 'major_elective').length, 66);
  assert.equal(courses.filter((course) => course.courseType === 'free_elective').length, 24);
  assert.equal(sumCredits(CUHK_REQUIRED), 23);
  assert.equal(sumCredits(CUHK_FACULTY_PACKAGE), 84);
  assert.equal(sumCredits(CUHK_ELECTIVES), 123);
  assert.equal(sumCredits(THU_REQUIRED), 12);
  assert.equal(sumCredits(THU_ELECTIVES), 72);
  assert.equal(sumCredits(THU_SELF_DEVELOPMENT), 58);
  assert.equal(byCode['40512513'], undefined);
  assert.equal(byCode.MATH1550.titleEn, 'Methods of Matrices & Linear Algebra');
  assert.equal(byCode.ECON3470.titleEn, 'Labour Economics');
  assert.equal(byCode['40510973'].titleEn, 'Labor Economics');
  assert.equal(byCode['40511133'].titleEn, 'Econometrics(2)');
  assert.equal(byCode['00030272'].titleEn, 'Transportation for Tommorrow(C-Campus Course)');
  assert(courses.every((course) => course.sourceUrl === supplementFile.sourceUrl));

  assert.match(supplementFile.academicYear, /2026-2027/);
  assert.match(supplementFile.note, /131 unambiguous Programme-local courses/);
  assert.match(supplementFile.note, /40512513/);
  assert.match(supplementFile.note, /both ambiguous rows are excluded/);
  assert.match(supplementFile.note, /totalCreditRequired=0/);
});
