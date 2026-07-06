const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');
const { checkReleaseReadiness } = require('./check-release-readiness');

const ROOT = path.join(__dirname, '..');

function extractCodeBlockAfterHeading(markdown, heading) {
  const headingIndex = markdown.indexOf(heading);
  assert.notEqual(headingIndex, -1, `Missing heading: ${heading}`);
  const afterHeading = markdown.slice(headingIndex);
  const match = afterHeading.match(/```text\n([\s\S]*?)\n```/);
  assert(match, `Missing text block after heading: ${heading}`);
  return match[1].trim();
}

test('current mini-program passes automated release readiness checks', () => {
  const result = checkReleaseReadiness(new Date('2026-07-05T12:00:00+08:00'));
  assert.equal(result.ready, true);
  assert.deepEqual(result.errors, []);
  assert.equal(result.release.version, '0.1.0');
  assert.equal(result.release.target, '六校授课硕士首发版');
  assert.equal(result.release.dataMode, '体验版 / 正式版离线数据');
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

test('WeChat review version description stays within the 200 character limit', () => {
  const reviewDoc = fs.readFileSync(path.join(ROOT, 'docs', 'REVIEW_SUBMISSION.md'), 'utf8');
  const versionDescription = extractCodeBlockAfterHeading(
    reviewDoc,
    '### 提交审核版本描述（200 字以内）'
  );
  assert(versionDescription.includes('0.1.0'));
  assert(versionDescription.length <= 200);
});
