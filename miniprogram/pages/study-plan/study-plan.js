const service = require('../../utils/courseService');

Page({
  data: {
    groups: []
  },

  onShow() {
    const courses = service.getStudyPlanCourses();
    const groups = [1, 2, 3, 4].map((year) => ({
      year,
      courses: courses
        .filter((item) => item.plannedYear === year)
        .map((item) => ({
          ...item,
          termLabel: item.plannedTerm === 'full year' ? 'Full Year' : `Semester ${item.plannedTerm}`
        }))
    }));
    this.setData({ groups });
  },

  goCourses() {
    wx.switchTab({ url: '/pages/courses/courses' });
  },

  editCourse(event) {
    wx.navigateTo({
      url: `/pages/plan-course/plan-course?code=${event.currentTarget.dataset.code}`
    });
  },

  removeCourse(event) {
    service.removeStudyPlanItem(event.currentTarget.dataset.code);
    this.onShow();
    wx.showToast({ title: '已移出计划' });
  }
});
