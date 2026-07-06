const catalogue = require('../../utils/tpgCatalog');

const ALL_SCHOOLS = 'ALL';

Page({
  data: {
    universities: catalogue.universities,
    selectedUniversity: ALL_SCHOOLS,
    keyword: '',
    visibleProgrammes: [],
    resultCount: 0,
    totalProgrammes: catalogue.programmes.length
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
    const keyword = this.data.keyword.trim().toLowerCase();
    const programmes = catalogue.programmes.filter((programme) => {
      const matchesSchool = selected === ALL_SCHOOLS || programme.universityCode === selected;
      const haystack = [
        programme.name,
        programme.programmeCode,
        programme.faculty
      ].join(' ').toLowerCase();
      return matchesSchool && (!keyword || haystack.includes(keyword));
    });
    this.setData({
      visibleProgrammes: programmes.slice(0, 120),
      resultCount: programmes.length
    });
  }
});
