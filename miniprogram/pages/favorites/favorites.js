const service = require('../../utils/courseService');

Page({
  data: {
    viewMode: 'offerings',
    courses: [],
    offerings: []
  },

  async onShow() {
    const result = await service.getFavoriteCoursesRemote();
    const offerings = service.getFavoriteOfferings().map((course) => ({
      ...course,
      termLabel: course.terms.join(' / '),
      categoryLabel: course.categories.join(' · ')
    }));
    this.setData({ courses: result.data, offerings });
  },

  onModeTap(event) {
    this.setData({ viewMode: event.currentTarget.dataset.value });
  },

  goDetail(event) {
    wx.navigateTo({ url: `/pages/course-detail/course-detail?id=${event.currentTarget.dataset.id}` });
  },

  goOfferingDetail(event) {
    wx.navigateTo({
      url: `/pages/offering-detail/offering-detail?code=${event.currentTarget.dataset.code}`
    });
  },

  goCourses() {
    wx.switchTab({ url: '/pages/courses/courses' });
  }
});
