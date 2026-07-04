const service = require('../../utils/courseService');

Page({
  data: {
    keyword: '',
    searchHistory: [],
    quickSearches: ['COMP1117', 'COMP2119', 'COMP3314'],
    viewMode: 'curriculum',
    courseType: 'all',
    hasPrerequisite: null,
    courses: [],
    offerings: [],
    offeringTerm: 'all',
    offeringCategory: 'all',
    offeringYear: 'all',
    offeringCategories: [
      { value: 'all', label: '全部类别' },
      { value: 'core', label: 'Core 核心' },
      { value: 'elective', label: 'Elective 选修' }
    ],
    offeringYears: [
      { value: 'all', label: '全部年级' },
      { value: '1', label: 'Year 1' },
      { value: '2', label: 'Year 2' },
      { value: '3', label: 'Year 3' },
      { value: '4', label: 'Year 4' }
    ],
    offeringCategoryIndex: 0,
    offeringYearIndex: 0,
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
    this.setData({ searchHistory: service.getCourseSearchHistory() });
    this.refresh();
  },

  async refresh() {
    if (this.data.viewMode === 'offerings') {
      const result = await service.listCourseOfferingsRemote({
        academicYear: '2025-26',
        keyword: this.data.keyword,
        term: this.data.offeringTerm,
        category: this.data.offeringCategory,
        year: this.data.offeringYear
      });
      this.setData({
        offerings: result.data.courses.map((course) => ({
          ...course,
          termLabel: course.terms.join(' / '),
          categoryLabel: course.categories.join(' · '),
          sectionCount: course.sections.length,
          favorite: service.isOfferingFavorite(course.courseCode),
          completed: service.isOfferingCompleted(course.courseCode),
          planned: service.isCoursePlanned(course.courseCode)
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
      courses: result.data.map((course) => ({
        ...course,
        favorite: service.isFavorite(course.id),
        completed: service.getCompletedCourseIds().includes(course.id)
      })),
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
      }).map((course) => ({
        ...course,
        favorite: service.isFavorite(course.id),
        completed: service.getCompletedCourseIds().includes(course.id)
      }))
    });
  },

  onKeyword(event) {
    this.setData({ keyword: event.detail.value });
    this.refresh();
  },

  onSearchConfirm() {
    this.setData({ searchHistory: service.recordCourseSearch(this.data.keyword) });
  },

  applySearch(event) {
    const keyword = event.currentTarget.dataset.keyword;
    this.setData({
      keyword,
      searchHistory: service.recordCourseSearch(keyword)
    });
    this.refresh();
  },

  clearKeyword() {
    this.setData({ keyword: '' });
    this.refresh();
  },

  clearSearchHistory() {
    this.setData({ searchHistory: service.clearCourseSearchHistory() });
  },

  resetFilters() {
    this.setData({
      keyword: '',
      courseType: 'all',
      hasPrerequisite: null,
      offeringTerm: 'all',
      offeringCategory: 'all',
      offeringYear: 'all',
      offeringCategoryIndex: 0,
      offeringYearIndex: 0
    });
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

  onOfferingCategoryChange(event) {
    const index = Number(event.detail.value);
    this.setData({
      offeringCategoryIndex: index,
      offeringCategory: this.data.offeringCategories[index].value
    });
    this.refresh();
  },

  onOfferingYearChange(event) {
    const index = Number(event.detail.value);
    this.setData({
      offeringYearIndex: index,
      offeringYear: this.data.offeringYears[index].value
    });
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

  goOfferingDetail(event) {
    wx.navigateTo({
      url: `/pages/offering-detail/offering-detail?code=${event.currentTarget.dataset.code}`
    });
  }
});
