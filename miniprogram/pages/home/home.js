const service = require('../../utils/courseService');
const tpgService = require('../../utils/tpgService');

function buildTpgNextSteps(summary) {
  if (!summary) return [];
  const hasCourses = summary.courseCount > 0;
  return [
    {
      status: 'DONE',
      title: 'Programme 已选择',
      copy: `${summary.schoolLabel} · ${summary.yearLabel}`
    },
    {
      status: hasCourses ? 'READY' : 'CHECKING',
      title: hasCourses ? '课程结构可查看' : '课程结构核验中',
      copy: hasCourses
        ? `${summary.statusLabel}，可以先浏览必修/选修分组。`
        : '已保留 Programme 入口，后续补齐课程组后会直接显示。'
    },
    {
      status: hasCourses ? 'NEXT' : 'SAFE',
      title: hasCourses ? '下一步：对照官方要求' : '下一步：等待课程拆分',
      copy: hasCourses
        ? '毕业检查页会展示课程组，但正式选课前仍以学校官网为准。'
        : '为避免误导，暂不生成未核验 Programme 的毕业完成度。'
    }
  ];
}

Page({
  data: {
    profile: null,
    audit: {
      completedCredits: 0,
      totalCreditRequired: 240,
      totalProgress: 0
    },
    dataSource: 'loading',
    recentCourses: [],
    isTpg: false,
    tpgProfile: null,
    tpgNextSteps: [],
    tpgCoverage: tpgService.getSchoolCoverage()
  },

  async onShow() {
    const profile = service.getProfile();
    const isTpg = profile && profile.profileType === 'tpg';
    const tpgProfile = tpgService.getProfileSummary(profile);
    const auditResult = isTpg
      ? {
          data: {
            completedCredits: 0,
            totalCreditRequired: profile.creditsRequired || 0,
            totalProgress: 0
          },
          source: 'catalogue'
        }
      : await service.buildAuditRemote(profile);
    const recentCourses = service.getRecentlyViewedOfferings().slice(0, 3).map((course) => ({
      ...course,
      termLabel: course.terms.join(' / ')
    }));
    this.setData({
      profile,
      isTpg,
      tpgProfile,
      tpgNextSteps: buildTpgNextSteps(tpgProfile),
      audit: auditResult.data,
      recentCourses,
      dataSource: auditResult.source
    });
  },

  goOnboarding() {
    wx.navigateTo({ url: '/pages/onboarding/onboarding' });
  },

  goCourses() {
    wx.switchTab({ url: '/pages/courses/courses' });
  },

  goAudit() {
    wx.switchTab({ url: '/pages/audit/audit' });
  },

  goFavorites() {
    wx.navigateTo({ url: '/pages/favorites/favorites' });
  },

  goStudyPlan() {
    wx.navigateTo({ url: '/pages/study-plan/study-plan' });
  },

  goTpgCatalog() {
    wx.navigateTo({ url: '/pages/tpg-catalog/tpg-catalog' });
  },

  goSelectedTpg() {
    const profile = this.data.profile;
    wx.navigateTo({
      url: `/pages/tpg-programme/tpg-programme?id=${encodeURIComponent(profile.programmeId)}`
    });
  },

  goRecentCourse(event) {
    wx.navigateTo({
      url: `/pages/offering-detail/offering-detail?code=${event.currentTarget.dataset.code}`
    });
  },

  goProfile() {
    wx.switchTab({ url: '/pages/profile/profile' });
  }
});
