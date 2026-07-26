const assert = require('node:assert/strict');
const test = require('node:test');
const supplementFile = require('../data/ug-course-supplements/hku-6781-accounting-curricula-2025.json');
const bbaFinanceFile = require('../data/ug-course-supplements/hku-6755-bba-finance-curriculum-2025.json');
const ugService = require('../miniprogram/utils/ugService');
const { addGenericCourseSupplements } = require('./generate-ug-catalog');
const { validateSupplement } = require('./validate-ug-supplements');

const EXPECTED = {
  'HKU-UG-6781-77': {
    count: 69,
    capstone: 'ACCT3112',
    sourceUrl: 'https://ug.hkubs.hku.hk/f/curriculum/255361/BBA%28Acc%26Fin%29_Syllabuses%202025-26.pdf'
  },
  'HKU-UG-6781-78': {
    count: 39,
    capstone: 'ACCT4101',
    sourceUrl: 'https://ug.hkubs.hku.hk/f/curriculum/255363/BBA%28ADA%29_Syllabuses%202025-26.pdf'
  }
};

function expandSupplement(supplement) {
  return {
    provider: supplementFile.provider,
    academicYear: supplementFile.academicYear,
    officialUrl: supplementFile.officialUrl,
    ...supplement
  };
}

function buildCatalogue() {
  return {
    programmes: supplementFile.supplements.map((supplement) => ({
      id: supplement.programmeId,
      universityCode: 'HKU',
      code: '6781',
      nameEn: supplement.programmeName,
      sourceStatus: 'programme_summary_only',
      courseCount: 1,
      codedCourseCount: 0
    })),
    majors: supplementFile.supplements.map((supplement) => ({
      id: supplement.majorId,
      programmeId: supplement.programmeId,
      nameEn: supplement.majorName,
      courseCount: 1,
      codedCourseCount: 0
    })),
    courses: []
  };
}

test('HKU 6781 supplements preserve both official accounting curricula', () => {
  assert.equal(supplementFile.supplements.length, 2);

  for (const supplement of supplementFile.supplements) {
    validateSupplement(expandSupplement(supplement), 0);

    const expected = EXPECTED[supplement.programmeId];
    const codes = supplement.courses.map((course) => course.code);
    const capstones = supplement.courses.filter((course) => course.courseType === 'capstone');

    assert(expected);
    assert.equal(supplement.sourceUrl, expected.sourceUrl);
    assert.equal(codes.length, expected.count);
    assert.equal(new Set(codes).size, expected.count);
    assert.deepEqual(capstones.map((course) => course.code), [expected.capstone]);
    assert(!codes.some((code) => /xxxx/i.test(code)));
  }
});

test('HKU BBA(Acc&Fin) preserves the official Finance Minor replacement pool', () => {
  const accounting = supplementFile.supplements.find((item) => item.programmeId === 'HKU-UG-6781-77');
  const replacementElectives = accounting.courses.filter((course) => (
    course.group.startsWith('Finance Minor replacement elective pool')
  ));
  const bbaFinanceElectives = bbaFinanceFile.supplements[0].courses.filter((course) => (
    course.group.startsWith('Finance disciplinary elective')
  ));
  const expectedCodes = bbaFinanceElectives
    .map((course) => course.code)
    .filter((code) => code !== 'FINA4392')
    .concat('FINA2322')
    .sort();

  assert.equal(replacementElectives.length, 48);
  assert.deepEqual(replacementElectives.map((course) => course.code).sort(), expectedCodes);
  assert(replacementElectives.every((course) => (
    course.credits === 6 && course.group.includes('complete 24 credits')
  )));
  assert(replacementElectives.some((course) => (
    course.code === 'FINA2322' && course.group.includes('only for Minor in Finance')
  )));
  assert(!replacementElectives.some((course) => course.code === 'FINA4392'));
  assert.match(accounting.ruleSummary, /108-credit Professional Core in Accounting/);
  assert.match(accounting.ruleSummary, /36-credit Minor in Finance/);
});

test('HKU BBA(ADA) preserves its closed Core choices and elective alternatives', () => {
  const analytics = supplementFile.supplements.find((item) => item.programmeId === 'HKU-UG-6781-78');
  const codes = new Set(analytics.courses.map((course) => course.code));
  const electives = analytics.courses.filter((course) => course.courseType === 'major_elective');

  assert.equal(electives.length, 13);
  assert(electives.every((course) => (
    course.credits === 6 && course.group.includes('complete two courses / 12 credits')
  )));
  assert.deepEqual(
    ['IIMT2602', 'COMP1117', 'IIMT3601', 'COMP3278', 'IIMT3602', 'COMP3297', 'IIMT3688', 'COMP3270']
      .filter((code) => codes.has(code)),
    ['IIMT2602', 'COMP1117', 'IIMT3601', 'COMP3278', 'IIMT3602', 'COMP3297', 'IIMT3688', 'COMP3270']
  );
  assert.match(analytics.ruleSummary, /156 professional-core credits/);
});

test('HKU 6781 supplements apply only to their Programme-local identities', () => {
  const catalogue = buildCatalogue();
  addGenericCourseSupplements(catalogue, supplementFile.supplements.map(expandSupplement));

  for (const supplement of supplementFile.supplements) {
    const expected = EXPECTED[supplement.programmeId];
    const programme = catalogue.programmes.find((item) => item.id === supplement.programmeId);
    const major = catalogue.majors.find((item) => item.id === supplement.majorId);
    const courses = catalogue.courses.filter((course) => course.programmeId === supplement.programmeId);

    assert.equal(programme.sourceStatus, 'course_codes_available');
    assert.equal(programme.codedCourseCount, expected.count);
    assert.equal(major.codedCourseCount, expected.count);
    assert.equal(courses.length, expected.count);
    assert(courses.every((course) => (
      course.programmeId === supplement.programmeId
      && course.majorId === supplement.majorId
      && course.sourceUrl === supplement.sourceUrl
    )));
  }
});

test('generated HKU 6781 runtime profiles expose both official course lists', () => {
  for (const supplement of supplementFile.supplements) {
    const expected = EXPECTED[supplement.programmeId];
    const profile = ugService.getMajorProfile(supplement.programmeId, supplement.majorId);

    assert(profile);
    assert.equal(profile.sourceStatus, 'course_codes_available');
    assert.equal(profile.codedCourseCount, expected.count);
    assert.equal(profile.courses.length, expected.count);
    assert.equal(new Set(profile.courses.map((course) => course.courseCode)).size, expected.count);
    assert(profile.courses.every((course) => (
      course.programmeId === supplement.programmeId
      && course.majorId === supplement.majorId
      && course.sourceUrl === supplement.sourceUrl
    )));
  }
});
