App({
  globalData: {
    userProfile: null,
    ugCoursesByUniversity: {},
    ugCoursesByPackage: {},
    ugPackageActivation: {}
  },

  onLaunch() {
    const profile = wx.getStorageSync('userProfile');
    this.globalData.userProfile = profile || null;
    this.globalData.ugCoursesByUniversity = {};
    this.globalData.ugCoursesByPackage = {};
    this.globalData.ugPackageActivation = {};
    const { createUniversityLoader } = require('./utils/ugLoadService');
    const { getPackageNames } = require('./utils/ugCourseShards');
    const loader = createUniversityLoader({
      getPackageNames,
      loadSubPackage(name) {
        // Some simulator runtimes preload declared subpackages but do not
        // expose wx.loadSubPackage.  The package is already available there;
        // real runtimes keep the explicit failure/retry path below.
        if (typeof wx.loadSubPackage !== 'function') {
          console.warn(`当前运行环境未提供 wx.loadSubPackage，使用已编译分包：${name}`);
          return Promise.resolve({ name, preloaded: true });
        }
        return new Promise((resolve, reject) => wx.loadSubPackage({
          name,
          success: resolve,
          fail(error) {
            console.error(`本科课程分包加载失败：${name}`, error);
            reject(error);
          }
        }));
      },
      activatePackage: (name) => this.activateUgPackage(name)
    });
    this.ensureUniversityLoaded = loader.ensureUniversityLoaded;
    this.getUniversityLoadState = loader.getUniversityLoadState;
    this.retryUniversityLoad = loader.retryUniversityLoad;
  },

  registerUgCourseShard({ universityCode, packageName, courses }) {
    const code = String(universityCode || '').toUpperCase();
    const activation = this.globalData.ugPackageActivation[packageName];
    if (!this.globalData.ugCoursesByPackage[packageName]) {
      const shardCourses = Array.isArray(courses) ? courses : [];
      this.globalData.ugCoursesByPackage[packageName] = shardCourses;
      this.globalData.ugCoursesByUniversity[code] = (this.globalData.ugCoursesByUniversity[code] || []).concat(shardCourses);
    }
    if (activation) {
      clearTimeout(activation.timer);
      delete this.globalData.ugPackageActivation[packageName];
      activation.resolve();
    }
  },

  activateUgPackage(packageName) {
    if (this.globalData.ugCoursesByPackage[packageName]) return Promise.resolve();
    const existing = this.globalData.ugPackageActivation[packageName];
    if (existing) return existing.promise;

    let resolveActivation;
    let rejectActivation;
    const promise = new Promise((resolve, reject) => {
      resolveActivation = resolve;
      rejectActivation = reject;
    });
    const activation = {
      promise,
      resolve: resolveActivation,
      reject: rejectActivation,
      timer: setTimeout(() => {
        if (this.globalData.ugPackageActivation[packageName] !== activation) return;
        delete this.globalData.ugPackageActivation[packageName];
        rejectActivation(new Error(`本科课程分包激活超时：${packageName}`));
      }, 5000)
    };
    this.globalData.ugPackageActivation[packageName] = activation;
    wx.navigateTo({
      url: `/${packageName}/pages/loader/index`,
      fail: (error) => {
        if (this.globalData.ugPackageActivation[packageName] !== activation) return;
        clearTimeout(activation.timer);
        delete this.globalData.ugPackageActivation[packageName];
        rejectActivation(error);
      }
    });
    return promise;
  }
});
