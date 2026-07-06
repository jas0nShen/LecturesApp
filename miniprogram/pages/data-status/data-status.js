const service = require('../../utils/courseService');
const releaseInfo = require('../../utils/releaseInfo');
const tpgService = require('../../utils/tpgService');

Page({
  data: {
    releaseInfo,
    status: null,
    tpgStatus: null,
    launchBoundaries: [
      {
        mark: 'DATA',
        title: '六校 Programme 已可检索',
        copy: 'HKU、CUHK、HKUST、PolyU、CityU、HKBU 的授课硕士 Programme 索引随包发布。'
      },
      {
        mark: 'READY',
        title: '已拆课程组可看结构',
        copy: '已完成课程组复核的 Programme 会展示必修、选修和课程清单。'
      },
      {
        mark: 'SAFE',
        title: '未拆项目不生成毕业判断',
        copy: '课程组待开放的 Programme 只展示索引与资料来源，避免给出不完整结论。'
      }
    ]
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
