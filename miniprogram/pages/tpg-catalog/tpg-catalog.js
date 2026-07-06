const tpgService = require('../../utils/tpgService');
const courseService = require('../../utils/courseService');

const ALL_SCHOOLS = 'ALL';
const coverage = tpgService.getSchoolCoverage();

Page({
  data: {
    universities: coverage.schools,
    selectedUniversity: ALL_SCHOOLS,
    keyword: '',
    searchHistory: [],
    availabilityFilter: 'all',
    availabilityFilters: [
      { value: 'all', label: '全部' },
      { value: 'courses', label: '课程组已开放' },
      { value: 'pending', label: '待拆分' }
    ],
    visibleProgrammes: [],
    resultCount: 0,
    resultScope: '全部学校',
    resultHint: '可按学校或关键词继续缩小范围',
    limitHint: '',
    totalProgrammes: coverage.programmeCount,
    totalCourses: coverage.courseCount,
    selectedProfile: null
  },

  onLoad() {
    this.refresh();
  },

  onShow() {
    const profile = courseService.getProfile();
    const selectedProfile = tpgService.getProfileSummary(profile);
    this.setData({
      selectedProfile: selectedProfile && selectedProfile.programme ? selectedProfile : null,
      searchHistory: courseService.getTpgProgrammeSearchHistory()
    });
    this.refresh();
  },

  selectUniversity(event) {
    this.setData({ selectedUniversity: event.currentTarget.dataset.code });
    this.refresh();
  },

  onKeywordInput(event) {
    this.setData({ keyword: event.detail.value });
    this.refresh();
  },

  clearKeyword() {
    this.setData({ keyword: '' });
    this.refresh();
  },

  commitKeywordSearch() {
    const keyword = this.data.keyword.trim();
    if (!keyword) return;
    this.setData({
      searchHistory: courseService.recordTpgProgrammeSearch(keyword)
    });
  },

  useHistoryKeyword(event) {
    const keyword = event.currentTarget.dataset.keyword || '';
    this.setData({
      keyword,
      searchHistory: courseService.recordTpgProgrammeSearch(keyword)
    });
    this.refresh();
  },

  clearSearchHistory() {
    this.setData({
      searchHistory: courseService.clearTpgProgrammeSearchHistory()
    });
  },

  selectAvailability(event) {
    this.setData({ availabilityFilter: event.currentTarget.dataset.value || 'all' });
    this.refresh();
  },

  goProgramme(event) {
    this.commitKeywordSearch();
    const id = event.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/tpg-programme/tpg-programme?id=${encodeURIComponent(id)}`
    });
  },

  goSelectedProgramme() {
    const summary = this.data.selectedProfile;
    if (!summary || !summary.programme) return;
    wx.navigateTo({
      url: `/pages/tpg-programme/tpg-programme?id=${encodeURIComponent(summary.programme.id)}`
    });
  },

  refresh() {
    const selected = this.data.selectedUniversity;
    const keyword = this.data.keyword.trim();
    const selectedSchool = selected === ALL_SCHOOLS
      ? null
      : this.data.universities.find((university) => university.code === selected);
    const searchedProgrammes = tpgService.searchProgrammes(
      tpgService.listProgrammes(selected === ALL_SCHOOLS ? '' : selected),
      keyword
    );
    const programmes = tpgService.filterProgrammesByAvailability(
      searchedProgrammes,
      this.data.availabilityFilter
    );
    const visibleProgrammes = programmes.slice(0, 120);
    const scopeName = selectedSchool ? selectedSchool.nameCn : '全部学校';
    const filterCopy = this.data.availabilityFilter === 'courses'
      ? '课程组已开放'
      : this.data.availabilityFilter === 'pending'
        ? '待拆分'
        : '';
    const resultScope = [
      scopeName,
      keyword ? `“${keyword}”` : '',
      filterCopy
    ].filter(Boolean).join(' · ');
    const resultHint = keyword
      ? '正在匹配 Programme、课程名与代码'
      : this.data.availabilityFilter === 'courses'
        ? '仅显示已录入必修、选修或课程清单的 Programme'
        : this.data.availabilityFilter === 'pending'
          ? '仅显示课程组尚未开放或仍待拆分的 Programme'
      : selectedSchool
        ? `${selectedSchool.name} · ${selectedSchool.programmeCount} 个 Programme`
        : `六校合计 ${this.data.totalProgrammes} 个 Programme`;
    const limitHint = programmes.length > visibleProgrammes.length
      ? keyword
        ? '结果仍较多，可以输入更具体的 Programme、课程名或代码。'
        : '当前只展示前 120 项，建议先选择学校或输入 Programme / 课程关键词。'
      : '';
    this.setData({
      visibleProgrammes: visibleProgrammes.map((programme) => {
        const status = tpgService.getStatus(programme);
        const university = tpgService.getProgrammeUniversity(programme);
        const selectedProgramme = this.data.selectedProfile && this.data.selectedProfile.programme;
        return {
          ...programme,
          selected: Boolean(selectedProgramme && selectedProgramme.id === programme.id),
          academicYear: university.academicYear,
          courseCount: status.courseCount,
          statusLabel: status.hasCourseGroups
            ? `${status.courseCount} 门课程`
            : status.hasStructure ? '结构待拆分' : '索引已导入',
          statusBadge: status.hasCourseGroups ? 'COURSES' : status.hasStructure ? 'STRUCTURE' : 'INDEX'
        };
      }),
      resultCount: programmes.length,
      resultScope,
      resultHint,
      limitHint
    });
  }
});
