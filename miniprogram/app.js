App({
  globalData: {
    userProfile: null
  },

  onLaunch() {
    const profile = wx.getStorageSync('userProfile');
    this.globalData.userProfile = profile || null;
  }
});
