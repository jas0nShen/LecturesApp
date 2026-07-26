const assert = require('node:assert/strict');
const test = require('node:test');
const supplementFile = require('../data/ug-course-supplements/hku-6779-statistical-decision-sciences-2025.json');
const ugService = require('../miniprogram/utils/ugService');
const { addGenericCourseSupplements } = require('./generate-ug-catalog');
const { validateSupplement } = require('./validate-ug-supplements');

const PROGRAMME_ID = 'HKU-UG-6779-76';
const EXPECTED = {
  'HKU-UG-6779-76-M1': {
    name: 'Professional Core in Statistics',
    count: 36,
    advancedCoreCount: 7,
    advancedElectiveCount: 14
  },
  'HKU-UG-6779-76-M2': {
    name: 'Professional Core in Decision Analytics',
    count: 37,
    advancedCoreCount: 6,
    advancedElectiveCount: 14
  },
  'HKU-UG-6779-76-M3': {
    name: 'Professional Core in Risk Management',
    count: 35,
    advancedCoreCount: 8,
    advancedElectiveCount: 12
  }
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

function getSourceCoursesForMajor(majorId) {
  return supplementFile.supplements[0].courses.filter((course) => (
    course.majorIds.includes(majorId)
  ));
}

function buildCatalogue() {
  return {
    programmes: [{
      id: PROGRAMME_ID,
      universityCode: 'HKU',
      code: '6779',
      nameEn: 'Statistical Decision Sciences',
      sourceStatus: 'programme_summary_only',
      courseCount: 1,
      codedCourseCount: 0
    }],
    majors: [{
      id: 'HKU-UG-6779-76-M1',
      programmeId: PROGRAMME_ID,
      code: 'STATISTICAL-DECISION-SCIENCES',
      nameEn: 'Statistical Decision Sciences',
      courseCount: 1,
      codedCourseCount: 0
    }],
    courses: []
  };
}

test('HKU 6779 declares three isolated BStat Professional Cores', () => {
  assert.equal(supplementFile.supplements.length, 3);

  for (const [index, supplement] of supplementFile.supplements.entries()) {
    validateSupplement(expandSupplement(supplement), index);
    assert(EXPECTED[supplement.majorId]);
    assert.equal(supplement.majorName, EXPECTED[supplement.majorId].name);
  }

  assert(supplementFile.supplements[0].majorOverride);
  assert(supplementFile.supplements[1].createMajor);
  assert(supplementFile.supplements[2].createMajor);
  assert.deepEqual(
    supplementFile.supplements.map((supplement) => supplement.majorId),
    Object.keys(EXPECTED)
  );
});

test('HKU 6779 preserves each Professional Core course boundary and official credit rules', () => {
  for (const [majorId, expected] of Object.entries(EXPECTED)) {
    const courses = getSourceCoursesForMajor(majorId);
    const codes = courses.map((course) => course.code);
    const advancedCore = courses.filter((course) => (
      course.group.startsWith('Disciplinary Core · Advanced')
    ));
    const advancedElectives = courses.filter((course) => (
      course.group.startsWith('Disciplinary Elective · Advanced')
    ));

    assert.equal(courses.length, expected.count);
    assert.equal(new Set(codes).size, expected.count);
    assert.equal(advancedCore.length, expected.advancedCoreCount);
    assert.equal(advancedElectives.length, expected.advancedElectiveCount);
    assert(courses.every((course) => course.credits === 6 || (
      course.code === 'CAES1001' && course.credits === 0
    ) || (
      course.code === 'SDST4799' && course.credits === 12
    )));
  }
});

test('HKU 6779 preserves the paired introductory mathematics paths and bounded advanced lists', () => {
  const allCourses = supplementFile.supplements[0].courses;
  const byCode = Object.fromEntries(allCourses.map((course) => [
    `${course.code}:${course.majorIds.join(',')}`,
    course
  ]));

  for (const majorId of Object.keys(EXPECTED)) {
    const courses = getSourceCoursesForMajor(majorId);
    const listA = courses.filter((course) => course.group.includes('List A for general study'));
    const listB = courses.filter((course) => course.group.includes('List B for advanced study'));

    assert.deepEqual(listA.map((course) => course.code), ['MATH2012', 'MATH2014']);
    assert.deepEqual(listB.map((course) => course.code), ['MATH2101', 'MATH2211']);
  }

  const statisticsCourses = getSourceCoursesForMajor('HKU-UG-6779-76-M1');
  assert.equal(statisticsCourses.filter((course) => course.group.includes('Statistics List C1')).length, 3);
  assert.equal(statisticsCourses.filter((course) => course.group.includes('Statistics List C2')).length, 11);
  assert.equal(getSourceCoursesForMajor('HKU-UG-6779-76-M2')
    .filter((course) => course.group.includes('Decision Analytics List D')).length, 14);
  assert.equal(getSourceCoursesForMajor('HKU-UG-6779-76-M3')
    .filter((course) => course.group.includes('Risk Management List E')).length, 12);
  assert(byCode['SDST4799:HKU-UG-6779-76-M1,HKU-UG-6779-76-M2,HKU-UG-6779-76-M3']
    .group.includes('reduces the open elective requirement from 66 to 60 credits'));
});

test('HKU 6779 excludes unnamed and open curriculum pools', () => {
  const explicit = supplementFile.supplements[0];
  const codes = explicit.courses.map((course) => course.code);

  assert(!codes.some((code) => /xxxx|placeholder/i.test(code)));
  assert.equal(codes.filter((code) => /^CAES/.test(code)).length, 2);
  assert.match(explicit.evidenceGap, /Chinese language enhancement/);
  assert.match(explicit.evidenceGap, /Common Core/);
  assert.match(explicit.evidenceGap, /Digital Literacy/);
  assert.match(explicit.evidenceGap, /66-credit open elective/);
});

test('HKU 6779 supplement replaces the aggregate Major and applies all three local identities', () => {
  const catalogue = buildCatalogue();
  const supplements = supplementFile.supplements.map(expandSupplement);
  addGenericCourseSupplements(catalogue, supplements);

  const programme = catalogue.programmes[0];
  const majors = catalogue.majors.filter((major) => major.programmeId === PROGRAMME_ID);

  assert.equal(programme.sourceStatus, 'course_codes_available');
  assert.equal(programme.codedCourseCount, 108);
  assert.equal(majors.length, 3);

  for (const major of majors) {
    const expected = EXPECTED[major.id];
    const courses = catalogue.courses.filter((course) => course.majorId === major.id);

    assert(expected);
    assert.equal(major.nameEn, expected.name);
    assert.equal(major.codedCourseCount, expected.count);
    assert.equal(courses.length, expected.count);
    assert.equal(new Set(courses.map((course) => course.courseCode)).size, expected.count);
    assert(courses.every((course) => (
      course.programmeId === PROGRAMME_ID
      && course.majorId === major.id
      && course.sourceUrl === supplementFile.sourceUrl
    )));
  }
});

test('generated HKU 6779 runtime profiles expose the three official course lists', () => {
  for (const [majorId, expected] of Object.entries(EXPECTED)) {
    const profile = ugService.getMajorProfile(PROGRAMME_ID, majorId);

    assert(profile);
    assert.equal(profile.sourceStatus, 'course_codes_available');
    assert.equal(profile.major.nameEn, expected.name);
    assert.equal(profile.codedCourseCount, expected.count);
    assert.equal(profile.courses.length, expected.count);
    assert.equal(new Set(profile.courses.map((course) => course.courseCode)).size, expected.count);
    assert(profile.courses.every((course) => (
      course.programmeId === PROGRAMME_ID
      && course.majorId === majorId
      && course.sourceUrl === supplementFile.sourceUrl
    )));
  }
});
