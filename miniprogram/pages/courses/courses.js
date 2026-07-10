const service = require('../../utils/courseService');
const feedbackService = require('../../utils/feedbackService');
const tpgService = require('../../utils/tpgService');
const ugService = require('../../utils/ugService');

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
    searching: false,
    typeLabels: service.TYPE_LABELS,
    types: [
      { value: 'all', label: '全部' },
      { value: 'core', label: '必修' },
      { value: 'major_elective', label: '专业选修' },
      { value: 'common_core', label: '通识' },
      { value: 'capstone', label: '毕业项目' }
    ],
    isTpg: false,
    tpgProgramme: null,
    tpgUniversity: null,
    tpgCourses: [],
    tpgCourseCount: 0,
    tpgCourseCountDisplay: '',
    tpgCourseCountLabel: '',
    tpgStatusTitle: '',
    tpgStatusCopy: '',
    isUgCatalogue: false,
    ugProfile: null,
    ugCourses: [],
    ugCourseCount: 0,
    ugCourseCountDisplay: '',
    ugHeroTitle: '',
    ugHeroSubtitle: '',
    ugStatusTitle: '',
    ugStatusCopy: '',
    needsSetup: false
  },

  onShow() {
    this.setData({ searchHistory: service.getCourseSearchHistory() });
    this.refresh();
  },

  async refresh() {
    if (this._searchTimer) {
      clearTimeout(this._searchTimer);
      this._searchTimer = null;
    }
    const requestId = (this._requestId || 0) + 1;
    this._requestId = requestId;
    this.setData({ searching: true });

    const profile = service.getProfile();
    if (!profile) {
      if (requestId !== this._requestId) return;
      this.setData({
        needsSetup: true,
        isTpg: false,
        tpgProgramme: null,
        tpgUniversity: null,
        tpgCourses: [],
        tpgCourseCount: 0,
        tpgCourseCountDisplay: '',
        tpgCourseCountLabel: '',
        isUgCatalogue: false,
        ugProfile: null,
        ugCourses: [],
        ugCourseCount: 0,
        ugCourseCountDisplay: '',
        ugHeroTitle: '',
        ugHeroSubtitle: '',
        courses: [],
        offerings: [],
        searching: false,
        dataSource: 'catalogue'
      });
      return;
    }

    const tpgProgramme = profile && profile.profileType === 'tpg'
      ? tpgService.getProgramme(profile.programmeId)
      : null;
    if (tpgProgramme) {
      const tpgUniversity = tpgService.getProgrammeUniversity(tpgProgramme);
      const allCourses = tpgService.flattenCourses(tpgProgramme);
      const tpgCourses = tpgService.flattenCourses(tpgProgramme, this.data.keyword);
      const status = tpgService.getStatus(tpgProgramme);
      if (requestId !== this._requestId) return;
      this.setData({
        needsSetup: false,
        isTpg: true,
        isUgCatalogue: false,
        tpgProgramme,
        tpgUniversity,
        tpgCourses,
        tpgCourseCount: allCourses.length,
        tpgCourseCountDisplay: status.hasCourseGroups ? allCourses.length : '待开放',
        tpgCourseCountLabel: status.hasCourseGroups ? '已开放课程' : '课程清单',
        tpgStatusTitle: status.hasCourseGroups ? '课程结构已开放' : '课程清单待开放',
        tpgStatusCopy: status.hasCourseGroups
          ? '这里显示你所选授课硕士 Programme 已拆分出的必修、选修或项目课程。'
          : '这个 Programme 已进入资料库；课程组完成复核后会在这里显示。',
        dataSource: 'catalogue',
        searching: false
      });
      return;
    }

    this.setData({
      needsSetup: false,
      isTpg: false,
      isUgCatalogue: false,
      ugProfile: null,
      ugCourses: [],
      ugCourseCount: 0,
      ugCourseCountDisplay: '',
      ugHeroTitle: '',
      ugHeroSubtitle: '',
      tpgProgramme: null,
      tpgUniversity: null,
      tpgCourses: [],
      tpgCourseCount: 0,
      tpgCourseCountDisplay: '',
      tpgCourseCountLabel: ''
    });

    const ugProfile = profile && profile.profileType === 'undergraduate'
      ? ugService.getMajorProfile(profile.programmeId, profile.majorId, profile.curriculumYear)
      : null;
    const ugHero = ugProfile ? this.buildUgHero(ugProfile) : {};
    if (ugProfile && ugProfile.sourceStatus === 'programme_summary_only') {
      if (requestId !== this._requestId) return;
      this.setData({
        isUgCatalogue: true,
        ugProfile,
        ugCourses: [],
        ugCourseCount: 0,
        ugCourseCountDisplay: '待开放',
        ugHeroTitle: ugHero.title,
        ugHeroSubtitle: ugHero.subtitle,
        ugStatusTitle: 'Programme / Major 已收录',
        ugStatusCopy: '课程表还在复核中；当前先保留学校与 Programme 信息。',
        courses: [],
        offerings: [],
        dataSource: 'catalogue',
        searching: false
      });
      return;
    }

    if (ugProfile && ugProfile.sourceStatus === 'course_codes_available') {
      const ugCourses = ugService.listMajorCourses(profile.programmeId, profile.majorId, {
        keyword: this.data.keyword
      });
      if (requestId !== this._requestId) return;
      this.setData({
        isUgCatalogue: true,
        ugProfile,
        ugCourses,
        ugCourseCount: ugProfile.codedCourseCount,
        ugCourseCountDisplay: ugProfile.codedCourseCount,
        ugHeroTitle: ugHero.title,
        ugHeroSubtitle: ugHero.subtitle,
        ugStatusTitle: '课程清单已开放',
        ugStatusCopy: '已整理公开课程代码；正式选课仍以学校系统为准。',
        courses: [],
        offerings: [],
        dataSource: 'catalogue',
        searching: false
      });
      return;
    }

    if (this.data.viewMode === 'offerings') {
      const result = await service.listCourseOfferingsRemote({
        academicYear: '2025-26',
        keyword: this.data.keyword,
        term: this.data.offeringTerm,
        category: this.data.offeringCategory,
        year: this.data.offeringYear
      });
      if (requestId !== this._requestId) return;
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
        dataSource: result.source,
        searching: false
      });
      return;
    }

    const result = await service.listCoursesRemote({
      programmeId: profile.programmeId,
      majorId: profile.majorId,
      keyword: this.data.keyword,
      courseType: this.data.courseType,
      hasPrerequisite: this.data.hasPrerequisite
    });
    if (requestId !== this._requestId) return;
    this.setData({
      courses: result.data.map((course) => ({
        ...course,
        favorite: service.isFavorite(course.id),
        completed: service.getCompletedCourseIds().includes(course.id)
      })),
      dataSource: result.source,
      searching: false
    });
  },

  buildUgHero(ugProfile = {}) {
    const majorName = ugProfile.major && ugProfile.major.nameEn;
    const programmeName = ugProfile.programme && ugProfile.programme.nameEn;
    const universityCode = ugProfile.university && ugProfile.university.code;
    const programmeCode = ugProfile.programme && ugProfile.programme.code;
    const title = majorName || programmeName || '本科课程';
    const programmeLabel = programmeCode || 'Undergraduate';
    const subtitle = [universityCode, ugProfile.curriculumYear, programmeLabel].filter(Boolean).join(' · ');
    return { title, subtitle };
  },

  refreshLocal() {
    const profile = service.getProfile();
    if (!profile) return;
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
    if (this._searchTimer) clearTimeout(this._searchTimer);
    this._requestId = (this._requestId || 0) + 1;
    this.setData({
      keyword: event.detail.value,
      searching: true
    });
    this._searchTimer = setTimeout(() => {
      this._searchTimer = null;
      this.refresh();
    }, 250);
  },

  onSearchConfirm() {
    this.setData({ searchHistory: service.recordCourseSearch(this.data.keyword) });
    this.refresh();
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

  goUgDetail(event) {
    wx.navigateTo({ url: `/pages/course-detail/course-detail?ugId=${event.currentTarget.dataset.id}` });
  },

  goOfferingDetail(event) {
    wx.navigateTo({
      url: `/pages/offering-detail/offering-detail?code=${event.currentTarget.dataset.code}`
    });
  },

  goTpgProgramme() {
    const programme = this.data.tpgProgramme;
    if (!programme) return;
    wx.navigateTo({
      url: `/pages/tpg-programme/tpg-programme?id=${encodeURIComponent(programme.id)}`
    });
  },

  goTpgCatalog() {
    wx.navigateTo({ url: '/pages/tpg-catalog/tpg-catalog' });
  },

  goOnboarding() {
    wx.navigateTo({ url: service.buildOnboardingUrl() });
  },

  copyTpgSource() {
    const programme = this.data.tpgProgramme;
    if (!programme) return;
    const data = programme.sourceUrl || tpgService.buildProgrammeSourceText(programme);
    wx.setClipboardData({
      data,
      success: () => {
        wx.showToast({ title: programme.sourceUrl ? '官方链接已复制' : '资料来源已复制' });
      }
    });
  },

  copyTpgFeedback() {
    const programme = this.data.tpgProgramme;
    if (!programme) return;
    const template = feedbackService.buildFeedbackTemplate(service.getProfile(), {
      programme
    });
    wx.setClipboardData({
      data: template,
      success: () => {
        wx.showToast({ title: '反馈模板已复制' });
      }
    });
  },

  copyUgSource() {
    const profile = this.data.ugProfile;
    const sourceUrl = profile && profile.sourceUrl;
    if (!sourceUrl) {
      wx.showToast({ title: '暂无官方链接', icon: 'none' });
      return;
    }
    wx.setClipboardData({
      data: sourceUrl,
      success: () => {
        wx.showToast({ title: '官方链接已复制' });
      }
    });
  },

  copyUgFeedback() {
    const template = feedbackService.buildFeedbackTemplate(service.getProfile());
    wx.setClipboardData({
      data: template,
      success: () => {
        wx.showToast({ title: '反馈模板已复制' });
      }
    });
  },

  copyUgCourseSource(event) {
    const sourceUrl = event.currentTarget.dataset.url;
    if (!sourceUrl) {
      wx.showToast({ title: '暂无课程来源', icon: 'none' });
      return;
    }
    wx.setClipboardData({
      data: sourceUrl,
      success: () => {
        wx.showToast({ title: '课程来源已复制' });
      }
    });
  },

  onUnload() {
    if (this._searchTimer) clearTimeout(this._searchTimer);
    this._requestId = (this._requestId || 0) + 1;
  }
});
