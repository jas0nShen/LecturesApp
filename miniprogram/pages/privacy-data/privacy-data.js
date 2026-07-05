const service = require('../../utils/courseService');

Page({
  data: {
    summary: null
  },

  onShow() {
    this.setData({ summary: service.getUserDataSummary() });
  },

  copyBackup() {
    wx.setClipboardData({
      data: JSON.stringify(service.exportUserData()),
      success() {
        wx.showToast({ title: '备份已复制' });
      }
    });
  },

  clearAllData() {
    wx.showModal({
      title: '清除全部本机数据？',
      content: '资料、收藏、已修记录、Study Plan、笔记和搜索记录都会被删除。建议先复制备份。',
      confirmText: '继续',
      confirmColor: '#9b443d',
      success: (firstResult) => {
        if (!firstResult.confirm) return;
        wx.showModal({
          title: '最后确认',
          content: '清除后无法恢复。确认删除这台设备上的全部课程助手数据？',
          confirmText: '全部清除',
          confirmColor: '#9b443d',
          success: (secondResult) => {
            if (!secondResult.confirm) return;
            this.setData({ summary: service.clearUserData() });
            wx.showToast({ title: '本机数据已清除' });
          }
        });
      }
    });
  }
});
