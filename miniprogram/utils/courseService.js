const data = require('./mockData');
const hkuOfferings = require('./hkuOfferings');
const api = require('./apiClient');

const TYPE_LABELS = {
  all: '全部',
  core: '必修',
  major_elective: '专业选修',
  common_core: '通识',
  capstone: '毕业项目',
  free_elective: '自由选修'
};

const USER_DATA_KEYS = [
  'userProfile',
  'favoriteCourseIds',
  'favoriteOfferingCodes',
  'completedCourseIds',
  'completedOfferingCodes',
  'studyPlanItems',
  'recentlyViewedCourseCodes',
  'courseSearchHistory',
  'tpgProgrammeSearchHistory',
  'courseNotes'
];

function getProfile() {
  const profile = wx.getStorageSync('userProfile') || null;
  if (profile && profile.curriculumYear === '2026' && Number(profile.programmeId) === 1) {
    const migrated = { ...profile, curriculumYear: '2025-26' };
    wx.setStorageSync('userProfile', migrated);
    return migrated;
  }
  return profile;
}

function saveProfile(profile) {
  wx.setStorageSync('userProfile', profile);
}

function daysSince(dateValue, now) {
  const timestamp = new Date(dateValue).getTime();
  return Math.max(0, Math.floor((now.getTime() - timestamp) / 86400000));
}

function getRuntimeStatus() {
  if (typeof api.getRuntimeConfig === 'function') return api.getRuntimeConfig();
  return {
    envVersion: 'develop',
    envLabel: '开发版',
    apiBaseUrl: api.API_BASE_URL || '',
    apiEnabled: Boolean(api.API_BASE_URL),
    modeLabel: api.API_BASE_URL ? '本机服务 + 离线回退' : '离线数据'
  };
}

function getDataStatus(now = new Date()) {
  const programme = data.programmes[0];
  const offeringAgeDays = daysSince(hkuOfferings.retrievedAt, now);
  const curriculumAgeDays = daysSince(`${programme.curriculumVerifiedAt}T00:00:00+08:00`, now);
  const stale = offeringAgeDays > 90 || curriculumAgeDays > 90;
  return {
    status: stale ? 'review' : 'current',
    statusLabel: stale ? '需要复核' : '资料当前有效',
    runtime: getRuntimeStatus(),
    offering: {
      academicYear: hkuOfferings.academicYear,
      updatedDate: hkuOfferings.retrievedAt.slice(0, 10),
      ageDays: offeringAgeDays,
      courseCount: hkuOfferings.courses.length,
      detailCount: hkuOfferings.courses.filter((course) => course.details).length,
      sourceUrl: hkuOfferings.sourceUrl
    },
    curriculum: {
      curriculumYear: programme.curriculumYear,
      verifiedDate: programme.curriculumVerifiedAt,
      ageDays: curriculumAgeDays,
      totalCredits: programme.totalCreditRequired,
      categoryCount: (programme.curriculumStructure || []).length,
      sourceUrl: programme.curriculumSourceUrl
    }
  };
}

function getCourseSearchHistory() {
  return wx.getStorageSync('courseSearchHistory') || [];
}

function recordCourseSearch(keyword) {
  const value = String(keyword || '').trim();
  if (!value) return getCourseSearchHistory();
  const history = getCourseSearchHistory();
  const next = [value].concat(history.filter((item) => item.toLowerCase() !== value.toLowerCase())).slice(0, 6);
  wx.setStorageSync('courseSearchHistory', next);
  return next;
}

function clearCourseSearchHistory() {
  wx.setStorageSync('courseSearchHistory', []);
  return [];
}

function getTpgProgrammeSearchHistory() {
  return wx.getStorageSync('tpgProgrammeSearchHistory') || [];
}

function recordTpgProgrammeSearch(keyword) {
  const value = String(keyword || '').trim();
  if (!value) return getTpgProgrammeSearchHistory();
  const history = getTpgProgrammeSearchHistory();
  const next = [value].concat(history.filter((item) => item.toLowerCase() !== value.toLowerCase())).slice(0, 8);
  wx.setStorageSync('tpgProgrammeSearchHistory', next);
  return next;
}

function clearTpgProgrammeSearchHistory() {
  wx.setStorageSync('tpgProgrammeSearchHistory', []);
  return [];
}

function exportUserData() {
  const dataSnapshot = {};
  USER_DATA_KEYS.forEach((key) => {
    const value = wx.getStorageSync(key);
    if (value !== undefined && value !== null && value !== '') dataSnapshot[key] = value;
  });
  return {
    app: 'lectures-app',
    version: 1,
    exportedAt: new Date().toISOString(),
    data: dataSnapshot
  };
}

function formatUserDataBackup(snapshot = exportUserData()) {
  return JSON.stringify(snapshot, null, 2);
}

function getUserDataSummary() {
  const favoriteCodes = new Set(
    getFavoriteOfferingCodes().concat(getFavoriteCourses().map((course) => course.courseCode))
  );
  return {
    hasProfile: Boolean(getProfile()),
    favoriteCount: favoriteCodes.size,
    completedCount: getCompletedOfferingCodes().length,
    studyPlanCount: getStudyPlanItems().length,
    noteCount: getCourseNotes().length,
    recentCount: getRecentlyViewedOfferings().length,
    searchCount: getCourseSearchHistory().length + getTpgProgrammeSearchHistory().length
  };
}

function clearUserData() {
  USER_DATA_KEYS.forEach((key) => wx.removeStorageSync(key));
  return getUserDataSummary();
}

function importUserData(snapshot) {
  const parsed = typeof snapshot === 'string' ? JSON.parse(snapshot) : snapshot;
  if (!parsed || parsed.app !== 'lectures-app' || parsed.version !== 1 || !parsed.data) {
    throw new Error('Invalid backup format');
  }

  const arrayKeys = new Set([
    'favoriteCourseIds',
    'favoriteOfferingCodes',
    'completedCourseIds',
    'completedOfferingCodes',
    'studyPlanItems',
    'recentlyViewedCourseCodes',
    'courseSearchHistory',
    'tpgProgrammeSearchHistory'
  ]);
  USER_DATA_KEYS.forEach((key) => {
    if (!Object.prototype.hasOwnProperty.call(parsed.data, key)) return;
    const value = parsed.data[key];
    if (arrayKeys.has(key) && !Array.isArray(value)) throw new Error(`Invalid ${key}`);
    if (key === 'userProfile' && (typeof value !== 'object' || Array.isArray(value))) {
      throw new Error('Invalid userProfile');
    }
    if (key === 'courseNotes' && (!value || typeof value !== 'object' || Array.isArray(value))) {
      throw new Error('Invalid courseNotes');
    }
  });

  USER_DATA_KEYS.forEach((key) => {
    if (Object.prototype.hasOwnProperty.call(parsed.data, key)) {
      wx.setStorageSync(key, parsed.data[key]);
    }
  });
  return true;
}

function getFavorites() {
  return wx.getStorageSync('favoriteCourseIds') || [];
}

function isFavorite(courseId) {
  return getFavorites().includes(Number(courseId));
}

function toggleFavorite(courseId) {
  const id = Number(courseId);
  const favorites = getFavorites();
  const next = favorites.includes(id) ? favorites.filter((item) => item !== id) : favorites.concat(id);
  wx.setStorageSync('favoriteCourseIds', next);
  return next;
}

function getFavoriteOfferingCodes() {
  return wx.getStorageSync('favoriteOfferingCodes') || [];
}

function isOfferingFavorite(courseCode) {
  return getFavoriteOfferingCodes().includes(String(courseCode).toUpperCase());
}

function toggleOfferingFavorite(courseCode) {
  const code = String(courseCode).toUpperCase();
  const favorites = getFavoriteOfferingCodes();
  const next = favorites.includes(code)
    ? favorites.filter((item) => item !== code)
    : favorites.concat(code);
  wx.setStorageSync('favoriteOfferingCodes', next);
  return next;
}

function getFavoriteOfferings() {
  const codes = getFavoriteOfferingCodes();
  return hkuOfferings.courses.filter((course) => codes.includes(course.courseCode));
}

function getCompletedCourseIds() {
  return wx.getStorageSync('completedCourseIds') || [];
}

function toggleCompleted(courseId) {
  const id = Number(courseId);
  const completed = getCompletedCourseIds();
  const next = completed.includes(id) ? completed.filter((item) => item !== id) : completed.concat(id);
  wx.setStorageSync('completedCourseIds', next);
  return next;
}

function getCompletedOfferingCodes() {
  const completedIds = getCompletedCourseIds();
  const completedCodes = data.courses
    .filter((course) => completedIds.includes(course.id))
    .map((course) => course.courseCode);
  return [...new Set(completedCodes.concat(wx.getStorageSync('completedOfferingCodes') || []))];
}

function isOfferingCompleted(courseCode) {
  return getCompletedOfferingCodes().includes(String(courseCode).toUpperCase());
}

function getCompletedOfferings() {
  const completedCodes = getCompletedOfferingCodes();
  return hkuOfferings.courses.filter((course) => completedCodes.includes(course.courseCode));
}

function toggleOfferingCompleted(courseCode) {
  const code = String(courseCode).toUpperCase();
  const knownCourse = data.courses.find((course) => course.courseCode === code);
  if (knownCourse) {
    toggleCompleted(knownCourse.id);
    return getCompletedOfferingCodes();
  }

  const completed = wx.getStorageSync('completedOfferingCodes') || [];
  const next = completed.includes(code)
    ? completed.filter((item) => item !== code)
    : completed.concat(code);
  wx.setStorageSync('completedOfferingCodes', next);
  return getCompletedOfferingCodes();
}

function getPrerequisiteCourseStatus(prerequisiteText) {
  if (!prerequisiteText || prerequisiteText === 'None') return [];
  const codes = [...new Set(String(prerequisiteText).toUpperCase().match(/[A-Z]{4}\d{4}/g) || [])];
  const completed = getCompletedOfferingCodes();
  return codes.map((courseCode) => ({
    courseCode,
    completed: completed.includes(courseCode)
  }));
}

function getStudyPlanItems() {
  return wx.getStorageSync('studyPlanItems') || [];
}

function recordRecentlyViewed(courseCode) {
  const code = String(courseCode).toUpperCase();
  const existing = wx.getStorageSync('recentlyViewedCourseCodes') || [];
  const isOfficialOffering = hkuOfferings.courses.some((course) => course.courseCode === code);
  if (!isOfficialOffering) return existing;

  const next = [code].concat(existing.filter((item) => item !== code)).slice(0, 5);
  wx.setStorageSync('recentlyViewedCourseCodes', next);
  return next;
}

function getRecentlyViewedOfferings() {
  const codes = wx.getStorageSync('recentlyViewedCourseCodes') || [];
  return codes.map((code) => hkuOfferings.courses.find((course) => course.courseCode === code)).filter(Boolean);
}

function getCourseNote(courseCode) {
  const notes = wx.getStorageSync('courseNotes') || {};
  return notes[String(courseCode).toUpperCase()] || '';
}

function getCourseNotes() {
  const notes = wx.getStorageSync('courseNotes') || {};
  return Object.keys(notes).map((courseCode) => {
    const offering = hkuOfferings.courses.find((course) => course.courseCode === courseCode);
    if (!offering || !notes[courseCode]) return null;
    return {
      courseCode,
      title: offering.title,
      terms: offering.terms,
      termLabel: offering.terms.join(' / '),
      note: notes[courseCode]
    };
  }).filter(Boolean).sort((left, right) => left.courseCode.localeCompare(right.courseCode));
}

function saveCourseNote(courseCode, note) {
  const code = String(courseCode).toUpperCase();
  const notes = wx.getStorageSync('courseNotes') || {};
  const value = String(note || '').trim().slice(0, 500);

  if (value) {
    notes[code] = value;
  } else {
    delete notes[code];
  }
  wx.setStorageSync('courseNotes', notes);
  return value;
}

function getStudyPlanItem(courseCode) {
  const code = String(courseCode).toUpperCase();
  return getStudyPlanItems().find((item) => item.courseCode === code) || null;
}

function isCoursePlanned(courseCode) {
  return Boolean(getStudyPlanItem(courseCode));
}

function saveStudyPlanItem(courseCode, plannedYear, plannedTerm) {
  const code = String(courseCode).toUpperCase();
  const items = getStudyPlanItems();
  const nextItem = {
    courseCode: code,
    plannedYear: Number(plannedYear),
    plannedTerm: String(plannedTerm)
  };
  const next = items.some((item) => item.courseCode === code)
    ? items.map((item) => (item.courseCode === code ? nextItem : item))
    : items.concat(nextItem);
  wx.setStorageSync('studyPlanItems', next);
  return next;
}

function removeStudyPlanItem(courseCode) {
  const code = String(courseCode).toUpperCase();
  const next = getStudyPlanItems().filter((item) => item.courseCode !== code);
  wx.setStorageSync('studyPlanItems', next);
  return next;
}

function getStudyPlanCourses() {
  return getStudyPlanItems().map((item) => {
    const offering = hkuOfferings.courses.find((course) => course.courseCode === item.courseCode);
    return offering ? { ...item, offering } : null;
  }).filter(Boolean);
}

function studyPlanPosition(item) {
  const termOrder = item.plannedTerm === 'full year' ? 0 : Number(item.plannedTerm);
  return (item.plannedYear * 10) + termOrder;
}

function requirementClauses(text) {
  if (!text || text === 'None') return [];
  return String(text).split(/;\s*(?:and\s+)?/i).map((clause) => (
    [...new Set(clause.toUpperCase().match(/[A-Z]{4}\d{4}/g) || [])]
  )).filter((codes) => codes.length);
}

function analyzeStudyPlan() {
  const courses = getStudyPlanCourses();
  const completedCodes = getCompletedOfferingCodes();
  const notices = [];
  const totalCredits = courses.reduce(
    (sum, item) => sum + Number((item.offering.details && item.offering.details.credits) || 0),
    0
  );

  courses.forEach((item) => {
    if (!item.offering.terms.includes(item.plannedTerm)) {
      notices.push({
        id: `offering-${item.courseCode}`,
        type: 'offering',
        courseCode: item.courseCode,
        message: `${item.courseCode} 官方开课学期为 ${item.offering.terms.join(' / ')}，与计划中的 Semester ${item.plannedTerm} 不一致。`
      });
    }

    const checkClauses = (text, allowSameTerm) => requirementClauses(text).filter((codes) => (
      !codes.some((code) => {
        if (completedCodes.includes(code)) return true;
        const planned = courses.find((course) => course.courseCode === code);
        if (!planned) return false;
        return allowSameTerm
          ? studyPlanPosition(planned) <= studyPlanPosition(item)
          : studyPlanPosition(planned) < studyPlanPosition(item);
      })
    ));

    const missingPrerequisiteClauses = checkClauses(
      item.offering.details && item.offering.details.prerequisites,
      false
    );
    if (missingPrerequisiteClauses.length) {
      const missingCodes = missingPrerequisiteClauses.flat();
      notices.push({
        id: `prerequisite-${item.courseCode}`,
        type: 'prerequisite',
        courseCode: item.courseCode,
        missingCodes,
        message: `${item.courseCode} 的先修要求尚缺：${missingPrerequisiteClauses.map((codes) => codes.join(' / ')).join('；')}。`
      });
    }

    const missingCorequisiteClauses = checkClauses(
      item.offering.details && item.offering.details.corequisites,
      true
    );
    if (missingCorequisiteClauses.length) {
      const missingCodes = missingCorequisiteClauses.flat();
      notices.push({
        id: `corequisite-${item.courseCode}`,
        type: 'corequisite',
        courseCode: item.courseCode,
        missingCodes,
        message: `${item.courseCode} 的共修要求尚缺：${missingCorequisiteClauses.map((codes) => codes.join(' / ')).join('；')}。`
      });
    }
  });

  const termLoads = [];
  [1, 2, 3, 4].forEach((year) => {
    ['1', '2'].forEach((term) => {
      const credits = courses.reduce((sum, item) => {
        if (item.plannedYear !== year) return sum;
        const courseCredits = Number((item.offering.details && item.offering.details.credits) || 0);
        if (item.plannedTerm === term) return sum + courseCredits;
        if (item.plannedTerm === 'full year') return sum + (courseCredits / 2);
        return sum;
      }, 0);
      termLoads.push({ year, term, credits, overloaded: credits > 36 });
      if (credits > 36) {
        notices.push({
          id: `load-${year}-${term}`,
          type: 'load',
          courseCode: '',
          message: `Year ${year} Semester ${term} 已安排 ${credits} 学分，超过 36 学分，请确认课业负担。`
        });
      }
    });
  });

  const noticeCounts = notices.reduce((counts, notice) => ({
    ...counts,
    [notice.type]: (counts[notice.type] || 0) + 1
  }), {});

  return {
    courseCount: courses.length,
    totalCredits,
    noticeCount: notices.length,
    noticeCounts,
    issueCodes: [...new Set(notices.map((notice) => notice.courseCode).filter(Boolean))],
    termLoads,
    notices
  };
}

function formatStudyPlanText(now = new Date()) {
  const courses = getStudyPlanCourses().slice().sort((left, right) => (
    studyPlanPosition(left) - studyPlanPosition(right)
    || left.courseCode.localeCompare(right.courseCode)
  ));
  const review = analyzeStudyPlan();
  const profile = getProfile();
  const lines = [
    'HKU BEng(CompSc) Study Plan',
    `Curriculum: ${(profile && profile.curriculumYear) || '2025-26'}`,
    `Generated: ${now.toISOString().slice(0, 10)}`,
    ''
  ];

  [1, 2, 3, 4].forEach((year) => {
    const yearCourses = courses.filter((course) => course.plannedYear === year);
    if (!yearCourses.length) return;
    lines.push(`Year ${year}`);
    ['1', '2', 'full year'].forEach((term) => {
      const termCourses = yearCourses.filter((course) => course.plannedTerm === term);
      if (!termCourses.length) return;
      lines.push(term === 'full year' ? 'Full Year' : `Semester ${term}`);
      termCourses.forEach((course) => {
        const credits = Number((course.offering.details && course.offering.details.credits) || 0);
        lines.push(`- ${course.courseCode} ${course.offering.title} (${credits} credits)`);
      });
    });
    lines.push('');
  });

  lines.push(`Total: ${review.courseCount} courses · ${review.totalCredits} credits`);
  if (review.notices.length) {
    lines.push('', `Plan checks: ${review.noticeCount}`);
    review.notices.forEach((notice) => lines.push(`- ${notice.message}`));
  } else {
    lines.push('', 'Plan checks: no current reminders');
  }
  lines.push('', 'For planning reference only. Confirm official timetable, prerequisites and degree requirements with HKU.');
  return lines.join('\n');
}

function listCourses(filters = {}) {
  const keyword = (filters.keyword || '').trim().toLowerCase();
  return data.courses.filter((course) => {
    const matchesProgramme = !filters.programmeId || course.programmeId === Number(filters.programmeId);
    const matchesMajor = !filters.majorId || course.majorId === Number(filters.majorId);
    const matchesType = !filters.courseType || filters.courseType === 'all' || course.courseType === filters.courseType;
    const matchesKeyword = !keyword
      || course.courseCode.toLowerCase().includes(keyword)
      || course.titleEn.toLowerCase().includes(keyword)
      || (course.titleZh || '').toLowerCase().includes(keyword);
    const matchesPrereq = filters.hasPrerequisite === undefined
      || filters.hasPrerequisite === null
      || (filters.hasPrerequisite ? course.prerequisites !== 'None' : course.prerequisites === 'None');
    return matchesProgramme && matchesMajor && matchesType && matchesKeyword && matchesPrereq;
  });
}

function listCoursesFromMock(filters = {}) {
  return listCourses(filters);
}

function listCourseOfferings(filters = {}) {
  const keyword = (filters.keyword || '').trim().toLowerCase();
  const category = filters.category === 'all'
    ? ''
    : (filters.category || '').trim().toLowerCase();
  return hkuOfferings.courses.filter((course) => {
    const matchesKeyword = !keyword
      || course.courseCode.toLowerCase().includes(keyword)
      || course.title.toLowerCase().includes(keyword);
    const matchesTerm = !filters.term || filters.term === 'all' || course.terms.includes(filters.term);
    const matchesCategory = !category
      || course.categories.some((item) => item.toLowerCase().includes(category));
    const matchesYear = !filters.year || filters.year === 'all' || course.categories.some((item) => {
      const range = item.match(/Year\s+(\d)\s+to\s+(\d)/i);
      if (range) return Number(filters.year) >= Number(range[1]) && Number(filters.year) <= Number(range[2]);
      return item.toLowerCase().includes(`year ${filters.year}`);
    });
    return matchesKeyword && matchesTerm && matchesCategory && matchesYear;
  });
}

function listUniversitiesFromMock() {
  return data.universities;
}

function listProgrammesFromMock(universityId) {
  return data.programmes.filter((item) => !universityId || item.universityId === Number(universityId));
}

function listMajorsFromMock(programmeId) {
  return data.majors.filter((item) => !programmeId || item.programmeId === Number(programmeId));
}

function listCurriculumYears(programmeId, majorId) {
  return [...new Set(data.requirements
    .filter((item) => (
      (!programmeId || item.programmeId === Number(programmeId))
      && (!majorId || item.majorId === Number(majorId))
    ))
    .map((item) => item.curriculumYear))]
    .sort((a, b) => b.localeCompare(a));
}

function getCourse(courseId) {
  return data.courses.find((course) => course.id === Number(courseId));
}

function getFavoriteCourses() {
  const ids = getFavorites();
  return data.courses.filter((course) => ids.includes(course.id));
}

function buildAudit(profile, completedCourseIds) {
  const effectiveProfile = profile || getProfile() || { programmeId: 1, majorId: 1, curriculumYear: '2025-26' };
  const completedIds = completedCourseIds || getCompletedCourseIds();
  const completedCourses = data.courses.filter((course) => completedIds.includes(course.id));
  const completedCodes = [...new Set(
    completedCourses.map((course) => course.courseCode)
      .concat(wx.getStorageSync('completedOfferingCodes') || [])
  )];
  const completedOfferingCredits = hkuOfferings.courses
    .filter((course) => completedCodes.includes(course.courseCode))
    .reduce((sum, course) => sum + Number((course.details && course.details.credits) || 0), 0);
  const completedNonOfferingCredits = completedCourses
    .filter((course) => !hkuOfferings.courses.some((offering) => offering.courseCode === course.courseCode))
    .reduce((sum, course) => sum + course.credits, 0);
  const completedCredits = completedOfferingCredits + completedNonOfferingCredits;
  const programme = data.programmes.find((item) => item.id === Number(effectiveProfile.programmeId)) || data.programmes[0];
  let requirements = data.requirements.filter((item) => (
    item.programmeId === Number(effectiveProfile.programmeId)
    && item.majorId === Number(effectiveProfile.majorId)
    && item.curriculumYear === effectiveProfile.curriculumYear
  ));
  let resolvedCurriculumYear = effectiveProfile.curriculumYear;
  if (!requirements.length) {
    resolvedCurriculumYear = programme.curriculumYear;
    requirements = data.requirements.filter((item) => (
      item.programmeId === Number(effectiveProfile.programmeId)
      && item.majorId === Number(effectiveProfile.majorId)
      && item.curriculumYear === resolvedCurriculumYear
    ));
  }

  const sections = requirements.map((requirement) => {
    const requirementCourses = data.courses.filter((course) => requirement.courseIds.includes(course.id));
    const done = requirementCourses.filter((course) => completedIds.includes(course.id));
    const doneCredits = done.reduce((sum, course) => sum + course.credits, 0);
    const missing = requirementCourses.filter((course) => !completedIds.includes(course.id));

    return {
      type: requirement.type,
      name: requirement.name,
      trackingScope: requirement.trackingScope || 'complete',
      requiredCredits: requirement.requiredCredits,
      completedCredits: Math.min(doneCredits, requirement.requiredCredits),
      progress: requirement.requiredCredits ? Math.min(100, Math.round((doneCredits / requirement.requiredCredits) * 100)) : 0,
      missingCourses: missing,
      completedCourses: done
    };
  });

  const recommendations = sections
    .flatMap((section) => section.missingCourses.map((course) => ({
      course,
      reason: ['foundation', 'cs_core', 'capstone'].includes(section.type)
        ? '尚未记录这门指定课程'
        : `${section.name}仍有未记录课程`
    })))
    .sort((a, b) => {
      const priority = { core: 1, major_elective: 2, capstone: 3, common_core: 4 };
      return (priority[a.course.courseType] || 9) - (priority[b.course.courseType] || 9);
    })
    .slice(0, 4);

  return {
    totalCreditRequired: programme.totalCreditRequired,
    completedCredits,
    totalProgress: Math.min(100, Math.round((completedCredits / programme.totalCreditRequired) * 100)),
    curriculumYear: resolvedCurriculumYear,
    curriculumStructure: programme.curriculumStructure || [],
    curriculumSourceUrl: programme.curriculumSourceUrl || programme.officialUrl,
    curriculumVerifiedAt: programme.curriculumVerifiedAt || '',
    trackingNotice: '官方 240 学分结构已核准；逐门课程完成度目前仅覆盖部分内置课程。',
    sections,
    recommendations
  };
}

async function withFallback(apiCall, fallbackCall) {
  try {
    const result = await apiCall();
    return {
      data: result,
      source: 'api'
    };
  } catch (error) {
    return {
      data: fallbackCall(),
      source: 'mock'
    };
  }
}

function listUniversitiesRemote() {
  return withFallback(
    () => api.request('/api/universities'),
    () => listUniversitiesFromMock()
  );
}

function listProgrammesRemote(universityId) {
  return withFallback(
    () => api.request(`/api/programmes${api.toQuery({ university_id: universityId })}`),
    () => listProgrammesFromMock(universityId)
  );
}

function listMajorsRemote(programmeId) {
  return withFallback(
    () => api.request(`/api/majors${api.toQuery({ programme_id: programmeId })}`),
    () => listMajorsFromMock(programmeId)
  );
}

function listCoursesRemote(filters = {}) {
  return withFallback(
    () => api.request(`/api/courses${api.toQuery({
      programme_id: filters.programmeId,
      major_id: filters.majorId,
      course_type: filters.courseType,
      keyword: filters.keyword,
      has_prerequisite: filters.hasPrerequisite
    })}`),
    () => listCoursesFromMock(filters)
  );
}

function listCourseOfferingsRemote(filters = {}) {
  return withFallback(
    () => api.request(`/api/course-offerings${api.toQuery({
      academic_year: filters.academicYear || hkuOfferings.academicYear,
      keyword: filters.keyword,
      term: filters.term === 'all' ? null : filters.term,
      category: filters.category === 'all' ? null : filters.category,
      year: filters.year === 'all' ? null : filters.year
    })}`),
    () => ({
      ...hkuOfferings,
      courses: listCourseOfferings(filters)
    })
  );
}

function getCourseOffering(courseCode) {
  const normalizedCode = String(courseCode || '').toUpperCase();
  const offering = hkuOfferings.courses.find((item) => item.courseCode === normalizedCode);
  if (!offering) return null;
  const existing = data.courses.find((item) => item.courseCode === normalizedCode);
  const details = offering.details || {};
  const yearMatch = offering.categories.join(' ').match(/Year\s+(\d)/i);
  return {
    universityCode: hkuOfferings.universityCode,
    provider: hkuOfferings.provider,
    academicYear: hkuOfferings.academicYear,
    offering,
    course: {
      ...(existing || {}),
      courseCode: offering.courseCode,
      titleEn: offering.title,
      credits: details.credits !== null && details.credits !== undefined
        ? details.credits
        : existing && existing.credits,
      prerequisites: details.prerequisites || (existing && existing.prerequisites) || 'None',
      corequisites: details.corequisites || 'None',
      exclusions: details.exclusions || (existing && existing.exclusions) || 'None',
      description: details.description || (existing && existing.description) || '',
      recommendedYear: (existing && existing.recommendedYear) || (yearMatch ? Number(yearMatch[1]) : null),
      officialUrl: offering.officialUrl
    }
  };
}

function getCourseShareInfo(courseCode) {
  const data = getCourseOffering(courseCode);
  if (!data) return null;
  return {
    title: `${data.offering.courseCode} · ${data.offering.title}`,
    path: `/pages/offering-detail/offering-detail?code=${encodeURIComponent(data.offering.courseCode)}`
  };
}

function getCourseOfferingRemote(courseCode) {
  return withFallback(
    () => api.request(`/api/course-offerings/${encodeURIComponent(String(courseCode).toUpperCase())}`),
    () => getCourseOffering(courseCode)
  );
}

function getCourseRemote(courseId) {
  return withFallback(
    () => api.request(`/api/courses/${courseId}`),
    () => getCourse(courseId)
  );
}

async function getFavoriteCoursesRemote() {
  const ids = getFavorites();
  const coursesResult = await listCoursesRemote({});
  return {
    data: coursesResult.data.filter((course) => ids.includes(course.id)),
    source: coursesResult.source
  };
}

function buildAuditRemote(profile, completedCourseIds) {
  const effectiveProfile = profile || getProfile() || { programmeId: 1, majorId: 1, curriculumYear: '2025-26' };
  const completedIds = completedCourseIds || getCompletedCourseIds();

  return withFallback(
    async () => {
      const result = await api.request('/api/graduation-audit', {
        method: 'POST',
        data: {
          programmeId: effectiveProfile.programmeId,
          majorId: effectiveProfile.majorId,
          curriculumYear: effectiveProfile.curriculumYear,
          completedCourseIds: completedIds,
          completedOfferingCodes: wx.getStorageSync('completedOfferingCodes') || []
        }
      });

      const sections = (result.sections || []).map((section) => ({
        ...section,
        progress: section.requiredCredits ? Math.min(100, Math.round((section.completedCredits / section.requiredCredits) * 100)) : 0
      }));

      return {
        totalCreditRequired: result.totalCreditsRequired,
        completedCredits: result.completedCredits,
        totalProgress: result.totalCreditsRequired ? Math.min(100, Math.round((result.completedCredits / result.totalCreditsRequired) * 100)) : 0,
        curriculumYear: result.curriculumYear,
        curriculumStructure: result.curriculumStructure || [],
        curriculumSourceUrl: result.curriculumSourceUrl || '',
        curriculumVerifiedAt: result.curriculumVerifiedAt || '',
        trackingNotice: result.trackingNotice || '',
        sections,
        recommendations: (result.recommendations || []).map((item) => ({
          course: {
            courseCode: item.courseCode,
            titleEn: item.courseTitle
          },
          reason: item.reason
        }))
      };
    },
    () => buildAudit(effectiveProfile, completedIds)
  );
}

module.exports = {
  TYPE_LABELS,
  USER_DATA_KEYS,
  data,
  buildAudit,
  buildAuditRemote,
  exportUserData,
  formatUserDataBackup,
  formatStudyPlanText,
  getCompletedCourseIds,
  getCompletedOfferingCodes,
  getCompletedOfferings,
  analyzeStudyPlan,
  getCourse,
  getDataStatus,
  getCourseNote,
  getCourseNotes,
  getCourseSearchHistory,
  getTpgProgrammeSearchHistory,
  getCourseShareInfo,
  getCourseRemote,
  getCourseOffering,
  getCourseOfferingRemote,
  getFavoriteCourses,
  getFavoriteCoursesRemote,
  getFavoriteOfferingCodes,
  getFavoriteOfferings,
  getFavorites,
  getProfile,
  getPrerequisiteCourseStatus,
  getRecentlyViewedOfferings,
  getStudyPlanCourses,
  getStudyPlanItem,
  getStudyPlanItems,
  getUserDataSummary,
  isFavorite,
  isOfferingCompleted,
  isOfferingFavorite,
  isCoursePlanned,
  importUserData,
  listCourses,
  listCoursesRemote,
  listCurriculumYears,
  listCourseOfferings,
  listCourseOfferingsRemote,
  listMajorsRemote,
  listProgrammesRemote,
  listUniversitiesRemote,
  removeStudyPlanItem,
  recordCourseSearch,
  recordTpgProgrammeSearch,
  recordRecentlyViewed,
  saveStudyPlanItem,
  saveCourseNote,
  saveProfile,
  clearCourseSearchHistory,
  clearTpgProgrammeSearchHistory,
  clearUserData,
  toggleCompleted,
  toggleFavorite,
  toggleOfferingCompleted,
  toggleOfferingFavorite
};
