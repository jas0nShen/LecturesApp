const catalogue = require('../../utils/tpgCatalog');

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
    const programme = catalogue.programmes.find((item) => item.id === id);
    if (!programme) {
      wx.showToast({ title: 'Programme 不存在', icon: 'none' });
      return;
    }

    const university = catalogue.universities.find(
      (item) => item.code === programme.universityCode
    );
    const hasCourseGroups = programme.courseGroups.some(
      (group) => Array.isArray(group.courses) && group.courses.length
    );
    const hasStructure = programme.dataLevel === 'structure';

    this.setData({
      programme,
      university,
      hasCourseGroups,
      statusTitle: hasCourseGroups ? '课程结构已录入' : hasStructure ? '结构资料待拆分' : 'Programme 索引',
      statusCopy: hasCourseGroups
        ? '以下必修与选修课程已从资料中录入，仍建议在选课前对照学校官网。'
        : hasStructure
          ? 'PDF 中包含部分结构信息，课程名称与分组仍在逐项整理。'
          : '当前已确认 Programme 基本资料，必修与选修课程尚未完成核验。'
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
