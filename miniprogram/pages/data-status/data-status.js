const service = require('../../utils/courseService');
const releaseInfo = require('../../utils/releaseInfo');
const tpgService = require('../../utils/tpgService');

Page({
  data: {
    releaseInfo,
    status: null,
    tpgStatus: null
  },

  onLoad() {
    this.setData({
      status: service.getDataStatus(),
      tpgStatus: tpgService.getSchoolCoverage()
    });
  },

  copySource(event) {
    wx.setClipboardData({
      data: event.currentTarget.dataset.url,
      success() {
        wx.showToast({ title: '官方来源已复制' });
      }
    });
  },

  copyTpgSources() {
    wx.setClipboardData({
      data: this.data.tpgStatus.sourceSummary,
      success() {
        wx.showToast({ title: '六校来源已复制' });
      }
    });
  }
});
