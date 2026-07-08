const service = require('../../utils/courseService');
const releaseInfo = require('../../utils/releaseInfo');
const tpgService = require('../../utils/tpgService');
const ugService = require('../../utils/ugService');

function copyTextOrToast(text, successTitle, emptyTitle = '暂无可复制内容') {
  const data = String(text || '').trim();
  if (!data) {
    wx.showToast({ title: emptyTitle, icon: 'none' });
    return;
  }
  wx.setClipboardData({
    data,
    success() {
      wx.showToast({ title: successTitle });
    }
  });
}

Page({
  data: {
    releaseInfo,
    status: null,
    tpgStatus: null,
    ugStatus: null,
    ugSchools: []
  },

  onLoad() {
    this.setData({
      status: service.getDataStatus(),
      tpgStatus: tpgService.getSchoolCoverage(),
      ugStatus: ugService.getCatalogueSummary(),
      ugSchools: ugService.getSchoolCoverage()
    });
  },

  copySource(event) {
    copyTextOrToast(event.currentTarget.dataset.url, '官方来源已复制', '暂无官方来源');
  },

  copyTpgSources() {
    copyTextOrToast(this.data.tpgStatus && this.data.tpgStatus.sourceSummary, '资料来源已复制', '暂无资料来源');
  },

  copyUgSummary() {
    const status = this.data.ugStatus;
    const schools = (this.data.ugSchools || []).map((school) => (
      `${school.code}：${school.programmeWithCoursesCount}/${school.programmeCount} Programme 已开放课程 · ${school.pendingProgrammeCount} 个待补 · ${school.codedCourseCount} codes · ${school.updatedLabel}`
    ));
    const text = [
      '本科资料库状态',
      `学校：${status.universityCount}`,
      `Programme：${status.sourceProgrammeCount}`,
      `Major / Track：${status.majorCount}`,
      `总覆盖率：${status.programmeWithCoursesCount}/${status.sourceProgrammeCount} Programme 已开放 · ${status.coveragePercent}% · ${status.pendingProgrammeCount} 个待补`,
      `已录入课程代码：${status.codedCourseCount}`,
      `数据更新时间：${status.generatedDate || '待确认'}`,
      '学校覆盖：',
      ...schools,
      '说明：Programme / Major 已接入；毕业规则和课程清单按公开资料逐步复核开放。'
    ].join('\n');
    copyTextOrToast(text, '本科状态已复制');
  }
});
