const service = require('../../utils/courseService');
const feedbackService = require('../../utils/feedbackService');
const tpgService = require('../../utils/tpgService');

Page({
  data: {
    programme: null,
    university: null,
    statusTitle: '',
    statusCopy: '',
    hasCourseGroups: false,
    courseCount: 0,
    isCurrentProgramme: false,
    loadError: false,
    programmeId: ''
  },

  async onLoad(options) {
    const id = decodeURIComponent(options.id || '');
    this.setData({ programmeId: id, loadError: false });
    let programme = tpgService.getProgramme(id);
    if (!programme) {
      wx.showToast({ title: 'Programme 不存在', icon: 'none' });
      return;
    }
    const app = typeof getApp === 'function' ? getApp() : {};
    try {
      if (app.ensureTpgUniversityLoaded) await app.ensureTpgUniversityLoaded(programme.universityCode);
    } catch (error) {
      this.setData({ loadError: true });
      return;
    }
    programme = tpgService.getProgramme(id);

    const university = tpgService.getProgrammeUniversity(programme);
    const status = tpgService.getStatus(programme);
    this.setData({
      programme,
      university,
      hasCourseGroups: status.hasCourseGroups,
      courseCount: status.courseCount,
      statusTitle: status.title,
      statusCopy: status.copy
    });
    this.refreshCurrentProgrammeState();
  },

  retryLoad() {
    const programme = tpgService.getProgramme(this.data.programmeId);
    const app = typeof getApp === 'function' ? getApp() : {};
    if (!programme || !app.retryTpgUniversityLoad) return this.onLoad({ id: encodeURIComponent(this.data.programmeId) });
    this.setData({ loadError: false });
    app.retryTpgUniversityLoad(programme.universityCode).then(() => this.onLoad({ id: encodeURIComponent(this.data.programmeId) })).catch(() => {
      this.setData({ loadError: true });
      wx.showToast({ title: '暂时无法加载，请稍后重试', icon: 'none' });
    });
  },

  onShow() {
    this.refreshCurrentProgrammeState();
  },

  refreshCurrentProgrammeState() {
    const programme = this.data.programme;
    if (!programme) return;
    const profile = service.getProfile();
    this.setData({
      isCurrentProgramme: profile && profile.profileType === 'tpg' && profile.programmeId === programme.id
    });
  },

  copyOfficialLink() {
    const programme = this.data.programme;
    if (!programme) return;
    const data = programme.sourceUrl || tpgService.buildProgrammeSourceText(programme);
    wx.setClipboardData({
      data,
      success: () => {
        wx.showToast({ title: programme.sourceUrl ? '官方链接已复制' : '资料来源已复制' });
      }
    });
  },

  copyFeedbackTemplate() {
    const programme = this.data.programme;
    if (!programme) return;
    const template = feedbackService.buildFeedbackTemplate(service.getProfile(), { programme });
    wx.setClipboardData({
      data: template,
      success() {
        wx.showToast({ title: '反馈模板已复制' });
      }
    });
  },

  saveAsMyProgramme() {
    if (this.data.isCurrentProgramme) {
      wx.showToast({ title: '已经是当前 Programme', icon: 'none' });
      return;
    }
    const programme = this.data.programme;
    const university = this.data.university;
    if (!programme || !university) return;
    service.saveProfile({
      profileType: 'tpg',
      universityCode: university.code,
      universityName: university.shortName,
      programmeId: programme.id,
      programmeName: programme.name,
      programmeCode: programme.programmeCode,
      faculty: programme.faculty,
      curriculumYear: university.academicYear,
      creditsRequired: programme.creditsRequired,
      courseCount: this.data.courseCount,
      sourceUrl: programme.sourceUrl || ''
    });
    this.setData({ isCurrentProgramme: true });
    wx.showToast({ title: '已设为我的 Programme' });
  },

  goHome() {
    wx.switchTab({ url: '/pages/home/home' });
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
