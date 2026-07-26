const assert = require('node:assert/strict');
const test = require('node:test');
const sourceReviews = require('../data/ug-source-reviews.json');
const supplementFile = require('../data/ug-course-supplements/hku-6808-bba-law-llb-curriculum-2025.json');
const ugService = require('../miniprogram/utils/ugService');
const { validateSupplement } = require('./validate-ug-supplements');

const PROGRAMME_ID = 'HKU-UG-6808-80';
const BBA_SOURCE = 'https://ug.hkubs.hku.hk/f/page/254425/263331/BBA_Syllabuses%202025-26.pdf';
const LLB_SOURCE = 'https://dm.law.hku.hk/wp-content/uploads/LLB_regulations_syllabus_2025-26.pdf';

const EXPECTED = {
  'HKU-UG-6808-80-M1': ['Business Stream - Entrepreneurship, Design and Innovation', 63],
  'HKU-UG-6808-80-M2': ['Business Stream - Finance', 109],
  'HKU-UG-6808-80-M3': ['Business Stream - Human Resource Management', 64],
  'HKU-UG-6808-80-M4': ['Business Stream - Information Systems and Analytics', 62],
  'HKU-UG-6808-80-M5': ['Business Stream - Marketing', 67],
  'HKU-UG-6808-80-M6': ['Accounting Stream', 65]
};

function expandSupplement(supplement) {
  return {
    provider: supplementFile.provider,
    academicYear: supplementFile.academicYear,
    sourceUrl: supplementFile.sourceUrl,
    officialUrl: supplementFile.officialUrl,
    ...supplement
  };
}

test('HKU 6808 declares five Business Major paths and one Accounting Stream', () => {
  assert.equal(supplementFile.supplements.length, 7);

  supplementFile.supplements.forEach((supplement, index) => {
    validateSupplement(expandSupplement(supplement), index);
  });

  assert(supplementFile.supplements[0].majorOverride);
  assert.equal(supplementFile.supplements.filter((item) => item.copyCoursesFrom).length, 5);
  assert.equal(supplementFile.supplements.filter((item) => item.createMajor).length, 5);
  assert.deepEqual(
    supplementFile.supplements.slice(0, 6).map((item) => item.majorId),
    Object.keys(EXPECTED)
  );
});

test('HKU 6808 publishes only explicit Programme-wide codes and records the incomplete Law elective universe', () => {
  const common = supplementFile.supplements[6];
  const codes = common.courses.map((course) => course.code);
  const fixedLawCore = common.courses.filter((course) => (
    course.group.startsWith('Professional Core in Law - required')
  ));
  const capstones = common.courses.filter((course) => course.courseType === 'capstone');
  const designatedElectives = common.courses.filter((course) => (
    course.group.includes('designated disciplinary elective subset')
  ));
  const review = sourceReviews.find((item) => (
    item.universityCode === 'HKU' && item.programmeCode === '6808'
  ));

  assert.equal(common.courses.length, 46);
  assert.equal(new Set(codes).size, 46);
  assert.equal(fixedLawCore.length, 18);
  assert.equal(capstones.length, 9);
  assert.equal(designatedElectives.length, 12);
  assert(!codes.some((code) => /xxxx/i.test(code)));
  assert.match(common.evidenceNote, /42-credit Law disciplinary-elective requirement is broader/);
  assert.equal(review.status, 'public_course_codes_partial');
  assert.match(review.note, /do not present them as a complete graduation structure/);
});

test('generated HKU 6808 runtime profiles keep all six Programme-local course lists isolated', () => {
  for (const [majorId, [name, count]] of Object.entries(EXPECTED)) {
    const profile = ugService.getMajorProfile(PROGRAMME_ID, majorId);

    assert(profile);
    assert.equal(profile.sourceStatus, 'course_codes_available');
    assert.equal(profile.major.nameEn, name);
    assert.equal(profile.codedCourseCount, count);
    assert.equal(profile.courses.length, count);
    assert.equal(new Set(profile.courses.map((course) => course.courseCode)).size, count);
    assert(profile.courses.every((course) => (
      course.programmeId === PROGRAMME_ID && course.majorId === majorId
    )));
  }
});

test('HKU 6808 preserves BBA, Accounting and Law source boundaries', () => {
  const edi = ugService.getMajorProfile(PROGRAMME_ID, 'HKU-UG-6808-80-M1');
  const hrm = ugService.getMajorProfile(PROGRAMME_ID, 'HKU-UG-6808-80-M3');
  const accounting = ugService.getMajorProfile(PROGRAMME_ID, 'HKU-UG-6808-80-M6');

  assert.equal(edi.courses.find((course) => course.courseCode === 'IIMT3624').sourceUrl, BBA_SOURCE);
  assert(!edi.courses.some((course) => course.courseCode === 'MGMT3429'));
  assert.equal(hrm.courses.find((course) => course.courseCode === 'MGMT3429').sourceUrl, BBA_SOURCE);
  assert(!hrm.courses.some((course) => course.courseCode === 'IIMT3624'));
  assert(accounting.courses.some((course) => course.courseCode === 'ACCT3112'));
  assert(!accounting.courses.some((course) => course.courseCode === 'IIMT3624'));

  for (const profile of [edi, hrm, accounting]) {
    assert.equal(
      profile.courses.find((course) => course.courseCode === 'LLAW1001').sourceUrl,
      supplementFile.sourceUrl
    );
    assert.equal(
      profile.courses.find((course) => course.courseCode === 'LLAW3148').sourceUrl,
      LLB_SOURCE
    );
  }
});
