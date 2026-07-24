const assert = require('node:assert/strict');
const test = require('node:test');

const supplement = require('../data/tpg-course-supplements/eduhk-source-status-2026.json');

test('EdUHK MA(IECE) remains blocked without current codes and per-course credits', () => {
  const programme = supplement.programmes.find(
    (item) => item.programmeId === 'EDUHK-TPG-DIR-MA-IECE'
  );

  assert(programme);
  assert.equal(programme.status, 'blocked');
  assert.equal(programme.verifiedAt, '2026-07-24');
  assert.equal(programme.creditsRequired, 24);
  assert.equal(programme.creditUnit, 'credit points');
  assert.equal(programme.courseGroups, undefined);
  assert.match(programme.sourceUrl, /programmes\.php\?id=9840/);
  assert.match(programme.statusNote, /six named Core Courses carry 18 credit points in total/);
  assert.match(programme.statusNote, /all eleven current titles but no course codes/);
  assert.match(programme.statusNote, /does not assign an individual credit value/);
  assert.match(programme.statusNote, /ECE6181 Thesis belongs to the separate Child and Family Education curriculum/);
  assert.match(programme.statusNote, /SED6030 Research Methods and Evidence-Based Practice/);
  assert.match(programme.statusNote, /Keep the structure closed/);
  assert.match(programme.statusNote, /do not map generic or similarly titled courses/);
});
