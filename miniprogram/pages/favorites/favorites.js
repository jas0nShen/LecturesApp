const service = require('../../utils/courseService');

Page({
  data: {
    viewMode: 'offerings',
    courses: [],
    offerings: [],
    selectedCodes: [],
    compareReady: false
  },

  async onShow() {
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
    this.setData({
      courses: result.data,
      offerings,
      selectedCodes,
      compareReady: selectedCodes.length >= 2
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
