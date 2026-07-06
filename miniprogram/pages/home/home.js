const service = require('../../utils/courseService');
const tpgService = require('../../utils/tpgService');

Page({
  data: {
    profile: null,
    audit: {
      completedCredits: 0,
      totalCreditRequired: 240,
      totalProgress: 0
    },
    dataSource: 'loading',
    recentCourses: [],
    isTpg: false,
    tpgProfile: null,
    tpgCoverage: tpgService.getSchoolCoverage()
  },

  async onShow() {
    const profile = service.getProfile();
    const isTpg = profile && profile.profileType === 'tpg';
    const tpgProfile = tpgService.getProfileSummary(profile);
    const auditResult = isTpg
      ? {
          data: {
            completedCredits: 0,
            totalCreditRequired: profile.creditsRequired || 0,
            totalProgress: 0
          },
          source: 'catalogue'
        }
      : await service.buildAuditRemote(profile);
    const recentCourses = service.getRecentlyViewedOfferings().slice(0, 3).map((course) => ({
      ...course,
      termLabel: course.terms.join(' / ')
    }));
    this.setData({
      profile,
      isTpg,
      tpgProfile,
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

  goTpgCatalog() {
    wx.navigateTo({ url: '/pages/tpg-catalog/tpg-catalog' });
  },

  goSelectedTpg() {
    const profile = this.data.profile;
    wx.navigateTo({
      url: `/pages/tpg-programme/tpg-programme?id=${encodeURIComponent(profile.programmeId)}`
    });
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
