const service = require('../../utils/courseService');
const ugService = require('../../utils/ugService');

const UG_YEAR_VALUES = ['', '1', '2', '3', '4', '5', '6'];
const UG_YEAR_LABELS = ['待安排', 'Year 1', 'Year 2', 'Year 3', 'Year 4', 'Year 5', 'Year 6'];
const UG_TERM_VALUES = ['', '1', '2', '3', 'summer', 'full year'];
const UG_TERM_LABELS = ['待安排', 'Term 1', 'Term 2', 'Term 3', 'Summer', 'Full Year'];

Page({
  data: {
    mode: 'hku-four-year-plan',
    loading: false,
    loadError: false,
    unsupportedMessage: '',
    routeOptions: null,
    course: null,
    yearOptions: ['1', '2', '3', '4'],
    yearIndex: 0,
    termOptions: [],
    termLabels: [],
    termIndex: 0,
    ugCourse: null,
    ugProgrammeId: '',
    ugMajorId: '',
    ugUniversityCode: '',
    ugMajorName: '',
    ugYearLabels: UG_YEAR_LABELS,
    ugYearIndex: 0,
    ugTermLabels: UG_TERM_LABELS,
    ugTermIndex: 0,
    officialYearLabel: '未提供',
    officialTermLabel: '未提供'
  },

  async onLoad(options) {
    if (options.ugId) {
      await this.loadUgCourse(options);
      return;
    }
    const data = service.getCourseOffering(options.code);
    if (!data) return;

    const existing = service.getStudyPlanItems().find((item) => item.courseCode === data.offering.courseCode);
    const profile = service.getProfile();
    const termOptions = data.offering.terms;
    const plannedYear = existing ? existing.plannedYear : (profile && profile.currentYear) || 1;
    const plannedTerm = existing ? existing.plannedTerm : termOptions[0];

    this.setData({
      mode: 'hku-four-year-plan',
      course: data.offering,
      termOptions,
      termLabels: termOptions.map((term) => term === 'full year' ? 'Full Year' : `Semester ${term}`),
      yearIndex: Math.max(0, this.data.yearOptions.indexOf(String(plannedYear))),
      termIndex: Math.max(0, termOptions.indexOf(String(plannedTerm)))
    });
  },

  async loadUgCourse(options) {
    this.setData({ mode: 'ug-course-plan', loading: true, loadError: false, unsupportedMessage: '', routeOptions: options });
    const app = typeof getApp === 'function' ? (getApp({ allowDefault: true }) || {}) : {};
    try {
      if (options.universityCode && app.ensureUniversityLoaded) await app.ensureUniversityLoaded(options.universityCode);
    } catch (error) {
      this.setData({ loading: false, loadError: true, unsupportedMessage: '本科课程数据加载失败，请重试。' });
      return;
    }
    const course = ugService.getCatalogueCourse(options.ugId, options.universityCode);
    const profile = service.getProfile();
    const isCurrentMajor = Boolean(
      course
      && profile
      && profile.profileType === 'undergraduate'
      && String(profile.programmeId) === String(course.programmeId)
      && String(profile.majorId) === String(course.majorId)
    );
    if (!course || !isCurrentMajor || !service.isUgCoursePlanned(course.programmeId, course.majorId, course.id)) {
      this.setData({
        loading: false,
        loadError: false,
        unsupportedMessage: course && isCurrentMajor
          ? '这门课程已不在当前本科计划中，请先从课程详情加入计划。'
          : '当前 Programme 或 Major 与课程不匹配，无法调整排期。'
      });
      return;
    }
    const assignment = service.getUgCoursePlanAssignment(course.programmeId, course.majorId, course.id);
    const plannedYear = assignment && assignment.plannedYear !== null ? String(assignment.plannedYear) : '';
    const plannedTerm = assignment ? assignment.plannedTerm : '';
    const recommendedYear = Number(course.recommendedYear);
    const major = ugService.getMajor(course.majorId);
    this.setData({
      loading: false,
      loadError: false,
      unsupportedMessage: '',
      ugCourse: course,
      ugProgrammeId: course.programmeId,
      ugMajorId: course.majorId,
      ugUniversityCode: options.universityCode || profile.universityCode || '',
      ugMajorName: major ? (major.nameEn || major.nameZh || '') : '',
      ugYearIndex: Math.max(0, UG_YEAR_VALUES.indexOf(plannedYear)),
      ugTermIndex: Math.max(0, UG_TERM_VALUES.indexOf(plannedTerm)),
      officialYearLabel: Number.isInteger(recommendedYear) && recommendedYear > 0 ? `Year ${recommendedYear}` : '未提供',
      officialTermLabel: course.semester || '未提供'
    });
  },

  retryUgLoad() {
    return this.loadUgCourse(this.data.routeOptions || {});
  },

  onYearChange(event) {
    this.setData({ yearIndex: Number(event.detail.value) });
  },

  onTermChange(event) {
    this.setData({ termIndex: Number(event.detail.value) });
  },

  onUgYearChange(event) {
    this.setData({ ugYearIndex: Number(event.detail.value) });
  },

  onUgTermChange(event) {
    this.setData({ ugTermIndex: Number(event.detail.value) });
  },

  save() {
    if (this.data.mode === 'ug-course-plan') {
      const plannedYear = UG_YEAR_VALUES[this.data.ugYearIndex];
      const plannedTerm = UG_TERM_VALUES[this.data.ugTermIndex];
      service.saveUgCoursePlanAssignment(
        this.data.ugProgrammeId,
        this.data.ugMajorId,
        this.data.ugCourse.id,
        plannedYear,
        plannedTerm
      );
      wx.showToast({ title: plannedYear && plannedTerm ? '本科排期已保存' : '已保存到待安排' });
      setTimeout(() => wx.navigateBack(), 500);
      return;
    }
    service.saveStudyPlanItem(
      this.data.course.courseCode,
      this.data.yearOptions[this.data.yearIndex],
      this.data.termOptions[this.data.termIndex]
    );
    wx.showToast({ title: '已加入计划' });
    setTimeout(() => wx.navigateBack(), 500);
  },

  clearUgAssignment() {
    service.clearUgCoursePlanAssignment(this.data.ugProgrammeId, this.data.ugMajorId, this.data.ugCourse.id);
    wx.showToast({ title: '已设为待安排' });
    setTimeout(() => wx.navigateBack(), 500);
  }
});
