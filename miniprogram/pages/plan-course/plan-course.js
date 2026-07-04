const service = require('../../utils/courseService');

Page({
  data: {
    course: null,
    yearOptions: ['1', '2', '3', '4'],
    yearIndex: 0,
    termOptions: [],
    termLabels: [],
    termIndex: 0
  },

  onLoad(options) {
    const data = service.getCourseOffering(options.code);
    if (!data) return;

    const existing = service.getStudyPlanItems().find((item) => item.courseCode === data.offering.courseCode);
    const profile = service.getProfile();
    const termOptions = data.offering.terms;
    const plannedYear = existing ? existing.plannedYear : (profile && profile.currentYear) || 1;
    const plannedTerm = existing ? existing.plannedTerm : termOptions[0];

    this.setData({
      course: data.offering,
      termOptions,
      termLabels: termOptions.map((term) => term === 'full year' ? 'Full Year' : `Semester ${term}`),
      yearIndex: Math.max(0, this.data.yearOptions.indexOf(String(plannedYear))),
      termIndex: Math.max(0, termOptions.indexOf(String(plannedTerm)))
    });
  },

  onYearChange(event) {
    this.setData({ yearIndex: Number(event.detail.value) });
  },

  onTermChange(event) {
    this.setData({ termIndex: Number(event.detail.value) });
  },

  save() {
    service.saveStudyPlanItem(
      this.data.course.courseCode,
      this.data.yearOptions[this.data.yearIndex],
      this.data.termOptions[this.data.termIndex]
    );
    wx.showToast({ title: '已加入计划' });
    setTimeout(() => wx.navigateBack(), 500);
  }
});
