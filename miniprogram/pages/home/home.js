const service = require('../../utils/courseService');
const tpgService = require('../../utils/tpgService');
const ugService = require('../../utils/ugService');

function buildTpgNextSteps(summary) {
  if (!summary) return [];
  const hasCourses = summary.courseCount > 0;
  return [
    {
      status: 'DONE',
      statusLabel: '已选择',
      title: 'Programme 已选择',
      copy: `${summary.schoolLabel} · ${summary.yearLabel}`
    },
    {
      status: hasCourses ? 'READY' : 'CHECKING',
      statusLabel: hasCourses ? '可查看' : '复核中',
      title: hasCourses ? '课程结构可查看' : '课程清单待开放',
      copy: hasCourses
        ? `${summary.statusLabel}，可以先浏览必修/选修分组。`
        : '已保留 Programme 入口；课程组完成复核后会直接显示。'
    },
    {
      status: hasCourses ? 'NEXT' : 'SAFE',
      statusLabel: hasCourses ? '下一步' : '安全提示',
      title: hasCourses ? '下一步：对照官方要求' : '下一步：查看资料来源',
      copy: hasCourses
        ? '毕业检查页会展示课程组，但正式选课前仍以学校官网为准。'
        : '课程组未开放前，暂不生成该 Programme 的毕业完成度。'
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
    isUgCatalogue: false,
    ugProfile: null,
    ugNextSteps: []
  },

  async onShow() {
    const profile = service.getProfile();
    const isTpg = profile && profile.profileType === 'tpg';
    const tpgProfile = tpgService.getProfileSummary(profile);
    const ugProfile = profile && profile.profileType === 'undergraduate'
      ? ugService.getMajorProfile(profile.programmeId, profile.majorId, profile.curriculumYear)
      : null;
    const isUgCatalogue = Boolean(ugProfile && ugProfile.sourceStatus);
    const auditResult = !profile || isTpg || isUgCatalogue
      ? {
          data: {
            completedCredits: 0,
            totalCreditRequired: isTpg ? profile.creditsRequired || 0 : 0,
            totalProgress: 0
          },
          source: profile ? 'catalogue' : 'none'
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
      isUgCatalogue,
      ugProfile,
      ugNextSteps: ugProfile ? [
        {
          status: 'DONE',
          statusLabel: '已选择',
          title: '本科范围已选择',
          copy: `${ugProfile.university.nameZh || ugProfile.university.code} · ${ugProfile.curriculumYear}`
        },
        {
          status: ugProfile.codedCourseCount > 0 ? 'READY' : 'CHECKING',
          statusLabel: ugProfile.codedCourseCount > 0 ? '可查看' : '复核中',
          title: ugProfile.codedCourseCount > 0 ? '课程代码可查看' : '课程清单待开放',
          copy: ugProfile.codedCourseCount > 0
            ? `已开放 ${ugProfile.codedCourseCount} 门课程代码，可先在课程页浏览。`
            : '已保留 Programme / Major 入口；课程清单复核后会直接显示。'
        },
        {
          status: 'SAFE',
          statusLabel: '安全提示',
          title: '毕业进度暂不自动判断',
          copy: '本科规则差异较大，完成复核前不会生成误导性的百分比。'
        }
      ] : [],
      audit: auditResult.data,
      recentCourses,
      dataSource: auditResult.source
    });
  },

  goOnboarding() {
    wx.navigateTo({ url: service.buildOnboardingUrl() });
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

  goPrivacyData() {
    wx.navigateTo({ url: '/pages/privacy-data/privacy-data' });
  },

  goSelectedTpg() {
    const profile = this.data.profile;
    wx.navigateTo({
      url: `/pages/tpg-programme/tpg-programme?id=${encodeURIComponent(profile.programmeId)}`
    });
  },

  goSelectedUg() {
    wx.switchTab({ url: '/pages/courses/courses' });
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
