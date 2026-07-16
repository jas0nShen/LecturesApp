const service = require('../../utils/courseService');
const tpgService = require('../../utils/tpgService');

function emptyReview() {
  return {
    courseCount: 0,
    totalCredits: 0,
    completedCount: 0,
    favoriteCount: 0,
    noteCount: 0,
    noticeCount: 0,
    categoryStats: [],
    noticeCounts: {},
    issueCodes: [],
    termLoads: [],
    loadSuggestions: [],
    notices: []
  };
}

function formatTpgPlanText(plan) {
  const lines = [
    `Programme: ${plan.programmeName}`,
    plan.trackName ? `Track: ${plan.trackName}` : '',
    `Planned courses: ${plan.courseCount}`,
    `Planned credits: ${plan.totalCredits}`,
    `Completed: ${plan.completedCount}`,
    `Programme official credits: ${plan.officialCredits || '待确认'}`
  ].filter(Boolean);
  plan.groups.forEach((group) => {
    lines.push('', `${group.name} · ${group.courseCount} 门 · ${group.credits} credits`);
    group.courses.forEach((course) => {
      lines.push(`- ${course.code} ${course.name} · ${course.creditLabel} · ${course.completed ? '已修' : '未修'}`);
    });
  });
  lines.push('', '仅供选课规划，课程安排与学分要求以学校官方资料为准。');
  return lines.join('\n');
}

Page({
  data: {
    supported: false,
    mode: '',
    loading: false,
    loadError: false,
    unsupportedMessage: '',
    tpgPlan: {
      programmeId: '',
      programmeName: '',
      trackName: '',
      courseCount: 0,
      totalCredits: 0,
      completedCount: 0,
      officialCredits: 0,
      groups: []
    },
    groups: [],
    suggestions: [],
    coreGapSummary: {
      courseCount: 0,
      credits: 0,
      groups: []
    },
    review: emptyReview()
  },

  async onShow() {
    const profile = service.getProfile();
    if (profile && profile.profileType === 'tpg') {
      await this.loadTpgPlan(profile);
      return;
    }
    this.loadUndergraduatePlan(profile);
  },

  loadUndergraduatePlan(profile) {
    const capability = service.getPlanningCapability(profile);
    if (!capability.supported) {
      this.setData({ supported: false, mode: '', loading: false, loadError: false, unsupportedMessage: capability.reason, groups: [], suggestions: [], coreGapSummary: { courseCount: 0, credits: 0, groups: [] }, review: emptyReview() });
      return;
    }
    const courses = service.getStudyPlanCourses();
    const review = service.analyzeStudyPlan();
    const suggestions = service.getStudyPlanSuggestions(5);
    const coreGapSummary = service.getStudyPlanCoreGapSummary();
    const groups = [1, 2, 3, 4].map((year) => {
      const yearCourses = courses
        .filter((item) => item.plannedYear === year)
        .map((item) => ({
          ...item,
          credits: Number((item.offering.details && item.offering.details.credits) || 0),
          termLabel: item.plannedTerm === 'full year' ? 'Full Year' : `Semester ${item.plannedTerm}`,
          categoryLabel: item.categoryLabel,
          hasIssue: review.issueCodes.includes(item.courseCode)
        }));
      const semesterOne = review.termLoads.find((item) => item.year === year && item.term === '1');
      const semesterTwo = review.termLoads.find((item) => item.year === year && item.term === '2');
      return {
        year,
        courses: yearCourses,
        credits: yearCourses.reduce((sum, item) => sum + item.credits, 0),
        semesterOne,
        semesterTwo
      };
    });
    this.setData({
      supported: true,
      mode: capability.mode || 'hku-four-year-plan',
      loading: false,
      loadError: false,
      unsupportedMessage: '',
      groups,
      suggestions,
      coreGapSummary,
      review: {
        ...review,
        completedCount: courses.filter((item) => item.completed).length,
        favoriteCount: courses.filter((item) => item.favorite).length,
        noteCount: courses.filter((item) => item.hasNote).length
      }
    });
  },

  async loadTpgPlan(profile) {
    this.setData({ loading: true, loadError: false, mode: 'tpg-course-plan' });
    let programme = tpgService.getProgramme(profile.programmeId);
    const app = typeof getApp === 'function' ? getApp() : {};
    try {
      if (programme && app.ensureTpgUniversityLoaded) await app.ensureTpgUniversityLoaded(programme.universityCode);
    } catch (error) {
      this.setData({ supported: false, loading: false, loadError: true, unsupportedMessage: '选课计划数据加载失败，请重试。' });
      return;
    }
    programme = tpgService.getProgramme(profile.programmeId);
    const capability = service.getPlanningCapability(profile);
    if (!capability.supported || !programme) {
      this.setData({
        supported: false,
        loading: false,
        loadError: false,
        unsupportedMessage: capability.reason || 'Programme 资料不存在。',
        tpgPlan: { programmeId: '', programmeName: '', trackName: '', courseCount: 0, totalCredits: 0, completedCount: 0, officialCredits: 0, groups: [] }
      });
      return;
    }

    const trackId = profile.trackId || '';
    const track = trackId ? tpgService.getTrack(programme.id, trackId) : null;
    const plannedKeys = new Set(service.getTpgPlannedCourseKeys());
    const seenCodes = new Set();
    const groups = tpgService.resolveCourseGroups(programme, trackId).map((group, groupIndex) => {
      const courses = (group.courses || []).filter((course) => {
        const code = String(course.code || '').trim().toUpperCase();
        const key = `${programme.id}:${code}`;
        if (!code || seenCodes.has(code) || !plannedKeys.has(key)) return false;
        seenCodes.add(code);
        return true;
      }).map((course) => {
        const credits = tpgService.resolveCourseCredits(course);
        return {
          ...course,
          code: String(course.code || '').trim().toUpperCase(),
          credits: credits === null ? 0 : credits,
          creditLabel: tpgService.getCourseCreditLabel(course),
          completed: service.isTpgCourseCompleted(programme.id, course.code)
        };
      });
      return {
        id: `${groupIndex}-${group.name}`,
        name: group.name,
        courses,
        courseCount: courses.length,
        credits: courses.reduce((sum, course) => sum + course.credits, 0)
      };
    }).filter((group) => group.courseCount > 0);
    const courses = groups.flatMap((group) => group.courses);
    this.setData({
      supported: true,
      mode: 'tpg-course-plan',
      loading: false,
      loadError: false,
      unsupportedMessage: '',
      tpgPlan: {
        programmeId: programme.id,
        programmeName: programme.name,
        trackName: track ? track.name : '',
        courseCount: courses.length,
        totalCredits: courses.reduce((sum, course) => sum + course.credits, 0),
        completedCount: courses.filter((course) => course.completed).length,
        officialCredits: tpgService.getCreditsRequired(programme, trackId),
        groups
      }
    });
  },

  retryTpgLoad() {
    const profile = service.getProfile();
    const programme = profile && tpgService.getProgramme(profile.programmeId);
    const app = typeof getApp === 'function' ? getApp() : {};
    if (!profile || !programme || !app.retryTpgUniversityLoad) return this.onShow();
    this.setData({ loading: true, loadError: false });
    return app.retryTpgUniversityLoad(programme.universityCode).then(() => this.loadTpgPlan(profile)).catch(() => {
      this.setData({ supported: false, loading: false, loadError: true, unsupportedMessage: '选课计划数据加载失败，请重试。' });
    });
  },

  goCourses() {
    wx.switchTab({ url: '/pages/courses/courses' });
  },

  goSettings() {
    service.openOnboarding();
  },

  copyPlan() {
    if (!this.data.review.courseCount) {
      wx.showToast({ title: '计划中还没有课程', icon: 'none' });
      return;
    }
    wx.setClipboardData({
      data: service.formatStudyPlanText(),
      success() {
        wx.showToast({ title: '四年计划已复制' });
      }
    });
  },

  copyTpgPlan() {
    if (!this.data.tpgPlan.courseCount) {
      wx.showToast({ title: '计划中还没有课程', icon: 'none' });
      return;
    }
    wx.setClipboardData({
      data: formatTpgPlanText(this.data.tpgPlan),
      success() {
        wx.showToast({ title: '选课计划已复制' });
      }
    });
  },

  removeTpgCourse(event) {
    service.removeTpgPlannedCourse(this.data.tpgPlan.programmeId, event.currentTarget.dataset.code);
    wx.showToast({ title: '已移出计划' });
    return this.onShow();
  },

  toggleTpgCompleted(event) {
    const code = event.currentTarget.dataset.code;
    service.toggleTpgCourseCompleted(this.data.tpgPlan.programmeId, code);
    const completed = service.isTpgCourseCompleted(this.data.tpgPlan.programmeId, code);
    wx.showToast({ title: completed ? '已标记已修' : '已取消已修' });
    return this.onShow();
  },

  openTpgDetail(event) {
    wx.navigateTo({
      url: `/pages/course-detail/course-detail?tpgProgrammeId=${encodeURIComponent(this.data.tpgPlan.programmeId)}&courseCode=${encodeURIComponent(event.currentTarget.dataset.code)}`
    });
  },

  goTpgCourses() {
    wx.switchTab({ url: '/pages/courses/courses' });
  },

  copyPlanStatus() {
    if (!this.data.review.courseCount) {
      wx.showToast({ title: '计划中还没有课程', icon: 'none' });
      return;
    }
    wx.setClipboardData({
      data: service.formatStudyPlanStatusText(),
      success() {
        wx.showToast({ title: '状态摘要已复制' });
      }
    });
  },

  copyCoreGap() {
    if (!this.data.coreGapSummary.courseCount) {
      wx.showToast({ title: '暂无未安排核心课', icon: 'none' });
      return;
    }
    wx.setClipboardData({
      data: service.formatStudyPlanCoreGapText(),
      success() {
        wx.showToast({ title: '核心课清单已复制' });
      }
    });
  },

  copyPlanChecks() {
    if (!this.data.review.noticeCount) {
      wx.showToast({ title: '暂无计划提醒', icon: 'none' });
      return;
    }
    wx.setClipboardData({
      data: service.formatStudyPlanCheckText(),
      success() {
        wx.showToast({ title: '检查清单已复制' });
      }
    });
  },

  editCourse(event) {
    wx.navigateTo({
      url: `/pages/plan-course/plan-course?code=${event.currentTarget.dataset.code}`
    });
  },

  removeCourse(event) {
    service.removeStudyPlanItem(event.currentTarget.dataset.code);
    this.onShow();
    wx.showToast({ title: '已移出计划' });
  },

  toggleCompleted(event) {
    const code = event.currentTarget.dataset.code;
    const completed = service.toggleOfferingCompleted(code).includes(String(code).toUpperCase());
    this.onShow();
    wx.showToast({ title: completed ? '已标记已修' : '已取消已修' });
  },

  toggleFavorite(event) {
    const code = event.currentTarget.dataset.code;
    const favorite = service.toggleOfferingFavorite(code).includes(String(code).toUpperCase());
    this.onShow();
    wx.showToast({ title: favorite ? '已收藏' : '已取消收藏' });
  },

  openDetail(event) {
    wx.navigateTo({
      url: `/pages/offering-detail/offering-detail?code=${event.currentTarget.dataset.code}`
    });
  },

  planSuggestion(event) {
    wx.navigateTo({
      url: `/pages/plan-course/plan-course?code=${event.currentTarget.dataset.code}`
    });
  }
});
