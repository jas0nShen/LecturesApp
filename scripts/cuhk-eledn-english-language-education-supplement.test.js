const assert = require('node:assert/strict');
const test = require('node:test');
const supplementFile = require('../data/ug-course-supplements/cuhk-eledn-english-language-education-courses-2026.json');
const { addGenericCourseSupplements } = require('./generate-ug-catalog');
const { validateSupplement } = require('./validate-ug-supplements');

const FACULTY = 'EDUC2120 EDUC3330 ENGE1000'.split(' ');
const REQUIRED_SUBJECT = 'ENGE1310 ENGE1500 ENGE1520 ENGE1610 ENGE2360 ENGE2390 ENGE2510 ENGE2620 ENGE2840 ENGE3320'.split(' ');
const REQUIRED_LANGUAGE = 'ELTU2301 ELTU2302 ELTU2303'.split(' ');
const REQUIRED_METHOD = 'ELED2810 ELED4720 ELED4730 ELED4740 ELED4840 ELED4920'.split(' ');
const RESEARCH = 'ELED4850 ELED4860'.split(' ');
const EDUCATIONAL = 'EDUC2140 EDUC2240 EDUC3160 EDUC3201 EDUC4360'.split(' ');
const PRACTICUM = 'EDUC4030 EDUC4040'.split(' ');
const IMMERSION = 'ELED1010 ELED1020 ELED1030'.split(' ');
const ELECTIVE_SUBJECT = `
ENGE1800 ENGE1900 ENGE2110 ENGE2130 ENGE2140 ENGE2150 ENGE2160 ENGE2190
ENGE2210 ENGE2220 ENGE2310 ENGE2380 ENGE2530 ENGE2540 ENGE2600 ENGE2630
ENGE2700 ENGE2710 ENGE2720 ENGE3110 ENGE3220 ENGE3260 ENGE3280 ENGE3290
ENGE3360 ENGE3370 ENGE3410 ENGE3430 ENGE3500 ENGE3600 ENGE3610 ENGE3670
ENGE3690 ENGE3780 ENGE3940 ENGE3950 ENGE3970 ENGE4240 ENGE4650
`.trim().split(/\s+/);
const ELECTIVE_LANGUAGE = 'ELTU2005 ELTU3413 ELTU3414 ELTU3502'.split(' ');
const ELECTIVE_METHOD = 'ELED4870 ELED4880 ELED4890 ELED4960 ELED4970 ELED4990'.split(' ');
const EXPECTED_CODES = [
  ...FACULTY, ...REQUIRED_SUBJECT, ...REQUIRED_LANGUAGE, ...REQUIRED_METHOD,
  ...RESEARCH, ...EDUCATIONAL, ...PRACTICUM, ...IMMERSION,
  ...ELECTIVE_SUBJECT, ...ELECTIVE_LANGUAGE, ...ELECTIVE_METHOD
].sort();

test('CUHK ELEDN exposes all 83 official 2026-27 rows without fabricating the mixed-unit language path', () => {
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
      id: 'CUHK-UG-ELEDN-31', universityCode: 'CUHK', code: 'ELEDN', jupasCode: 'JS4343',
      nameEn: 'English Studies (BA) and English Language Education (BEd)',
      sourceStatus: 'programme_summary_only', courseCount: 1, codedCourseCount: 0
    }],
    majors: [{
      id: 'CUHK-UG-ELEDN-31-M1', programmeId: 'CUHK-UG-ELEDN-31',
      nameEn: 'English Studies (BA) and English Language Education (BEd)',
      courseCount: 1, codedCourseCount: 0
    }],
    courses: []
  };

  addGenericCourseSupplements(catalogue, [supplement]);

  const courses = catalogue.courses;
  const byCode = Object.fromEntries(courses.map((course) => [course.courseCode, course]));
  const sumCredits = (codes) => codes.reduce((sum, code) => sum + byCode[code].credits, 0);
  assert.equal(catalogue.programmes[0].sourceStatus, 'course_codes_available');
  assert.equal(catalogue.programmes[0].codedCourseCount, 83);
  assert.equal(catalogue.majors[0].codedCourseCount, 83);
  assert.equal(courses.length, 83);
  assert.deepEqual(courses.map((course) => course.courseCode).sort(), EXPECTED_CODES);
  assert.equal(courses.filter((course) => course.courseType === 'foundation').length, 3);
  assert.equal(courses.filter((course) => course.courseType === 'core').length, 27);
  assert.equal(courses.filter((course) => course.courseType === 'capstone').length, 2);
  assert.equal(courses.filter((course) => course.courseType === 'internship').length, 2);
  assert.equal(courses.filter((course) => course.courseType === 'major_elective').length, 49);
  assert.equal(courses.reduce((sum, course) => sum + course.credits, 0), 235);
  assert.deepEqual([
    sumCredits(FACULTY), sumCredits(REQUIRED_SUBJECT), sumCredits(REQUIRED_LANGUAGE),
    sumCredits(REQUIRED_METHOD), sumCredits(RESEARCH), sumCredits(EDUCATIONAL),
    sumCredits(PRACTICUM), sumCredits(IMMERSION)
  ], [9, 30, 9, 18, 6, 12, 10, 3]);
  assert.deepEqual([sumCredits(ELECTIVE_SUBJECT), sumCredits(ELECTIVE_LANGUAGE), sumCredits(ELECTIVE_METHOD)], [117, 9, 12]);
  assert.deepEqual([byCode.ELTU2005.credits, byCode.ELTU3413.credits, byCode.ELED1010.credits], [3, 2, 1]);
  assert.equal(byCode.ELED4850.courseType, 'capstone');
  assert.equal(byCode.ELED4860.courseType, 'capstone');
  assert(courses.every((course) => course.sourceUrl === supplementFile.sourceUrl));

  assert.match(supplementFile.academicYear, /2026-2027/);
  assert.match(supplementFile.note, /minimum 118-unit Major/);
  assert.match(supplementFile.note, /83 unique code-title-unit rows/);
  assert.match(supplementFile.note, /totalCreditRequired=0/);
});
