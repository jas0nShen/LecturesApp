const assert = require('node:assert/strict');
const test = require('node:test');

const supplementFile = require('../data/tpg-course-supplements/hkbu-source-status-2025.json');
const { applySupplements, validateSupplement } = require('./import-tpg-course-supplements');

test('HKBU MSocSc Counselling closes all three 30-unit Specialisation paths and both Practicum courses', () => {
  const programme = supplementFile.programmes.find((item) => item.programmeId === 'HKBU-TPG-011');
  const supplement = { ...supplementFile, programmes: [programme] };
  const catalogue = {
    programmes: [{
      id: 'HKBU-TPG-011',
      universityCode: 'HKBU',
      name: 'Master of Social Sciences in Counselling',
      tracks: [],
      dataLevel: 'programme',
      courseGroups: []
    }]
  };

  validateSupplement(supplement, catalogue, 'hkbu-source-status-2025.json');
  const [importedProgramme] = applySupplements(catalogue, [{
    file: 'hkbu-source-status-2025.json',
    value: supplement
  }]).programmes;
  const allCourses = importedProgramme.courseGroups.flatMap((group) => group.courses);
  const uniqueCourses = new Map(allCourses.map((course) => [course.code, course]));
  const specialisation = importedProgramme.courseGroups.find((group) => group.id === 'counselling-specialisation-courses');
  const practicum = importedProgramme.courseGroups.find((group) => group.id === 'counselling-practicum');

  assert.equal(programme.status, 'verified');
  assert.equal(programme.ruleReviewStatus, 'manual_review_required');
  assert.equal(importedProgramme.courseVerificationStatus, 'verified');
  assert.equal(importedProgramme.courseVerifiedAt, '2026-07-22');
  assert.equal(importedProgramme.creditsRequired, 30);
  assert.equal(importedProgramme.creditUnit, 'units');
  assert.equal(importedProgramme.dataLevel, 'structure');
  assert.equal(importedProgramme.trackSelectionOptional, false);
  assert.deepEqual(importedProgramme.tracks.map((track) => track.creditsRequired), [30, 30, 30]);
  assert.equal(allCourses.length, 19);
  assert.equal(uniqueCourses.size, 19);
  assert([...uniqueCourses.values()].every((course) => course.credits === 3));

  assert.equal(specialisation.creditsRequired, 12);
  assert.equal(specialisation.coursesRequired, 4);
  assert.equal(specialisation.courses.length, 13);
  assert.deepEqual(
    specialisation.courses.filter((course) => course.requiredForTrackIds?.includes('HKBU-TPG-011-YOUTH-COUNSELLING')).map((course) => course.code),
    ['SOWK7170', 'SOWK7430', 'SOWK7440']
  );
  assert.deepEqual(
    specialisation.courses.filter((course) => course.requiredForTrackIds?.includes('HKBU-TPG-011-MENTAL-HEALTH-COUNSELLING')).map((course) => course.code),
    ['SOWK7120', 'SOWK7510', 'SOWK7790']
  );
  assert.match(specialisation.ruleText, /Generic Counselling chooses four courses/);
  assert.match(specialisation.ruleText, /manual review/);

  assert.deepEqual(
    practicum.courses.map((course) => [course.code, course.name, course.credits]),
    [
      ['SOWK7801', 'Counselling Practicum I', 3],
      ['SOWK7802', 'Counselling Practicum II', 3]
    ]
  );
  assert(practicum.courses.every((course) => course.courseKind === 'practicum'));
  assert(practicum.courses.every((course) => course.linkedSequenceId === 'SOWK780-COUNSELLING-PRACTICUM'));

  const sharedCredits = 12 + 6;
  const trackCredits = Object.fromEntries(importedProgramme.tracks.map((track) => [
    track.id,
    sharedCredits + importedProgramme.courseGroups
      .filter((group) => group.appliesToTrackIds.includes(track.id))
      .reduce((sum, group) => sum + group.creditsRequired, 0)
  ]));
  assert.deepEqual(Object.values(trackCredits), [30, 30, 30]);
  assert.match(programme.statusNote, /SOWK7801 Counselling Practicum I/);
  assert.match(programme.statusNote, /SOWK7802 Counselling Practicum II/);
  assert.match(programme.statusNote, /manual checks/);
});
