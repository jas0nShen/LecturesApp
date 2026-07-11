const service = require('../../utils/courseService');
const ugService = require('../../utils/ugService');

Page({
  data: {
    course: null,
    typeLabel: '',
    favorite: false,
    completed: false,
    dataSource: 'loading',
    isUgCourse: false,
    loadError: false
  },

  async onLoad(options) {
    if (options.ugId) {
      const app = typeof getApp === 'function' ? getApp() : {};
      const universityCode = options.universityCode || ugService.inferUniversityCodeFromCourseId(options.ugId);
      try {
        if (universityCode && app.ensureUniversityLoaded) await app.ensureUniversityLoaded(universityCode);
      } catch (error) {
        this.setData({ dataSource: 'error', isUgCourse: true, loadError: true });
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
        isUgCourse: true
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
      isUgCourse: false
    });
  },

  toggleFavorite() {
    if (this.data.isUgCourse || !this.data.course) return;
    service.toggleFavorite(this.data.course.id);
    this.setData({ favorite: service.isFavorite(this.data.course.id) });
  },

  toggleCompleted() {
    if (this.data.isUgCourse || !this.data.course) return;
    service.toggleCompleted(this.data.course.id);
    this.setData({ completed: service.getCompletedCourseIds().includes(this.data.course.id) });
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
