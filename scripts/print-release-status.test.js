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
      version: '1.0.2',
      target: '香港高校课程规划助手正式版',
      dataMode: '体验版 / 正式版离线数据'
    },
    errors: [],
    warnings: ['Manual check required'],
    metrics: {
      tpgSchoolCount: 8,
      tpgProgrammeCount: 448,
      tpgProgrammeWithCoursesCount: 7,
      tpgCourseCount: 293,
      ugSchoolCount: 8,
      ugProgrammeCount: 444,
      ugMajorCount: 689,
      ugCodedCourseCount: 3217,
      offeringCount: 56,
      offeringAgeDays: 2,
      uploadFileCount: 83,
      packageBytes: 1173489,
      mainPackageBytes: 1048576,
      subpackageBytes: [{ name: 'ug-data-hku', bytes: 512000 }],
      sensitiveApiCount: 0
    },
    manualChecklist: {
      reviewMaterial: 'Use docs/REVIEW_SUBMISSION.md'
    }
  });
  const output = lines.join('\n');

  assert.match(output, /READY/);
  assert.match(output, /TPG：8 所学校 · 448 Programme/);
  assert.match(output, /UG：8 所学校 · 444 Programme · 689 Major\/Track/);
  assert.match(output, /上传包：83 个文件 · 总计 1\.12 MB · 主包 1\.00 MB · 最大分包 500\.0 KB/);
});
