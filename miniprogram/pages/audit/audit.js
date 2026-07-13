const service = require('../../utils/courseService');
const tpgService = require('../../utils/tpgService');
const ugService = require('../../utils/ugService');

function buildTpgAudit(programme, university, trackId = '') {
  const groups = tpgService.resolveCourseGroups(programme, trackId).map((group, groupIndex) => ({
    ...group,
    courses: (group.courses || []).map((course, courseIndex) => ({
      ...course,
      rowKey: `${groupIndex}-${course.code}-${courseIndex}`,
      credits: tpgService.resolveAuditCredits(course),
      creditStatus: course.credits !== undefined ? 'official' : course.creditsMin ? 'official_range' : 'unknown',
      creditLabel: tpgService.getCourseCreditLabel(course),
      completed: service.isTpgCourseCompleted(programme.id, course.code)
    })),
    courseCount: (group.courses || []).length
  }));
  const status = tpgService.getStatus(programme);
  const courseCount = status.courseCount;
  const totalCredits = tpgService.getCreditsRequired(programme, trackId);
  const completedCourses = groups.flatMap((group) => group.courses).filter((course) => course.completed);
  const completedCredits = completedCourses.reduce((sum, course) => sum + (course.credits || 0), 0);
  const unknownCompletedCredits = completedCourses.filter((course) => course.creditStatus !== 'official').length;
  const canCalculateRemaining = status.isComplete && totalCredits > 0 && unknownCompletedCredits === 0;
  const remainingCredits = canCalculateRemaining ? Math.max(0, totalCredits - completedCredits) : null;
  const snapshot = [
    {
      label: '已修学分',
      value: completedCredits,
      state: unknownCompletedCredits ? `${unknownCompletedCredits} 门学分未知未计入` : totalCredits ? `共需 ${totalCredits}` : '总要求待确认'
    },
    {
      label: '剩余学分',
      value: remainingCredits === null ? '--' : remainingCredits,
      state: canCalculateRemaining ? '按已核验规则估算' : '规则或学分需人工核对'
    },
    {
      label: '已修课程',
      value: completedCourses.length,
      state: `共 ${courseCount} 门可选`
    }
  ];
  const nextChecks = status.hasCourseGroups
    ? [
        '查看已拆出的必修/选修课程组',
        '对照 Programme Handbook 与学校选课系统',
        '点击下方课程记录已修状态'
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
    completedCourseCount: completedCourses.length,
    completedCredits,
    remainingCredits,
    unknownCompletedCredits,
    needsManualReview: !status.isComplete || programme.ruleReviewStatus === 'manual_review_required' || unknownCompletedCredits > 0,
    hasCourseGroups: status.hasCourseGroups,
    statusTitle: status.title,
    statusCopy: status.copy,
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
    const requestId = (this._requestId || 0) + 1;
    this._requestId = requestId;
    if (profile.profileType === 'undergraduate') {
      const programme = ugService.getProgramme(profile.programmeId);
      const universityCode = profile.universityCode || (programme && programme.universityCode);
      const app = typeof getApp === 'function' ? getApp() : {};
      if (universityCode && app.ensureUniversityLoaded) {
        try {
          await app.ensureUniversityLoaded(universityCode);
        } catch (error) {
          if (requestId !== this._requestId) return;
          this.setData({ needsSetup: false, isTpg: false, isUgCatalogue: false, ugAudit: null, dataSource: 'error' });
          return;
        }
      }
    }
    if (profile.profileType === 'tpg') {
      const programme = tpgService.getProgramme(profile.programmeId);
      const universityCode = profile.universityCode || (programme && programme.universityCode);
      const app = typeof getApp === 'function' ? getApp() : {};
      if (universityCode && app.ensureTpgUniversityLoaded) {
        try {
          await app.ensureTpgUniversityLoaded(universityCode);
        } catch (error) {
          if (requestId !== this._requestId) return;
          this.setData({ needsSetup: false, isTpg: false, tpgAudit: null, isUgCatalogue: false, ugAudit: null, dataSource: 'error' });
          return;
        }
      }
    }

    const tpgProgramme = profile && profile.profileType === 'tpg'
      ? tpgService.getProgramme(profile.programmeId)
      : null;
    if (tpgProgramme) {
      this.setData({
        needsSetup: false,
        isTpg: true,
        tpgAudit: buildTpgAudit(tpgProgramme, tpgService.getProgrammeUniversity(tpgProgramme), profile.trackId || ''),
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

  toggleTpgCourseCompleted(event) {
    const programme = this.data.tpgAudit && this.data.tpgAudit.programme;
    const courseCode = event.currentTarget.dataset.code;
    if (!programme || !courseCode) return;
    service.toggleTpgCourseCompleted(programme.id, courseCode);
    this.setData({
      tpgAudit: buildTpgAudit(programme, this.data.tpgAudit.university, (service.getProfile() || {}).trackId || '')
    });
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
    service.openOnboarding();
  },

  retryUgLoad() {
    const profile = service.getProfile();
    const app = typeof getApp === 'function' ? getApp() : {};
    if (profile && profile.profileType === 'tpg') {
      const programme = tpgService.getProgramme(profile.programmeId);
      const universityCode = profile.universityCode || (programme && programme.universityCode);
      if (!universityCode || !app.retryTpgUniversityLoad) return this.refresh();
      app.retryTpgUniversityLoad(universityCode).then(() => this.refresh()).catch(() => {
        wx.showToast({ title: '暂时无法加载，请稍后重试', icon: 'none' });
      });
      return;
    }
    const programme = profile && ugService.getProgramme(profile.programmeId);
    const universityCode = profile && (profile.universityCode || (programme && programme.universityCode));
    if (!universityCode || !app.retryUniversityLoad) return this.refresh();
    app.retryUniversityLoad(universityCode).then(() => this.refresh()).catch(() => {
      wx.showToast({ title: '暂时无法加载，请稍后重试', icon: 'none' });
    });
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
