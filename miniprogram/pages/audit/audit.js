const service = require('../../utils/courseService');
const tpgService = require('../../utils/tpgService');
const ugService = require('../../utils/ugService');

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
      state: totalCredits ? '已收录' : '待确认'
    },
    {
      label: '已拆课程',
      value: courseCount,
      state: status.hasCourseGroups ? '可查看' : '待开放'
    },
    {
      label: '资料年份',
      value: university.academicYear || '待确认',
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
        '课程组开放后再查看毕业进度',
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
    statusTitle: status.hasCourseGroups ? '课程结构已录入' : '课程清单待开放',
    statusCopy: status.hasCourseGroups
      ? '已展示从资料中拆出的课程组。正式选课前，仍建议与学校官网及 Programme Handbook 对照。'
      : '目前先确认学校、Programme 与资料来源；课程组尚未开放前，暂不生成毕业完成度。',
    detailEntryCopy: status.hasCourseGroups
      ? `${courseCount} 门课程已开放 · 点击查看 Programme 详情`
      : '点击查看 Programme 来源、学分与收录状态',
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
    isUgCatalogue: false,
    ugAudit: null,
    needsSetup: false
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
        isUgCatalogue: false,
        ugAudit: null,
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
        isUgCatalogue: false,
        ugAudit: null,
        dataSource: 'catalogue'
      });
      return;
    }

    const ugProfile = profile && profile.profileType === 'undergraduate'
      ? ugService.getMajorProfile(profile.programmeId, profile.majorId, profile.curriculumYear)
      : null;
    if (ugProfile && ugProfile.sourceStatus) {
      this.setData({
        needsSetup: false,
        isTpg: false,
        tpgAudit: null,
        isUgCatalogue: true,
        ugAudit: {
          profile: ugProfile,
          hasCourses: ugProfile.codedCourseCount > 0,
          courseCount: ugProfile.codedCourseCount || 0,
          statusTitle: ugProfile.codedCourseCount > 0 ? '课程清单已开放' : '课程清单待开放',
          statusCopy: ugProfile.codedCourseCount > 0
            ? '当前显示已从公开资料整理出的课程代码；毕业进度规则仍需继续复核。'
            : '当前先确认学校、Programme 与 Major；课程代码和毕业规则完成复核后再开放进度计算。',
          nextChecks: ugProfile.codedCourseCount > 0
            ? ['浏览课程页查看已录入课程代码', '对照学校系统确认选课要求', '后续版本再开放逐项毕业进度']
            : ['确认 Programme / Major 是否选择正确', '复制官方来源与学校页面对照', '等待课程清单和毕业规则复核']
        },
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
      isUgCatalogue: false,
      ugAudit: null,
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
    wx.navigateTo({ url: service.buildOnboardingUrl() });
  },

  copyTpgSource() {
    const programme = this.data.tpgAudit && this.data.tpgAudit.programme;
    if (!programme) return;
    const data = programme.sourceUrl || tpgService.buildProgrammeSourceText(programme);
    wx.setClipboardData({
      data,
      success: () => {
        wx.showToast({ title: programme.sourceUrl ? '官方链接已复制' : '资料来源已复制' });
      }
    });
  },

  copyUgSource() {
    const profile = this.data.ugAudit && this.data.ugAudit.profile;
    if (!profile || !profile.sourceUrl) {
      wx.showToast({ title: '暂无官方链接', icon: 'none' });
      return;
    }
    wx.setClipboardData({
      data: profile.sourceUrl,
      success: () => {
        wx.showToast({ title: '官方链接已复制' });
      }
    });
  }
});
