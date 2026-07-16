const assert = require('node:assert/strict');
const path = require('node:path');
const test = require('node:test');

const PAGE_PATH = path.join(__dirname, '..', 'miniprogram', 'pages', 'study-plan', 'study-plan.js');

function loadStudyPlanPage(initialStorage = {}, app = {}) {
  delete require.cache[require.resolve(PAGE_PATH)];
  const storage = { ...initialStorage };
  let clipboard = '';
  global.wx = {
    getStorageSync: (key) => storage[key],
    setStorageSync: (key, value) => { storage[key] = value; },
    setClipboardData: ({ data, success }) => {
      clipboard = data;
      if (success) success();
    },
    showToast: () => {},
    navigateTo: () => {},
    switchTab: () => {}
  };
  global.getApp = () => app;
  let page;
  global.Page = (config) => {
    page = {
      ...config,
      data: JSON.parse(JSON.stringify(config.data)),
      setData(patch) {
        this.data = { ...this.data, ...patch };
      }
    };
  };
  require(PAGE_PATH);
  return { page, storage, getClipboard: () => clipboard };
}

test('TPG Study Plan groups current Programme courses and copies a privacy-safe summary', async () => {
  const programmeId = 'HKU-TPG-030';
  const { page, storage, getClipboard } = loadStudyPlanPage({
    userProfile: { profileType: 'tpg', universityCode: 'HKU', programmeId },
    plannedTpgCourseKeys: [`${programmeId}:MAES7001`, `${programmeId}:MAES7200`],
    completedTpgCourseKeys: [`${programmeId}:MAES7001`],
    courseNotes: { [`${programmeId}:MAES7001`]: '不应复制的私密笔记' }
  });

  await page.onShow();

  assert.equal(page.data.mode, 'tpg-course-plan');
  assert.equal(page.data.supported, true);
  assert.match(page.data.tpgPlan.programmeName, /^Master of Arts in Teaching English to Speakers of Other Languages/);
  assert.equal(page.data.tpgPlan.courseCount, 2);
  assert.equal(page.data.tpgPlan.totalCredits, 18);
  assert.equal(page.data.tpgPlan.completedCount, 1);
  assert.equal(page.data.tpgPlan.officialCredits, 72);
  assert.deepEqual(page.data.tpgPlan.groups.map((group) => group.name), ['Core Courses', 'Capstone Project']);

  page.copyTpgPlan();
  assert.match(getClipboard(), /Programme: Master of Arts/);
  assert.match(getClipboard(), /Core Courses/);
  assert.match(getClipboard(), /MAES7001 .* 已修/);
  assert.match(getClipboard(), /MAES7200 .* 未修/);
  assert.doesNotMatch(getClipboard(), /私密笔记|毕业百分比|还差多少学分|通过判断/);

  await page.removeTpgCourse({ currentTarget: { dataset: { code: 'MAES7200' } } });
  assert.deepEqual(storage.plannedTpgCourseKeys, [`${programmeId}:MAES7001`]);
  assert.equal(page.data.tpgPlan.courseCount, 1);
});

test('TPG Study Plan counts only the current Track and retains records from another Track', async () => {
  const programmeId = 'HKU-TPG-031';
  const plannedKey = `${programmeId}:MEDD8853`;
  const { page, storage } = loadStudyPlanPage({
    userProfile: {
      profileType: 'tpg',
      universityCode: 'HKU',
      programmeId,
      trackId: 'HKU-TPG-031-GENERALIST'
    },
    plannedTpgCourseKeys: [plannedKey]
  });

  await page.onShow();
  assert.equal(page.data.tpgPlan.trackName, 'Generalist');
  assert.equal(page.data.tpgPlan.courseCount, 0);
  assert.deepEqual(storage.plannedTpgCourseKeys, [plannedKey]);

  storage.userProfile = {
    ...storage.userProfile,
    trackId: 'HKU-TPG-031-CHINESE-LANGUAGE-EDUCATION'
  };
  await page.onShow();
  assert.equal(page.data.tpgPlan.trackName, 'Chinese Language Education');
  assert.equal(page.data.tpgPlan.courseCount, 1);
  assert.equal(page.data.tpgPlan.groups[0].courses[0].code, 'MEDD8853');
});

test('TPG Study Plan shows explicit blocked and package-load failure states', async () => {
  const blocked = loadStudyPlanPage({
    userProfile: { profileType: 'tpg', universityCode: 'HKU', programmeId: 'HKU-TPG-027' }
  });
  await blocked.page.onShow();
  assert.equal(blocked.page.data.supported, false);
  assert.match(blocked.page.data.unsupportedMessage, /复核中/);

  const failed = loadStudyPlanPage({
    userProfile: { profileType: 'tpg', universityCode: 'HKU', programmeId: 'HKU-TPG-030' }
  }, {
    ensureTpgUniversityLoaded: () => Promise.reject(new Error('offline'))
  });
  await failed.page.onShow();
  assert.equal(failed.page.data.loadError, true);
  assert.match(failed.page.data.unsupportedMessage, /加载失败/);
});
