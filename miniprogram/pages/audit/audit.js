const service = require('../../utils/courseService');
const tpgService = require('../../utils/tpgService');

function buildTpgAudit(programme, university) {
  const groups = (programme.courseGroups || []).map((group, groupIndex) => ({
    ...group,
    courses: (group.courses || []).map((course, courseIndex) => ({
      ...course,
      rowKey: `${groupIndex}-${course.code}-${courseIndex}`
    })),
    courseCount: (group.courses || []).length
  }));
  const status = tpgService.getStatus(programme);
  const courseCount = status.courseCount;
  const totalCredits = programme.creditsRequired || 0;
  const snapshot = [
    {
      label: '毕业学分 / units',
      value: totalCredits || '--',
      state: totalCredits ? '已收录' : '待核验'
    },
    {
      label: '已拆课程',
      value: courseCount,
      state: status.hasCourseGroups ? '可查看' : '整理中'
    },
    {
      label: '资料年份',
      value: university.academicYear || '待核验',
      state: programme.sourceUrl ? '可追溯' : '本地 PDF'
    }
  ];
  const nextChecks = status.hasCourseGroups
    ? [
        '查看已拆出的必修/选修课程组',
        '对照 Programme Handbook 与学校选课系统',
        '后续版本再开放逐门完成度勾选'
      ]
    : [
        '先确认 Programme 与官方来源是否匹配',
        '等待课程组拆分完成后再计算毕业进度',
        '可先去资料库查看同校其他 Programme'
      ];
  return {
    programme,
    university,
    groups,
    snapshot,
    nextChecks,
    courseCount,
    totalCredits,
    hasCourseGroups: status.hasCourseGroups,
    statusTitle: status.hasCourseGroups ? '课程结构已录入' : '课程结构待核验',
    statusCopy: status.hasCourseGroups
      ? '已展示从资料中拆出的课程组。正式选课前，仍建议与学校官网及 Programme Handbook 对照。'
      : '目前先确认学校、Programme 与官方资料来源；课程组未核验前，不做毕业完成度判断。',
    progressLabel: status.hasCourseGroups ? '可查看课程组' : '暂不计算进度'
  };
}

Page({
  data: {
    audit: {
      sections: [],
      recommendations: [],
      completedCredits: 0,
      totalCreditRequired: 240,
      totalProgress: 0,
      curriculumStructure: []
    },
    dataSource: 'loading',
    isTpg: false,
    tpgAudit: null,
    needsSetup: false,
    tpgCoverage: tpgService.getSchoolCoverage()
  },

  onShow() {
    this.refresh();
  },

  async refresh() {
    const profile = service.getProfile();
    if (!profile) {
      this.setData({
        needsSetup: true,
        isTpg: false,
        tpgAudit: null,
        dataSource: 'catalogue'
      });
      return;
    }

    const tpgProgramme = profile && profile.profileType === 'tpg'
      ? tpgService.getProgramme(profile.programmeId)
      : null;
    if (tpgProgramme) {
      this.setData({
        needsSetup: false,
        isTpg: true,
        tpgAudit: buildTpgAudit(tpgProgramme, tpgService.getProgrammeUniversity(tpgProgramme)),
        dataSource: 'catalogue'
      });
      return;
    }

    const completedIds = service.getCompletedCourseIds();
    const auditResult = await service.buildAuditRemote(profile, completedIds);
    this.setData({
      needsSetup: false,
      isTpg: false,
      tpgAudit: null,
      audit: auditResult.data,
      dataSource: auditResult.source
    });
  },

  goCompletedCourses() {
    wx.navigateTo({ url: '/pages/completed-courses/completed-courses' });
  },

  copyCurriculumSource() {
    wx.setClipboardData({
      data: this.data.audit.curriculumSourceUrl,
      success() {
        wx.showToast({ title: '官方来源已复制' });
      }
    });
  },

  goTpgProgramme() {
    const programme = this.data.tpgAudit && this.data.tpgAudit.programme;
    if (!programme) return;
    wx.navigateTo({
      url: `/pages/tpg-programme/tpg-programme?id=${encodeURIComponent(programme.id)}`
    });
  },

  goTpgCatalog() {
    wx.navigateTo({ url: '/pages/tpg-catalog/tpg-catalog' });
  },

  goOnboarding() {
    wx.navigateTo({ url: '/pages/onboarding/onboarding' });
  },

  copyTpgSource() {
    const programme = this.data.tpgAudit && this.data.tpgAudit.programme;
    if (!programme || !programme.sourceUrl) {
      wx.showToast({ title: '官方链接整理中', icon: 'none' });
      return;
    }
    wx.setClipboardData({
      data: programme.sourceUrl,
      success() {
        wx.showToast({ title: '官方链接已复制' });
      }
    });
  }
});
