const assert = require('node:assert/strict');
const test = require('node:test');
const sourceReviews = require('../data/ug-source-reviews.json');
const supplementFile = require('../data/ug-course-supplements/hku-6810-government-laws-llb-curriculum-2024.json');
const ugService = require('../miniprogram/utils/ugService');
const { validateSupplement } = require('./validate-ug-supplements');

const PROGRAMME_ID = 'HKU-UG-6810-81';
const MAJOR_ID = 'HKU-UG-6810-81-M1';
const CURRENT_LLB_SOURCE = 'https://dm.law.hku.hk/wp-content/uploads/LLB_regulations_syllabus_2025-26.pdf';

test('HKU 6810 publishes 54 unique Programme-local codes from the explicit evidence intersection', () => {
  const supplement = supplementFile.supplements[0];
  const expanded = {
    provider: supplementFile.provider,
    academicYear: supplementFile.academicYear,
    sourceUrl: supplementFile.sourceUrl,
    officialUrl: supplementFile.officialUrl,
    ...supplement
  };
  const codes = supplement.courses.map((course) => course.code);

  validateSupplement(expanded, 0);
  assert.equal(supplementFile.supplements.length, 1);
  assert.equal(supplement.courses.length, 54);
  assert.equal(new Set(codes).size, 54);
  assert(!codes.includes('LLAW3058'));
  assert(!codes.includes('POLI4046'));
  assert(!codes.some((code) => /xxxx/i.test(code)));
});

test('HKU 6810 keeps fixed Law, current Capstone and designated-elective groups distinct', () => {
  const courses = supplementFile.supplements[0].courses;
  const fixedLawCore = courses.filter((course) => (
    course.group.startsWith('Law Professional Core - required')
  ));
  const lawCapstones = courses.filter((course) => (
    course.courseType === 'capstone' && course.code.startsWith('LLAW')
  ));
  const designatedLawElectives = courses.filter((course) => (
    course.group.includes('designated disciplinary elective subset')
  ));
  const llaw3230 = courses.find((course) => course.code === 'LLAW3230');

  assert.equal(fixedLawCore.length, 18);
  assert.equal(lawCapstones.length, 9);
  assert.equal(designatedLawElectives.length, 7);
  assert(lawCapstones.every((course) => course.sourceUrl === CURRENT_LLB_SOURCE));
  assert.equal(llaw3230.title, 'Public interest clinic');
  assert.match(llaw3230.group, /older title Business of justice clinic/);
});

test('HKU 6810 source review records the incomplete PPA and Law elective universes', () => {
  const review = sourceReviews.find((item) => (
    item.universityCode === 'HKU' && item.programmeCode === '6810'
  ));

  assert(review);
  assert.equal(review.status, 'public_course_codes_partial');
  assert.match(review.note, /eight PPA electives/);
  assert.match(review.note, /42 credits of Law electives/);
  assert.match(review.note, /do not present them as a complete graduation structure/);
});

test('generated HKU 6810 runtime profile remains a read-only partial planning list', () => {
  const profile = ugService.getMajorProfile(PROGRAMME_ID, MAJOR_ID);

  assert(profile);
  assert.equal(profile.sourceStatus, 'course_codes_available');
  assert.equal(profile.codedCourseCount, 54);
  assert.equal(profile.courses.length, 54);
  assert.equal(new Set(profile.courses.map((course) => course.courseCode)).size, 54);
  assert(profile.courses.every((course) => (
    course.programmeId === PROGRAMME_ID && course.majorId === MAJOR_ID
  )));
  assert(!profile.courses.some((course) => course.courseCode === 'LLAW3058'));
});
