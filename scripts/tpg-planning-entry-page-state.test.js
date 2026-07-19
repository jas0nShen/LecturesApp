const assert = require('node:assert/strict');
const path = require('node:path');
const test = require('node:test');

const ROOT = path.join(__dirname, '..');
const tpgService = require('../miniprogram/utils/tpgService');
const ugService = require('../miniprogram/utils/ugService');

function getIndexOnlyUgProfile() {
  for (const university of ugService.listUniversities()) {
    const programmes = ugService.listProgrammes({ universityId: university.id, degreeLevel: 'undergraduate' });
    for (const programme of programmes) {
      const major = ugService.listMajors(programme.id).find((item) => item.codedCourseCount === 0);
      if (major) {
        return {
          profileType: 'undergraduate',
          universityCode: university.code,
          programmeId: programme.id,
          majorId: major.id,
          curriculumYear: programme.curriculumYear
        };
      }
    }
  }
  throw new Error('Expected at least one index-only undergraduate Major fixture');
}

function loadPage(relativePath, initialStorage = {}, app = {}) {
  const pagePath = path.join(ROOT, relativePath);
  delete require.cache[require.resolve(pagePath)];
  const storage = { ...initialStorage };
  const calls = { navigations: [], toasts: [] };
  global.wx = {
    getStorageSync: (key) => storage[key],
    setStorageSync: (key, value) => { storage[key] = value; },
    navigateTo: (options) => { calls.navigations.push(options.url); },
    switchTab: (options) => { calls.navigations.push(options.url); },
    showToast: (options) => { calls.toasts.push(options); }
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
  require(pagePath);
  return { page, storage, calls };
}

test('TPG courses page decorates planned courses and opens the plan', async () => {
  const programmeId = 'POLYU-TPG-105';
  const courseCode = 'SO5100';
  const { page, calls } = loadPage('miniprogram/pages/courses/courses.js', {
    userProfile: {
      profileType: 'tpg',
      programmeId,
      universityCode: 'POLYU',
      trackId: ''
    },
    plannedTpgCourseKeys: [`${programmeId}:${courseCode}`]
  }, {
    ensureTpgUniversityLoaded: () => Promise.resolve()
  });

  await page.refresh();

  assert.equal(page.data.tpgPlanningSupported, true);
  assert.equal(page.data.tpgCourses.find((course) => course.code === courseCode).planned, true);
  page.goTpgStudyPlan();
  assert.deepEqual(calls.navigations, ['/pages/study-plan/study-plan']);
});

test('TPG courses page keeps only the selected Track in the visible course list', async () => {
  const programmeId = 'HKU-TPG-031';
  const selectedTrackId = 'HKU-TPG-031-GENERALIST';
  const otherTrackId = 'HKU-TPG-031-CHINESE-LANGUAGE-EDUCATION';
  const selectedCodes = new Set(tpgService.flattenCourses(tpgService.getProgramme(programmeId), '', selectedTrackId).map((course) => course.code));
  const otherOnlyCourse = tpgService
    .flattenCourses(tpgService.getProgramme(programmeId), '', otherTrackId)
    .find((course) => !selectedCodes.has(course.code));
  assert.ok(otherOnlyCourse, 'fixture must contain a course unique to the other Track');
  const { page } = loadPage('miniprogram/pages/courses/courses.js', {
    userProfile: {
      profileType: 'tpg',
      programmeId,
      universityCode: 'HKU',
      trackId: selectedTrackId
    }
  }, {
    ensureTpgUniversityLoaded: () => Promise.resolve()
  });

  await page.refresh();

  assert.equal(page.data.tpgPlanningSupported, true);
  assert.equal(page.data.tpgCourses.some((course) => course.code === otherOnlyCourse.code), false);
});

test('blocked TPG Programme keeps the plan entry disabled with an observable reason', async () => {
  const { page, calls } = loadPage('miniprogram/pages/courses/courses.js', {
    userProfile: {
      profileType: 'tpg',
      programmeId: 'HKU-TPG-027',
      universityCode: 'HKU',
      trackId: ''
    }
  }, {
    ensureTpgUniversityLoaded: () => Promise.resolve()
  });

  await page.refresh();
  page.goTpgStudyPlan();

  assert.equal(page.data.tpgPlanningSupported, false);
  assert.match(page.data.tpgPlanningReason, /课程结构尚未开放/);
  assert.equal(calls.navigations.length, 0);
  assert.match(calls.toasts.at(-1).title, /课程结构尚未开放/);
});

test('TPG package load failure stays visible instead of becoming an empty catalogue', async () => {
  const { page } = loadPage('miniprogram/pages/courses/courses.js', {
    userProfile: {
      profileType: 'tpg',
      programmeId: 'HKU-TPG-024',
      universityCode: 'HKU',
      trackId: ''
    }
  }, {
    ensureTpgUniversityLoaded: () => Promise.reject(new Error('package unavailable'))
  });

  await page.refresh();

  assert.equal(page.data.dataSource, 'error');
  assert.equal(page.data.ugStatusTitle, '硕士课程数据加载失败');
  assert.equal(page.data.isTpg, false);
});

test('home and Programme pages expose the TPG plan entry only for the current verified Programme', async () => {
  const profile = {
    profileType: 'tpg',
    programmeId: 'POLYU-TPG-105',
    universityCode: 'POLYU',
    trackId: ''
  };
  const home = loadPage('miniprogram/pages/home/home.js', { userProfile: profile });
  await home.page.onShow();
  assert.equal(home.page.data.planningCapability.mode, 'tpg-course-plan');
  home.page.goTpgStudyPlan();
  assert.deepEqual(home.calls.navigations, ['/pages/study-plan/study-plan']);

  const programme = loadPage('miniprogram/pages/tpg-programme/tpg-programme.js', { userProfile: profile });
  await programme.page.onLoad({ id: profile.programmeId });
  assert.equal(programme.page.data.tpgPlanningSupported, true);
  programme.page.goTpgStudyPlan();
  assert.deepEqual(programme.calls.navigations, ['/pages/study-plan/study-plan']);
});

test('opened UG Major decorates planned courses and opens the shared Study Plan page', async () => {
  const programmeId = 'POLYU-UG-JS3868-14';
  const majorId = 'POLYU-UG-JS3868-14-M1';
  const courseId = 'POLYU-UG-JS3868-14-M1-C1';
  const { page, calls } = loadPage('miniprogram/pages/courses/courses.js', {
    userProfile: {
      profileType: 'undergraduate',
      universityCode: 'POLYU',
      programmeId,
      majorId,
      curriculumYear: '2026'
    },
    plannedUgCourseKeys: [`${programmeId}:${majorId}:${courseId}`]
  }, {
    ensureUniversityLoaded: () => Promise.resolve()
  });

  await page.refresh();

  assert.equal(page.data.isUgCatalogue, true);
  assert.equal(page.data.ugPlanningSupported, true);
  assert.equal(page.data.ugCourses.find((course) => course.id === courseId).planned, true);
  page.goUgStudyPlan();
  assert.deepEqual(calls.navigations, ['/pages/study-plan/study-plan']);
});

test('index-only UG Major does not expose a usable plan entry', async () => {
  const { page, calls } = loadPage('miniprogram/pages/courses/courses.js', {
    userProfile: getIndexOnlyUgProfile()
  }, {
    ensureUniversityLoaded: () => Promise.resolve()
  });

  await page.refresh();
  page.goUgStudyPlan();

  assert.equal(page.data.ugCourseCountDisplay, '待开放');
  assert.equal(page.data.ugPlanningSupported, false);
  assert.match(page.data.ugPlanningReason, /课程清单待开放/);
  assert.equal(calls.navigations.length, 0);
});
