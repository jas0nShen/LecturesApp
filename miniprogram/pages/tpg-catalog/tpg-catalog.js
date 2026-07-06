const tpgService = require('../../utils/tpgService');

const ALL_SCHOOLS = 'ALL';

Page({
  data: {
    universities: tpgService.listUniversities(),
    selectedUniversity: ALL_SCHOOLS,
    keyword: '',
    visibleProgrammes: [],
    resultCount: 0,
    totalProgrammes: tpgService.getSchoolCoverage().programmeCount,
    totalCourses: tpgService.getSchoolCoverage().courseCount
  },

  onLoad() {
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

  goProgramme(event) {
    const id = event.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/tpg-programme/tpg-programme?id=${encodeURIComponent(id)}`
    });
  },

  refresh() {
    const selected = this.data.selectedUniversity;
    const programmes = tpgService.searchProgrammes(
      tpgService.listProgrammes(selected === ALL_SCHOOLS ? '' : selected),
      this.data.keyword
    );
    this.setData({
      visibleProgrammes: programmes.slice(0, 120).map((programme) => {
        const status = tpgService.getStatus(programme);
        const university = tpgService.getProgrammeUniversity(programme);
        return {
          ...programme,
          academicYear: university.academicYear,
          courseCount: status.courseCount,
          statusLabel: status.hasCourseGroups
            ? `${status.courseCount} 门课程`
            : status.hasStructure ? '结构待拆分' : '索引已导入',
          statusBadge: status.hasCourseGroups ? 'COURSES' : status.hasStructure ? 'STRUCTURE' : 'INDEX'
        };
      }),
      resultCount: programmes.length
    });
  }
});
