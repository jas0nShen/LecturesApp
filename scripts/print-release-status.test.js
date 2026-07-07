const assert = require('node:assert/strict');
const test = require('node:test');
const { buildReleaseStatusLines, formatBytes } = require('./print-release-status');

test('release status formats package bytes for quick human scanning', () => {
  assert.equal(formatBytes(999), '999 B');
  assert.equal(formatBytes(1536), '1.5 KB');
  assert.equal(formatBytes(1173489), '1.12 MB');
});

test('release status summarizes TPG and UG metrics', () => {
  const lines = buildReleaseStatusLines({
    ready: true,
    release: {
      version: '0.1.0',
      target: '授课硕士课程规划与本科目录预览版',
      dataMode: '体验版 / 正式版离线数据'
    },
    errors: [],
    warnings: ['Manual check required'],
    metrics: {
      tpgSchoolCount: 6,
      tpgProgrammeCount: 348,
      tpgProgrammeWithCoursesCount: 6,
      tpgCourseCount: 257,
      ugSchoolCount: 6,
      ugProgrammeCount: 396,
      ugMajorCount: 641,
      ugCodedCourseCount: 172,
      offeringCount: 56,
      offeringAgeDays: 2,
      uploadFileCount: 83,
      packageBytes: 1173489,
      sensitiveApiCount: 0
    },
    manualChecklist: {
      reviewMaterial: 'Use docs/REVIEW_SUBMISSION.md'
    }
  });
  const output = lines.join('\n');

  assert.match(output, /READY/);
  assert.match(output, /TPG：6 所学校 · 348 Programme/);
  assert.match(output, /UG：6 所学校 · 396 Programme · 641 Major\/Track/);
  assert.match(output, /上传包：83 个文件 · 1\.12 MB/);
});
