const service = require('../../utils/courseService');

Page({
  data: {
    status: null
  },

  onLoad() {
    this.setData({ status: service.getDataStatus() });
  },

  copySource(event) {
    wx.setClipboardData({
      data: event.currentTarget.dataset.url,
      success() {
        wx.showToast({ title: '官方来源已复制' });
      }
    });
  }
});
