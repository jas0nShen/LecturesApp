const assert = require('node:assert/strict');
const test = require('node:test');
const supplementFile = require('../data/ug-course-supplements/hku-6896-ibgm-curriculum-2025.json');
const ugService = require('../miniprogram/utils/ugService');
const { addGenericCourseSupplements } = require('./generate-ug-catalog');
const { validateSupplement } = require('./validate-ug-supplements');

const EXPECTED_CODES = [
  'ACCT1101',
  'ECON1210',
  'ECON1280',
  'IIMT1640',
  'FINA1310',
  'MKTG2501',
  'BUSI1805',
  'IIMT2601',
  'MGMT2401',
  'BUSI3808',
  'STRA3702',
  'STRA4702',
  'BUSI3809',
  'STRA3703',
  'STRA4701',
  'BUSI3801',
  'BUSI3803',
  'FINA2390',
  'FINA2350',
  'MKTG3511',
  'MKTG3524'
];

function getSupplement() {
  return supplementFile.supplements[0];
}

function expandSupplement() {
  return {
    provider: supplementFile.provider,
    academicYear: supplementFile.academicYear,
    officialUrl: supplementFile.officialUrl,
    ...getSupplement()
  };
}

function buildCatalogue() {
  const supplement = getSupplement();
  return {
    programmes: [{
      id: supplement.programmeId,
      universityCode: 'HKU',
      code: supplement.programmeCode,
      nameEn: supplement.programmeName,
      sourceStatus: 'programme_summary_only',
      courseCount: 1,
      codedCourseCount: 0
    }],
    majors: [{
      id: supplement.majorId,
      programmeId: supplement.programmeId,
      nameEn: supplement.majorName,
      courseCount: 1,
      codedCourseCount: 0
    }],
    courses: []
  };
}

test('HKU 6896 preserves the complete closed 96-credit IBGM First Major', () => {
  const supplement = getSupplement();

  assert.equal(supplementFile.supplements.length, 1);
  validateSupplement(expandSupplement(), 0);
  assert.deepEqual(supplement.courses.map((course) => course.code), EXPECTED_CODES);
  assert.equal(new Set(EXPECTED_CODES).size, 21);
  assert(supplement.courses.every((course) => course.credits === 6));
  assert.deepEqual(
    supplement.courses.filter((course) => course.courseType === 'capstone').map((course) => course.code),
    ['STRA4701']
  );
  assert.match(supplement.ruleSummary, /96 first-major credits/);
});

test('HKU 6896 preserves the one-from-each-list elective boundary', () => {
  const supplement = getSupplement();
  const listA = supplement.courses
    .filter((course) => course.group.startsWith('Disciplinary Electives List A'))
    .map((course) => course.code);
  const listB = supplement.courses
    .filter((course) => course.group.startsWith('Disciplinary Electives List B'))
    .map((course) => course.code);

  assert.deepEqual(listA, ['BUSI3801', 'BUSI3803']);
  assert.deepEqual(listB, ['FINA2390', 'FINA2350', 'MKTG3511', 'MKTG3524']);
  assert(supplement.courses
    .filter((course) => course.group.startsWith('Disciplinary Electives'))
    .every((course) => course.recommendedYear === 4));
  assert.match(supplement.ruleSummary, /one List A course and one List B course/);
});

test('HKU 6896 excludes its open Second Major, exchange and placeholder requirements', () => {
  const supplement = getSupplement();
  const codes = supplement.courses.map((course) => course.code);

  assert(!codes.some((code) => /xxxx/i.test(code)));
  assert(!codes.some((code) => /exchange/i.test(code)));
  assert.match(supplement.evidenceGap, /Second Major may be any FBE or HKU discipline/);
  assert.match(supplement.evidenceGap, /compulsory overseas exchange has no prescribed HKU course code/);
  assert.match(supplement.evidenceGap, /Open or placeholder-coded University and free-elective requirements are excluded/);
});

test('HKU 6896 supplement applies only to its Programme-local identity', () => {
  const supplement = getSupplement();
  const catalogue = buildCatalogue();
  addGenericCourseSupplements(catalogue, [expandSupplement()]);

  const programme = catalogue.programmes[0];
  const major = catalogue.majors[0];
  const courses = catalogue.courses.filter((course) => course.programmeId === supplement.programmeId);

  assert.equal(programme.sourceStatus, 'course_codes_available');
  assert.equal(programme.codedCourseCount, 21);
  assert.equal(major.codedCourseCount, 21);
  assert.equal(courses.length, 21);
  assert(courses.every((course) => (
    course.programmeId === supplement.programmeId
    && course.majorId === supplement.majorId
    && course.sourceUrl === supplement.sourceUrl
  )));
});

test('generated HKU 6896 runtime profile exposes the official IBGM course list', () => {
  const supplement = getSupplement();
  const profile = ugService.getMajorProfile(supplement.programmeId, supplement.majorId);

  assert(profile);
  assert.equal(profile.sourceStatus, 'course_codes_available');
  assert.equal(profile.codedCourseCount, 21);
  assert.equal(profile.courses.length, 21);
  assert.deepEqual(profile.courses.map((course) => course.courseCode), EXPECTED_CODES);
  assert(profile.courses.every((course) => (
    course.programmeId === supplement.programmeId
    && course.majorId === supplement.majorId
    && course.sourceUrl === supplement.sourceUrl
  )));
});
