const assert = require('node:assert/strict');
const path = require('node:path');
const test = require('node:test');

const PAGE_PATH = path.join(__dirname, '..', 'miniprogram', 'pages', 'plan-course', 'plan-course.js');

function loadPlanCoursePage(initialStorage = {}, app = {}) {
  delete require.cache[require.resolve(PAGE_PATH)];
  const storage = { ...initialStorage };
  const navigations = [];
  global.wx = {
    getStorageSync: (key) => storage[key],
    setStorageSync: (key, value) => { storage[key] = value; },
    showToast: () => {},
    navigateBack: () => { navigations.push('back'); }
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
  return { page, storage, navigations };
}

test('UG plan-course starts pending, persists Year and Term, and clears the assignment', async () => {
  const programmeId = 'POLYU-UG-JS3868-14';
  const majorId = 'POLYU-UG-JS3868-14-M1';
  const courseId = 'POLYU-UG-JS3868-14-M1-C1';
  const courseKey = `${programmeId}:${majorId}:${courseId}`;
  const { page, storage } = loadPlanCoursePage({
    userProfile: { profileType: 'undergraduate', universityCode: 'POLYU', programmeId, majorId, curriculumYear: '2026' },
    plannedUgCourseKeys: [courseKey]
  }, { ensureUniversityLoaded: () => Promise.resolve() });

  await page.onLoad({ ugId: courseId, universityCode: 'POLYU' });
  assert.equal(page.data.mode, 'ug-course-plan');
  assert.equal(page.data.ugCourse.courseCode, 'COMP1004');
  assert.equal(page.data.ugYearIndex, 0);
  assert.equal(page.data.ugTermIndex, 0);
  assert.deepEqual(page.data.ugYearLabels, ['待安排', 'Year 1', 'Year 2', 'Year 3', 'Year 4', 'Year 5', 'Year 6']);
  assert.deepEqual(page.data.ugTermLabels, ['待安排', 'Term 1', 'Term 2', 'Term 3', 'Summer', 'Full Year']);
  assert.equal(page.data.officialYearLabel, 'Year 1');
  assert.match(page.data.officialTermLabel, /Semester 1/);

  page.onUgYearChange({ detail: { value: '3' } });
  page.onUgTermChange({ detail: { value: '4' } });
  page.save();
  assert.deepEqual(storage.ugCoursePlanAssignments, [{ courseKey, plannedYear: 3, plannedTerm: 'summer' }]);

  await page.onLoad({ ugId: courseId, universityCode: 'POLYU' });
  assert.equal(page.data.ugYearIndex, 3);
  assert.equal(page.data.ugTermIndex, 4);
  page.clearUgAssignment();
  assert.deepEqual(storage.ugCoursePlanAssignments, []);
});

test('UG plan-course shows an observable retry after package load failure', async () => {
  let attempts = 0;
  const programmeId = 'POLYU-UG-JS3868-14';
  const majorId = 'POLYU-UG-JS3868-14-M1';
  const courseId = 'POLYU-UG-JS3868-14-M1-C1';
  const { page } = loadPlanCoursePage({
    userProfile: { profileType: 'undergraduate', universityCode: 'POLYU', programmeId, majorId },
    plannedUgCourseKeys: [`${programmeId}:${majorId}:${courseId}`]
  }, {
    ensureUniversityLoaded: () => {
      attempts += 1;
      return attempts === 1 ? Promise.reject(new Error('offline')) : Promise.resolve();
    }
  });

  await page.onLoad({ ugId: courseId, universityCode: 'POLYU' });
  assert.equal(page.data.loadError, true);
  await page.retryUgLoad();
  assert.equal(page.data.loadError, false);
  assert.equal(page.data.ugCourse.courseCode, 'COMP1004');
});

test('legacy HKU plan-course keeps its existing four-year scheduling behavior', async () => {
  const { page, storage } = loadPlanCoursePage();
  await page.onLoad({ code: 'COMP1117' });
  assert.equal(page.data.mode, 'hku-four-year-plan');
  assert.equal(page.data.course.courseCode, 'COMP1117');
  page.save();
  assert.equal(storage.studyPlanItems[0].courseCode, 'COMP1117');
});
