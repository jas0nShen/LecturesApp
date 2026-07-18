const service = require('../../utils/courseService');
const tpgService = require('../../utils/tpgService');
const ugService = require('../../utils/ugService');

const UG_PLAN_TERM_ORDER = ['1', '2', '3', 'summer', 'full year'];

function getUgPlanTermLabel(term) {
  if (term === 'summer') return 'Summer';
  if (term === 'full year') return 'Full Year';
  return term ? `Term ${term}` : '待安排';
}

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

function formatUgPlanText(plan) {
  const lines = [
    `${plan.universityCode} · ${plan.programmeName}`,
    `Major: ${plan.majorName}`,
    `Curriculum year: ${plan.curriculumYear || '待确认'}`,
    `Planned courses: ${plan.courseCount}`,
    `Completed: ${plan.completedCount}`,
    `Planned incomplete: ${plan.incompleteCount}`,
    `Known credits: ${plan.knownCredits || 0}`
  ];
  plan.groups.forEach((group) => {
    lines.push('', `${group.name} · ${group.courseCount} 门`);
    group.courses.forEach((course) => {
      lines.push(`- ${course.courseCode} ${course.titleEn} · ${course.completed ? '已修' : '未修'} · 用户计划：${course.userPlanLabel} · 官方参考：${course.officialReferenceLabel}${course.creditLabel ? ` · ${course.creditLabel}` : ''}`);
    });
  });
  lines.push('', '仅供课程规划；不计算毕业百分比、学分差额或毕业资格。正式安排以学校课程系统和培养方案为准。');
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
    ugPlan: {
      universityCode: '',
      programmeId: '',
      programmeName: '',
      majorId: '',
      majorName: '',
      curriculumYear: '',
      courseCount: 0,
      completedCount: 0,
      incompleteCount: 0,
      knownCredits: 0,
      knownCreditsDisplay: '-',
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
    const capability = service.getPlanningCapability(profile);
    if (profile && profile.profileType === 'undergraduate' && capability.mode === 'ug-course-plan') {
      if (!capability.supported) {
        this.setData({ supported: false, mode: 'ug-course-plan', loading: false, loadError: false, unsupportedMessage: capability.reason });
        return;
      }
      await this.loadUgPlan(profile);
      return;
    }
    this.loadUndergraduatePlan(profile);
  },

  async loadUgPlan(profile) {
    this.setData({ loading: true, loadError: false, mode: 'ug-course-plan' });
    const programme = ugService.getProgramme(profile.programmeId);
    const universityCode = profile.universityCode || (programme && programme.universityCode) || '';
    const app = typeof getApp === 'function' ? (getApp({ allowDefault: true }) || {}) : {};
    try {
      if (universityCode && app.ensureUniversityLoaded) await app.ensureUniversityLoaded(universityCode);
    } catch (error) {
      this.setData({ supported: false, loading: false, loadError: true, unsupportedMessage: '本科课程计划数据加载失败，请重试。' });
      return;
    }
    const capability = service.getPlanningCapability(profile);
    const ugProfile = ugService.getMajorProfile(profile.programmeId, profile.majorId, profile.curriculumYear);
    if (!capability.supported || !ugProfile) {
      this.setData({ supported: false, loading: false, loadError: false, unsupportedMessage: capability.reason || '本科 Programme 或 Major 资料不存在。' });
      return;
    }
    const assignmentMap = new Map(service.getUgCoursePlanAssignments().map((item) => [item.courseKey, item]));
    const courses = ugService.listMajorCourses(profile.programmeId, profile.majorId)
      .filter((course) => service.isUgCoursePlanned(profile.programmeId, profile.majorId, course.id))
      .map((course) => {
        const hasKnownCredits = course.credits !== undefined && course.credits !== null && Number.isFinite(Number(course.credits));
        const assignment = assignmentMap.get(`${profile.programmeId}:${profile.majorId}:${course.id}`) || null;
        const plannedYear = assignment && assignment.plannedYear !== null ? Number(assignment.plannedYear) : null;
        const plannedTerm = assignment ? assignment.plannedTerm : '';
        const isScheduled = Number.isInteger(plannedYear) && plannedYear >= 1 && plannedYear <= 6 && UG_PLAN_TERM_ORDER.includes(plannedTerm);
        const recommendedYear = Number(course.recommendedYear);
        const officialYearLabel = Number.isInteger(recommendedYear) && recommendedYear > 0 ? `Year ${recommendedYear}` : '未提供';
        const officialTermLabel = course.semester || '未提供';
        return {
          ...course,
          credits: hasKnownCredits ? Number(course.credits) : 0,
          hasKnownCredits,
          completed: service.isUgCourseCompleted(profile.programmeId, profile.majorId, course.id),
          creditLabel: hasKnownCredits ? `${Number(course.credits)} credits` : '',
          plannedYear,
          plannedTerm,
          isScheduled,
          userPlanLabel: `${plannedYear ? `Year ${plannedYear}` : 'Year 待安排'} · ${getUgPlanTermLabel(plannedTerm)}`,
          officialReferenceLabel: `推荐年级 ${officialYearLabel} · 学期 ${officialTermLabel}`
        };
      });
    const groupKeys = [...new Set(courses.map((course) => course.isScheduled ? `${course.plannedYear}:${course.plannedTerm}` : 'pending'))]
      .sort((left, right) => {
        if (left === 'pending') return 1;
        if (right === 'pending') return -1;
        const [leftYear, leftTerm] = left.split(':');
        const [rightYear, rightTerm] = right.split(':');
        return Number(leftYear) - Number(rightYear)
          || UG_PLAN_TERM_ORDER.indexOf(leftTerm) - UG_PLAN_TERM_ORDER.indexOf(rightTerm);
      });
    const groups = groupKeys.map((groupKey) => {
      const groupCourses = courses.filter((course) => (course.isScheduled ? `${course.plannedYear}:${course.plannedTerm}` : 'pending') === groupKey);
      const [year, term] = groupKey === 'pending' ? ['', ''] : groupKey.split(':');
      return {
        id: groupKey === 'pending' ? 'pending' : `year-${year}-${term.replace(/\s+/g, '-')}`,
        name: groupKey === 'pending' ? '待安排' : `Year ${year} · ${getUgPlanTermLabel(term)}`,
        courseCount: groupCourses.length,
        knownCredits: groupCourses.reduce((sum, course) => sum + course.credits, 0),
        courses: groupCourses
      };
    });
    const knownCredits = courses.reduce((sum, course) => sum + course.credits, 0);
    const completedCount = courses.filter((course) => course.completed).length;
    this.setData({
      supported: true,
      mode: 'ug-course-plan',
      loading: false,
      loadError: false,
      unsupportedMessage: '',
      ugPlan: {
        universityCode: ugProfile.university && ugProfile.university.code || universityCode,
        programmeId: ugProfile.programme.id,
        programmeName: ugProfile.programme.nameEn || ugProfile.programme.nameZh || '',
        majorId: ugProfile.major.id,
        majorName: ugProfile.major.nameEn || ugProfile.major.nameZh || '',
        curriculumYear: ugProfile.curriculumYear || '',
        courseCount: courses.length,
        completedCount,
        incompleteCount: courses.length - completedCount,
        knownCredits,
        knownCreditsDisplay: courses.some((course) => course.hasKnownCredits) ? knownCredits : '-',
        groups
      }
    });
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
    const app = typeof getApp === 'function' ? (getApp({ allowDefault: true }) || {}) : {};
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
    const app = typeof getApp === 'function' ? (getApp({ allowDefault: true }) || {}) : {};
    if (!profile || !programme || !app.retryTpgUniversityLoad) return this.onShow();
    this.setData({ loading: true, loadError: false });
    return app.retryTpgUniversityLoad(programme.universityCode).then(() => this.loadTpgPlan(profile)).catch(() => {
      this.setData({ supported: false, loading: false, loadError: true, unsupportedMessage: '选课计划数据加载失败，请重试。' });
    });
  },

  retryPlanLoad() {
    if (this.data.mode === 'tpg-course-plan') return this.retryTpgLoad();
    const profile = service.getProfile();
    const programme = profile && ugService.getProgramme(profile.programmeId);
    const universityCode = profile && (profile.universityCode || (programme && programme.universityCode));
    const app = typeof getApp === 'function' ? (getApp({ allowDefault: true }) || {}) : {};
    if (!profile || !universityCode || !app.retryUniversityLoad) return this.onShow();
    this.setData({ loading: true, loadError: false });
    return app.retryUniversityLoad(universityCode).then(() => this.loadUgPlan(profile)).catch(() => {
      this.setData({ supported: false, loading: false, loadError: true, unsupportedMessage: '本科课程计划数据加载失败，请重试。' });
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

  copyUgPlan() {
    if (!this.data.ugPlan.courseCount) {
      wx.showToast({ title: '计划中还没有课程', icon: 'none' });
      return;
    }
    wx.setClipboardData({
      data: formatUgPlanText(this.data.ugPlan),
      success() {
        wx.showToast({ title: '本科课程计划已复制' });
      }
    });
  },

  removeUgCourse(event) {
    service.removeUgPlannedCourse(this.data.ugPlan.programmeId, this.data.ugPlan.majorId, event.currentTarget.dataset.id);
    wx.showToast({ title: '已移出计划' });
    return this.onShow();
  },

  openUgDetail(event) {
    wx.navigateTo({
      url: `/pages/course-detail/course-detail?ugId=${encodeURIComponent(event.currentTarget.dataset.id)}&universityCode=${encodeURIComponent(this.data.ugPlan.universityCode)}`
    });
  },

  editUgAssignment(event) {
    wx.navigateTo({
      url: `/pages/plan-course/plan-course?ugId=${encodeURIComponent(event.currentTarget.dataset.id)}&universityCode=${encodeURIComponent(this.data.ugPlan.universityCode)}`
    });
  },

  toggleUgCompleted(event) {
    const courseId = event.currentTarget.dataset.id;
    service.toggleUgCourseCompleted(this.data.ugPlan.programmeId, this.data.ugPlan.majorId, courseId);
    const completed = service.isUgCourseCompleted(this.data.ugPlan.programmeId, this.data.ugPlan.majorId, courseId);
    wx.showToast({ title: completed ? '已标记已修' : '已撤销已修' });
    return this.onShow();
  },

  goUgCourses() {
    wx.switchTab({ url: '/pages/courses/courses' });
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
