const service = require('../../utils/courseService');

Page({
  data: {
    courses: []
  },

  async onShow() {
    const result = await service.getFavoriteCoursesRemote();
    this.setData({ courses: result.data });
  },

  goDetail(event) {
    wx.navigateTo({ url: `/pages/course-detail/course-detail?id=${event.currentTarget.dataset.id}` });
  }
});
