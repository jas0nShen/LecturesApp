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
  assert.equal(result.release.target, '授课硕士课程规划与本科目录预览版');
  assert.equal(result.release.dataMode, '体验版 / 正式版离线数据');
  assert(result.metrics.pageCount >= 10);
  assert.equal(result.metrics.offeringCount, 56);
  assert.equal(result.metrics.tpgSchoolCount, 6);
  assert.equal(result.metrics.tpgProgrammeCount, 348);
  assert.equal(result.metrics.tpgProgrammeWithCoursesCount, 6);
  assert.equal(result.metrics.tpgCourseCount, 257);
  assert.equal(result.metrics.ugSchoolCount, 6);
  assert.equal(result.metrics.ugProgrammeCount, 396);
  assert.equal(result.metrics.ugMajorCount, 641);
  assert.equal(result.metrics.ugCodedCourseCount, 172);
  assert.equal(result.metrics.ugProgrammeWithCoursesCount, 1);
  assert(result.metrics.packageBytes > 0);
  assert.match(result.manualChecklist.reviewMaterial, /REVIEW_SUBMISSION/);
});

test('WeChat project metadata matches the launch positioning', () => {
  const projectConfig = JSON.parse(fs.readFileSync(
    path.join(ROOT, 'miniprogram', 'project.config.json'),
    'utf8'
  ));
  assert.equal(projectConfig.description, '香港高校授课硕士课程规划助手 MVP');
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

test('MVP spec documents the TPG launch scope without user-facing school lock-in', () => {
  const mvpSpec = fs.readFileSync(path.join(ROOT, 'docs', 'MVP_SPEC.md'), 'utf8');
  assert(mvpSpec.includes('授课硕士课程规划助手'));
  assert(mvpSpec.includes('348 个 TPG Programme'));
  assert(mvpSpec.includes('本科 Programme / Major 目录'));
  assert(mvpSpec.includes('UG 目录至少包含 6 所学校'));
  assert(!mvpSpec.includes('多学校完整数据覆盖'));
  assert(!mvpSpec.includes('本地 API mock 固定接口'));
});

test('release-facing docs avoid stale launch terminology', () => {
  [
    'README.md',
    'docs/RELEASE_CHECKLIST.md',
    'docs/REVIEW_SUBMISSION.md',
    'docs/HKU_2025_26_SOURCES.md'
  ].forEach((relativePath) => {
    const content = fs.readFileSync(path.join(ROOT, relativePath), 'utf8');
    assert(!content.includes('Degree Audit'), `${relativePath} still mentions Degree Audit`);
    assert(!content.includes('本地 API mock'), `${relativePath} still mentions 本地 API mock`);
  });
});

test('release checklist includes an iOS and Android acceptance matrix', () => {
  const checklist = fs.readFileSync(path.join(ROOT, 'docs', 'RELEASE_CHECKLIST.md'), 'utf8');
  assert(checklist.includes('## 真机验收记录模板'));
  assert(checklist.includes('| 检查项 | iOS | Android | 预期结果 |'));
  ['授课硕士选择', '本科目录预览', '本科保存后状态', 'Programme 详情', '数据状态', '数据与隐私', '备份恢复', '清除本机数据'].forEach((item) => {
    assert(checklist.includes(item), `Missing acceptance item: ${item}`);
  });
});

test('local-first user data copy is explicit in user-facing pages', () => {
  const profilePage = fs.readFileSync(path.join(ROOT, 'miniprogram', 'pages', 'profile', 'profile.wxml'), 'utf8');
  const privacyPage = fs.readFileSync(path.join(ROOT, 'miniprogram', 'pages', 'privacy-data', 'privacy-data.wxml'), 'utf8');

  assert(profilePage.includes('资料保存在本机'));
  assert(profilePage.includes('数据不会上传服务器'));
  assert(profilePage.includes('不会自动同步到其他设备'));
  assert(privacyPage.includes('不会自动同步到云端或其他设备'));
});

test('TPG audit page avoids misleading zero-course copy', () => {
  const auditPage = fs.readFileSync(path.join(ROOT, 'miniprogram', 'pages', 'audit', 'audit.wxml'), 'utf8');
  const auditLogic = fs.readFileSync(path.join(ROOT, 'miniprogram', 'pages', 'audit', 'audit.js'), 'utf8');

  assert(auditPage.includes('tpgAudit.detailEntryCopy'));
  assert(auditLogic.includes('点击查看 Programme 来源、学分与收录状态'));
  assert(!auditPage.includes('{{tpgAudit.courseCount}} 门课程已开放'));
});

test('TPG course page avoids misleading zero-course hero copy', () => {
  const coursesPage = fs.readFileSync(path.join(ROOT, 'miniprogram', 'pages', 'courses', 'courses.wxml'), 'utf8');
  const coursesLogic = fs.readFileSync(path.join(ROOT, 'miniprogram', 'pages', 'courses', 'courses.js'), 'utf8');

  assert(coursesPage.includes('tpgCourseCountDisplay'));
  assert(coursesPage.includes('tpgCourseCountLabel'));
  assert(coursesLogic.includes("status.hasCourseGroups ? allCourses.length : '待开放'"));
  assert(!coursesPage.includes('<view class="tpg-number">{{tpgCourseCount}}</view>'));
});

test('TPG catalogue copy describes availability instead of completeness', () => {
  const cataloguePage = fs.readFileSync(path.join(ROOT, 'miniprogram', 'pages', 'tpg-catalog', 'tpg-catalog.wxml'), 'utf8');

  assert(cataloguePage.includes('课程组开放状态'));
  assert(!cataloguePage.includes('资料完整度'));
});
