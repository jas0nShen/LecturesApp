const assert = require('node:assert/strict');
const test = require('node:test');
const supplementFile = require('../data/ug-course-supplements/hku-business-analytics-marketing-technology-curricula-2025.json');
const ugService = require('../miniprogram/utils/ugService');
const { addGenericCourseSupplements } = require('./generate-ug-catalog');
const { validateSupplement } = require('./validate-ug-supplements');

const EXPECTED = {
  'HKU-UG-6793-79': {
    count: 19,
    capstones: ['IIMT4602'],
    listA: ['IIMT3641', 'IIMT3642', 'IIMT3688'],
    listB: ['IIMT3603', 'IIMT3643', 'IIMT3684']
  },
  'HKU-UG-6846-83': {
    count: 25,
    capstones: ['MKTG3531', 'MKTG4501'],
    listA: ['MKTG3511', 'MKTG3524', 'MKTG3526', 'MKTG3527', 'MKTG3529'],
    listB: ['COMP2119', 'ECON2280', 'IIMT3601', 'MKTG3532', 'MKTG3602', 'COMP3314']
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
      code: supplement.programmeCode,
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

test('HKU analytics supplements preserve both closed 96-credit Major structures', () => {
  assert.equal(supplementFile.supplements.length, 2);

  for (const supplement of supplementFile.supplements) {
    validateSupplement(expandSupplement(supplement), 0);

    const expected = EXPECTED[supplement.programmeId];
    const codes = supplement.courses.map((course) => course.code);
    const capstones = supplement.courses
      .filter((course) => course.courseType === 'capstone')
      .map((course) => course.code);
    const listA = supplement.courses
      .filter((course) => course.group.startsWith('Disciplinary Electives List A'))
      .map((course) => course.code);
    const listB = supplement.courses
      .filter((course) => course.group.startsWith('Disciplinary Electives List B'))
      .map((course) => course.code);

    assert(expected);
    assert.equal(codes.length, expected.count);
    assert.equal(new Set(codes).size, expected.count);
    assert.deepEqual(capstones, expected.capstones);
    assert.deepEqual(listA, expected.listA);
    assert.deepEqual(listB, expected.listB);
    assert(listA.every((code) => codes.includes(code)));
    assert(listB.every((code) => codes.includes(code)));
    assert(supplement.courses
      .filter((course) => course.group.startsWith('Disciplinary Electives'))
      .every((course) => course.group.includes('choose two courses / 12 credits')));
    assert.match(supplement.ruleSummary, /96 major credits/);
    assert(!codes.some((code) => /xxxx/i.test(code)));
  }
});

test('HKU BBA(BA) keeps approved MSc substitutions outside its undergraduate pool', () => {
  const businessAnalytics = supplementFile.supplements.find((item) => item.programmeId === 'HKU-UG-6793-79');
  const codes = businessAnalytics.courses.map((course) => course.code);

  assert.match(businessAnalytics.evidenceGap, /up to four approved MSc\(BA\) courses/);
  assert(!codes.some((code) => /^MSBA/i.test(code)));
});

test('HKU BSc(MAT) preserves its either-or capstone and two-list elective rule', () => {
  const marketingTechnology = supplementFile.supplements.find((item) => item.programmeId === 'HKU-UG-6846-83');
  const capstones = marketingTechnology.courses.filter((course) => course.courseType === 'capstone');

  assert.deepEqual(capstones.map((course) => course.code), ['MKTG3531', 'MKTG4501']);
  assert(capstones.every((course) => (
    course.credits === 6
    && course.group.includes('choose MKTG3531 or MKTG4501')
  )));
  assert.match(marketingTechnology.ruleSummary, /two Marketing Technology and Strategy List A courses/);
  assert.match(marketingTechnology.ruleSummary, /two Marketing Analytics List B courses/);
});

test('HKU analytics supplements apply only to their Programme-local identities', () => {
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

test('generated HKU analytics runtime profiles expose both official course lists', () => {
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
