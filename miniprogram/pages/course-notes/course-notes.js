const service = require('../../utils/courseService');

Page({
  data: {
    notes: []
  },

  onShow() {
    this.setData({ notes: service.getCourseNotes() });
  },

  goCourse(event) {
    wx.navigateTo({
      url: `/pages/offering-detail/offering-detail?code=${event.currentTarget.dataset.code}`
    });
  },

  removeNote(event) {
    const courseCode = event.currentTarget.dataset.code;
    wx.showModal({
      title: `删除 ${courseCode} 笔记`,
      content: '删除后无法恢复，课程收藏和 Study Plan 不受影响。',
      confirmText: '删除',
      confirmColor: '#a43f36',
      success: (result) => {
        if (!result.confirm) return;
        service.saveCourseNote(courseCode, '');
        this.onShow();
        wx.showToast({ title: '笔记已删除' });
      }
    });
  },

  goCourses() {
    wx.switchTab({ url: '/pages/courses/courses' });
  }
});
