const assert = require('node:assert/strict');
const test = require('node:test');
const supplementFile = require('../data/ug-course-supplements/hku-6901-bachelor-of-science-2026.json');
const ugService = require('../miniprogram/utils/ugService');
const { validateSupplement } = require('./validate-ug-supplements');

const PROGRAMME_COUNTS = {
  'HKU-UG-6901-99': 29,
  'HKU-UG-6901-100': 36,
  'HKU-UG-6901-101': 32,
  'HKU-UG-6901-102': 26,
  'HKU-UG-6901-103': 31,
  'HKU-UG-6901-104': 41,
  'HKU-UG-6901-105': 36,
  'HKU-UG-6901-106': 27,
  'HKU-UG-6901-107': 53,
  'HKU-UG-6901-108': 28,
  'HKU-UG-6901-109': 48
};

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

test('HKU 6901 binds all eleven 2026 BSc Majors to Programme-local course lists', () => {
  assert.deepEqual(
    supplementFile.supplements.map((supplement) => supplement.programmeId),
    Object.keys(PROGRAMME_COUNTS)
  );
  assert.match(supplementFile.academicYear, /2026-27/);
  assert.match(supplementFile.note, /96-credit structure/);
  assert.match(supplementFile.note, /not presented as automatic graduation decisions/);

  supplementFile.supplements.forEach((supplement, index) => {
    validateSupplement(expandSupplement(supplement), index);
    assert.equal(supplement.majorId, `${supplement.programmeId}-M1`);
    assert.equal(supplement.courses.length, PROGRAMME_COUNTS[supplement.programmeId]);
    assert.equal(new Set(supplement.courses.map((course) => course.code)).size, supplement.courses.length);
    assert.match(supplement.evidenceNote, /96-credit Major structure/);
    assert.match(supplement.sourceUrl, /AdmissionYear=2026$/);
    assert(supplement.courses.every((course) => (
      course.title
      && [6, 12].includes(course.credits)
      && course.sourceUrl === supplement.sourceUrl
    )));
  });
});

test('HKU 6901 preserves foundation, alternative-course and open-pool evidence', () => {
  supplementFile.supplements.forEach((supplement) => {
    const scnc1111 = supplement.courses.find((course) => course.code === 'SCNC1111');
    const scnc1112 = supplement.courses.find((course) => course.code === 'SCNC1112');
    assert.equal(scnc1111.courseType, 'foundation');
    assert.equal(scnc1112.courseType, 'foundation');
    assert.match(scnc1111.group, /Science Foundation Courses \(12 credits\)/);
  });

  const biologicalChoice = getCourse('HKU-UG-6901-100', 'BIOC2600');
  const chemistryList = getCourse('HKU-UG-6901-101', 'CHEM4145');
  assert.match(biologicalChoice.group, /either BIOL2220 or BIOC2600/);
  assert.match(biologicalChoice.group, /mutually exclusive/);
  assert.match(chemistryList.group, /any level 4 Chemistry/);
  assert.match(chemistryList.group, /current list include courses in List A/);
});

test('HKU 6901 keeps Mathematics and Physics list constraints distinct from capstones', () => {
  const mathListB = getCourse('HKU-UG-6901-107', 'MATH3600');
  const mathInternship = getCourse('HKU-UG-6901-107', 'MATH4966');
  const mathProject = getCourse('HKU-UG-6901-107', 'MATH4999');
  const physicsListB = getCourse('HKU-UG-6901-109', 'PHYS3851');
  const physicsProject = getCourse('HKU-UG-6901-109', 'PHYS3999');

  assert.equal(mathListB.courseType, 'major_elective');
  assert.match(mathListB.group, /at least 12 credits are selected from List A/);
  assert.match(mathListB.group, /List B/);
  assert.equal(mathInternship.courseType, 'capstone');
  assert.equal(mathProject.courseType, 'capstone');
  assert.equal(mathProject.credits, 12);
  assert.equal(physicsListB.courseType, 'major_elective');
  assert.match(physicsListB.group, /Plus at least 18 credits/);
  assert.match(physicsListB.group, /List B/);
  assert.equal(physicsProject.courseType, 'capstone');
});

test('generated HKU 6901 runtime profiles expose every Programme-local list without leakage', () => {
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
    assert(profile.courses.some((course) => course.courseCode === 'SCNC1111' && course.credits === 6));
    assert(profile.courses.some((course) => course.courseCode === 'SCNC1112' && course.credits === 6));
  });
});
