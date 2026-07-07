const service = require('../../utils/courseService');
const releaseInfo = require('../../utils/releaseInfo');

function buildLocalBoundaries(dataStatus) {
  return [
    {
      mark: '01',
      title: '不要求登录',
      copy: '当前版本不需要微信登录或学校账号登录；你的 Programme、收藏和计划保存在本机。'
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
      title: '课程资料分层开放',
      copy: '已开放课程组的 Programme 会展示课程结构；未开放项目只展示索引与来源，不生成毕业判断。'
    }
  ];
}

Page({
  data: {
    summary: null,
    dataStatus: null,
    releaseInfo,
    localBoundaries: []
  },

  onShow() {
    const dataStatus = service.getDataStatus();
    this.setData({
      summary: service.getUserDataSummary(),
      dataStatus,
      localBoundaries: buildLocalBoundaries(dataStatus)
    });
  },

  copyBackup() {
    wx.setClipboardData({
      data: service.formatUserDataBackup(),
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
          content: '备份中的学校专业、收藏、已修记录、Study Plan、笔记和搜索记录会写入当前设备。确认继续？',
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
