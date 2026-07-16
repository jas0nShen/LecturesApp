const service = require('../../utils/courseService');
const tpgService = require('../../utils/tpgService');
const ugService = require('../../utils/ugService');

Page({
  data: {
    course: null,
    typeLabel: '',
    favorite: false,
    completed: false,
    planned: false,
    tpgPlanningSupported: false,
    tpgPlanningReason: '',
    dataSource: 'loading',
    isUgCourse: false,
    isTpgCourse: false,
    tpgProgrammeId: '',
    loadError: false,
    routeOptions: null
  },

  onLoad(options) {
    return this.loadCourse(options);
  },

  async loadCourse(options = this.data.routeOptions || {}) {
    this.setData({ loadError: false, dataSource: 'loading', routeOptions: options });
    if (options.tpgProgrammeId && options.courseCode) {
      let programme = tpgService.getProgramme(options.tpgProgrammeId);
      const app = typeof getApp === 'function' ? getApp() : {};
      try {
        if (programme && app.ensureTpgUniversityLoaded) await app.ensureTpgUniversityLoaded(programme.universityCode);
      } catch (error) {
        this.setData({ dataSource: 'error', isTpgCourse: true, tpgProgrammeId: options.tpgProgrammeId, loadError: true, routeOptions: options });
        wx.showToast({ title: '硕士课程数据加载失败，请重试', icon: 'none' });
        return;
      }
      programme = tpgService.getProgramme(options.tpgProgrammeId);
      const university = tpgService.getProgrammeUniversity(programme);
      const profile = service.getProfile();
      const isCurrentProgramme = Boolean(profile && profile.profileType === 'tpg' && profile.programmeId === programme.id);
      const trackId = isCurrentProgramme ? profile.trackId || '' : '';
      const trackSelectionComplete = tpgService.isTrackSelectionComplete(programme, trackId);
      const status = tpgService.getStatus(programme);
      const item = tpgService.getProgrammeCourse(options.tpgProgrammeId, options.courseCode, trackId);
      const planningCapability = service.getPlanningCapability(profile);
      const tpgPlanningSupported = Boolean(
        item
        && isCurrentProgramme
        && trackSelectionComplete
        && status.isComplete
        && planningCapability.supported
        && planningCapability.mode === 'tpg-course-plan'
      );
      let tpgPlanningReason = '';
      if (!isCurrentProgramme) tpgPlanningReason = '请先将此 Programme 设为当前课程范围。';
      else if (status.isBlocked || !status.hasCourseGroups) tpgPlanningReason = '此 Programme 的课程结构尚未开放，暂不能加入计划。';
      else if (!trackSelectionComplete) tpgPlanningReason = '请先选择完整的 Track，再使用选课计划。';
      else if (!item) tpgPlanningReason = '这门课程不属于当前 Track，暂不能加入当前计划。';
      else if (!tpgPlanningSupported) tpgPlanningReason = planningCapability.reason || '当前 Programme 暂不支持选课计划。';
      const course = item ? {
        courseCode: item.code,
        titleEn: item.name,
        titleZh: '',
        credits: item.credits,
        semester: '以学校选课系统为准',
        department: programme && programme.faculty || '',
        language: '以学校公布为准',
        prerequisites: '请查阅 Programme Handbook',
        exclusions: '请查阅学校选课系统',
        description: `${item.groupName} · ${programme ? programme.name : ''}`,
        officialUrl: programme && programme.sourceUrl || '',
        lastVerifiedAt: university && university.academicYear || ''
      } : null;
      this.setData({
        course,
        typeLabel: item ? item.groupName : '',
        favorite: item ? service.isTpgCourseFavorite(options.tpgProgrammeId, item.code) : false,
        completed: item ? service.isTpgCourseCompleted(options.tpgProgrammeId, item.code) : false,
        planned: item ? service.isTpgCoursePlanned(options.tpgProgrammeId, item.code) : false,
        tpgPlanningSupported,
        tpgPlanningReason,
        dataSource: '授课硕士本地资料库',
        isUgCourse: false,
        isTpgCourse: true,
        tpgProgrammeId: options.tpgProgrammeId
      });
      return;
    }
    if (options.ugId) {
      const app = typeof getApp === 'function' ? getApp() : {};
      const universityCode = options.universityCode || ugService.inferUniversityCodeFromCourseId(options.ugId);
      try {
        if (universityCode && app.ensureUniversityLoaded) await app.ensureUniversityLoaded(universityCode);
      } catch (error) {
        this.setData({ dataSource: 'error', isUgCourse: true, loadError: true, routeOptions: options });
        wx.showToast({ title: '课程数据加载失败，请重试', icon: 'none' });
        return;
      }
      const course = ugService.getCatalogueCourse(options.ugId, universityCode);
      this.setData({
        course,
        typeLabel: course ? service.TYPE_LABELS[course.courseType] : '',
        favorite: false,
        completed: false,
        dataSource: '本科本地资料库',
        isUgCourse: true,
        isTpgCourse: false
      });
      return;
    }
    const result = await service.getCourseRemote(options.id);
    const course = result.data;
    if (course) service.recordRecentlyViewed(course.courseCode);
    this.setData({
      course,
      typeLabel: course ? service.TYPE_LABELS[course.courseType] : '',
      favorite: service.isFavorite(options.id),
      completed: service.getCompletedCourseIds().includes(Number(options.id)),
      dataSource: result.source,
      isUgCourse: false,
      isTpgCourse: false
    });
  },

  retryUgLoad() {
    const options = this.data.routeOptions || {};
    if (options.tpgProgrammeId) {
      const programme = tpgService.getProgramme(options.tpgProgrammeId);
      const app = typeof getApp === 'function' ? getApp() : {};
      if (programme && app.retryTpgUniversityLoad) {
        return app.retryTpgUniversityLoad(programme.universityCode).then(() => this.loadCourse(options)).catch(() => {
          wx.showToast({ title: '暂时无法加载，请稍后重试', icon: 'none' });
        });
      }
    }
    return this.loadCourse(this.data.routeOptions || {});
  },

  toggleFavorite() {
    if (this.data.isUgCourse || !this.data.course) return;
    if (this.data.isTpgCourse) {
      service.toggleTpgCourseFavorite(this.data.tpgProgrammeId, this.data.course.courseCode);
      this.setData({ favorite: service.isTpgCourseFavorite(this.data.tpgProgrammeId, this.data.course.courseCode) });
      return;
    }
    service.toggleFavorite(this.data.course.id);
    this.setData({ favorite: service.isFavorite(this.data.course.id) });
  },

  toggleCompleted() {
    if (this.data.isUgCourse || !this.data.course) return;
    if (this.data.isTpgCourse) {
      service.toggleTpgCourseCompleted(this.data.tpgProgrammeId, this.data.course.courseCode);
      this.setData({ completed: service.isTpgCourseCompleted(this.data.tpgProgrammeId, this.data.course.courseCode) });
      return;
    }
    service.toggleCompleted(this.data.course.id);
    this.setData({ completed: service.getCompletedCourseIds().includes(this.data.course.id) });
  },

  togglePlanned() {
    if (!this.data.isTpgCourse || !this.data.course) return;
    if (!this.data.tpgPlanningSupported) {
      wx.showToast({ title: this.data.tpgPlanningReason || '当前课程暂不能加入计划', icon: 'none' });
      return;
    }
    service.toggleTpgPlannedCourse(this.data.tpgProgrammeId, this.data.course.courseCode);
    this.setData({ planned: service.isTpgCoursePlanned(this.data.tpgProgrammeId, this.data.course.courseCode) });
  },

  copyOfficialUrl() {
    if (!this.data.course || !this.data.course.officialUrl) {
      wx.showToast({ title: '暂无官方链接', icon: 'none' });
      return;
    }

    wx.setClipboardData({
      data: this.data.course.officialUrl,
      success() {
        wx.showToast({ title: '官方链接已复制' });
      }
    });
  }
});
