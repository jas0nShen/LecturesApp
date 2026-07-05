const service = require('../../utils/courseService');

Page({
  data: {
    profile: null,
    noteCount: 0,
    noteSummary: '集中整理选课理由和注意事项',
    dataStatus: null
  },

  onShow() {
    const noteCount = service.getCourseNotes().length;
    this.setData({
      profile: service.getProfile(),
      noteCount,
      noteSummary: noteCount ? `已记录 ${noteCount} 门课程` : '集中整理选课理由和注意事项',
      dataStatus: service.getDataStatus()
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
