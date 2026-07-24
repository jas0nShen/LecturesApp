const assert = require('node:assert/strict');
const path = require('node:path');
const test = require('node:test');

const PAGE_PATH = path.join(__dirname, '..', 'miniprogram', 'pages', 'course-detail', 'course-detail.js');

function loadCourseDetailPage(app, initialStorage = {}) {
  delete require.cache[require.resolve(PAGE_PATH)];
  const storage = { ...initialStorage };
  global.wx = {
    showToast: () => {},
    getStorageSync: (key) => storage[key],
    setStorageSync: (key, value) => { storage[key] = value; }
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
  page._storage = storage;
  return page;
}

test('undergraduate course detail exposes a retry after a package load failure', async () => {
  let attempts = 0;
  const page = loadCourseDetailPage({
    ensureUniversityLoaded() {
      attempts += 1;
      return attempts === 1 ? Promise.reject(new Error('offline')) : Promise.resolve();
    }
  });
  const options = { ugId: 'HKU-UG-6004-1-M1-SUP-ARCH1079-3', universityCode: 'HKU' };

  await page.onLoad(options);
  assert.equal(page.data.loadError, true);
  assert.equal(page.data.routeOptions.ugId, options.ugId);

  await page.retryUgLoad();
  assert.equal(page.data.loadError, false);
  assert.equal(page.data.course.courseCode, 'ARCH1079');
  assert.equal(attempts, 2);
});

test('opened undergraduate course detail toggles scoped plan and completion state independently', async () => {
  const programmeId = 'POLYU-UG-JS3868-14';
  const majorId = 'POLYU-UG-JS3868-14-M1';
  const courseId = 'POLYU-UG-JS3868-14-M1-C1';
  const page = loadCourseDetailPage({
    ensureUniversityLoaded: () => Promise.resolve()
  }, {
    userProfile: {
      profileType: 'undergraduate',
      universityCode: 'POLYU',
      programmeId,
      majorId,
      curriculumYear: '2026'
    }
  });

  await page.onLoad({ ugId: courseId, universityCode: 'POLYU' });

  assert.equal(page.data.course.courseCode, 'COMP1004');
  assert.equal(page.data.ugPlanningSupported, true);
  assert.equal(page.data.planned, false);
  assert.equal(page.data.completed, false);
  page.toggleCompleted();
  assert.equal(page.data.completed, true);
  page.togglePlanned();
  assert.equal(page.data.planned, true);
  page.togglePlanned();
  assert.equal(page.data.planned, false);
  assert.equal(page.data.completed, true);
  assert.deepEqual(page._storage.completedUgCourseKeys, [`${programmeId}:${majorId}:${courseId}`]);

  const reopened = loadCourseDetailPage({
    ensureUniversityLoaded: () => Promise.resolve()
  }, page._storage);
  await reopened.onLoad({ ugId: courseId, universityCode: 'POLYU' });
  assert.equal(reopened.data.completed, true);
});

test('TPG course detail opens the selected programme course with per-course credits', async () => {
  const page = loadCourseDetailPage({});

  await page.onLoad({ tpgProgrammeId: 'POLYU-TPG-105', courseCode: 'SO5100' });

  assert.equal(page.data.isTpgCourse, true);
  assert.equal(page.data.course.courseCode, 'SO5100');
  assert.equal(page.data.course.titleEn, 'Research Project');
  assert.equal(page.data.course.credits, 6);
  page.toggleFavorite();
  assert.equal(page.data.favorite, true);
  page.toggleCompleted();
  assert.equal(page.data.completed, true);
});

test('verified TPG course detail toggles the Programme-scoped planned state', async () => {
  const page = loadCourseDetailPage({}, {
    userProfile: {
      profileType: 'tpg',
      programmeId: 'POLYU-TPG-105',
      universityCode: 'POLYU',
      trackId: ''
    }
  });

  await page.onLoad({ tpgProgrammeId: 'POLYU-TPG-105', courseCode: 'SO5100' });

  assert.equal(page.data.tpgPlanningSupported, true);
  assert.equal(page.data.planned, false);
  page.togglePlanned();
  assert.equal(page.data.planned, true);
  page.togglePlanned();
  assert.equal(page.data.planned, false);
});

test('blocked TPG Programme does not expose course planning', async () => {
  const page = loadCourseDetailPage({}, {
    userProfile: {
      profileType: 'tpg',
      programmeId: 'HKU-TPG-027',
      universityCode: 'HKU',
      trackId: ''
    }
  });

  await page.onLoad({ tpgProgrammeId: 'HKU-TPG-027', courseCode: 'DENT0000' });

  assert.equal(page.data.tpgPlanningSupported, false);
  assert.match(page.data.tpgPlanningReason, /课程结构尚未开放/);
});

test('course-list-only TPG detail shows official credit ranges without local state actions', async () => {
  const programmeId = 'EDUHK-TPG-DIR-MSCESLPLD';
  const courseCode = 'SED6026';
  const page = loadCourseDetailPage({}, {
    userProfile: {
      profileType: 'tpg',
      programmeId,
      universityCode: 'EDUHK',
      trackId: ''
    }
  });

  await page.onLoad({ tpgProgrammeId: programmeId, courseCode });

  assert.equal(page.data.course.creditLabel, '3–6 credit points');
  assert.equal(page.data.tpgCourseActionsEnabled, false);
  assert.equal(page.data.tpgPlanningSupported, false);
  page.toggleFavorite();
  page.toggleCompleted();
  page.togglePlanned();
  assert.equal(page.data.favorite, false);
  assert.equal(page.data.completed, false);
  assert.equal(page.data.planned, false);
  assert.equal(page._storage.favoriteTpgCourseKeys, undefined);
  assert.equal(page._storage.completedTpgCourseKeys, undefined);
  assert.equal(page._storage.plannedTpgCourseKeys, undefined);
});
