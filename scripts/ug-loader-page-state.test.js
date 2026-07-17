const assert = require('node:assert/strict');
const path = require('node:path');
const test = require('node:test');

const POLYU_A_PATH = path.join(
  __dirname,
  '..',
  'miniprogram',
  'subpackages',
  'ug-data-polyu-a',
  'pages',
  'loader',
  'index.js'
);
const POLYU_B_PATH = path.join(
  __dirname,
  '..',
  'miniprogram',
  'subpackages',
  'ug-data-polyu-b',
  'pages',
  'loader',
  'index.js'
);

function loadLoader(loaderPath) {
  delete require.cache[require.resolve(loaderPath)];
  const caller = {
    route: 'pages/courses/courses',
    options: { source: 'study plan' }
  };
  const firstLoader = {
    route: 'subpackages/ug-data-polyu-a/pages/loader/index',
    options: {}
  };
  const currentLoader = {
    route: loaderPath.includes('polyu-b')
      ? 'subpackages/ug-data-polyu-b/pages/loader/index'
      : firstLoader.route,
    options: {}
  };
  let pageDefinition;
  let reLaunchUrl = '';
  let registered = 0;
  let completed = 0;

  const previous = {
    Page: global.Page,
    getApp: global.getApp,
    getCurrentPages: global.getCurrentPages,
    wx: global.wx
  };

  global.Page = (definition) => { pageDefinition = definition; };
  global.getApp = () => ({
    registerUgCourseShard() { registered += 1; },
    completeUgCourseShardActivation() { completed += 1; }
  });
  global.getCurrentPages = () => loaderPath.includes('polyu-b')
    ? [caller, firstLoader, currentLoader]
    : [caller, currentLoader];
  global.wx = {
    reLaunch({ url }) { reLaunchUrl = url; }
  };

  require(loaderPath);

  return {
    run() {
      const page = {};
      pageDefinition.onLoad.call(page);
      pageDefinition.onReady.call(page);
      return { registered, completed, reLaunchUrl };
    },
    restore() {
      Object.entries(previous).forEach(([key, value]) => {
        if (value === undefined) delete global[key];
        else global[key] = value;
      });
      delete require.cache[require.resolve(loaderPath)];
    }
  };
}

test('first package of a split UG university activates without returning early', () => {
  const runtime = loadLoader(POLYU_A_PATH);
  try {
    assert.deepEqual(runtime.run(), {
      registered: 1,
      completed: 1,
      reLaunchUrl: ''
    });
  } finally {
    runtime.restore();
  }
});

test('final package of a split UG university returns to the original caller', () => {
  const runtime = loadLoader(POLYU_B_PATH);
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
