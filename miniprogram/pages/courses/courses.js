const service = require('../../utils/courseService');

Page({
  data: {
    keyword: '',
    courseType: 'all',
    hasPrerequisite: null,
    courses: [],
    dataSource: 'loading',
    typeLabels: service.TYPE_LABELS,
    types: [
      { value: 'all', label: '全部' },
      { value: 'core', label: '必修' },
      { value: 'major_elective', label: '专业选修' },
      { value: 'common_core', label: '通识' },
      { value: 'capstone', label: '毕业项目' }
    ]
  },

  onShow() {
    this.refresh();
  },

  async refresh() {
    const profile = service.getProfile() || { programmeId: 1, majorId: 1 };
    const result = await service.listCoursesRemote({
      programmeId: profile.programmeId,
      majorId: profile.majorId,
      keyword: this.data.keyword,
      courseType: this.data.courseType,
      hasPrerequisite: this.data.hasPrerequisite
    });
    this.setData({
      courses: result.data,
      dataSource: result.source
    });
  },

  refreshLocal() {
    const profile = service.getProfile() || { programmeId: 1, majorId: 1 };
    this.setData({
      courses: service.listCourses({
        programmeId: profile.programmeId,
        majorId: profile.majorId,
        keyword: this.data.keyword,
        courseType: this.data.courseType,
        hasPrerequisite: this.data.hasPrerequisite
      })
    });
  },

  onKeyword(event) {
    this.setData({ keyword: event.detail.value });
    this.refresh();
  },

  onTypeTap(event) {
    this.setData({ courseType: event.currentTarget.dataset.value });
    this.refresh();
  },

  onPrereqTap(event) {
    const value = event.currentTarget.dataset.value;
    this.setData({ hasPrerequisite: value === 'all' ? null : value === 'yes' });
    this.refresh();
  },

  goDetail(event) {
    wx.navigateTo({ url: `/pages/course-detail/course-detail?id=${event.currentTarget.dataset.id}` });
  }
});
