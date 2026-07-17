const assert = require('node:assert/strict');
const path = require('node:path');
const test = require('node:test');

const LOADER_PATH = path.join(
  __dirname,
  '..',
  'miniprogram',
  'subpackages',
  'ug-data-polyu-a',
  'pages',
  'loader',
  'index.js'
);

function loadLoader() {
  delete require.cache[require.resolve(LOADER_PATH)];
  const caller = {
    route: 'pages/courses/courses',
    options: { source: 'study plan' }
  };
  const loader = {
    route: 'subpackages/ug-data-polyu-a/pages/loader/index',
    options: {}
  };
  let pages = [caller, loader];
  let pageDefinition;
  let reLaunchUrl = '';
  let registered = 0;
  let completed = 0;

  const previous = {
    Page: global.Page,
    getApp: global.getApp,
    getCurrentPages: global.getCurrentPages,
    wx: global.wx,
    setTimeout: global.setTimeout
  };

  global.Page = (definition) => { pageDefinition = definition; };
  global.getApp = () => ({
    registerUgCourseShard() { registered += 1; },
    completeUgCourseShardActivation() { completed += 1; }
  });
  global.getCurrentPages = () => pages;
  global.setTimeout = (callback) => {
    callback();
    return 1;
  };
  global.wx = {
    reLaunch({ url, success }) {
      reLaunchUrl = url;
      pages = [caller];
      success();
    }
  };

  require(LOADER_PATH);

  return {
    run() {
      pageDefinition.onLoad();
      return { registered, completed, reLaunchUrl };
    },
    restore() {
      Object.entries(previous).forEach(([key, value]) => {
        if (value === undefined) delete global[key];
        else global[key] = value;
      });
      delete require.cache[require.resolve(LOADER_PATH)];
    }
  };
}

test('UG loader reLaunches the caller before completing activation', () => {
  const runtime = loadLoader();
  try {
    assert.deepEqual(runtime.run(), {
      registered: 1,
      completed: 1,
      reLaunchUrl: '/pages/courses/courses?source=study%20plan'
    });
  } finally {
    runtime.restore();
  }
});
