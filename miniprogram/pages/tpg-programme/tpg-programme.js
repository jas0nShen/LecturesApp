const tpgService = require('../../utils/tpgService');

Page({
  data: {
    programme: null,
    university: null,
    statusTitle: '',
    statusCopy: '',
    hasCourseGroups: false
  },

  onLoad(options) {
    const id = decodeURIComponent(options.id || '');
    const programme = tpgService.getProgramme(id);
    if (!programme) {
      wx.showToast({ title: 'Programme 不存在', icon: 'none' });
      return;
    }

    const university = tpgService.getProgrammeUniversity(programme);
    const status = tpgService.getStatus(programme);

    this.setData({
      programme,
      university,
      hasCourseGroups: status.hasCourseGroups,
      statusTitle: status.title,
      statusCopy: status.copy
    });
  },

  copyOfficialLink() {
    const url = this.data.programme && this.data.programme.sourceUrl;
    if (!url) {
      wx.showToast({ title: '官方链接整理中', icon: 'none' });
      return;
    }
    wx.setClipboardData({ data: url });
  },

  onShareAppMessage() {
    const programme = this.data.programme;
    if (!programme) return {};
    return {
      title: `${programme.universityCode} · ${programme.name}`,
      path: `/pages/tpg-programme/tpg-programme?id=${encodeURIComponent(programme.id)}`
    };
  }
});
