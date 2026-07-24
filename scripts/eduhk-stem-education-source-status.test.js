const assert = require('node:assert/strict');
const test = require('node:test');

const supplement = require('../data/tpg-course-supplements/eduhk-source-status-2026.json');

test('EdUHK MA(STEM Ed) remains blocked until all ten current course codes are official', () => {
  const programme = supplement.programmes.find(
    (item) => item.programmeId === 'EDUHK-TPG-DIR-MA-STEM-ED'
  );

  assert(programme);
  assert.equal(programme.status, 'blocked');
  assert.equal(programme.verifiedAt, '2026-07-24');
  assert.equal(programme.creditsRequired, 24);
  assert.equal(programme.creditUnit, 'credit points');
  assert.equal(programme.courseGroups, undefined);
  assert.match(programme.sourceUrl, /ses\.eduhk\.hk\/en\/programmes\/stem_ed/);
  assert.match(programme.statusNote, /seven of the ten current titles/);
  assert.match(programme.statusNote, /Scientific Inquiry and Engineering Design/);
  assert.match(programme.statusNote, /Developing Creativity and Innovation in STEM/);
  assert.match(programme.statusNote, /or Internship/);
  assert.match(programme.statusNote, /do not publish a partial course pool/);
  assert.match(programme.statusNote, /do not.*infer the three missing codes/);
});
