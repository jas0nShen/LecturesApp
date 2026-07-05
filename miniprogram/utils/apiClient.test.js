const assert = require('node:assert/strict');
const { beforeEach, test } = require('node:test');

let envVersion = 'develop';
let requestCount = 0;

global.wx = {
  getAccountInfoSync() {
    return { miniProgram: { envVersion } };
  },
  request(options) {
    requestCount += 1;
    options.success({ statusCode: 200, data: { ok: true } });
  }
};

const api = require('./apiClient');

beforeEach(() => {
  envVersion = 'develop';
  requestCount = 0;
});

test('development runtime enables the local API', async () => {
  assert.deepEqual(api.getRuntimeConfig(), {
    envVersion: 'develop',
    envLabel: '开发版',
    apiBaseUrl: 'http://localhost:3000',
    apiEnabled: true,
    modeLabel: '本地 API + 离线回退'
  });
  assert.deepEqual(await api.request('/health'), { ok: true });
  assert.equal(requestCount, 1);
});

test('trial and release runtimes skip localhost requests', async () => {
  envVersion = 'trial';
  assert.equal(api.getRuntimeConfig().apiEnabled, false);
  assert.equal(api.getRuntimeConfig().modeLabel, '离线数据');
  await assert.rejects(() => api.request('/health'), /disabled/);
  assert.equal(requestCount, 0);

  envVersion = 'release';
  assert.equal(api.getRuntimeConfig().apiBaseUrl, '');
});
