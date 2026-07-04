const service = require('../../utils/courseService');

Page({
  data: {
    keyword: '',
    viewMode: 'all',
    courses: [],
    visibleCourses: [],
    completedCount: 0,
    completedCredits: 0
  },

  onShow() {
    this.refresh();
  },

  refresh() {
    const completedCodes = service.getCompletedOfferingCodes();
    const courses = service.listCourseOfferings({}).map((course) => ({
      ...course,
      termLabel: course.terms.join(' / '),
      credits: Number((course.details && course.details.credits) || 0),
      completed: completedCodes.includes(course.courseCode)
    }));
    const completed = courses.filter((course) => course.completed);
    this.setData({
      courses,
      completedCount: completed.length,
      completedCredits: completed.reduce((sum, course) => sum + course.credits, 0)
    });
    this.applyFilters(courses);
  },

  applyFilters(courses = this.data.courses) {
    const keyword = this.data.keyword.trim().toLowerCase();
    const visibleCourses = courses.filter((course) => {
      const matchesMode = this.data.viewMode === 'all' || course.completed;
      const matchesKeyword = !keyword
        || course.courseCode.toLowerCase().includes(keyword)
        || course.title.toLowerCase().includes(keyword);
      return matchesMode && matchesKeyword;
    });
    this.setData({ visibleCourses });
  },

  onSearch(event) {
    this.setData({ keyword: event.detail.value });
    this.applyFilters();
  },

  clearSearch() {
    this.setData({ keyword: '' });
    this.applyFilters();
  },

  setMode(event) {
    this.setData({ viewMode: event.currentTarget.dataset.mode });
    this.applyFilters();
  },

  toggleCompleted(event) {
    const courseCode = event.currentTarget.dataset.code;
    service.toggleOfferingCompleted(courseCode);
    this.refresh();
  },

  goCourse(event) {
    wx.navigateTo({
      url: `/pages/offering-detail/offering-detail?code=${event.currentTarget.dataset.code}`
    });
  }
});
