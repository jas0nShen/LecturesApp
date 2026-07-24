const assert = require('node:assert/strict');
const test = require('node:test');

const supplement = require('../data/tpg-course-supplements/eduhk-source-status-2026.json');

test('EdUHK MA(SRE) remains blocked until the final current elective code is official', () => {
  const programme = supplement.programmes.find(
    (item) => item.programmeId === 'EDUHK-TPG-DIR-MA-SRE'
  );

  assert(programme);
  assert.equal(programme.status, 'blocked');
  assert.equal(programme.verifiedAt, '2026-07-24');
  assert.equal(programme.creditsRequired, 24);
  assert.equal(programme.creditUnit, 'credit points');
  assert.equal(programme.courseGroups, undefined);
  assert.match(programme.sourceUrl, /master-of-arts-in-science-and-robotics-education/);
  assert.match(programme.statusNote, /nine of the ten current titles/);
  assert.match(programme.statusNote, /SCG6041/);
  assert.match(programme.statusNote, /SCG6049 Capstone Project/);
  assert.match(
    programme.statusNote,
    /No public current official source identifies the code for Digital Leadership/
  );
  assert.match(programme.statusNote, /do not publish a partial elective pool/);
  assert.match(programme.statusNote, /do not.*infer the missing code/);
});
