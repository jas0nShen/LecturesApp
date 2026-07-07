const service = require('../../utils/courseService');
const releaseInfo = require('../../utils/releaseInfo');
const tpgService = require('../../utils/tpgService');
const ugService = require('../../utils/ugService');

Page({
  data: {
    releaseInfo,
    status: null,
    tpgStatus: null,
    ugStatus: null
  },

  onLoad() {
    this.setData({
      status: service.getDataStatus(),
      tpgStatus: tpgService.getSchoolCoverage(),
      ugStatus: ugService.getCatalogueSummary()
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
        wx.showToast({ title: '资料来源已复制' });
      }
    });
  },

  copyUgSummary() {
    const status = this.data.ugStatus;
    const text = [
      '本科资料库状态',
      `学校：${status.universityCount}`,
      `Programme：${status.sourceProgrammeCount}`,
      `Major / Track：${status.majorCount}`,
      `已录入课程代码：${status.codedCourseCount}`,
      '说明：Programme / Major 已接入；毕业规则和课程清单按公开资料逐步复核开放。'
    ].join('\n');
    wx.setClipboardData({
      data: text,
      success() {
        wx.showToast({ title: '本科状态已复制' });
      }
    });
  }
});
