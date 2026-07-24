const assert = require('node:assert/strict');
const test = require('node:test');

const supplementFile = require('../data/tpg-course-supplements/eduhk-source-status-2026.json');
const { applySupplements, validateSupplement } = require('./import-tpg-course-supplements');

test('EdUHK Sports Coaching and Management stays blocked on the one unpublished current elective code', () => {
  const catalogue = {
    programmes: [{
      id: 'EDUHK-TPG-DIR-MSOCSC-SCM',
      universityCode: 'EDUHK',
      name: 'Master of Social Sciences in Sports Coaching and Management',
      tracks: [],
      dataLevel: 'programme',
      courseGroups: []
    }]
  };
  const programmeEntry = supplementFile.programmes.find(
    (programme) => programme.programmeId === 'EDUHK-TPG-DIR-MSOCSC-SCM'
  );
  const focusedSupplement = {
    ...supplementFile,
    programmes: [programmeEntry]
  };

  validateSupplement(focusedSupplement, catalogue, 'eduhk-source-status-2026.json');
  const imported = applySupplements(catalogue, [{
    file: 'eduhk-source-status-2026.json',
    value: focusedSupplement
  }]);
  const programme = imported.programmes[0];

  assert.equal(programme.courseVerificationStatus, 'blocked');
  assert.equal(programme.courseVerifiedAt, '2026-07-24');
  assert.equal(programme.creditsRequired, 24);
  assert.equal(programme.creditUnit, 'credit points');
  assert.equal(programme.dataLevel, 'programme');
  assert.deepEqual(programme.courseGroups, []);
  assert.match(programme.courseStatusNote, /three 3-credit Core Courses/);
  assert.match(programme.courseStatusNote, /five of eight 3-credit Elective Courses/);
  assert.match(programme.courseStatusNote, /three Elective Courses and the 6-credit Master's Thesis/);
  assert.match(programme.courseStatusNote, /PES6250-PES6259/);
  assert.match(programme.courseStatusNote, /PES6260 as Master's Thesis/);
  assert.match(programme.courseStatusNote, /Sports Coaching and Management for Selected Populations/);
  assert.match(programme.courseStatusNote, /Moodle exact-title and title-fragment searches return no matching course/);
  assert.match(programme.courseStatusNote, /superseded four-Core structure and a 9-credit PES6260 thesis/);
  assert.match(programme.courseStatusNote, /do not publish a partial elective pool/);
});
