const assert = require('node:assert/strict');
const test = require('node:test');
const supplementFile = require('../data/ug-course-supplements/hku-asset-management-quantitative-finance-curricula-2025.json');
const ugService = require('../miniprogram/utils/ugService');
const { addGenericCourseSupplements } = require('./generate-ug-catalog');
const { validateSupplement } = require('./validate-ug-supplements');

const EXPECTED = {
  'HKU-UG-6860-96': {
    count: 29,
    electiveCount: 16,
    capstones: ['FINA4321']
  },
  'HKU-UG-6884-97': {
    count: 32,
    electiveCount: 19,
    capstones: ['FINA4341', 'FINA4354']
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

test('HKU AMPB and QFin supplements preserve both closed 96-credit Major structures', () => {
  assert.equal(supplementFile.supplements.length, 2);

  for (const supplement of supplementFile.supplements) {
    validateSupplement(expandSupplement(supplement), 0);

    const expected = EXPECTED[supplement.programmeId];
    const codes = supplement.courses.map((course) => course.code);
    const electives = supplement.courses.filter((course) => (
      course.group.startsWith('Disciplinary Electives')
    ));
    const capstones = supplement.courses
      .filter((course) => course.courseType === 'capstone')
      .map((course) => course.code);

    assert(expected);
    assert.equal(codes.length, expected.count);
    assert.equal(new Set(codes).size, expected.count);
    assert.equal(electives.length, expected.electiveCount);
    assert.deepEqual(capstones, expected.capstones);
    assert(supplement.courses.every((course) => course.credits === 6));
    assert.match(supplement.ruleSummary, /96 major credits/);
    assert(!codes.some((code) => /xxxx/i.test(code)));
  }
});

test('HKU BFin(AMPB) preserves its 16-course elective pool and sustainability minimum', () => {
  const assetManagement = supplementFile.supplements.find((item) => item.programmeId === 'HKU-UG-6860-96');
  const electives = assetManagement.courses.filter((course) => (
    course.group.startsWith('Disciplinary Electives')
  ));
  const sustainability = electives.filter((course) => (
    course.group.startsWith('Disciplinary Electives sustainability condition')
  ));

  assert.equal(electives.length, 16);
  assert.deepEqual(sustainability.map((course) => course.code), ['FINA2385', 'FINA3385']);
  assert(electives.every((course) => (
    course.group.includes('four courses / 24 credits')
    && course.group.includes('FINA2385 or FINA3385')
  )));
  assert.match(assetManagement.evidenceGap, /approved MEcon courses/);
});

test('HKU BSc(QFin) preserves three paired alternatives and its two capstone choices', () => {
  const quantitativeFinance = supplementFile.supplements.find((item) => item.programmeId === 'HKU-UG-6884-97');
  const byCode = Object.fromEntries(quantitativeFinance.courses.map((course) => [course.code, course]));
  const pairedAlternatives = [
    ['FINA3322', 'SDST4607'],
    ['ECON3283', 'SDST4601'],
    ['MATH3603', 'SDST3603']
  ];

  for (const [left, right] of pairedAlternatives) {
    assert(byCode[left].group.includes(`choose ${left} or ${right} as one course`));
    assert.equal(byCode[left].group, byCode[right].group);
  }

  for (const code of ['FINA4341', 'FINA4354']) {
    assert.equal(byCode[code].credits, 6);
    assert.equal(byCode[code].courseType, 'capstone');
    assert(byCode[code].group.includes('choose at least one of FINA4341 or FINA4354'));
  }

  assert.match(quantitativeFinance.ruleSummary, /three paired alternative choices/);
  assert.match(quantitativeFinance.evidenceGap, /approved MEcon courses/);
});

test('HKU AMPB and QFin supplements exclude open placeholders and free-elective MEcon rows', () => {
  for (const supplement of supplementFile.supplements) {
    const codes = supplement.courses.map((course) => course.code);

    assert(!codes.some((code) => /xxxx/i.test(code)));
    assert(!codes.some((code) => /^MEcon/i.test(code)));
    assert.match(supplement.evidenceGap, /Open or placeholder-coded University and free-elective requirements are excluded/);
  }
});

test('HKU AMPB and QFin supplements apply only to their Programme-local identities', () => {
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

test('generated HKU AMPB and QFin runtime profiles expose both official course lists', () => {
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
