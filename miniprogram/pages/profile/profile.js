const service = require('../../utils/courseService');
const feedbackService = require('../../utils/feedbackService');
const tpgService = require('../../utils/tpgService');
const ugService = require('../../utils/ugService');

Page({
  data: {
    profile: null,
    isTpg: false,
    tpgProfile: null,
    isUgCatalogue: false,
    ugProfile: null,
    noteCount: 0,
    noteSummary: '集中整理选课理由和注意事项',
    userSummary: null,
    dataStatus: null
  },

  onShow() {
    const noteCount = service.getCourseNotes().length;
    const profile = service.getProfile();
    const tpgProfile = tpgService.getProfileSummary(profile);
    const ugProfile = profile && profile.profileType === 'undergraduate'
      ? ugService.getMajorProfile(profile.programmeId, profile.majorId, profile.curriculumYear)
      : null;
    const isUgCatalogue = Boolean(ugProfile && ugProfile.sourceStatus);
    const dataStatus = service.getDataStatus();
    const userSummary = service.getUserDataSummary();
    this.setData({
      profile,
      isTpg: !!tpgProfile,
      tpgProfile,
      isUgCatalogue,
      ugProfile,
      noteCount,
      noteSummary: noteCount ? `已记录 ${noteCount} 门课程` : '集中整理选课理由和注意事项',
      userSummary,
      dataStatus
    });
  },

  goOnboarding() {
    wx.navigateTo({ url: '/pages/onboarding/onboarding' });
  },

  goCourseNotes() {
    wx.navigateTo({ url: '/pages/course-notes/course-notes' });
  },

  goDataStatus() {
    wx.navigateTo({ url: '/pages/data-status/data-status' });
  },

  goSelectedTpg() {
    const programme = this.data.tpgProfile && this.data.tpgProfile.programme;
    if (!programme) {
      wx.navigateTo({ url: '/pages/tpg-catalog/tpg-catalog' });
      return;
    }
    wx.navigateTo({
      url: `/pages/tpg-programme/tpg-programme?id=${encodeURIComponent(programme.id)}`
    });
  },

  goTpgCatalog() {
    wx.navigateTo({ url: '/pages/tpg-catalog/tpg-catalog' });
  },

  goPrivacyData() {
    wx.navigateTo({ url: '/pages/privacy-data/privacy-data' });
  },

  copyFeedbackTemplate() {
    const template = feedbackService.buildFeedbackTemplate(this.data.profile);
    wx.setClipboardData({
      data: template,
      success() {
        wx.showToast({ title: '反馈模板已复制' });
      }
    });
  },

  copyBackup() {
    const backup = JSON.stringify(service.exportUserData());
    wx.setClipboardData({
      data: backup,
      success() {
        wx.showToast({ title: '备份已复制' });
      }
    });
  },

  restoreBackup() {
    wx.getClipboardData({
      success: ({ data }) => {
        let backup;
        try {
          backup = JSON.parse(data);
          if (!backup || backup.app !== 'lectures-app' || backup.version !== 1) throw new Error('invalid');
        } catch (error) {
          wx.showToast({ title: '剪贴板中没有有效备份', icon: 'none' });
          return;
        }

        wx.showModal({
          title: '恢复本机数据',
          content: '备份中的学校专业、收藏、已修记录、Study Plan、笔记和搜索记录将写入当前设备。确认继续？',
          confirmText: '恢复',
          success: (result) => {
            if (!result.confirm) return;
            try {
              service.importUserData(backup);
              this.onShow();
              wx.showToast({ title: '数据已恢复' });
            } catch (error) {
              wx.showToast({ title: '备份格式不正确', icon: 'none' });
            }
          }
        });
      },
      fail() {
        wx.showToast({ title: '无法读取剪贴板', icon: 'none' });
      }
    });
  }
});
