const service = require('../../utils/courseService');
const releaseInfo = require('../../utils/releaseInfo');
const tpgService = require('../../utils/tpgService');

function buildLaunchBoundaries(dataStatus, tpgCoverage) {
  return [
    {
      mark: '01',
      title: '不要求登录',
      copy: '首发版本不需要微信登录或学校账号登录；你的 Programme、收藏和计划保存在本机。'
    },
    {
      mark: '02',
      title: dataStatus.runtime.apiEnabled ? '开发版可连接本机服务' : '正式版离线运行',
      copy: dataStatus.runtime.apiEnabled
        ? '开发环境会优先连接本机服务；体验版和正式版直接读取离线数据，避免发布后依赖开发环境。'
        : '发布环境直接读取随包发布的数据快照，不依赖开发机或外部登录。'
    },
    {
      mark: '03',
      title: `${tpgCoverage.schoolCount} 校 ${tpgCoverage.programmeCount} 个 Programme`,
      copy: `${tpgCoverage.courseCount} 门课程已拆分；未拆分项目只展示索引与来源，不生成毕业判断。`
    }
  ];
}

Page({
  data: {
    summary: null,
    dataStatus: null,
    releaseInfo,
    tpgCoverage: null,
    launchBoundaries: []
  },

  onShow() {
    const dataStatus = service.getDataStatus();
    const tpgCoverage = tpgService.getSchoolCoverage();
    this.setData({
      summary: service.getUserDataSummary(),
      dataStatus,
      tpgCoverage,
      launchBoundaries: buildLaunchBoundaries(dataStatus, tpgCoverage)
    });
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
