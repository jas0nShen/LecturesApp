App({
  globalData: {
    userProfile: null
  },

  onLaunch() {
    const profile = wx.getStorageSync('userProfile');
    this.globalData.userProfile = profile || null;
    const ugPackages = ['ug-data-cityu-a', 'ug-data-cityu-b', 'ug-data-cuhk', 'ug-data-hku', 'ug-data-hkust', 'ug-data-lingnan', 'ug-data-polyu'];
    this.globalData.ugDataReady = Promise.all(ugPackages.map((name) => new Promise((resolve) => {
      wx.loadSubPackage({ name, success: resolve, fail: resolve });
    })));
  }
});
