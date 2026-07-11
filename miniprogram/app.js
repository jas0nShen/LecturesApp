App({
  globalData: {
    userProfile: null,
    ugCoursesByUniversity: {},
    ugCoursesByPackage: {},
    ugPackageActivation: {},
    tpgProgrammesByUniversity: {},
    tpgProgrammesByPackage: {},
    tpgPackageActivation: {}
  },

  onLaunch() {
    const profile = wx.getStorageSync('userProfile');
    this.globalData.userProfile = profile || null;
    this.globalData.ugCoursesByUniversity = {};
    this.globalData.ugCoursesByPackage = {};
    this.globalData.ugPackageActivation = {};
    this.globalData.tpgProgrammesByUniversity = {};
    this.globalData.tpgProgrammesByPackage = {};
    this.globalData.tpgPackageActivation = {};
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

    const tpgShards = require('./utils/tpgCourseShards');
    const tpgLoader = createUniversityLoader({
      getPackageNames: tpgShards.getPackageNames,
      loadSubPackage(name) {
        if (typeof wx.loadSubPackage !== 'function') {
          console.warn(`当前运行环境未提供 wx.loadSubPackage，使用已编译硕士分包：${name}`);
          return Promise.resolve({ name, preloaded: true });
        }
        return new Promise((resolve, reject) => wx.loadSubPackage({
          name,
          success: resolve,
          fail(error) {
            console.error(`硕士课程分包加载失败：${name}`, error);
            reject(error);
          }
        }));
      },
      activatePackage: (name) => this.activateTpgPackage(name)
    });
    this.ensureTpgUniversityLoaded = tpgLoader.ensureUniversityLoaded;
    this.getTpgUniversityLoadState = tpgLoader.getUniversityLoadState;
    this.retryTpgUniversityLoad = tpgLoader.retryUniversityLoad;
  },

  registerUgCourseShard({ universityCode, packageName, courses }) {
    const code = String(universityCode || '').toUpperCase();
    if (!this.globalData.ugCoursesByPackage[packageName]) {
      const shardCourses = Array.isArray(courses) ? courses : [];
      this.globalData.ugCoursesByPackage[packageName] = shardCourses;
      this.globalData.ugCoursesByUniversity[code] = (this.globalData.ugCoursesByUniversity[code] || []).concat(shardCourses);
    }
  },

  registerTpgProgrammeShard({ universityCode, packageName, programmes }) {
    const code = String(universityCode || '').toUpperCase();
    if (!this.globalData.tpgProgrammesByPackage[packageName]) {
      const shardProgrammes = Array.isArray(programmes) ? programmes : [];
      this.globalData.tpgProgrammesByPackage[packageName] = shardProgrammes;
      this.globalData.tpgProgrammesByUniversity[code] = (this.globalData.tpgProgrammesByUniversity[code] || []).concat(shardProgrammes);
    }
  },

  completeTpgProgrammeShardActivation(packageName) {
    const activation = this.globalData.tpgPackageActivation[packageName];
    if (activation) {
      clearTimeout(activation.timer);
      delete this.globalData.tpgPackageActivation[packageName];
      activation.resolve();
    }
  },

  completeUgCourseShardActivation(packageName) {
    const activation = this.globalData.ugPackageActivation[packageName];
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
  },

  activateTpgPackage(packageName) {
    if (this.globalData.tpgProgrammesByPackage[packageName]) return Promise.resolve();
    const existing = this.globalData.tpgPackageActivation[packageName];
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
        if (this.globalData.tpgPackageActivation[packageName] !== activation) return;
        delete this.globalData.tpgPackageActivation[packageName];
        rejectActivation(new Error(`硕士课程分包激活超时：${packageName}`));
      }, 5000)
    };
    this.globalData.tpgPackageActivation[packageName] = activation;
    wx.navigateTo({
      url: `/${packageName}/pages/loader/index`,
      fail: (error) => {
        if (this.globalData.tpgPackageActivation[packageName] !== activation) return;
        clearTimeout(activation.timer);
        delete this.globalData.tpgPackageActivation[packageName];
        rejectActivation(error);
      }
    });
    return promise;
  }
});
