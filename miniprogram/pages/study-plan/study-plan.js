const service = require('../../utils/courseService');

Page({
  data: {
    groups: [],
    review: {
      courseCount: 0,
      totalCredits: 0,
      noticeCount: 0,
      notices: []
    }
  },

  onShow() {
    const courses = service.getStudyPlanCourses();
    const groups = [1, 2, 3, 4].map((year) => {
      const yearCourses = courses
        .filter((item) => item.plannedYear === year)
        .map((item) => ({
          ...item,
          credits: Number((item.offering.details && item.offering.details.credits) || 0),
          termLabel: item.plannedTerm === 'full year' ? 'Full Year' : `Semester ${item.plannedTerm}`
        }));
      return {
        year,
        courses: yearCourses,
        credits: yearCourses.reduce((sum, item) => sum + item.credits, 0)
      };
    });
    this.setData({ groups, review: service.analyzeStudyPlan() });
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
