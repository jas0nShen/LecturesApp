const service = require('../../utils/courseService');

Page({
  data: {
    course: null,
    typeLabel: '',
    favorite: false,
    completed: false,
    dataSource: 'loading'
  },

  async onLoad(options) {
    const result = await service.getCourseRemote(options.id);
    const course = result.data;
    this.setData({
      course,
      typeLabel: course ? service.TYPE_LABELS[course.courseType] : '',
      favorite: service.isFavorite(options.id),
      completed: service.getCompletedCourseIds().includes(Number(options.id)),
      dataSource: result.source
    });
  },

  toggleFavorite() {
    service.toggleFavorite(this.data.course.id);
    this.setData({ favorite: service.isFavorite(this.data.course.id) });
  },

  toggleCompleted() {
    service.toggleCompleted(this.data.course.id);
    this.setData({ completed: service.getCompletedCourseIds().includes(this.data.course.id) });
  }
});
