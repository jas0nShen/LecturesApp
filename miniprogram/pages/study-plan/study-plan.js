const service = require('../../utils/courseService');

Page({
  data: {
    supported: false,
    unsupportedMessage: '',
    groups: [],
    suggestions: [],
    coreGapSummary: {
      courseCount: 0,
      credits: 0,
      groups: []
    },
    review: {
      courseCount: 0,
      totalCredits: 0,
      completedCount: 0,
      favoriteCount: 0,
      noteCount: 0,
      noticeCount: 0,
      categoryStats: [],
      noticeCounts: {},
      issueCodes: [],
      termLoads: [],
      loadSuggestions: [],
      notices: []
    }
  },

  onShow() {
    const capability = service.getPlanningCapability();
    if (!capability.supported) {
      this.setData({ supported: false, unsupportedMessage: capability.reason, groups: [], suggestions: [], coreGapSummary: { courseCount: 0, credits: 0, groups: [] }, review: { courseCount: 0, totalCredits: 0, completedCount: 0, favoriteCount: 0, noteCount: 0, noticeCount: 0, categoryStats: [], noticeCounts: {}, issueCodes: [], termLoads: [], loadSuggestions: [], notices: [] } });
      return;
    }
    const courses = service.getStudyPlanCourses();
    const review = service.analyzeStudyPlan();
    const suggestions = service.getStudyPlanSuggestions(5);
    const coreGapSummary = service.getStudyPlanCoreGapSummary();
    const groups = [1, 2, 3, 4].map((year) => {
      const yearCourses = courses
        .filter((item) => item.plannedYear === year)
        .map((item) => ({
          ...item,
          credits: Number((item.offering.details && item.offering.details.credits) || 0),
          termLabel: item.plannedTerm === 'full year' ? 'Full Year' : `Semester ${item.plannedTerm}`,
          categoryLabel: item.categoryLabel,
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
    this.setData({
      supported: true,
      groups,
      suggestions,
      coreGapSummary,
      review: {
        ...review,
        completedCount: courses.filter((item) => item.completed).length,
        favoriteCount: courses.filter((item) => item.favorite).length,
        noteCount: courses.filter((item) => item.hasNote).length
      }
    });
  },

  goCourses() {
    wx.switchTab({ url: '/pages/courses/courses' });
  },

  goSettings() {
    service.openOnboarding();
  },

  copyPlan() {
    if (!this.data.review.courseCount) {
      wx.showToast({ title: '计划中还没有课程', icon: 'none' });
      return;
    }
    wx.setClipboardData({
      data: service.formatStudyPlanText(),
      success() {
        wx.showToast({ title: '四年计划已复制' });
      }
    });
  },

  copyPlanStatus() {
    if (!this.data.review.courseCount) {
      wx.showToast({ title: '计划中还没有课程', icon: 'none' });
      return;
    }
    wx.setClipboardData({
      data: service.formatStudyPlanStatusText(),
      success() {
        wx.showToast({ title: '状态摘要已复制' });
      }
    });
  },

  copyCoreGap() {
    if (!this.data.coreGapSummary.courseCount) {
      wx.showToast({ title: '暂无未安排核心课', icon: 'none' });
      return;
    }
    wx.setClipboardData({
      data: service.formatStudyPlanCoreGapText(),
      success() {
        wx.showToast({ title: '核心课清单已复制' });
      }
    });
  },

  copyPlanChecks() {
    if (!this.data.review.noticeCount) {
      wx.showToast({ title: '暂无计划提醒', icon: 'none' });
      return;
    }
    wx.setClipboardData({
      data: service.formatStudyPlanCheckText(),
      success() {
        wx.showToast({ title: '检查清单已复制' });
      }
    });
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
  },

  toggleCompleted(event) {
    const code = event.currentTarget.dataset.code;
    const completed = service.toggleOfferingCompleted(code).includes(String(code).toUpperCase());
    this.onShow();
    wx.showToast({ title: completed ? '已标记已修' : '已取消已修' });
  },

  toggleFavorite(event) {
    const code = event.currentTarget.dataset.code;
    const favorite = service.toggleOfferingFavorite(code).includes(String(code).toUpperCase());
    this.onShow();
    wx.showToast({ title: favorite ? '已收藏' : '已取消收藏' });
  },

  openDetail(event) {
    wx.navigateTo({
      url: `/pages/offering-detail/offering-detail?code=${event.currentTarget.dataset.code}`
    });
  },

  planSuggestion(event) {
    wx.navigateTo({
      url: `/pages/plan-course/plan-course?code=${event.currentTarget.dataset.code}`
    });
  }
});
