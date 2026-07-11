const assert = require('node:assert/strict');
const path = require('node:path');
const test = require('node:test');

const PAGE_PATH = path.join(__dirname, '..', 'miniprogram', 'pages', 'course-detail', 'course-detail.js');

function loadCourseDetailPage(app) {
  delete require.cache[require.resolve(PAGE_PATH)];
  const storage = {};
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
