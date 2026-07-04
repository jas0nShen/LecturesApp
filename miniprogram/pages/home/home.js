const service = require('../../utils/courseService');

Page({
  data: {
    profile: null,
    audit: {
      completedCredits: 0,
      totalCreditRequired: 240,
      totalProgress: 0
    },
    dataSource: 'loading'
  },

  async onShow() {
    const profile = service.getProfile();
    const auditResult = await service.buildAuditRemote(profile);
    this.setData({
      profile,
      audit: auditResult.data,
      dataSource: auditResult.source
    });
  },

  goOnboarding() {
    wx.navigateTo({ url: '/pages/onboarding/onboarding' });
  },

  goCourses() {
    wx.switchTab({ url: '/pages/courses/courses' });
  },

  goAudit() {
    wx.switchTab({ url: '/pages/audit/audit' });
  },

  goFavorites() {
    wx.navigateTo({ url: '/pages/favorites/favorites' });
  },

  goProfile() {
    wx.switchTab({ url: '/pages/profile/profile' });
  }
});
