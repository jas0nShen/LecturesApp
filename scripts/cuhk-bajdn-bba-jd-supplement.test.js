const assert = require('node:assert/strict');
const test = require('node:test');
const supplementFile = require('../data/ug-course-supplements/cuhk-bajdn-bba-jd-study-sequence-current.json');
const { addGenericCourseSupplements } = require('./generate-ug-catalog');
const { validateSupplement } = require('./validate-ug-supplements');

const EXPECTED_CODES = `
ACCT2111 ACCT2121 DOTE1030 DOTE1040 DOTE2011 DOTE2030 DOTE2051 FINA2010
IBBA3040 LAWS1020 LAWS1030 LAWS1041 LAWS1042 LAWS2131 LAWS2132 LAWS6001
LAWS6004 LAWS6006 LAWS6007 LAWS6011 LAWS6013 LAWS6015 LAWS6017 LAWS6018
LAWS6019 LAWS6020 LAWS6021 LAWS6022 LAWS6023 LAWS6024 LAWS6089 LAWS6901
LAWS6902 MGNT1020 MGNT2511 MGNT2512 MGNT4010 MKTG2010
`.trim().split(/\s+/).sort();

test('CUHK BAJDN exposes the complete current coded Study Sequence without inferring units or completion rules', () => {
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
      id: 'CUHK-UG-BAJDN-17', universityCode: 'CUHK', code: 'BAJDN', jupasCode: 'JS4264',
      nameEn: 'BBA(IBBA)-JD Double Degree Programme', sourceStatus: 'programme_summary_only',
      courseCount: 1, codedCourseCount: 0
    }],
    majors: [{
      id: 'CUHK-UG-BAJDN-17-M1', programmeId: 'CUHK-UG-BAJDN-17',
      nameEn: 'BBA(IBBA)-JD Double Degree Programme', courseCount: 1, codedCourseCount: 0
    }],
    courses: []
  };

  addGenericCourseSupplements(catalogue, [supplement]);

  const courses = catalogue.courses;
  const byCode = Object.fromEntries(courses.map((course) => [course.courseCode, course]));
  assert.equal(catalogue.programmes[0].sourceStatus, 'course_codes_available');
  assert.equal(catalogue.programmes[0].codedCourseCount, 38);
  assert.equal(catalogue.majors[0].codedCourseCount, 38);
  assert.equal(courses.length, 38);
  assert.deepEqual(courses.map((course) => course.courseCode).sort(), EXPECTED_CODES);
  assert.equal(new Set(courses.map((course) => course.courseCode)).size, 38);
  assert(courses.every((course) => course.credits === 0));
  assert(courses.every((course) => course.courseType === 'programme_course'));
  assert.equal(byCode.DOTE1030.titleEn, 'Economics for Business Studies I');
  assert.match(byCode.DOTE1030.requirementGroups[0], /legacy DSME1030/);
  assert.equal(byCode.LAWS6020.titleEn, 'Principle of Administrative Law');
  assert.match(byCode.LAWS6006.requirementGroups[0], /alternative is LAWS6089/);
  assert.match(byCode.LAWS6089.requirementGroups[0], /substitute for LAWS6006/);
  assert.match(byCode.LAWS6901.requirementGroups[0], /choose LAWS6901 or LAWS6902/);
  assert.equal(byCode.LAWS6024.semester, 'Summer');
  assert(courses.every((course) => course.sourceUrl === supplementFile.sourceUrl));

  assert.match(supplementFile.note, /38 unique Programme-local code-title entries/);
  assert.match(supplementFile.note, /credits=0 as unknown/);
  assert.match(supplementFile.note, /totalCreditRequired=0/);
});
