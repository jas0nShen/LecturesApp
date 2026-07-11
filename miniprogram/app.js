App({
  globalData: {
    userProfile: null
  },

  onLaunch() {
    const profile = wx.getStorageSync('userProfile');
    this.globalData.userProfile = profile || null;
    const { createUniversityLoader } = require('./utils/ugLoadService');
    const { getPackageNames } = require('./utils/ugCourseShards');
    const loader = createUniversityLoader({
      getPackageNames,
      loadSubPackage(name) {
        return new Promise((resolve, reject) => wx.loadSubPackage({ name, success: resolve, fail: reject }));
      }
    });
    this.ensureUniversityLoaded = loader.ensureUniversityLoaded;
    this.getUniversityLoadState = loader.getUniversityLoadState;
    this.retryUniversityLoad = loader.retryUniversityLoad;
  }
});
