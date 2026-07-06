const assert = require('node:assert/strict');
const { test } = require('node:test');
const { checkReleaseReadiness } = require('./check-release-readiness');

test('current mini-program passes automated release readiness checks', () => {
  const result = checkReleaseReadiness(new Date('2026-07-05T12:00:00+08:00'));
  assert.equal(result.ready, true);
  assert.deepEqual(result.errors, []);
  assert.equal(result.release.version, '0.1.0');
  assert.equal(result.release.target, 'six-school taught postgraduate MVP');
  assert(result.metrics.pageCount >= 10);
  assert.equal(result.metrics.offeringCount, 56);
  assert.equal(result.metrics.tpgSchoolCount, 6);
  assert.equal(result.metrics.tpgProgrammeCount, 348);
  assert.equal(result.metrics.tpgProgrammeWithCoursesCount, 6);
  assert.equal(result.metrics.tpgCourseCount, 257);
  assert(result.metrics.packageBytes > 0);
  assert.match(result.manualChecklist.reviewMaterial, /REVIEW_SUBMISSION/);
});

test('stale official course data blocks release readiness', () => {
  const result = checkReleaseReadiness(new Date('2026-11-01T12:00:00+08:00'));
  assert.equal(result.ready, false);
  assert(result.errors.some((error) => error.includes('days old')));
});
