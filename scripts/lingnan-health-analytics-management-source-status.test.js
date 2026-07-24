const assert = require('node:assert/strict');
const test = require('node:test');

const supplementFile = require('../data/tpg-course-supplements/lingnan-source-status-2026.json');
const { applySupplements, validateSupplement } = require('./import-tpg-course-supplements');

test('Lingnan Health Analytics and Management stays blocked on six unresolved current course codes', () => {
  const catalogue = {
    programmes: [{
      id: 'LINGNAN-TPG-DIR-21-001281-L6',
      universityCode: 'LINGNAN',
      name: 'Master of Science in Health Analytics and Management',
      tracks: [],
      dataLevel: 'programme',
      courseGroups: []
    }]
  };
  const programmeEntry = supplementFile.programmes.find(
    (programme) => programme.programmeId === 'LINGNAN-TPG-DIR-21-001281-L6'
  );
  const focusedSupplement = {
    ...supplementFile,
    programmes: [programmeEntry]
  };

  validateSupplement(focusedSupplement, catalogue, 'lingnan-source-status-2026.json');
  const imported = applySupplements(catalogue, [{
    file: 'lingnan-source-status-2026.json',
    value: focusedSupplement
  }]);
  const programme = imported.programmes[0];

  assert.equal(programme.courseVerificationStatus, 'blocked');
  assert.equal(programme.courseVerifiedAt, '2026-07-24');
  assert.equal(programme.creditsRequired, 30);
  assert.equal(programme.creditUnit, 'credits');
  assert.equal(programme.dataLevel, 'programme');
  assert.deepEqual(programme.courseGroups, []);
  assert.match(programme.courseStatusNote, /seven 3-credit Core Courses/);
  assert.match(programme.courseStatusNote, /one of five 3-credit Elective Courses/);
  assert.match(programme.courseStatusNote, /6-credit Health Analytics and Management Project/);
  assert.match(programme.courseStatusNote, /HAM501-HAM504, HAM509, HAM510 and the HAM506 Capstone Project/);
  assert.match(programme.courseStatusNote, /six titles and their approval status/);
  assert.match(programme.courseStatusNote, /subject to Senate approval/);
  assert.match(programme.courseStatusNote, /do not publish the seven known courses as a complete pool/);
});
