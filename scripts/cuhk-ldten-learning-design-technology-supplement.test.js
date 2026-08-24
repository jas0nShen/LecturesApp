const assert = require('node:assert/strict');
const test = require('node:test');
const supplementFile = require('../data/ug-course-supplements/cuhk-ldten-learning-design-technology-courses-2026.json');
const { addGenericCourseSupplements } = require('./generate-ug-catalog');
const { validateSupplement } = require('./validate-ug-supplements');

const FACULTY = 'CHEM1070 CHEM1072 ENGG1110 LDTE1300'.split(' ');
const FOUNDATION = 'CSCI1130 EDUC2120 ENGG2440 LDTE2100 LSCI1012 STAT1011 STAT2005'.split(' ');
const REQUIRED = `
CSCI2040 CSCI2100 EDUC3330 ENGG1920 MAEG1020 LDTE3100 LDTE3110 LDTE3120
LDTE3500 LDTE3510 LDTE4500 PHYS1002 PHYS1004
`.trim().split(/\s+/);
const ELECTIVES = `
AIST2010 AIST3510 SEEM3510 CSCI2720 CSCI3170 CSCI3230 CSCI3310 EDUC2140
EDUC3160 EDUC4360 LDTE3200 LDTE4200 LDTE4210 LDTE4300 LSCI2002 MAEG2050
PHYS1712 PHYS2061
`.trim().split(/\s+/);
const EXPECTED_CODES = [...FACULTY, ...FOUNDATION, ...REQUIRED, ...ELECTIVES].sort();

test('CUHK LDTEN exposes all 42 official 2026-27 codes without fabricating the 7-unit elective rule', () => {
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
      id: 'CUHK-UG-LDTEN-34', universityCode: 'CUHK', code: 'LDTEN', jupasCode: 'JS4386',
      nameEn: 'Learning Design and Technology', sourceStatus: 'programme_summary_only',
      courseCount: 1, codedCourseCount: 0
    }],
    majors: [{
      id: 'CUHK-UG-LDTEN-34-M1', programmeId: 'CUHK-UG-LDTEN-34',
      nameEn: 'Learning Design and Technology', courseCount: 1, codedCourseCount: 0
    }],
    courses: []
  };

  addGenericCourseSupplements(catalogue, [supplement]);

  const courses = catalogue.courses;
  const byCode = Object.fromEntries(courses.map((course) => [course.courseCode, course]));
  assert.equal(catalogue.programmes[0].sourceStatus, 'course_codes_available');
  assert.equal(catalogue.programmes[0].codedCourseCount, 42);
  assert.equal(catalogue.majors[0].codedCourseCount, 42);
  assert.equal(courses.length, 42);
  assert.deepEqual(courses.map((course) => course.courseCode).sort(), EXPECTED_CODES);
  assert.equal(courses.filter((course) => course.courseType === 'foundation').length, 11);
  assert.equal(courses.filter((course) => course.courseType === 'core').length, 10);
  assert.equal(courses.filter((course) => course.courseType === 'capstone').length, 2);
  assert.equal(courses.filter((course) => course.courseType === 'internship').length, 1);
  assert.equal(courses.filter((course) => course.courseType === 'major_elective').length, 18);
  assert.equal(courses.reduce((sum, course) => sum + course.credits, 0), 120);
  assert.equal(FOUNDATION.reduce((sum, code) => sum + byCode[code].credits, 0), 21);
  assert.equal(REQUIRED.reduce((sum, code) => sum + byCode[code].credits, 0), 38);
  assert.deepEqual([byCode.CSCI2040.credits, byCode.PHYS1712.credits], [2, 1]);
  assert.equal(byCode.AIST3510.titleEn, byCode.SEEM3510.titleEn);
  assert.match(byCode.LDTE3500.requirementGroups[0], /Internship/);
  assert(courses.every((course) => course.sourceUrl === supplementFile.sourceUrl));

  assert.match(supplementFile.note, /complete 72-unit Major Programme Requirement/);
  assert.match(supplementFile.note, /42 unique code-title-unit records/);
  assert.match(supplementFile.note, /totalCreditRequired=0/);
});
