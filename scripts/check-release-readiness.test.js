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
  assert.equal(result.metrics.tpgSchoolCount, 8);
  assert.equal(result.metrics.tpgProgrammeCount, 348);
  assert.equal(result.metrics.tpgProgrammeWithCoursesCount, 7);
  assert.equal(result.metrics.tpgCourseCount, 293);
  assert.equal(result.metrics.ugSchoolCount, 8);
  assert.equal(result.metrics.ugProgrammeCount, 444);
  assert.equal(result.metrics.ugMajorCount, 689);
  assert.equal(result.metrics.ugCodedCourseCount, 6682);
  assert.equal(result.metrics.ugProgrammeWithCoursesCount, 87);
  assert(result.metrics.packageBytes > 0);
  assert.match(result.manualChecklist.reviewMaterial, /REVIEW_SUBMISSION/);
});

test('ship check validates undergraduate course supplements', () => {
  const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));

  assert.match(pkg.scripts.check, /validate-data\.js/);
  assert.match(pkg.scripts.check, /validate-ug-supplements\.js/);
  assert.match(pkg.scripts['check:ship'], /check:release/);
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
  assert(mvpSpec.includes('UG 目录至少包含 8 所学校'));
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

test('home page avoids internal launch status labels', () => {
  const homePage = fs.readFileSync(path.join(ROOT, 'miniprogram', 'pages', 'home', 'home.wxml'), 'utf8');
  const homeLogic = fs.readFileSync(path.join(ROOT, 'miniprogram', 'pages', 'home', 'home.js'), 'utf8');
  assert(homePage.includes('资料状态'));
  assert(homePage.includes('{{item.statusLabel}}'));
  assert(homeLogic.includes("statusLabel: '已选择'"));
  assert(homeLogic.includes("statusLabel: hasCourses ? '可查看' : '复核中'"));
  assert(homeLogic.includes("statusLabel: hasCourses ? '下一步' : '安全提示'"));
  assert(!homePage.includes('MVP STATUS'));
  assert(!homePage.includes('UG STATUS'));
  assert(!homePage.includes('{{item.status}}'));
});

test('release checklist includes an iOS and Android acceptance matrix', () => {
  const checklist = fs.readFileSync(path.join(ROOT, 'docs', 'RELEASE_CHECKLIST.md'), 'utf8');
  assert(checklist.includes('## 真机验收记录模板'));
  assert(checklist.includes('| 检查项 | iOS | Android | 预期结果 |'));
  assert(checklist.includes('--priority launch --missing-limit 10 --batch-plan'));
  assert(checklist.includes('--priority launch --collector-template'));
  assert(checklist.includes('--priority launch --supplement-template'));
  assert(checklist.includes('--readiness index-only --collector-template'));
  assert(checklist.includes('--readiness no-source --collector-template'));
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
  const homePage = fs.readFileSync(path.join(ROOT, 'miniprogram', 'pages', 'home', 'home.wxml'), 'utf8');
  const coursesPage = fs.readFileSync(path.join(ROOT, 'miniprogram', 'pages', 'courses', 'courses.wxml'), 'utf8');
  const coursesLogic = fs.readFileSync(path.join(ROOT, 'miniprogram', 'pages', 'courses', 'courses.js'), 'utf8');

  assert(homePage.includes('先选择你的课程范围。'));
  assert(homePage.includes('选择你的学校与 Programme'));
  assert(!homePage.includes('选择你的授课硕士 Programme'));
  assert(coursesPage.includes('tpgCourseCountDisplay'));
  assert(coursesPage.includes('tpgCourseCountLabel'));
  assert(coursesPage.includes("{{tpgCourseCount ? '课程已开放' : '复核中'}}"));
  assert(coursesPage.includes("{{ugCourseCount ? '课程已开放' : '复核中'}}"));
  assert(coursesPage.includes("{{tpgCourseCount ? '课程' : '索引'}}"));
  assert(coursesPage.includes("{{ugCourseCount ? '课程' : '索引'}}"));
  assert(coursesPage.includes('先选范围'));
  assert(coursesPage.includes('先选择你的课程范围'));
  assert(!coursesPage.includes('先选择你的授课硕士 Programme'));
  ['TPG FIRST', 'TPG READY', 'UG READY', 'IN REVIEW', 'PROGRAMME ADDED', 'NO MATCH', 'NO OFFERING'].forEach((label) => {
    assert(!coursesPage.includes(label), `Courses page still exposes internal label: ${label}`);
  });
  assert(coursesLogic.includes("status.hasCourseGroups ? allCourses.length : '待开放'"));
  assert(!coursesPage.includes('<view class="tpg-number">{{tpgCourseCount}}</view>'));
});

test('TPG programme detail uses user-facing status labels', () => {
  const programmePage = fs.readFileSync(path.join(ROOT, 'miniprogram', 'pages', 'tpg-programme', 'tpg-programme.wxml'), 'utf8');
  assert(programmePage.includes("{{hasCourseGroups ? '已开放' : '复核中'}}"));
  assert(programmePage.includes("{{isCurrentProgramme ? '本机已保存' : '尚未保存'}}"));
  assert(programmePage.includes('课程结构'));
  ['VERIFIED', 'IN REVIEW', 'SAVED LOCALLY', 'NOT SAVED YET', 'COURSE STRUCTURE'].forEach((label) => {
    assert(!programmePage.includes(label), `Programme detail still exposes internal label: ${label}`);
  });
});

test('home page hides graduation progress until a profile is saved', () => {
  const homePage = fs.readFileSync(path.join(ROOT, 'miniprogram', 'pages', 'home', 'home.wxml'), 'utf8');
  const homeLogic = fs.readFileSync(path.join(ROOT, 'miniprogram', 'pages', 'home', 'home.js'), 'utf8');

  assert(homePage.includes('wx:if="{{profile && !isTpg}}"'));
  assert(homePage.includes('wx:if="{{profile && !isTpg && !isUgCatalogue}}"'));
  assert(homeLogic.includes('const auditResult = !profile || isTpg || isUgCatalogue'));
});

test('saved programme profiles keep source links for review and feedback', () => {
  const onboardingLogic = fs.readFileSync(path.join(ROOT, 'miniprogram', 'pages', 'onboarding', 'onboarding.js'), 'utf8');
  const tpgProgrammeLogic = fs.readFileSync(path.join(ROOT, 'miniprogram', 'pages', 'tpg-programme', 'tpg-programme.js'), 'utf8');
  const coursesLogic = fs.readFileSync(path.join(ROOT, 'miniprogram', 'pages', 'courses', 'courses.js'), 'utf8');
  const auditLogic = fs.readFileSync(path.join(ROOT, 'miniprogram', 'pages', 'audit', 'audit.js'), 'utf8');

  assert(onboardingLogic.includes("sourceUrl: programme.sourceUrl || ''"));
  assert(onboardingLogic.includes('sourceUrl: this.data.ugMajorProfile && this.data.ugMajorProfile.sourceUrl'));
  assert(tpgProgrammeLogic.includes("sourceUrl: programme.sourceUrl || ''"));
  assert(coursesLogic.includes("wx.showToast({ title: '暂无官方链接', icon: 'none' })"));
  assert(auditLogic.includes("wx.showToast({ title: '暂无官方链接', icon: 'none' })"));
});

test('backup copy actions use the readable backup formatter', () => {
  const profileLogic = fs.readFileSync(path.join(ROOT, 'miniprogram', 'pages', 'profile', 'profile.js'), 'utf8');
  const privacyLogic = fs.readFileSync(path.join(ROOT, 'miniprogram', 'pages', 'privacy-data', 'privacy-data.js'), 'utf8');

  assert(profileLogic.includes('service.formatUserDataBackup()'));
  assert(privacyLogic.includes('service.formatUserDataBackup()'));
});

test('feedback copy includes only count-based local context', () => {
  const profileLogic = fs.readFileSync(path.join(ROOT, 'miniprogram', 'pages', 'profile', 'profile.js'), 'utf8');
  const coursesLogic = fs.readFileSync(path.join(ROOT, 'miniprogram', 'pages', 'courses', 'courses.js'), 'utf8');
  const coursesPage = fs.readFileSync(path.join(ROOT, 'miniprogram', 'pages', 'courses', 'courses.wxml'), 'utf8');
  const feedbackLogic = fs.readFileSync(path.join(ROOT, 'miniprogram', 'utils', 'feedbackService.js'), 'utf8');

  assert(profileLogic.includes('userSummary: this.data.userSummary'));
  assert(coursesLogic.includes("const feedbackService = require('../../utils/feedbackService')"));
  assert(coursesLogic.includes('copyTpgFeedback()'));
  assert(coursesLogic.includes('copyUgFeedback()'));
  assert(coursesPage.includes('bindtap="copyTpgFeedback"'));
  assert(coursesPage.includes('bindtap="copyUgFeedback"'));
  assert(coursesPage.includes('复制补课反馈模板'));
  assert(feedbackLogic.includes('本机数据摘要'));
  assert(feedbackLogic.includes('只包含数量，不包含具体课程或笔记内容'));
  assert(feedbackLogic.includes('数据补充模板'));
  assert(feedbackLogic.includes('需要补充的课程代码 / 课程名'));
  assert(feedbackLogic.includes('官方链接 / 截图来源'));
});

test('data status source copy handles missing source text', () => {
  const dataStatusLogic = fs.readFileSync(path.join(ROOT, 'miniprogram', 'pages', 'data-status', 'data-status.js'), 'utf8');

  assert(dataStatusLogic.includes('function copyTextOrToast'));
  assert(dataStatusLogic.includes("wx.showToast({ title: emptyTitle, icon: 'none' })"));
  assert(dataStatusLogic.includes("copyTextOrToast(event.currentTarget.dataset.url, '官方来源已复制', '暂无官方来源')"));
  assert(dataStatusLogic.includes("copyTextOrToast(this.data.tpgStatus && this.data.tpgStatus.sourceSummary, '资料来源已复制', '暂无资料来源')"));
});

test('data status page exposes undergraduate school coverage details', () => {
  const dataStatusPage = fs.readFileSync(path.join(ROOT, 'miniprogram', 'pages', 'data-status', 'data-status.wxml'), 'utf8');
  const dataStatusLogic = fs.readFileSync(path.join(ROOT, 'miniprogram', 'pages', 'data-status', 'data-status.js'), 'utf8');

  assert(dataStatusLogic.includes('ugSchools: ugService.getSchoolCoverage()'));
  assert(dataStatusLogic.includes('ugService.buildPendingCollectionText({ limit: 12 })'));
  assert(dataStatusLogic.includes("ugService.buildPendingCollectionText({ priority: 'launch', limit: 12 })"));
  assert(dataStatusLogic.includes("ugService.buildPendingCollectionText({ readiness: 'index-only', limit: 12 })"));
  assert(dataStatusLogic.includes("ugService.buildPendingCollectionText({ readiness: 'no-source', limit: 12 })"));
  assert(dataStatusLogic.includes('copyUgPendingCollection()'));
  assert(dataStatusLogic.includes('copyUgPriorityCollection()'));
  assert(dataStatusLogic.includes('copyUgIndexOnlyCollection()'));
  assert(dataStatusLogic.includes('copyUgNoSourceCollection()'));
  assert(dataStatusLogic.includes('school.pendingProgrammeCount'));
  assert(dataStatusLogic.includes('school.updatedLabel'));
  assert(dataStatusLogic.includes("`总覆盖率：${status.programmeWithCoursesCount}/${status.sourceProgrammeCount} Programme 已开放 · ${status.coveragePercent}% · ${status.pendingProgrammeCount} 个待补`"));
  assert(dataStatusLogic.includes('`待补来源状态：${status.sourceReadinessLabel}`'));
  assert(dataStatusLogic.includes("`数据更新时间：${status.generatedDate || '待确认'}`"));
  assert(dataStatusPage.includes('wx:for="{{ugSchools}}"'));
  assert(dataStatusPage.includes("本科数据更新时间：{{ugStatus.generatedDate || '待确认'}}"));
  assert(dataStatusPage.includes('本科总覆盖率：{{ugStatus.programmeWithCoursesCount}}/{{ugStatus.sourceProgrammeCount}} Programme 已开放 · {{ugStatus.coveragePercent}}% · {{ugStatus.pendingProgrammeCount}} 个待补'));
  assert(dataStatusPage.includes('待补来源状态：{{ugStatus.sourceReadinessLabel}}'));
  assert(dataStatusPage.includes('{{item.programmeWithCoursesCount}}/{{item.programmeCount}} Programme 已开放 · {{item.pendingProgrammeCount}} 个待补'));
  assert(dataStatusPage.includes('{{item.sourceReadinessLabel}}'));
  assert(dataStatusPage.includes('{{item.coveragePercent}}%'));
  assert(dataStatusPage.includes('{{item.majorCount}} Major / Track · {{item.coverageLabel}}'));
  assert(dataStatusPage.includes('{{item.updatedLabel}}'));
  assert(dataStatusPage.includes('{{item.codedCourseCount ? item.codedCourseCount + \' codes\' : \'待开放\'}}'));
  assert(dataStatusPage.includes('bindtap="copyUgPendingCollection"'));
  assert(dataStatusPage.includes('复制待补资料清单'));
  assert(dataStatusPage.includes('bindtap="copyUgPriorityCollection"'));
  assert(dataStatusPage.includes('复制优先补数清单'));
  assert(dataStatusPage.includes('bindtap="copyUgIndexOnlyCollection"'));
  assert(dataStatusPage.includes('复制仅索引清单'));
  assert(dataStatusPage.includes('bindtap="copyUgNoSourceCollection"'));
  assert(dataStatusPage.includes('复制缺来源清单'));
});

test('undergraduate onboarding previews selected school data coverage', () => {
  const onboardingPage = fs.readFileSync(path.join(ROOT, 'miniprogram', 'pages', 'onboarding', 'onboarding.wxml'), 'utf8');
  const onboardingLogic = fs.readFileSync(path.join(ROOT, 'miniprogram', 'pages', 'onboarding', 'onboarding.js'), 'utf8');

  assert(onboardingLogic.includes('ugSchoolCoverage: []'));
  assert(onboardingLogic.includes('ugUniversityIndex: 0'));
  assert(onboardingLogic.includes('ugProgrammeIndex: 0'));
  assert(onboardingLogic.includes('ugMajorIndex: 0'));
  assert(onboardingLogic.includes('ugCurriculumYearIndex: 0'));
  assert(onboardingLogic.includes('currentYearIndex: 0'));
  assert(onboardingLogic.includes('const INITIAL_UG_UNIVERSITIES = ugService.listUniversities()'));
  assert(onboardingLogic.includes('const INITIAL_UG_UNIVERSITY = {}'));
  assert(onboardingLogic.includes('const INITIAL_UG_PROGRAMMES = []'));
  assert(onboardingLogic.includes('const INITIAL_UG_PROGRAMME = {}'));
  assert(onboardingLogic.includes('const INITIAL_UG_MAJORS = []'));
  assert(onboardingLogic.includes('universities: INITIAL_UG_UNIVERSITIES'));
  assert(onboardingLogic.includes('universityOptions: INITIAL_UG_UNIVERSITIES.map(formatUgUniversityOption)'));
  assert(onboardingLogic.includes('programmes: INITIAL_UG_PROGRAMMES'));
  assert(onboardingLogic.includes('programmeOptions: INITIAL_UG_PROGRAMMES.map(formatUgProgrammeOption)'));
  assert(onboardingLogic.includes('majors: INITIAL_UG_MAJORS'));
  assert(onboardingLogic.includes('majorOptions: INITIAL_UG_MAJORS.map(formatMajorOption)'));
  assert(onboardingLogic.includes('universityOptions: universities.map(formatUgUniversityOption)'));
  assert(onboardingLogic.includes('programmeOptions: filteredUgProgrammes.map(formatUgProgrammeOption)'));
  assert(onboardingLogic.includes('majorOptions: majors.map(formatMajorOption)'));
  assert(onboardingLogic.includes('showUgUniversitySheet: false'));
  assert(onboardingLogic.includes('showUgProgrammeSheet: false'));
  assert(onboardingLogic.includes('showUgMajorSheet: false'));
  assert(onboardingLogic.includes('showUgCurriculumYearSheet: false'));
  assert(onboardingLogic.includes('showCurrentYearSheet: false'));
  assert(onboardingLogic.includes('openUgUniversitySheet()'));
  assert(onboardingLogic.includes('openUgProgrammeSheet()'));
  assert(onboardingLogic.includes('openUgMajorSheet()'));
  assert(onboardingLogic.includes('openUgCurriculumYearSheet()'));
  assert(onboardingLogic.includes('openCurrentYearSheet()'));
  assert(onboardingLogic.includes('selectUgUniversityByIndex(index)'));
  assert(onboardingLogic.includes("wx.showToast({ title: '请选择你的学校', icon: 'none' })"));
  assert(onboardingLogic.includes('selectUgProgrammeByIndex(index)'));
  assert(onboardingLogic.includes('selectMajorByIndex(index)'));
  assert(onboardingLogic.includes('selectCurriculumYearByIndex(index)'));
  assert(onboardingLogic.includes('selectCurrentYearByIndex(index)'));
  assert(onboardingLogic.includes('const ugSchoolCoverage = ugService.getSchoolCoverage()'));
  assert(onboardingLogic.includes('ugSchoolCoverage = this.data.ugSchoolCoverage'));
  assert(onboardingLogic.includes('applyUgProgrammeSelection(selectedProgramme = {}, profile = null, filteredUgProgrammes = this.data.filteredUgProgrammes)'));
  assert(onboardingPage.includes('bindtap="openUgUniversitySheet"'));
  assert(onboardingPage.includes("{{selectedUniversity.nameZh || '请选择你的学校'}}"));
  assert(onboardingPage.includes('请先选择你的学校，然后再选择 Programme 和 Major。'));
  assert(onboardingPage.includes('wx:if="{{selectedUniversity.id}}" class="field"'));
  assert(onboardingPage.includes('wx:if="{{selectedUniversity.id && filteredUgProgrammes.length}}"'));
  assert(onboardingPage.includes('wx:if="{{showUgUniversitySheet}}"'));
  assert(onboardingPage.includes('wx:for="{{universityOptions}}"'));
  assert(onboardingPage.includes('bindtap="selectUgUniversity"'));
  assert(!onboardingPage.includes('range="{{universities}}"'));
  assert(onboardingPage.includes("{{ugUniversityIndex === index ? 'sheet-option-active' : ''}}"));
  assert(onboardingPage.includes('bindtap="openUgProgrammeSheet"'));
  assert(onboardingPage.includes('wx:if="{{showUgProgrammeSheet}}"'));
  assert(onboardingPage.includes('wx:for="{{programmeOptions}}"'));
  assert(onboardingPage.includes('bindtap="selectUgProgrammeFromSheet"'));
  assert(onboardingPage.includes("{{ugProgrammeIndex === index ? 'sheet-option-active' : ''}}"));
  assert(onboardingPage.includes('wx:if="{{selectedProgramme.id}}"'));
  assert(onboardingPage.includes('bindtap="openUgMajorSheet"'));
  assert(onboardingPage.includes('wx:if="{{showUgMajorSheet}}"'));
  assert(onboardingPage.includes('wx:for="{{majorOptions}}"'));
  assert(onboardingPage.includes('bindtap="selectUgMajor"'));
  assert(onboardingPage.includes("{{ugMajorIndex === index ? 'sheet-option-active' : ''}}"));
  assert(onboardingPage.includes('bindtap="openUgCurriculumYearSheet"'));
  assert(onboardingPage.includes('wx:if="{{showUgCurriculumYearSheet}}"'));
  assert(onboardingPage.includes('wx:for="{{curriculumYears}}"'));
  assert(onboardingPage.includes('bindtap="selectUgCurriculumYear"'));
  assert(onboardingPage.includes("{{ugCurriculumYearIndex === index ? 'sheet-option-active' : ''}}"));
  assert(onboardingPage.includes('bindtap="openCurrentYearSheet"'));
  assert(onboardingPage.includes('wx:if="{{showCurrentYearSheet}}"'));
  assert(onboardingPage.includes('wx:for="{{yearOptions}}"'));
  assert(onboardingPage.includes('bindtap="selectCurrentYear"'));
  assert(onboardingPage.includes("{{currentYearIndex === index ? 'sheet-option-active' : ''}}"));
  assert(!onboardingPage.includes('range="{{programmeOptions}}"'));
  assert(!onboardingPage.includes('range="{{majorOptions}}"'));
  assert(!onboardingPage.includes('range="{{curriculumYears}}"'));
  assert(!onboardingPage.includes('range="{{yearOptions}}"'));
  assert(!onboardingPage.includes('value="{{ugCurriculumYearIndex}}"'));
  assert(!onboardingPage.includes('value="{{currentYearIndex}}"'));
  assert(onboardingLogic.includes('selectedUgCoverage'));
  assert(onboardingPage.includes('当前学校数据'));
  assert(onboardingPage.includes('{{selectedUgCoverage.programmeCount}} Programme · {{selectedUgCoverage.majorCount}} Major / Track'));
  assert(!onboardingLogic.includes("title: '请选择大学'"));
});

test('undergraduate onboarding shows the saved local profile summary', () => {
  const onboardingPage = fs.readFileSync(path.join(ROOT, 'miniprogram', 'pages', 'onboarding', 'onboarding.wxml'), 'utf8');
  const onboardingLogic = fs.readFileSync(path.join(ROOT, 'miniprogram', 'pages', 'onboarding', 'onboarding.js'), 'utf8');

  assert(onboardingLogic.includes('savedUgProfile: null'));
  assert(onboardingLogic.includes('function resolveInitialMode(profile, options = {})'));
  assert(onboardingLogic.includes("profile && profile.profileType === 'undergraduate'"));
  assert(onboardingLogic.includes("options.mode === 'undergraduate'"));
  assert(onboardingLogic.includes("options.mode === 'tpg'"));
  assert(onboardingLogic.includes('this._modeTouchedByUser = false'));
  assert(onboardingLogic.includes('async onLoad(options = {})'));
  assert(onboardingLogic.includes('const initialMode = resolveInitialMode(profile, options)'));
  assert(onboardingLogic.includes('onShow()'));
  assert(onboardingLogic.includes('if (this._modeTouchedByUser) return'));
  assert(onboardingLogic.includes('this._launchOptions = options'));
  assert(onboardingLogic.includes('mergeProfileOptions(service.getProfile(), options)'));
  assert(onboardingLogic.includes('resolveInitialMode(profile, options)'));
  assert(onboardingLogic.includes('this._modeTouchedByUser = true'));
  assert(onboardingLogic.includes('function mergeProfileOptions(profile, options = {})'));
  assert(onboardingLogic.includes('const rawOptionProfile = {'));
  assert(onboardingLogic.includes("rawOptionProfile[key] !== undefined && rawOptionProfile[key] !== null && rawOptionProfile[key] !== ''"));
  assert(onboardingLogic.includes('function resolveSavedUgUniversity(profile, universities = [])'));
  assert(onboardingLogic.includes('const profileProgramme = ugService.getProgramme(profile.programmeId)'));
  assert(onboardingLogic.includes('item.id === profile.universityId'));
  assert(onboardingLogic.includes('item.code === profile.universityCode'));
  assert(onboardingLogic.includes("String(item.code || '').toUpperCase() === normalizedUniversityCode"));
  assert(onboardingLogic.includes('profileProgramme && item.id === profileProgramme.universityId'));
  assert(onboardingLogic.includes('function resolveSavedUgProgramme(profile, programmes = [])'));
  assert(onboardingLogic.includes('item.nameEn === savedProgrammeName'));
  assert(onboardingLogic.includes('const selectedUniversity = resolveSavedUgUniversity(profile, universities)'));
  assert(onboardingLogic.includes('const selectedProgramme = resolveSavedUgProgramme(profile, programmes)'));
  assert(onboardingLogic.includes('mode: initialMode'));
  assert(onboardingLogic.includes("profile.profileType === 'undergraduate'"));
  assert(onboardingLogic.includes('ugService.getMajorProfile(profile.programmeId, profile.majorId, profile.curriculumYear)'));
  assert(onboardingPage.includes('wx:if="{{savedUgProfile}}"'));
  assert(onboardingPage.includes('bindtap="previewSavedUgProfile"'));
  assert(onboardingPage.includes('当前本机保存：{{savedUgProfile.programme.nameEn}}'));
  assert(onboardingLogic.includes('previewSavedUgProfile()'));
  assert(onboardingLogic.includes("wx.switchTab({ url: '/pages/courses/courses' })"));
});

test('profile edit entry keeps the saved profile type when opening onboarding', () => {
  const serviceLogic = fs.readFileSync(path.join(ROOT, 'miniprogram', 'utils', 'courseService.js'), 'utf8');
  assert(serviceLogic.includes('function buildOnboardingUrl(profile = getProfile())'));
  assert(serviceLogic.includes("universityCode: profile && profile.universityCode"));
  assert(serviceLogic.includes("programmeId: profile && profile.programmeId"));
  assert(serviceLogic.includes("majorId: profile && profile.majorId"));
  assert(serviceLogic.includes("return `/pages/onboarding/onboarding?${query || `mode=${mode}`}`"));
  [
    'home',
    'courses',
    'audit',
    'profile'
  ].forEach((pageName) => {
    const pageLogic = fs.readFileSync(path.join(ROOT, 'miniprogram', 'pages', pageName, `${pageName}.js`), 'utf8');
    assert(pageLogic.includes('service.buildOnboardingUrl()'), `${pageName} does not pass the saved profile to onboarding`);
  });
});

test('undergraduate onboarding programme results show major-level course availability', () => {
  const onboardingPage = fs.readFileSync(path.join(ROOT, 'miniprogram', 'pages', 'onboarding', 'onboarding.wxml'), 'utf8');
  const onboardingLogic = fs.readFileSync(path.join(ROOT, 'miniprogram', 'pages', 'onboarding', 'onboarding.js'), 'utf8');

  assert(onboardingLogic.includes('decorateUgProgrammes'));
  assert(onboardingLogic.includes('ugService.listMajorCourses(programme.id, major.id).length'));
  assert(onboardingLogic.includes('visibleUgProgrammes: this.decorateUgProgrammes(filteredUgProgrammes.slice(0, 5))'));
  assert(onboardingPage.includes('{{item.courseStatusLabel}}'));
  assert(onboardingPage.includes('wx:if="{{ugKeyword}}" class="programme-empty-action" bindtap="clearUgKeyword"'));
  assert(!onboardingPage.includes("{{item.codedCourseCount ? item.codedCourseCount + ' 门课程' : '课程清单待开放'}}"));
});

test('study plan page exposes local planning states and quick actions', () => {
  const planPage = fs.readFileSync(path.join(ROOT, 'miniprogram', 'pages', 'study-plan', 'study-plan.wxml'), 'utf8');
  const planLogic = fs.readFileSync(path.join(ROOT, 'miniprogram', 'pages', 'study-plan', 'study-plan.js'), 'utf8');
  const serviceLogic = fs.readFileSync(path.join(ROOT, 'miniprogram', 'utils', 'courseService.js'), 'utf8');

  assert(serviceLogic.includes('completed: isOfferingCompleted(item.courseCode)'));
  assert(serviceLogic.includes('favorite: isOfferingFavorite(item.courseCode)'));
  assert(serviceLogic.includes('hasNote: Boolean(note)'));
  assert(serviceLogic.includes('function classifyStudyPlanCourse'));
  assert(serviceLogic.includes('categoryStats: STUDY_PLAN_CATEGORY_DEFS'));
  assert(serviceLogic.includes('function getStudyPlanSuggestions'));
  assert(serviceLogic.includes('function getStudyPlanCoreGapSummary'));
  assert(serviceLogic.includes('function formatStudyPlanCheckText'));
  assert(serviceLogic.includes('function formatStudyPlanCoreGapText'));
  assert(serviceLogic.includes('function formatStudyPlanStatusText'));
  assert(serviceLogic.includes('(course.categories || []).some((category) => /core/i.test(category))'));
  assert(planLogic.includes('completedCount: courses.filter((item) => item.completed).length'));
  assert(planLogic.includes('const suggestions = service.getStudyPlanSuggestions(5);'));
  assert(planLogic.includes('const coreGapSummary = service.getStudyPlanCoreGapSummary();'));
  assert(planLogic.includes('copyCoreGap()'));
  assert(planLogic.includes('service.formatStudyPlanCoreGapText()'));
  assert(planLogic.includes('copyPlanChecks()'));
  assert(planLogic.includes('service.formatStudyPlanCheckText()'));
  assert(planLogic.includes('copyPlanStatus()'));
  assert(planLogic.includes('service.formatStudyPlanStatusText()'));
  assert(planLogic.includes('planSuggestion(event)'));
  assert(planLogic.includes('toggleCompleted(event)'));
  assert(planLogic.includes('toggleFavorite(event)'));
  assert(planPage.includes('已修 {{review.completedCount}}'));
  assert(planPage.includes('收藏 {{review.favoriteCount}}'));
  assert(planPage.includes('笔记 {{review.noteCount}}'));
  assert(planPage.includes('COURSE MIX'));
  assert(planPage.includes('wx:for="{{review.categoryStats}}"'));
  assert(planPage.includes('bindtap="copyPlanStatus"'));
  assert(planPage.includes('复制状态摘要'));
  assert(planPage.includes('不复制笔记内容'));
  assert(planPage.includes('{{course.credits}} credits · {{course.categoryLabel}}'));
  assert(planPage.includes('未安排的核心课'));
  assert(planPage.includes('bindtap="copyPlanChecks"'));
  assert(planPage.includes('复制检查清单'));
  assert(planPage.includes('bindtap="copyCoreGap"'));
  assert(planPage.includes('复制核心课清单'));
  assert(planPage.includes('{{coreGapSummary.courseCount}}'));
  assert(planPage.includes('wx:for="{{coreGapSummary.groups}}"'));
  assert(planPage.includes('可尝试调整'));
  assert(planPage.includes('wx:for="{{review.loadSuggestions}}"'));
  assert(planPage.includes('{{candidate.fromLabel}} → {{candidate.toLabel}}'));
  assert(planPage.includes('wx:for="{{suggestions}}"'));
  assert(planPage.includes('{{course.completed ? \'取消已修\' : \'标记已修\'}}'));
  assert(planPage.includes('{{course.favorite ? \'取消收藏\' : \'收藏\'}}'));
  assert(planPage.includes('详情/笔记'));
});

test('TPG onboarding previews selected school data coverage', () => {
  const onboardingPage = fs.readFileSync(path.join(ROOT, 'miniprogram', 'pages', 'onboarding', 'onboarding.wxml'), 'utf8');
  const onboardingLogic = fs.readFileSync(path.join(ROOT, 'miniprogram', 'pages', 'onboarding', 'onboarding.js'), 'utf8');

  assert(onboardingLogic.includes('const INITIAL_TPG_SCHOOL_COVERAGE = tpgService.getSchoolCoverage()'));
  assert(onboardingLogic.includes('tpgSchoolCoverage: INITIAL_TPG_SCHOOL_COVERAGE.schools || []'));
  assert(onboardingLogic.includes('tpgUniversityIndex: 0'));
  assert(onboardingLogic.includes('tpgProgrammeIndex: 0'));
  assert(onboardingLogic.includes('const INITIAL_TPG_UNIVERSITIES = tpgService.listUniversities()'));
  assert(onboardingLogic.includes('const INITIAL_TPG_UNIVERSITY = {}'));
  assert(onboardingLogic.includes('const INITIAL_TPG_PROGRAMMES = []'));
  assert(onboardingLogic.includes('const INITIAL_TPG_PROGRAMME = {}'));
  assert(onboardingLogic.includes('tpgUniversities: INITIAL_TPG_UNIVERSITIES'));
  assert(onboardingLogic.includes('tpgUniversityOptions: INITIAL_TPG_UNIVERSITIES.map(formatTpgUniversityOption)'));
  assert(onboardingLogic.includes('tpgProgrammes: INITIAL_TPG_PROGRAMMES'));
  assert(onboardingLogic.includes('tpgProgrammeOptions: INITIAL_TPG_PROGRAMMES.map(formatTpgProgrammeOption)'));
  assert(onboardingLogic.includes('tpgProgrammeOptions: filteredTpgProgrammes.map(formatTpgProgrammeOption)'));
  assert(onboardingLogic.includes('tpgEmptyTitle'));
  assert(onboardingLogic.includes('const hasSchoolProgrammes = tpgProgrammes.length > 0'));
  assert(onboardingLogic.includes("`${selectedTpgUniversity.shortName || selectedTpgUniversity.code} Programme 资料待开放`"));
  assert(onboardingLogic.includes('这所学校已经加入选择范围；Programme 和课程资料整理完成后会在这里显示。'));
  assert(onboardingLogic.includes('showTpgUniversitySheet: false'));
  assert(onboardingLogic.includes('showTpgProgrammeSheet: false'));
  assert(onboardingLogic.includes('openTpgUniversitySheet()'));
  assert(onboardingLogic.includes('openTpgProgrammeSheet()'));
  assert(onboardingLogic.includes('selectTpgUniversityByIndex(index)'));
  assert(onboardingPage.includes("{{selectedTpgUniversity.shortName || '请选择你的学校'}}"));
  assert(onboardingPage.includes('请先选择你的学校，然后再搜索或选择 Programme。'));
  assert(onboardingPage.includes('wx:if="{{selectedTpgUniversity.code}}" class="field"'));
  assert(onboardingPage.includes('wx:if="{{selectedTpgUniversity.code && filteredTpgProgrammes.length}}"'));
  assert(onboardingLogic.includes('selectTpgProgrammeByIndex(index)'));
  assert(onboardingLogic.includes('const tpgUniversities = tpgService.listUniversities()'));
  assert(onboardingLogic.includes('tpgUniversityIndex: tpgUniversityIndex >= 0 ? tpgUniversityIndex : 0'));
  assert(onboardingPage.includes('bindtap="openTpgUniversitySheet"'));
  assert(onboardingPage.includes('wx:if="{{showTpgUniversitySheet}}"'));
  assert(onboardingPage.includes('wx:for="{{tpgUniversityOptions}}"'));
  assert(onboardingPage.includes('bindtap="selectTpgUniversity"'));
  assert(!onboardingPage.includes('range="{{tpgUniversities}}"'));
  assert(onboardingPage.includes("{{tpgUniversityIndex === index ? 'sheet-option-active' : ''}}"));
  assert(onboardingPage.includes('bindtap="openTpgProgrammeSheet"'));
  assert(onboardingPage.includes('wx:if="{{showTpgProgrammeSheet}}"'));
  assert(onboardingPage.includes('wx:for="{{tpgProgrammeOptions}}"'));
  assert(onboardingPage.includes('bindtap="selectTpgProgrammeFromSheet"'));
  assert(onboardingPage.includes('{{tpgEmptyTitle}}'));
  assert(onboardingPage.includes('{{tpgEmptyCopy}}'));
  assert(onboardingPage.includes('wx:if="{{tpgKeyword && tpgProgrammes.length}}" class="programme-empty-action" bindtap="clearTpgKeyword"'));
  assert(onboardingPage.includes("{{tpgProgrammeIndex === index ? 'sheet-option-active' : ''}}"));
  assert(!onboardingPage.includes('range="{{tpgProgrammeOptions}}"'));
  assert(onboardingPage.includes('wx:if="{{selectedTpgProgramme.id}}"'));
  assert(onboardingLogic.includes('selectedTpgCoverage'));
  assert(onboardingPage.includes('{{selectedTpgCoverage.programmeCount}} Programme · {{selectedTpgCoverage.programmeWithCoursesCount}} 个已开放课程组'));
  assert(onboardingPage.includes('{{selectedTpgCoverage.courseCount ? selectedTpgCoverage.courseCount + \' courses\' : \'课程待开放\'}}'));
});

test('TPG onboarding programme results show course availability', () => {
  const onboardingPage = fs.readFileSync(path.join(ROOT, 'miniprogram', 'pages', 'onboarding', 'onboarding.wxml'), 'utf8');
  const onboardingLogic = fs.readFileSync(path.join(ROOT, 'miniprogram', 'pages', 'onboarding', 'onboarding.js'), 'utf8');

  assert(onboardingLogic.includes('decorateTpgProgrammes'));
  assert(onboardingLogic.includes("courseStatusLabel: courseCount ? `${courseCount} 门课程` : '课程清单待开放'"));
  assert(onboardingLogic.includes('visibleTpgProgrammes: this.decorateTpgProgrammes(filteredTpgProgrammes.slice(0, 5))'));
  assert(onboardingPage.includes('{{item.courseStatusLabel}}'));
  assert(onboardingPage.includes('wx:if="{{tpgKeyword && tpgProgrammes.length}}" class="programme-empty-action" bindtap="clearTpgKeyword"'));
});

test('TPG catalogue copy describes availability instead of completeness', () => {
  const cataloguePage = fs.readFileSync(path.join(ROOT, 'miniprogram', 'pages', 'tpg-catalog', 'tpg-catalog.wxml'), 'utf8');

  assert(cataloguePage.includes('课程组开放状态'));
  assert(!cataloguePage.includes('资料完整度'));
});
