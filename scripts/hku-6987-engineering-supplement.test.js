const assert = require('node:assert/strict');
const test = require('node:test');
const sourceReviews = require('../data/ug-source-reviews.json');
const supplementFile = require('../data/ug-course-supplements/hku-6987-engineering-2025.json');
const ugService = require('../miniprogram/utils/ugService');
const { addGenericCourseSupplements } = require('./generate-ug-catalog');
const { validateSupplement } = require('./validate-ug-supplements');

const PROGRAMME_ID = 'HKU-UG-6987-124';
const EXPECTED = {
  'HKU-UG-6987-124-M1': ['Computer Engineering', 108],
  'HKU-UG-6987-124-M2': ['Electrical Engineering', 105],
  'HKU-UG-6987-124-M3': ['Electronic Engineering', 103]
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

function buildCatalogue() {
  return {
    programmes: [{
      id: PROGRAMME_ID,
      universityCode: 'HKU',
      code: '6987',
      nameEn: 'Bachelor of Engineering in Computer Engineering / Electrical Engineering / Electronic Engineering',
      sourceStatus: 'programme_summary_only',
      courseCount: 1,
      codedCourseCount: 0
    }],
    majors: [{
      id: `${PROGRAMME_ID}-M1`,
      programmeId: PROGRAMME_ID,
      code: 'BACHELOR-OF-ENGINEERING-IN-COMPUTER-ENGINEERING-ELECTRICAL-ENGINEERING-ELECTRONIC-ENGINEERING',
      nameEn: 'Bachelor of Engineering in Computer Engineering / Electrical Engineering / Electronic Engineering',
      courseCount: 1,
      codedCourseCount: 0
    }],
    courses: []
  };
}

function getSourceMajor(majorId) {
  return supplementFile.supplements.find((supplement) => supplement.majorId === majorId);
}

test('HKU 6987 replaces the aggregate entry with three isolated official Majors', () => {
  assert.equal(supplementFile.supplements.length, 3);
  assert.match(supplementFile.academicYear, /2025-26 and thereafter/);
  assert.match(supplementFile.note, /covers the 2026 cohort/);

  supplementFile.supplements.forEach((supplement, index) => {
    validateSupplement(expandSupplement(supplement), index);
    assert(EXPECTED[supplement.majorId]);
    assert.match(supplement.evidenceNote, /complete 240-credit category structure/);
  });

  assert(supplementFile.supplements[0].majorOverride);
  assert.equal(supplementFile.supplements.filter((item) => item.createMajor).length, 2);
  assert.deepEqual(
    supplementFile.supplements.map((supplement) => (
      supplement.majorOverride?.nameEn || supplement.createMajor?.nameEn
    )),
    Object.values(EXPECTED).map(([name]) => name)
  );
});

test('HKU 6987 preserves each Major core boundary, internship and capstone', () => {
  const requiredByMajor = {
    [`${PROGRAMME_ID}-M1`]: ['COMP2119', 'COMP3230', 'ELEC3342', 'ELEC3442', 'ELEC3544'],
    [`${PROGRAMME_ID}-M2`]: ['ELEC3141', 'ELEC3142', 'ELEC3143', 'ELEC3241'],
    [`${PROGRAMME_ID}-M3`]: ['ELEC2543', 'ELEC3241', 'ELEC3243', 'ELEC3350', 'ELEC3543']
  };

  for (const [majorId, [, expectedCount]] of Object.entries(EXPECTED)) {
    const courses = getSourceMajor(majorId).courses;
    const codes = courses.map((course) => course.code);
    const byCode = Object.fromEntries(courses.map((course) => [course.code, course]));

    assert.equal(courses.length, expectedCount);
    assert.equal(new Set(codes).size, expectedCount);
    assert.equal(byCode.ELEC3841.credits, 0);
    assert.equal(byCode.ELEC3841.courseType, 'internship');
    assert.equal(byCode.ELEC4848.credits, 12);
    assert.equal(byCode.ELEC4848.courseType, 'capstone');
    for (const code of ['MATH1851', 'MATH1853', 'ENGG1101', 'ENGG1300', 'ENGG1310', 'ENGG1330', 'COMP2113']) {
      assert.equal(byCode[code].courseType, 'foundation');
      assert.match(byCode[code].group, /required Engineering Core/);
    }
    for (const code of requiredByMajor[majorId]) {
      assert.equal(byCode[code].courseType, 'core');
    }
  }

  assert.equal(getSourceMajor(`${PROGRAMME_ID}-M2`).courses.find((course) => (
    course.code === 'COMP3230'
  )).courseType, 'major_elective');
  assert.equal(getSourceMajor(`${PROGRAMME_ID}-M3`).courses.find((course) => (
    course.code === 'ELEC3141'
  )).courseType, 'major_elective');
});

test('HKU 6987 preserves Discipline Elective rules and optional Focus boundaries', () => {
  const computer = getSourceMajor(`${PROGRAMME_ID}-M1`);
  const electrical = getSourceMajor(`${PROGRAMME_ID}-M2`);
  const electronic = getSourceMajor(`${PROGRAMME_ID}-M3`);

  assert(computer.courses.some((course) => (
    course.group.includes('12 credits of advanced courses from Groups E and J')
    && course.group.includes('18 credits from Groups A, B, C, D, E, I and J')
  )));
  assert(electrical.courses.some((course) => (
    course.group.includes('ELEC4142/ELEC4147')
    && course.group.includes('ELEC4146/ELEC4149')
    && course.group.includes('ELEC4141/ELEC4144')
  )));
  assert(electronic.courses.some((course) => (
    course.group.includes('12 credits of advanced courses from Groups B, C, D and E')
  )));

  for (const code of ['COMP3270', 'COMP3314', 'COMP3358', 'FITE3010', 'COMP3356']) {
    const course = computer.courses.find((item) => item.code === code);
    assert.equal(course.credits, 6);
    assert.equal(course.courseType, 'major_elective');
    assert.match(course.group, /published optional Focus course outside Groups A-E\/I\/J/);
    assert.match(course.group, /Optional Focus membership/);
  }
  for (const code of ['MECH3430', 'MECH3431']) {
    const course = electrical.courses.find((item) => item.code === code);
    assert.equal(course.credits, 6);
    assert.equal(course.courseType, 'major_elective');
    assert.match(course.group, /Optional Focus membership: Intelligent Built Environment/);
  }

  assert.equal(computer.courses.find((course) => course.code === 'COMP3323').exclusions, 'FITE3010');
  assert.equal(computer.courses.find((course) => course.code === 'ELEC2543').exclusions, 'COMP2119');
  assert.equal(electrical.courses.find((course) => course.code === 'ELEC3443').exclusions, 'COMP3234');
  assert.equal(electronic.courses.find((course) => course.code === 'ELEC4641').exclusions, 'COMP3355');
});

test('HKU 6987 generic merge applies the three identities without cross-Major leakage', () => {
  const catalogue = buildCatalogue();
  addGenericCourseSupplements(
    catalogue,
    supplementFile.supplements.map(expandSupplement)
  );

  assert.equal(catalogue.programmes[0].sourceStatus, 'course_codes_available');
  assert.equal(catalogue.majors.length, 3);
  assert.equal(catalogue.courses.length, 316);

  for (const [majorId, [name, expectedCount]] of Object.entries(EXPECTED)) {
    const major = catalogue.majors.find((item) => item.id === majorId);
    const courses = catalogue.courses.filter((course) => course.majorId === majorId);

    assert.equal(major.nameEn, name);
    assert.equal(major.codedCourseCount, expectedCount);
    assert.equal(courses.length, expectedCount);
    assert(courses.every((course) => (
      course.programmeId === PROGRAMME_ID && course.majorId === majorId
    )));
  }
});

test('generated HKU 6987 runtime exposes all three Programme-local course lists', () => {
  for (const [majorId, [name, expectedCount]] of Object.entries(EXPECTED)) {
    const profile = ugService.getMajorProfile(PROGRAMME_ID, majorId);

    assert(profile);
    assert.equal(profile.sourceStatus, 'course_codes_available');
    assert.equal(profile.major.nameEn, name);
    assert.equal(profile.codedCourseCount, expectedCount);
    assert.equal(profile.courses.length, expectedCount);
    assert.equal(new Set(profile.courses.map((course) => course.courseCode)).size, expectedCount);
    assert(profile.courses.every((course) => (
      course.programmeId === PROGRAMME_ID && course.majorId === majorId
    )));
  }
});

test('HKU 6925 remains index-only because current public BME syllabus evidence stops at 2024', () => {
  const review = sourceReviews.find((item) => (
    item.universityCode === 'HKU' && item.programmeCode === '6925'
  ));

  assert(review);
  assert.equal(review.status, 'no_public_course_codes');
  assert.equal(review.reviewedAt, '2026-07-27');
  assert.match(review.note, /links BME Regulations and Syllabus only for 2024/);
  assert.match(review.note, /Do not reuse the 2024 BME syllabus for the 2026 cohort/);
});
