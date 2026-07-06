const service = require('../../utils/courseService');
const tpgService = require('../../utils/tpgService');

function buildTrustCards(tpgCoverage, dataStatus) {
  return [
    {
      label: '六校 Programme',
      value: tpgCoverage.programmeCount,
      copy: `${tpgCoverage.schoolCount} 所大学已导入`
    },
    {
      label: '已拆课程',
      value: tpgCoverage.courseCount,
      copy: `${tpgCoverage.programmeWithCoursesCount} 个 Programme 可看课程组`
    },
    {
      label: '运行模式',
      value: dataStatus.runtime.apiEnabled ? 'DEV' : 'OFFLINE',
      copy: dataStatus.runtime.apiEnabled ? '开发版可连本地 API' : '发布版读取本地数据'
    }
  ];
}

Page({
  data: {
    profile: null,
    isTpg: false,
    tpgProfile: null,
    noteCount: 0,
    noteSummary: '集中整理选课理由和注意事项',
    dataStatus: null,
    tpgCoverage: tpgService.getSchoolCoverage(),
    trustCards: []
  },

  onShow() {
    const noteCount = service.getCourseNotes().length;
    const profile = service.getProfile();
    const tpgProfile = tpgService.getProfileSummary(profile);
    const dataStatus = service.getDataStatus();
    const tpgCoverage = tpgService.getSchoolCoverage();
    this.setData({
      profile,
      isTpg: !!tpgProfile,
      tpgProfile,
      noteCount,
      noteSummary: noteCount ? `已记录 ${noteCount} 门课程` : '集中整理选课理由和注意事项',
      dataStatus,
      tpgCoverage,
      trustCards: buildTrustCards(tpgCoverage, dataStatus)
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
          content: '备份中的资料、收藏、已修记录和 Study Plan 将写入当前设备。确认继续？',
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
