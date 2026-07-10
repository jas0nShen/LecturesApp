App({
  globalData: {
    userProfile: null
  },

  onLaunch() {
    const profile = wx.getStorageSync('userProfile');
    this.globalData.userProfile = profile || null;
    this.globalData.ugDataReady = new Promise((resolve) => {
      wx.loadSubPackage({ name: 'ug-data', success: resolve, fail: resolve });
    });
  }
});
