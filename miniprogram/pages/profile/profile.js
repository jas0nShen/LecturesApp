const service = require('../../utils/courseService');

Page({
  data: {
    profile: null
  },

  onShow() {
    this.setData({ profile: service.getProfile() });
  },

  goOnboarding() {
    wx.navigateTo({ url: '/pages/onboarding/onboarding' });
  }
});
