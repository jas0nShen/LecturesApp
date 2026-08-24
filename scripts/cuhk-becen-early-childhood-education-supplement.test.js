const assert = require('node:assert/strict');
const test = require('node:test');
const supplementFile = require('../data/ug-course-supplements/cuhk-becen-early-childhood-education-courses-2025.json');
const { addGenericCourseSupplements } = require('./generate-ug-catalog');
const { validateSupplement } = require('./validate-ug-supplements');

const FACULTY_PACKAGE = 'BECE2110 BECE2310 EDUC2240'.split(' ');
const CORE = `
BECE2120 BECE2130 BECE2140 BECE2320 BECE2330 BECE2510 CHED4210 CHED4220
CHED4310 CHED4340 CHED4350 CHED4410 CHED4510 EDUC3201
`.trim().split(/\s+/);
const RESEARCH = 'CHED4320 BECE4540'.split(' ');
const TEACHING_PRACTICE = 'BECE4010 BECE4020'.split(' ');
const ELECTIVE_A = `
BECE2210 BECE3110 BECE3120 BECE3160 BECE3170 BECE3210 BECE3220 BECE4341
CHED4330 CHED4530
`.trim().split(/\s+/);
const ELECTIVE_B = `
BECE3130 BECE3140 BECE3150 CHED4150 CHED4370 CHED4520 CHED4550 EDUC3150
EDUC3200 EDUC3280 EDUC3290
`.trim().split(/\s+/);
const ELECTIVE_C = `
BMBL1001 LING1000 LING2003 LING2004 LING3201 LING3204 LING3208 MUSC1000
MUSC2545 MUSC2872 MUSC2882 MUSC3502 MUSC3533 PSYC1000 PSYC2010 PSYC2300
PSYC2620 SPED2141 SPED3410
`.trim().split(/\s+/);
const EXPECTED_CODES = [
  ...FACULTY_PACKAGE,
  ...CORE,
  ...RESEARCH,
  ...TEACHING_PRACTICE,
  ...ELECTIVE_A,
  ...ELECTIVE_B,
  ...ELECTIVE_C
].sort();

test('CUHK BECEN exposes all 61 official rows without fabricating the mixed-unit elective rules', () => {
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
      id: 'CUHK-UG-BECEN-29', universityCode: 'CUHK', code: 'BECEN', jupasCode: 'JS4372',
      nameEn: 'Early Childhood Education', sourceStatus: 'programme_summary_only',
      courseCount: 1, codedCourseCount: 0
    }],
    majors: [{
      id: 'CUHK-UG-BECEN-29-M1', programmeId: 'CUHK-UG-BECEN-29',
      nameEn: 'Early Childhood Education', courseCount: 1, codedCourseCount: 0
    }],
    courses: []
  };

  addGenericCourseSupplements(catalogue, [supplement]);

  const courses = catalogue.courses;
  const byCode = Object.fromEntries(courses.map((course) => [course.courseCode, course]));
  const sumCredits = (codes) => codes.reduce((sum, code) => sum + byCode[code].credits, 0);
  assert.equal(catalogue.programmes[0].sourceStatus, 'course_codes_available');
  assert.equal(catalogue.programmes[0].codedCourseCount, 61);
  assert.equal(catalogue.majors[0].codedCourseCount, 61);
  assert.equal(courses.length, 61);
  assert.deepEqual(courses.map((course) => course.courseCode).sort(), EXPECTED_CODES);
  assert.equal(courses.filter((course) => course.courseType === 'foundation').length, 3);
  assert.equal(courses.filter((course) => course.courseType === 'core').length, 15);
  assert.equal(courses.filter((course) => course.courseType === 'capstone').length, 1);
  assert.equal(courses.filter((course) => course.courseType === 'internship').length, 2);
  assert.equal(courses.filter((course) => course.courseType === 'major_elective').length, 40);
  assert.equal(courses.reduce((sum, course) => sum + course.credits, 0), 172);
  assert.equal(sumCredits(FACULTY_PACKAGE), 9);
  assert.equal(sumCredits(CORE), 40);
  assert.equal(sumCredits(RESEARCH), 6);
  assert.equal(sumCredits(TEACHING_PRACTICE), 10);
  assert.deepEqual([sumCredits(ELECTIVE_A), sumCredits(ELECTIVE_B), sumCredits(ELECTIVE_C)], [29, 28, 50]);
  assert.deepEqual([byCode.BECE4010.credits, byCode.BECE4020.credits, byCode.SPED2141.credits], [5, 5, 1]);
  assert.equal(byCode.BECE4540.recommendedYear, 5);
  assert.equal(byCode.BECE4540.semester, 'Term 2');
  assert.match(byCode.BECE3110.requirementGroups[0], /pool \(a\)/);
  assert.match(byCode.EDUC3200.requirementGroups[0], /pool \(b\)/);
  assert.match(byCode.LING2003.requirementGroups[0], /pool \(c\)/);
  assert(courses.every((course) => course.sourceUrl === supplementFile.sourceUrl));

  assert.match(supplementFile.note, /minimum 111-unit Major/);
  assert.match(supplementFile.note, /61 unique code-title-unit rows/);
  assert.match(supplementFile.note, /totalCreditRequired=0/);
});
