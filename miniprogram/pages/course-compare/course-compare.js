const service = require('../../utils/courseService');

Page({
  data: {
    courses: []
  },

  onLoad(options) {
    const codes = String(options.codes || '').split(',').filter(Boolean).slice(0, 3);
    const courses = codes.map((code) => service.getCourseOffering(code)).filter(Boolean).map((item) => ({
      courseCode: item.offering.courseCode,
      title: item.offering.title,
      termLabel: item.offering.terms.join(' / '),
      categoryLabel: item.offering.categories.join(' · '),
      credits: item.course.credits || '待确认',
      recommendedYear: item.course.recommendedYear ? `Year ${item.course.recommendedYear}` : '未标注',
      prerequisites: item.course.prerequisites || 'None',
      corequisites: item.course.corequisites || 'None',
      exclusions: item.course.exclusions || 'None',
      planned: service.isCoursePlanned(item.offering.courseCode),
      completed: service.isOfferingCompleted(item.offering.courseCode)
    }));
    this.setData({ courses });
  },

  goCourse(event) {
    wx.navigateTo({
      url: `/pages/offering-detail/offering-detail?code=${event.currentTarget.dataset.code}`
    });
  }
});
