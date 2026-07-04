const service = require('../../utils/courseService');

Page({
  data: {
    audit: {
      sections: [],
      recommendations: [],
      completedCredits: 0,
      totalCreditRequired: 240,
      totalProgress: 0,
      curriculumStructure: []
    },
    dataSource: 'loading'
  },

  onShow() {
    this.refresh();
  },

  async refresh() {
    const profile = service.getProfile() || { programmeId: 1, majorId: 1, curriculumYear: '2025-26' };
    const completedIds = service.getCompletedCourseIds();
    const auditResult = await service.buildAuditRemote(profile, completedIds);
    this.setData({
      audit: auditResult.data,
      dataSource: auditResult.source
    });
  },

  goCompletedCourses() {
    wx.navigateTo({ url: '/pages/completed-courses/completed-courses' });
  },

  copyCurriculumSource() {
    wx.setClipboardData({
      data: this.data.audit.curriculumSourceUrl,
      success() {
        wx.showToast({ title: '官方来源已复制' });
      }
    });
  }
});
