const service = require('../../utils/courseService');

Page({
  data: {
    loading: true,
    notFound: false,
    offering: null,
    course: null,
    provider: '',
    academicYear: '',
    termLabel: '',
    categoryLabel: '',
    favorite: false,
    dataSource: 'loading'
  },

  async onLoad(options) {
    const result = await service.getCourseOfferingRemote(options.code);
    if (!result.data) {
      this.setData({ loading: false, notFound: true, dataSource: result.source });
      return;
    }

    const data = result.data;
    this.setData({
      loading: false,
      offering: data.offering,
      course: data.course,
      provider: data.provider,
      academicYear: data.academicYear,
      termLabel: data.offering.terms.join(' / '),
      categoryLabel: data.offering.categories.join(' · '),
      favorite: service.isOfferingFavorite(data.offering.courseCode),
      dataSource: result.source
    });
  },

  copyOfficialUrl() {
    wx.setClipboardData({
      data: this.data.offering.officialUrl,
      success() {
        wx.showToast({ title: '官方链接已复制' });
      }
    });
  },

  toggleFavorite() {
    service.toggleOfferingFavorite(this.data.offering.courseCode);
    const favorite = service.isOfferingFavorite(this.data.offering.courseCode);
    this.setData({ favorite });
    wx.showToast({ title: favorite ? '已收藏' : '已取消收藏' });
  }
});
