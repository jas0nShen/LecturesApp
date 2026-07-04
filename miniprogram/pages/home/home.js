const service = require('../../utils/courseService');

Page({
  data: {
    profile: null,
    audit: {
      completedCredits: 0,
      totalCreditRequired: 240,
      totalProgress: 0
    },
    dataSource: 'loading',
    recentCourses: []
  },

  async onShow() {
    const profile = service.getProfile();
    const auditResult = await service.buildAuditRemote(profile);
    const recentCourses = service.getRecentlyViewedOfferings().slice(0, 3).map((course) => ({
      ...course,
      termLabel: course.terms.join(' / ')
    }));
    this.setData({
      profile,
      audit: auditResult.data,
      recentCourses,
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

  goStudyPlan() {
    wx.navigateTo({ url: '/pages/study-plan/study-plan' });
  },

  goRecentCourse(event) {
    wx.navigateTo({
      url: `/pages/offering-detail/offering-detail?code=${event.currentTarget.dataset.code}`
    });
  },

  goProfile() {
    wx.switchTab({ url: '/pages/profile/profile' });
  }
});
