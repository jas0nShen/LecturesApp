const assert = require('node:assert/strict');
const test = require('node:test');
const supplementFile = require('../data/ug-course-supplements/hku-6688-science-master-class-2026.json');
const ugService = require('../miniprogram/utils/ugService');
const { validateSupplement } = require('./validate-ug-supplements');

const PROGRAMME_COUNTS = {
  'HKU-UG-6688-47': 93,
  'HKU-UG-6688-48': 91,
  'HKU-UG-6688-49': 91,
  'HKU-UG-6688-50': 90,
  'HKU-UG-6688-51': 101,
  'HKU-UG-6688-52': 86,
  'HKU-UG-6688-53': 106
};

const MRES_CODES = [
  'INRE6033',
  'BIOL6007', 'BIOL6014', 'BIOL6015', 'BIOL8017', 'BIOL8018', 'BIOL8021', 'BIOL8022', 'BIOL8023',
  'CHEM6101', 'CHEM6102', 'CHEM6103', 'CHEM6108', 'CHEM6109', 'CHEM6111', 'CHEM6112', 'CHEM6113',
  'CHEM6114', 'CHEM6115', 'CHEM6116', 'CHEM6117', 'CHEM6118',
  'EASC6009', 'EASC6010', 'EASC6011', 'EASC6012',
  'MATH6014', 'MATH6015', 'MATH6101', 'MATH6207', 'MATH6216', 'MATH6219', 'MATH6224', 'MATH6501',
  'MATH6502', 'MATH6503', 'MATH6505', 'MATH7301', 'MATH7302', 'MATH7304',
  'PHYS8351', 'PHYS8352', 'PHYS8450', 'PHYS8550', 'PHYS8552', 'PHYS8653', 'PHYS8654', 'PHYS8656',
  'PHYS8701', 'PHYS8750', 'PHYS8751', 'PHYS8852',
  'INRE7999'
];

function expandSupplement(supplement) {
  return {
    provider: supplementFile.provider,
    academicYear: supplementFile.academicYear,
    officialUrl: supplementFile.officialUrl,
    ...supplement
  };
}

function getCourse(programmeId, courseCode) {
  const supplement = supplementFile.supplements.find((item) => item.programmeId === programmeId);
  return supplement.courses.find((course) => course.code === courseCode);
}

test('HKU 6688 binds all seven 2026 Intensive Majors to Programme-local course lists', () => {
  assert.deepEqual(
    supplementFile.supplements.map((supplement) => supplement.programmeId),
    Object.keys(PROGRAMME_COUNTS)
  );
  assert.match(supplementFile.academicYear, /2026-27/);
  assert.match(supplementFile.note, /240 BSc credits plus 63 MRes credits \(303 total\)/);
  assert.match(supplementFile.note, /manual confirmation/);

  supplementFile.supplements.forEach((supplement, index) => {
    validateSupplement(expandSupplement(supplement), index);
    assert.equal(supplement.majorId, `${supplement.programmeId}-M1`);
    assert.equal(supplement.courses.length, PROGRAMME_COUNTS[supplement.programmeId]);
    assert.equal(new Set(supplement.courses.map((course) => course.code)).size, supplement.courses.length);
    assert.match(supplement.sourceUrl, /AdmissionYear=2026$/);
    assert(supplement.courses.every((course) => course.sourceUrl));
  });
});

test('HKU 6688 preserves the complete shared 63-credit MRes component', () => {
  assert.equal(MRES_CODES.length, 53);
  assert.equal(new Set(MRES_CODES).size, 53);

  supplementFile.supplements.forEach((supplement) => {
    const byCode = new Map(supplement.courses.map((course) => [course.code, course]));
    assert(MRES_CODES.every((code) => byCode.has(code)));
    assert.deepEqual(
      MRES_CODES.slice(1, -1).map((code) => byCode.get(code).credits),
      Array(51).fill(6)
    );
    assert.deepEqual(
      [byCode.get('INRE6033').credits, byCode.get('INRE7999').credits],
      [3, 42]
    );
    assert.match(byCode.get('INRE6033').group, /MRes - compulsory Research Ethics core/);
    assert.match(byCode.get('INRE7999').group, /MRes - compulsory Research Project/);
    assert(MRES_CODES.slice(1, -1).every((code) => (
      byCode.get(code).courseType === 'major_elective'
      && /complete 18 credits/.test(byCode.get(code).group)
    )));
  });
});

test('HKU 6688 keeps Intensive Major choice, list and course-note boundaries visible', () => {
  const biologyChoice = getCourse('HKU-UG-6688-47', 'BIOC2600');
  const biologyList = getCourse('HKU-UG-6688-47', 'BIOL3101');
  const chemistryLab = supplementFile.supplements
    .find((item) => item.programmeId === 'HKU-UG-6688-48')
    .courses.find((course) => /\(lab\)/.test(course.group));
  const mathematicsShared = supplementFile.supplements
    .find((item) => item.programmeId === 'HKU-UG-6688-51')
    .courses.find((course) => /Pure Mathematics/.test(course.group) && /Applied Mathematics/.test(course.group));
  const physicsList = getCourse('HKU-UG-6688-53', 'PHYS3851');

  assert.equal(biologyChoice.courseType, 'core');
  assert.match(biologyChoice.group, /Take either BIOL2220 or BIOC2600/);
  assert.equal(biologyList.courseType, 'major_elective');
  assert.match(biologyList.group, /\(C\) Physiology/);
  assert.match(biologyList.group, /List I/);
  assert(chemistryLab);
  assert.match(chemistryLab.group, /one of the two elective courses selected must contain a laboratory component/);
  assert(mathematicsShared);
  assert.match(physicsList.group, /at least 6 credits are selected from List A/);
  assert.match(physicsList.group, /List B/);
});

test('generated HKU 6688 runtime profiles expose every Programme-local list without cross-Programme leakage', () => {
  supplementFile.supplements.forEach((supplement) => {
    const profile = ugService.getMajorProfile(supplement.programmeId, supplement.majorId);
    assert(profile);
    assert.equal(profile.sourceStatus, 'course_codes_available');
    assert.equal(profile.codedCourseCount, PROGRAMME_COUNTS[supplement.programmeId]);
    assert.equal(profile.courses.length, PROGRAMME_COUNTS[supplement.programmeId]);
    assert(profile.courses.every((course) => (
      course.programmeId === supplement.programmeId
      && course.majorId === supplement.majorId
    )));
    assert(profile.courses.some((course) => course.courseCode === 'INRE6033' && course.credits === 3));
    assert(profile.courses.some((course) => course.courseCode === 'INRE7999' && course.credits === 42));
  });
});
