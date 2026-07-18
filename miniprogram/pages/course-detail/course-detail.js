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
    ugPlanningSupported: false,
    ugPlanningReason: '',
    tpgPlanningSupported: false,
    tpgPlanningReason: '',
    dataSource: 'loading',
    isUgCourse: false,
    isTpgCourse: false,
    ugProgrammeId: '',
    ugMajorId: '',
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
      const app = typeof getApp === 'function' ? (getApp({ allowDefault: true }) || {}) : {};
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
      const app = typeof getApp === 'function' ? (getApp({ allowDefault: true }) || {}) : {};
      const universityCode = options.universityCode || ugService.inferUniversityCodeFromCourseId(options.ugId);
      try {
        if (universityCode && app.ensureUniversityLoaded) await app.ensureUniversityLoaded(universityCode);
      } catch (error) {
        this.setData({ dataSource: 'error', isUgCourse: true, loadError: true, routeOptions: options });
        wx.showToast({ title: '课程数据加载失败，请重试', icon: 'none' });
        return;
      }
      const item = ugService.getCatalogueCourse(options.ugId, universityCode);
      const profile = service.getProfile();
      const isCurrentMajor = Boolean(
        item
        && profile
        && profile.profileType === 'undergraduate'
        && String(profile.programmeId) === String(item.programmeId)
        && String(profile.majorId) === String(item.majorId)
      );
      const planningCapability = service.getPlanningCapability(profile);
      const ugPlanningSupported = Boolean(
        item
        && isCurrentMajor
        && planningCapability.supported
        && planningCapability.mode === 'ug-course-plan'
      );
      let ugPlanningReason = '';
      if (!isCurrentMajor) ugPlanningReason = '请先将这门课所属的 Programme 和 Major 设为当前本科范围。';
      else if (!ugPlanningSupported) ugPlanningReason = planningCapability.reason || '当前 Major 暂不支持课程计划。';
      const major = item ? ugService.getMajor(item.majorId) : null;
      const course = item ? {
        ...item,
        department: major ? major.nameEn : '',
        language: item.language || '以学校公布为准',
        prerequisites: item.prerequisites || '请查阅学校课程资料',
        exclusions: item.exclusions || '请查阅学校课程资料',
        description: item.description || `${major ? major.nameEn : 'Undergraduate'} · ${item.courseType || 'programme course'}`,
        officialUrl: item.sourceUrl || '',
        lastVerifiedAt: item.lastVerifiedAt || ''
      } : null;
      this.setData({
        course,
        typeLabel: course ? service.TYPE_LABELS[course.courseType] : '',
        favorite: false,
        completed: item ? service.isUgCourseCompleted(item.programmeId, item.majorId, item.id) : false,
        planned: item ? service.isUgCoursePlanned(item.programmeId, item.majorId, item.id) : false,
        ugPlanningSupported,
        ugPlanningReason,
        dataSource: '本科本地资料库',
        isUgCourse: true,
        isTpgCourse: false,
        ugProgrammeId: item ? item.programmeId : '',
        ugMajorId: item ? item.majorId : ''
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
      const app = typeof getApp === 'function' ? (getApp({ allowDefault: true }) || {}) : {};
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
    if (!this.data.course) return;
    if (this.data.isUgCourse) {
      service.toggleUgCourseCompleted(this.data.ugProgrammeId, this.data.ugMajorId, this.data.course.id);
      this.setData({ completed: service.isUgCourseCompleted(this.data.ugProgrammeId, this.data.ugMajorId, this.data.course.id) });
      return;
    }
    if (this.data.isTpgCourse) {
      service.toggleTpgCourseCompleted(this.data.tpgProgrammeId, this.data.course.courseCode);
      this.setData({ completed: service.isTpgCourseCompleted(this.data.tpgProgrammeId, this.data.course.courseCode) });
      return;
    }
    service.toggleCompleted(this.data.course.id);
    this.setData({ completed: service.getCompletedCourseIds().includes(this.data.course.id) });
  },

  togglePlanned() {
    if (!this.data.course) return;
    if (this.data.isUgCourse) {
      if (!this.data.ugPlanningSupported) {
        wx.showToast({ title: this.data.ugPlanningReason || '当前课程暂不能加入计划', icon: 'none' });
        return;
      }
      service.toggleUgPlannedCourse(this.data.ugProgrammeId, this.data.ugMajorId, this.data.course.id);
      this.setData({ planned: service.isUgCoursePlanned(this.data.ugProgrammeId, this.data.ugMajorId, this.data.course.id) });
      return;
    }
    if (!this.data.isTpgCourse) return;
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
