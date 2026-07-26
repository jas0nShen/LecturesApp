const assert = require('node:assert/strict');
const test = require('node:test');
const supplementFile = require('../data/ug-course-supplements/hku-6767-economics-curricula-2025.json');
const bbaFinanceFile = require('../data/ug-course-supplements/hku-6755-bba-finance-curriculum-2025.json');
const ugService = require('../miniprogram/utils/ugService');
const { addGenericCourseSupplements } = require('./generate-ug-catalog');
const { validateSupplement } = require('./validate-ug-supplements');

const EXPECTED = {
  'HKU-UG-6767-74': {
    count: 61,
    requiredCredits: 78,
    economicsElectiveCredits: 18,
    financeElectiveCredits: 0
  },
  'HKU-UG-6767-75': {
    count: 111,
    requiredCredits: 96,
    economicsElectiveCredits: 12,
    financeElectiveCredits: 12
  }
};

const ECONOMICS_ELECTIVE_CODES = [
  'ECON2214', 'ECON2216', 'ECON2217', 'ECON2223', 'ECON2225', 'ECON2226', 'ECON2232',
  'ECON2233', 'ECON2234', 'ECON2249', 'ECON2252', 'ECON2253', 'ECON2255', 'ECON2257',
  'ECON2262', 'ECON2264', 'ECON2266', 'ECON2271', 'ECON2272', 'ECON2273', 'ECON2275',
  'ECON2276', 'ECON2284', 'ECON2285', 'ECON2292', 'ECON3215', 'ECON3219', 'ECON3220',
  'ECON3221', 'ECON3222', 'ECON3223', 'ECON3224', 'ECON3225', 'ECON3229', 'ECON3232',
  'ECON3233', 'ECON3234', 'ECON3235', 'ECON3243', 'ECON3262', 'ECON3263', 'ECON3272',
  'ECON3283', 'ECON3284', 'ECON3293', 'ECON4211', 'ECON4214', 'ECON4221', 'ECON4294'
];

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
      code: '6767',
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

test('HKU 6767 supplements preserve the official BEcon and BEcon&Fin coded structures', () => {
  assert.equal(supplementFile.supplements.length, 2);

  for (const supplement of supplementFile.supplements) {
    validateSupplement(expandSupplement(supplement), 0);

    const expected = EXPECTED[supplement.programmeId];
    const codes = supplement.courses.map((course) => course.code);
    const economicsElectives = supplement.courses.filter((course) => (
      course.group.startsWith('Economics disciplinary elective')
    ));
    const financeElectives = supplement.courses.filter((course) => (
      course.group.startsWith('Finance disciplinary elective')
    ));
    const capstones = supplement.courses.filter((course) => course.courseType === 'capstone');

    assert(expected);
    assert.equal(codes.length, expected.count);
    assert.equal(new Set(codes).size, expected.count);
    assert.equal(economicsElectives.length, 49);
    assert.deepEqual(
      economicsElectives.map((course) => course.code),
      ECONOMICS_ELECTIVE_CODES
    );
    assert.equal(financeElectives.length, expected.financeElectiveCredits ? 48 : 0);
    assert(economicsElectives.every((course) => (
      course.group.includes(`complete ${expected.economicsElectiveCredits} credits`)
    )));
    assert(financeElectives.every((course) => (
      course.group.includes(`complete ${expected.financeElectiveCredits} credits`)
    )));
    assert.equal(economicsElectives.find((course) => course.code === 'ECON4294').credits, 12);
    assert.equal(capstones.length, 1);
    assert.equal(capstones[0].code, 'ECON4200');
    assert.match(supplement.ruleSummary, new RegExp(`${expected.requiredCredits} major credits`));
    assert(!codes.some((code) => /xxxx/i.test(code)));
  }
});

test('HKU BEcon&Fin finance List B matches the official dated BBA finance elective appendix', () => {
  const beconFin = supplementFile.supplements.find((item) => item.programmeId === 'HKU-UG-6767-75');
  const beconFinFinance = beconFin.courses.filter((course) => (
    course.group.startsWith('Finance disciplinary elective')
  ));
  const bbaFinance = bbaFinanceFile.supplements[0].courses.filter((course) => (
    course.group.startsWith('Finance disciplinary elective')
  ));

  assert.deepEqual(
    beconFinFinance.map(({ code, title, credits }) => ({ code, title, credits })),
    bbaFinance.map(({ code, title, credits }) => ({ code, title, credits }))
  );
  assert.equal(beconFinFinance.find((course) => course.code === 'FINA4392').credits, 12);
});

test('HKU 6767 supplements apply only to their Programme-local identities', () => {
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

  assert.equal(
    catalogue.courses.filter((course) => course.programmeId === 'HKU-UG-6767-74').length,
    EXPECTED['HKU-UG-6767-74'].count
  );
  assert.equal(
    catalogue.courses.filter((course) => course.programmeId === 'HKU-UG-6767-75').length,
    EXPECTED['HKU-UG-6767-75'].count
  );
});

test('generated HKU 6767 runtime profiles expose both official course lists', () => {
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
