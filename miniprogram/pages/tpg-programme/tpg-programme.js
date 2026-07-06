const service = require('../../utils/courseService');
const tpgService = require('../../utils/tpgService');

Page({
  data: {
    programme: null,
    university: null,
    statusTitle: '',
    statusCopy: '',
    hasCourseGroups: false,
    courseCount: 0,
    isCurrentProgramme: false
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
      courseCount: status.courseCount,
      statusTitle: status.title,
      statusCopy: status.copy
    });
    this.refreshCurrentProgrammeState();
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
    const url = this.data.programme && this.data.programme.sourceUrl;
    if (!url) {
      wx.showToast({ title: '官方链接整理中', icon: 'none' });
      return;
    }
    wx.setClipboardData({
      data: url,
      success() {
        wx.showToast({ title: '官方链接已复制' });
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
      courseCount: this.data.courseCount
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
