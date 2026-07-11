const service = require('../../utils/courseService');
const tpgService = require('../../utils/tpgService');

Page({
  data: {
    viewMode: 'offerings',
    courses: [],
    offerings: [],
    tpgCourses: [],
    tpgLoadError: false,
    selectedCodes: [],
    compareReady: false
  },

  async onShow() {
    this.setData({ tpgLoadError: false });
    const result = await service.getFavoriteCoursesRemote();
    const favoriteOfferings = service.getFavoriteOfferings();
    const availableCodes = favoriteOfferings.map((course) => course.courseCode);
    const selectedCodes = this.data.selectedCodes.filter((code) => availableCodes.includes(code));
    const offerings = favoriteOfferings.map((course) => ({
      ...course,
      termLabel: course.terms.join(' / '),
      categoryLabel: course.categories.join(' · '),
      planned: service.isCoursePlanned(course.courseCode),
      selected: selectedCodes.includes(course.courseCode)
    }));
    const tpgKeys = service.getFavoriteTpgCourseKeys();
    const universityCodes = [...new Set(tpgKeys.map((key) => {
      const programme = tpgService.getProgramme(key.slice(0, key.lastIndexOf(':')));
      return programme && programme.universityCode;
    }).filter(Boolean))];
    const app = typeof getApp === 'function' ? getApp() : {};
    let tpgLoadError = false;
    try {
      if (app.ensureTpgUniversityLoaded) await Promise.all(universityCodes.map((code) => app.ensureTpgUniversityLoaded(code)));
    } catch (error) {
      tpgLoadError = true;
      this.setData({ tpgLoadError });
    }
    const tpgCourses = (tpgLoadError ? [] : tpgKeys).map((key) => {
      const separator = key.lastIndexOf(':');
      const programmeId = key.slice(0, separator);
      const courseCode = key.slice(separator + 1);
      const programme = tpgService.getProgramme(programmeId);
      const course = tpgService.getProgrammeCourse(programmeId, courseCode);
      return programme && course ? { ...course, programmeId, programmeName: programme.name } : null;
    }).filter(Boolean);
    this.setData({
      courses: result.data,
      offerings,
      tpgCourses,
      selectedCodes,
      compareReady: selectedCodes.length >= 2
    });
  },

  retryTpgLoad() {
    const app = typeof getApp === 'function' ? getApp() : {};
    const codes = [...new Set(service.getFavoriteTpgCourseKeys().map((key) => {
      const programme = tpgService.getProgramme(key.slice(0, key.lastIndexOf(':')));
      return programme && programme.universityCode;
    }).filter(Boolean))];
    if (!app.retryTpgUniversityLoad) return this.onShow();
    Promise.all(codes.map((code) => app.retryTpgUniversityLoad(code))).then(() => this.onShow()).catch(() => {
      wx.showToast({ title: '暂时无法加载，请稍后重试', icon: 'none' });
    });
  },

  onModeTap(event) {
    this.setData({ viewMode: event.currentTarget.dataset.value });
  },

  goDetail(event) {
    wx.navigateTo({ url: `/pages/course-detail/course-detail?id=${event.currentTarget.dataset.id}` });
  },

  goOfferingDetail(event) {
    wx.navigateTo({
      url: `/pages/offering-detail/offering-detail?code=${event.currentTarget.dataset.code}`
    });
  },

  goTpgCourseDetail(event) {
    wx.navigateTo({
      url: `/pages/course-detail/course-detail?tpgProgrammeId=${encodeURIComponent(event.currentTarget.dataset.programmeId)}&courseCode=${encodeURIComponent(event.currentTarget.dataset.code)}`
    });
  },

  toggleCompare(event) {
    const courseCode = event.currentTarget.dataset.code;
    const selectedCodes = this.data.selectedCodes.includes(courseCode)
      ? this.data.selectedCodes.filter((code) => code !== courseCode)
      : this.data.selectedCodes.concat(courseCode);

    if (selectedCodes.length > 3) {
      wx.showToast({ title: '最多对比 3 门课程', icon: 'none' });
      return;
    }

    this.setData({
      selectedCodes,
      compareReady: selectedCodes.length >= 2,
      offerings: this.data.offerings.map((course) => ({
        ...course,
        selected: selectedCodes.includes(course.courseCode)
      }))
    });
  },

  goCompare() {
    if (!this.data.compareReady) {
      wx.showToast({ title: '请至少选择 2 门课程', icon: 'none' });
      return;
    }
    wx.navigateTo({
      url: `/pages/course-compare/course-compare?codes=${this.data.selectedCodes.join(',')}`
    });
  },

  goCourses() {
    wx.switchTab({ url: '/pages/courses/courses' });
  }
});
