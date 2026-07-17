const assert = require('node:assert/strict');
const path = require('node:path');
const test = require('node:test');

const PAGE_PATH = path.join(__dirname, '..', 'miniprogram', 'pages', 'study-plan', 'study-plan.js');

function loadStudyPlanPage(initialStorage = {}, app = {}) {
  delete require.cache[require.resolve(PAGE_PATH)];
  const storage = { ...initialStorage };
  let clipboard = '';
  const navigations = [];
  global.wx = {
    getStorageSync: (key) => storage[key],
    setStorageSync: (key, value) => { storage[key] = value; },
    setClipboardData: ({ data, success }) => {
      clipboard = data;
      if (success) success();
    },
    showToast: () => {},
    navigateTo: ({ url }) => { navigations.push(url); },
    switchTab: ({ url }) => { navigations.push(url); }
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
  return { page, storage, navigations, getClipboard: () => clipboard };
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

test('UG Study Plan starts courses pending, applies user Year and Term, and preserves official reference data', async () => {
  const programmeId = 'POLYU-UG-JS3868-14';
  const majorId = 'POLYU-UG-JS3868-14-M1';
  const courseId = 'POLYU-UG-JS3868-14-M1-C1';
  const otherMajorKey = `${programmeId}:POLYU-UG-JS3868-14-M2:POLYU-UG-JS3868-14-M2-C1`;
  const currentKey = `${programmeId}:${majorId}:${courseId}`;
  const { page, storage, navigations, getClipboard } = loadStudyPlanPage({
    userProfile: {
      profileType: 'undergraduate',
      universityCode: 'POLYU',
      programmeId,
      majorId,
      curriculumYear: '2026'
    },
    plannedUgCourseKeys: [currentKey, otherMajorKey],
    ugCoursePlanAssignments: [{ courseKey: otherMajorKey, plannedYear: 5, plannedTerm: 'full year' }]
  }, {
    ensureUniversityLoaded: () => Promise.resolve()
  });

  await page.onShow();

  assert.equal(page.data.mode, 'ug-course-plan');
  assert.equal(page.data.supported, true);
  assert.equal(page.data.ugPlan.majorId, majorId);
  assert.equal(page.data.ugPlan.courseCount, 1);
  assert.deepEqual(page.data.ugPlan.groups.map((group) => group.name), ['待安排']);
  assert.equal(page.data.ugPlan.groups[0].courses[0].courseCode, 'COMP1004');
  assert.match(page.data.ugPlan.groups[0].courses[0].userPlanLabel, /待安排/);
  assert.match(page.data.ugPlan.groups[0].courses[0].officialReferenceLabel, /推荐年级 Year 1/);
  page.copyUgPlan();
  assert.match(getClipboard(), /用户计划：Year 待安排 · 待安排/);
  assert.match(getClipboard(), /官方参考：推荐年级 Year 1/);

  storage.ugCoursePlanAssignments.push({ courseKey: currentKey, plannedYear: 2, plannedTerm: '3' });
  await page.onShow();
  assert.deepEqual(page.data.ugPlan.groups.map((group) => group.name), ['Year 2 · Term 3']);
  assert.equal(page.data.ugPlan.groups[0].courses[0].userPlanLabel, 'Year 2 · Term 3');

  page.copyUgPlan();
  assert.match(getClipboard(), /Major:/);
  assert.match(getClipboard(), /COMP1004/);
  assert.match(getClipboard(), /用户计划：Year 2 · Term 3/);
  assert.match(getClipboard(), /官方参考：推荐年级 Year 1/);
  assert.match(getClipboard(), /不计算毕业百分比、学分差额或毕业资格/);
  assert.doesNotMatch(getClipboard(), /\d+(?:\.\d+)?%|还差\s*\d+/);

  page.openUgDetail({ currentTarget: { dataset: { id: courseId } } });
  assert.match(navigations.at(-1), /course-detail\?ugId=.*POLYU-UG-JS3868-14-M1-C1/);
  page.editUgAssignment({ currentTarget: { dataset: { id: courseId } } });
  assert.match(navigations.at(-1), /plan-course\?ugId=.*POLYU-UG-JS3868-14-M1-C1/);

  storage.userProfile = { ...storage.userProfile, majorId: 'POLYU-UG-JS3868-14-M2' };
  await page.onShow();
  assert.equal(page.data.ugPlan.majorId, 'POLYU-UG-JS3868-14-M2');
  assert.deepEqual(page.data.ugPlan.groups.map((group) => group.name), ['Year 5 · Full Year']);
  assert.equal(page.data.ugPlan.groups[0].courses[0].id, 'POLYU-UG-JS3868-14-M2-C1');

  storage.userProfile = { ...storage.userProfile, majorId };
  await page.onShow();
  assert.deepEqual(page.data.ugPlan.groups.map((group) => group.name), ['Year 2 · Term 3']);
  assert.equal(page.data.ugPlan.groups[0].courses[0].id, courseId);

  await page.removeUgCourse({ currentTarget: { dataset: { id: courseId } } });
  assert.deepEqual(storage.plannedUgCourseKeys, [otherMajorKey]);
  assert.deepEqual(storage.ugCoursePlanAssignments, [{ courseKey: otherMajorKey, plannedYear: 5, plannedTerm: 'full year' }]);
  assert.equal(page.data.ugPlan.courseCount, 0);
});

test('UG Study Plan keeps index-only Majors unavailable and exposes package retry', async () => {
  const indexOnly = loadStudyPlanPage({
    userProfile: {
      profileType: 'undergraduate',
      universityCode: 'HKU',
      programmeId: 'HKU-UG-6066-20',
      majorId: 'HKU-UG-6066-20-M1',
      curriculumYear: '2026'
    }
  });
  await indexOnly.page.onShow();
  assert.equal(indexOnly.page.data.supported, false);
  assert.match(indexOnly.page.data.unsupportedMessage, /课程清单待开放/);

  let attempts = 0;
  const failed = loadStudyPlanPage({
    userProfile: {
      profileType: 'undergraduate',
      universityCode: 'POLYU',
      programmeId: 'POLYU-UG-JS3868-14',
      majorId: 'POLYU-UG-JS3868-14-M1',
      curriculumYear: '2026'
    }
  }, {
    ensureUniversityLoaded: () => attempts ? Promise.resolve() : Promise.reject(new Error('offline')),
    retryUniversityLoad: () => {
      attempts += 1;
      return Promise.resolve();
    }
  });
  await failed.page.onShow();
  assert.equal(failed.page.data.loadError, true);
  await failed.page.retryPlanLoad();
  assert.equal(attempts, 1);
  assert.equal(failed.page.data.loadError, false);
});
