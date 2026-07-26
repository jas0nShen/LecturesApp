const assert = require('node:assert/strict');
const test = require('node:test');
const supplementFile = require('../data/ug-course-supplements/hku-6755-bba-remaining-majors-curricula-2025.json');
const ugService = require('../miniprogram/utils/ugService');
const { addGenericCourseSupplements } = require('./generate-ug-catalog');
const { validateSupplement } = require('./validate-ug-supplements');

const PROGRAMMES = [
  ['HKU-UG-6755-69', 'Entrepreneurship, Design and Innovation'],
  ['HKU-UG-6755-70', 'Finance'],
  ['HKU-UG-6755-71', 'Human Resource Management'],
  ['HKU-UG-6755-72', 'Information Systems and Analytics'],
  ['HKU-UG-6755-73', 'Marketing']
];

const EXPECTED = {
  'HKU-UG-6755-69': {
    count: 17,
    capstone: 'IIMT3624',
    requiredCodes: ['IIMT3627', 'IIMT3689'],
    groupPattern: /at least one must be IIMT3627 or IIMT3689/
  },
  'HKU-UG-6755-71': {
    count: 18,
    capstone: 'MGMT3429',
    requiredCodes: ['MGMT3404', 'MGMT3476'],
    groupPattern: /complete four courses/
  },
  'HKU-UG-6755-72': {
    count: 16,
    capstone: 'IIMT4601',
    requiredCodes: ['IIMT3601', 'COMP3278', 'IIMT3602', 'COMP3297'],
    groupPattern: /choose IIMT3601 or COMP3278/
  },
  'HKU-UG-6755-73': {
    count: 21,
    capstone: 'MKTG3531',
    requiredCodes: ['MKTG3511', 'MKTG3526', 'MKTG3527', 'MKTG3532'],
    groupPattern: /choose two Marketing Strategy courses/
  }
};

function buildCatalogue() {
  return {
    programmes: PROGRAMMES.map(([id, majorName]) => ({
      id,
      universityCode: 'HKU',
      code: '6755',
      nameEn: `Bachelor of Business Administration (Major in ${majorName})`,
      sourceStatus: 'programme_summary_only',
      courseCount: 1,
      codedCourseCount: 0
    })),
    majors: PROGRAMMES.map(([programmeId, majorName]) => ({
      id: `${programmeId}-M1`,
      programmeId,
      nameEn: `Bachelor of Business Administration (Major in ${majorName})`,
      courseCount: 1,
      codedCourseCount: 0
    })),
    courses: []
  };
}

test('HKU BBA remaining Major supplements preserve exact bounded code sets and 78-credit rules', () => {
  assert.equal(supplementFile.supplements.length, 4);

  for (const supplement of supplementFile.supplements) {
    validateSupplement({
      provider: supplementFile.provider,
      academicYear: supplementFile.academicYear,
      sourceUrl: supplementFile.sourceUrl,
      officialUrl: supplementFile.officialUrl,
      ...supplement
    }, 0);

    const expected = EXPECTED[supplement.programmeId];
    const codes = supplement.courses.map((course) => course.code);
    const capstones = supplement.courses.filter((course) => course.courseType === 'capstone');

    assert(expected);
    assert.equal(supplement.majorId, `${supplement.programmeId}-M1`);
    assert.equal(codes.length, expected.count);
    assert.equal(new Set(codes).size, expected.count);
    assert.equal(capstones.length, 1);
    assert.equal(capstones[0].code, expected.capstone);
    assert(expected.requiredCodes.every((code) => codes.includes(code)));
    assert(supplement.courses.some((course) => expected.groupPattern.test(course.group)));
    assert(supplement.courses.every((course) => course.credits === 6));
    assert(!codes.some((code) => /xxxx/i.test(code)));
    assert.match(supplement.ruleSummary, /78 major credits/);
  }
});

test('HKU BBA remaining Major supplements apply only to their Programme-local identities', () => {
  const catalogue = buildCatalogue();
  addGenericCourseSupplements(catalogue, supplementFile.supplements.map((supplement) => ({
    provider: supplementFile.provider,
    academicYear: supplementFile.academicYear,
    sourceUrl: supplementFile.sourceUrl,
    officialUrl: supplementFile.officialUrl,
    ...supplement
  })));

  for (const supplement of supplementFile.supplements) {
    const expected = EXPECTED[supplement.programmeId];
    const programme = catalogue.programmes.find((item) => item.id === supplement.programmeId);
    const major = catalogue.majors.find((item) => item.id === supplement.majorId);
    const courses = catalogue.courses.filter((course) => course.majorId === supplement.majorId);

    assert.equal(programme.sourceStatus, 'course_codes_available');
    assert.equal(programme.codedCourseCount, expected.count);
    assert.equal(major.codedCourseCount, expected.count);
    assert.equal(courses.length, expected.count);
    assert(courses.every((course) => (
      course.programmeId === supplement.programmeId
      && course.majorId === supplement.majorId
      && course.sourceUrl === supplementFile.sourceUrl
    )));
  }

  const financeProgramme = catalogue.programmes.find((item) => item.id === 'HKU-UG-6755-70');
  const financeMajor = catalogue.majors.find((item) => item.id === 'HKU-UG-6755-70-M1');
  assert.equal(financeProgramme.sourceStatus, 'programme_summary_only');
  assert.equal(financeProgramme.codedCourseCount, 0);
  assert.equal(financeMajor.codedCourseCount, 0);
  assert.equal(catalogue.courses.filter((course) => course.programmeId === financeProgramme.id).length, 0);
});

test('HKU BBA Marketing and ISA preserve their alternative-group boundaries', () => {
  const marketing = supplementFile.supplements.find((item) => item.programmeId === 'HKU-UG-6755-73');
  const isa = supplementFile.supplements.find((item) => item.programmeId === 'HKU-UG-6755-72');
  const marketingListA = marketing.courses.filter((course) => course.group.includes('List A'));
  const marketingListB = marketing.courses.filter((course) => course.group.includes('List B'));
  const databaseOptions = isa.courses.filter((course) => (
    course.group.includes('choose IIMT3601 or COMP3278')
  ));
  const systemsOptions = isa.courses.filter((course) => (
    course.group.includes('choose IIMT3602 or COMP3297')
  ));

  assert.equal(marketingListA.length, 5);
  assert.equal(marketingListB.length, 5);
  assert.equal(databaseOptions.length, 2);
  assert.equal(systemsOptions.length, 2);
});

test('generated HKU BBA runtime profiles expose each remaining Major course list', () => {
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
      && course.sourceUrl === supplementFile.sourceUrl
    )));
  }

  const finance = ugService.getMajorProfile('HKU-UG-6755-70', 'HKU-UG-6755-70-M1');
  assert.equal(finance.codedCourseCount, 63);
  assert.equal(finance.courses.length, 63);
});
