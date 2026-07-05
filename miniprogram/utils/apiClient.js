const API_BASE_URL = 'http://localhost:3000';

function getEnvVersion() {
  try {
    const accountInfo = wx.getAccountInfoSync();
    return accountInfo.miniProgram.envVersion || 'develop';
  } catch (error) {
    return 'develop';
  }
}

function getRuntimeConfig() {
  const envVersion = getEnvVersion();
  const apiBaseUrl = envVersion === 'develop' ? API_BASE_URL : '';
  const labels = {
    develop: '开发版',
    trial: '体验版',
    release: '正式版'
  };
  return {
    envVersion,
    envLabel: labels[envVersion] || envVersion,
    apiBaseUrl,
    apiEnabled: Boolean(apiBaseUrl),
    modeLabel: apiBaseUrl ? '本地 API + 离线回退' : '离线数据'
  };
}

function request(path, options = {}) {
  const runtime = getRuntimeConfig();
  if (!runtime.apiEnabled) {
    return Promise.reject(new Error('Remote API is disabled for this environment'));
  }

  return new Promise((resolve, reject) => {
    wx.request({
      url: `${runtime.apiBaseUrl}${path}`,
      method: options.method || 'GET',
      data: options.data,
      header: {
        'Content-Type': 'application/json'
      },
      success(response) {
        if (response.statusCode >= 200 && response.statusCode < 300) {
          resolve(response.data);
          return;
        }
        reject(new Error(`API ${response.statusCode}`));
      },
      fail(error) {
        reject(error);
      }
    });
  });
}

function toQuery(params) {
  const query = Object.keys(params)
    .filter((key) => params[key] !== undefined && params[key] !== null && params[key] !== '')
    .map((key) => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
    .join('&');
  return query ? `?${query}` : '';
}

module.exports = {
  API_BASE_URL,
  getRuntimeConfig,
  request,
  toQuery
};
