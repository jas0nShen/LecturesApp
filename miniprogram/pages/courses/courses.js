const service = require('../../utils/courseService');

Page({
  data: {
    keyword: '',
    viewMode: 'curriculum',
    courseType: 'all',
    hasPrerequisite: null,
    courses: [],
    offerings: [],
    offeringTerm: 'all',
    offeringTerms: [
      { value: 'all', label: '全部学期' },
      { value: '1', label: '第一学期' },
      { value: '2', label: '第二学期' },
      { value: 'full year', label: '全年' }
    ],
    offeringMeta: null,
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
    if (this.data.viewMode === 'offerings') {
      const result = await service.listCourseOfferingsRemote({
        academicYear: '2025-26',
        keyword: this.data.keyword,
        term: this.data.offeringTerm
      });
      this.setData({
        offerings: result.data.courses.map((course) => ({
          ...course,
          termLabel: course.terms.join(' / '),
          categoryLabel: course.categories.join(' · '),
          sectionCount: course.sections.length
        })),
        offeringMeta: result.data,
        dataSource: result.source
      });
      return;
    }

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

  onModeTap(event) {
    this.setData({
      viewMode: event.currentTarget.dataset.value,
      keyword: '',
      dataSource: 'loading'
    });
    this.refresh();
  },

  onOfferingTermTap(event) {
    this.setData({ offeringTerm: event.currentTarget.dataset.value });
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
  },

  copyOfferingUrl(event) {
    wx.setClipboardData({
      data: event.currentTarget.dataset.url,
      success() {
        wx.showToast({ title: '官方链接已复制' });
      }
    });
  }
});
