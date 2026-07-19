const assert = require('node:assert/strict');
const test = require('node:test');
const { createUniversityLoader } = require('./ugLoadService');
const { getPackageNames } = require('./ugCourseShards');

function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((onResolve, onReject) => {
    resolve = onResolve;
    reject = onReject;
  });
  return { promise, resolve, reject };
}

test('loads one university package once and deduplicates concurrent callers', async () => {
  const pending = deferred();
  const calls = [];
  const loader = createUniversityLoader({
    getPackageNames: (code) => (code === 'HKU' ? ['subpackages/ug-data-hku'] : []),
    loadSubPackage: (name) => { calls.push(name); return pending.promise; }
  });

  const first = loader.ensureUniversityLoaded('hku');
  const second = loader.ensureUniversityLoaded('HKU');
  assert.strictEqual(first, second);
  assert.equal(loader.getUniversityLoadState('HKU'), 'loading');
  assert.deepEqual(calls, ['subpackages/ug-data-hku']);
  pending.resolve();
  assert.equal((await first).state, 'ready');
  assert.equal(loader.getUniversityLoadState('HKU'), 'ready');
});

test('treats all split university shards as one atomic university load', async () => {
  const calls = [];
  const activations = [];
  const loader = createUniversityLoader({
    getPackageNames: (code) => (code === 'POLYU' ? ['subpackages/ug-data-polyu-a', 'subpackages/ug-data-polyu-b'] : []),
    loadSubPackage: (name) => { calls.push(name); return Promise.resolve(); },
    activatePackage: (name) => { activations.push(name); return Promise.resolve(); }
  });

  await loader.ensureUniversityLoaded('POLYU');
  assert.deepEqual(calls, ['subpackages/ug-data-polyu-a', 'subpackages/ug-data-polyu-b']);
  assert.deepEqual(activations, ['subpackages/ug-data-polyu-a', 'subpackages/ug-data-polyu-b']);
  assert.equal(loader.getUniversityLoadState('POLYU'), 'ready');
});

test('records failures and retries the same university cleanly', async () => {
  let attempts = 0;
  const loader = createUniversityLoader({
    getPackageNames: () => ['subpackages/ug-data-cityu-a', 'subpackages/ug-data-cityu-b'],
    loadSubPackage: () => {
      attempts += 1;
      return attempts === 1 ? Promise.reject(new Error('offline')) : Promise.resolve();
    }
  });

  await assert.rejects(loader.ensureUniversityLoaded('CITYU'));
  assert.equal(loader.getUniversityLoadState('CITYU'), 'error');
  await assert.rejects(loader.ensureUniversityLoaded('CITYU'));
  await loader.retryUniversityLoad('CITYU');
  assert.equal(loader.getUniversityLoadState('CITYU'), 'ready');
  assert.equal(attempts, 3);
});

test('marks universities with no course package as not required', async () => {
  const loader = createUniversityLoader({
    getPackageNames: () => [],
    loadSubPackage: () => Promise.reject(new Error('should not load'))
  });

  assert.deepEqual(await loader.ensureUniversityLoaded('EDUHK'), {
    code: 'EDUHK', state: 'not_required', packageNames: []
  });
  assert.equal(loader.getUniversityLoadState('EDUHK'), 'not_required');
});

test('all eight launch schools resolve either their own course package or an explicit not-required state', async () => {
  const loaded = [];
  const activated = [];
  const loader = createUniversityLoader({
    getPackageNames,
    loadSubPackage: (name) => { loaded.push(name); return Promise.resolve(); },
    activatePackage: (name) => { activated.push(name); return Promise.resolve(); }
  });
  const expectedStates = {
    HKU: 'ready',
    CUHK: 'ready',
    HKUST: 'ready',
    POLYU: 'ready',
    CITYU: 'ready',
    LINGNAN: 'ready',
    HKBU: 'ready',
    EDUHK: 'not_required'
  };

  for (const [universityCode, state] of Object.entries(expectedStates)) {
    const result = await loader.ensureUniversityLoaded(universityCode);
    assert.equal(result.state, state, universityCode);
    assert.equal(loader.getUniversityLoadState(universityCode), state, universityCode);
  }
  assert.deepEqual(activated, loaded);
  assert.equal(loaded.length, 11);
});
