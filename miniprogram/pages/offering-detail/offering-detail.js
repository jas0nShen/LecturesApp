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
    note: '',
    noteLength: 0,
    noteSaved: true,
    planningCapability: { supported: false },
    dataSource: 'loading'
  },

  async onLoad(options) {
    const result = await service.getCourseOfferingRemote(options.code);
    if (!result.data) {
      this.setData({ loading: false, notFound: true, dataSource: result.source });
      return;
    }

    const data = result.data;
    const planningCapability = service.getPlanningCapability();
    service.recordRecentlyViewed(data.offering.courseCode);
    this.setData({
      loading: false,
      offering: data.offering,
      course: data.course,
      provider: data.provider,
      academicYear: data.academicYear,
      termLabel: data.offering.terms.join(' / '),
      categoryLabel: data.offering.categories.join(' · '),
      favorite: planningCapability.supported && service.isOfferingFavorite(data.offering.courseCode),
      completed: planningCapability.supported && service.isOfferingCompleted(data.offering.courseCode),
      planned: planningCapability.supported && service.isCoursePlanned(data.offering.courseCode),
      planLabel: planningCapability.supported && service.isCoursePlanned(data.offering.courseCode) ? '调整 Study Plan' : '加入 Study Plan',
      planningCapability,
      prerequisiteCourses: service.getPrerequisiteCourseStatus(data.course.prerequisites),
      note: service.getCourseNote(data.offering.courseCode),
      noteLength: service.getCourseNote(data.offering.courseCode).length,
      dataSource: result.source
    });
  },

  onShow() {
    if (!this.data.offering || !this.data.planningCapability.supported) return;
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
  },

  onNoteInput(event) {
    const note = event.detail.value;
    this.setData({
      note,
      noteLength: note.length,
      noteSaved: false
    });
  },

  saveNote() {
    const note = service.saveCourseNote(this.data.offering.courseCode, this.data.note);
    this.setData({
      note,
      noteLength: note.length,
      noteSaved: true
    });
    wx.showToast({ title: note ? '笔记已保存' : '笔记已清空' });
  },

  onShareAppMessage() {
    if (!this.data.offering) {
      return {
        title: 'HKU 课程查询',
        path: '/pages/courses/courses'
      };
    }
    return service.getCourseShareInfo(this.data.offering.courseCode);
  }
});
