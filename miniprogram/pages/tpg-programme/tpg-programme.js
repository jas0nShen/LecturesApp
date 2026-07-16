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
    courseGroups: [],
    creditsRequired: 0,
    selectedTrack: null,
    trackSelectionRequired: false,
    isCurrentProgramme: false,
    tpgPlanningSupported: false,
    tpgPlanningReason: '',
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
    const profile = service.getProfile();
    const savedTrackId = profile && profile.profileType === 'tpg' && profile.programmeId === programme.id ? profile.trackId || '' : '';
    const trackId = tpgService.isTrackSelectionComplete(programme, savedTrackId) ? savedTrackId : '';
    const courseGroups = tpgService.resolveCourseGroups(programme, trackId);
    this.setData({
      programme,
      university,
      hasCourseGroups: status.hasCourseGroups,
      courseCount: courseGroups.reduce((sum, group) => sum + group.courses.length, 0),
      courseGroups,
      creditsRequired: tpgService.getCreditsRequired(programme, trackId),
      selectedTrack: trackId ? tpgService.getTrack(programme.id, trackId) : null,
      trackSelectionRequired: tpgService.listTracks(programme).length > 0 && !programme.trackSelectionOptional,
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
    const isSavedProgramme = Boolean(profile && profile.profileType === 'tpg' && profile.programmeId === programme.id);
    const savedTrackId = isSavedProgramme ? profile.trackId || '' : '';
    const isCurrentProgramme = isSavedProgramme && tpgService.isTrackSelectionComplete(programme, savedTrackId);
    const trackId = isCurrentProgramme ? savedTrackId : '';
    const courseGroups = tpgService.resolveCourseGroups(programme, trackId);
    const status = tpgService.getStatus(programme);
    const planningCapability = service.getPlanningCapability(profile);
    const tpgPlanningSupported = Boolean(
      isCurrentProgramme
      && status.isComplete
      && planningCapability.supported
      && planningCapability.mode === 'tpg-course-plan'
    );
    let tpgPlanningReason = '';
    if (!isSavedProgramme) tpgPlanningReason = '请先将此 Programme 设为当前课程范围。';
    else if (status.isBlocked || !status.hasCourseGroups) tpgPlanningReason = '此 Programme 的课程结构尚未开放，暂不能使用选课计划。';
    else if (!tpgService.isTrackSelectionComplete(programme, savedTrackId)) tpgPlanningReason = '请先选择完整的 Track，再使用选课计划。';
    else if (!tpgPlanningSupported) tpgPlanningReason = planningCapability.reason || '当前 Programme 暂不支持选课计划。';
    this.setData({
      isCurrentProgramme,
      courseGroups,
      courseCount: courseGroups.reduce((sum, group) => sum + group.courses.length, 0),
      creditsRequired: tpgService.getCreditsRequired(programme, trackId),
      selectedTrack: trackId ? tpgService.getTrack(programme.id, trackId) : null,
      trackSelectionRequired: tpgService.listTracks(programme).length > 0 && !programme.trackSelectionOptional,
      tpgPlanningSupported,
      tpgPlanningReason
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
    const trackId = this.data.selectedTrack ? this.data.selectedTrack.id : '';
    if (!tpgService.isTrackSelectionComplete(programme, trackId)) {
      wx.showToast({ title: '请先选择 Track', icon: 'none' });
      service.openOnboarding({
        profileType: 'tpg',
        universityCode: university.code,
        programmeId: programme.id
      });
      return;
    }
    service.saveProfile({
      profileType: 'tpg',
      universityCode: university.code,
      universityName: university.shortName,
      programmeId: programme.id,
      programmeName: programme.name,
      programmeCode: programme.programmeCode,
      trackId,
      trackName: this.data.selectedTrack ? this.data.selectedTrack.name : '',
      trackType: this.data.selectedTrack ? this.data.selectedTrack.type : '',
      faculty: programme.faculty,
      curriculumYear: university.academicYear,
      creditsRequired: tpgService.getCreditsRequired(programme, trackId),
      courseCount: this.data.courseCount,
      sourceUrl: programme.sourceUrl || ''
    });
    this.setData({ isCurrentProgramme: true });
    wx.showToast({ title: '已设为我的 Programme' });
  },

  goHome() {
    wx.switchTab({ url: '/pages/home/home' });
  },

  goTpgStudyPlan() {
    if (!this.data.tpgPlanningSupported) {
      wx.showToast({ title: this.data.tpgPlanningReason || '当前 Programme 暂不能使用选课计划', icon: 'none' });
      return;
    }
    wx.navigateTo({ url: '/pages/study-plan/study-plan' });
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
