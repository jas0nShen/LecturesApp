const assert = require('node:assert/strict');
const path = require('node:path');
const test = require('node:test');

const LOADER_PATH = path.join(
  __dirname,
  '..',
  'miniprogram',
  'subpackages',
  'tpg-data-polyu',
  'pages',
  'loader',
  'index.js'
);

function loadLoader({ keepLoaderAfterNavigateBack }) {
  delete require.cache[require.resolve(LOADER_PATH)];
  const caller = {
    route: 'pages/courses/courses',
    options: { source: 'study plan' }
  };
  const loader = {
    route: 'subpackages/tpg-data-polyu/pages/loader/index',
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
    registerTpgProgrammeShard() { registered += 1; },
    completeTpgProgrammeShardActivation() { completed += 1; }
  });
  global.getCurrentPages = () => pages;
  global.setTimeout = (callback) => {
    callback();
    return 1;
  };
  global.wx = {
    navigateBack({ success }) {
      if (!keepLoaderAfterNavigateBack) pages = [caller];
      success();
    },
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

test('TPG loader completes through navigateBack when the caller becomes current', () => {
  const runtime = loadLoader({ keepLoaderAfterNavigateBack: false });
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

test('TPG loader reLaunches the caller when navigateBack reports success but leaves the loader current', () => {
  const runtime = loadLoader({ keepLoaderAfterNavigateBack: true });
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
