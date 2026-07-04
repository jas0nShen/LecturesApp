const service = require('../../utils/courseService');

Page({
  data: {
    loading: true,
    notFound: false,
    offering: null,
    course: null,
    provider: '',
    academicYear: '',
    termLabel: '',
    categoryLabel: '',
    favorite: false,
    completed: false,
    planned: false,
    planLabel: '加入 Study Plan',
    prerequisiteCourses: [],
    dataSource: 'loading'
  },

  async onLoad(options) {
    const result = await service.getCourseOfferingRemote(options.code);
    if (!result.data) {
      this.setData({ loading: false, notFound: true, dataSource: result.source });
      return;
    }

    const data = result.data;
    service.recordRecentlyViewed(data.offering.courseCode);
    this.setData({
      loading: false,
      offering: data.offering,
      course: data.course,
      provider: data.provider,
      academicYear: data.academicYear,
      termLabel: data.offering.terms.join(' / '),
      categoryLabel: data.offering.categories.join(' · '),
      favorite: service.isOfferingFavorite(data.offering.courseCode),
      completed: service.isOfferingCompleted(data.offering.courseCode),
      planned: service.isCoursePlanned(data.offering.courseCode),
      planLabel: service.isCoursePlanned(data.offering.courseCode) ? '调整 Study Plan' : '加入 Study Plan',
      prerequisiteCourses: service.getPrerequisiteCourseStatus(data.course.prerequisites),
      dataSource: result.source
    });
  },

  onShow() {
    if (!this.data.offering) return;
    const planned = service.isCoursePlanned(this.data.offering.courseCode);
    this.setData({
      planned,
      planLabel: planned ? '调整 Study Plan' : '加入 Study Plan'
    });
  },

  copyOfficialUrl() {
    wx.setClipboardData({
      data: this.data.offering.officialUrl,
      success() {
        wx.showToast({ title: '官方链接已复制' });
      }
    });
  },

  toggleFavorite() {
    service.toggleOfferingFavorite(this.data.offering.courseCode);
    const favorite = service.isOfferingFavorite(this.data.offering.courseCode);
    this.setData({ favorite });
    wx.showToast({ title: favorite ? '已收藏' : '已取消收藏' });
  },

  toggleCompleted() {
    service.toggleOfferingCompleted(this.data.offering.courseCode);
    const completed = service.isOfferingCompleted(this.data.offering.courseCode);
    this.setData({
      completed,
      prerequisiteCourses: service.getPrerequisiteCourseStatus(this.data.course.prerequisites)
    });
    wx.showToast({ title: completed ? '已标记为已修' : '已取消已修' });
  },

  goPlanCourse() {
    wx.navigateTo({
      url: `/pages/plan-course/plan-course?code=${this.data.offering.courseCode}`
    });
  }
});
