const service = require('../../utils/courseService');

Page({
  data: {
    groups: [],
    review: {
      courseCount: 0,
      totalCredits: 0,
      noticeCount: 0,
      noticeCounts: {},
      issueCodes: [],
      termLoads: [],
      notices: []
    }
  },

  onShow() {
    const courses = service.getStudyPlanCourses();
    const review = service.analyzeStudyPlan();
    const groups = [1, 2, 3, 4].map((year) => {
      const yearCourses = courses
        .filter((item) => item.plannedYear === year)
        .map((item) => ({
          ...item,
          credits: Number((item.offering.details && item.offering.details.credits) || 0),
          termLabel: item.plannedTerm === 'full year' ? 'Full Year' : `Semester ${item.plannedTerm}`,
          hasIssue: review.issueCodes.includes(item.courseCode)
        }));
      const semesterOne = review.termLoads.find((item) => item.year === year && item.term === '1');
      const semesterTwo = review.termLoads.find((item) => item.year === year && item.term === '2');
      return {
        year,
        courses: yearCourses,
        credits: yearCourses.reduce((sum, item) => sum + item.credits, 0),
        semesterOne,
        semesterTwo
      };
    });
    this.setData({ groups, review });
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
