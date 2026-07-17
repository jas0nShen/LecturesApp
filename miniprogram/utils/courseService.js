const data = require('./mockData');
const hkuOfferings = require('./hkuOfferings');
const ugService = require('./ugService');
const tpgService = require('./tpgService');
const api = require('./apiClient');

const TYPE_LABELS = {
  all: '全部',
  core: '必修',
  major_elective: '专业选修',
  common_core: '通识',
  capstone: '毕业项目',
  free_elective: '自由选修'
};

const STUDY_PLAN_CATEGORY_DEFS = [
  { key: 'core', label: 'Core' },
  { key: 'elective', label: 'Elective' },
  { key: 'capstone', label: 'Capstone' },
  { key: 'other', label: 'Other' }
];

const UG_COURSE_PLAN_TERMS = ['1', '2', '3', 'summer', 'full year'];

const USER_DATA_KEYS = [
  'userProfile',
  'favoriteCourseIds',
  'favoriteOfferingCodes',
  'favoriteTpgCourseKeys',
  'completedCourseIds',
  'completedOfferingCodes',
  'completedTpgCourseKeys',
  'plannedUgCourseKeys',
  'ugCoursePlanAssignments',
  'plannedTpgCourseKeys',
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
  if (profile && profile.profileType === 'tpg') {
    const programme = tpgService.getProgramme(profile.programmeId);
    if (!programme) throw new Error('Invalid TPG programme');
    if (!tpgService.isTrackSelectionComplete(programme, profile.trackId || '')) {
      throw new Error('TPG Track selection is required or invalid');
    }
  }
  wx.setStorageSync('userProfile', profile);
}

function buildOnboardingUrl(profile = getProfile()) {
  const mode = profile && profile.profileType === 'undergraduate' ? 'undergraduate' : 'tpg';
  const params = {
    mode,
    profileType: profile && profile.profileType,
    universityId: profile && profile.universityId,
    universityCode: profile && profile.universityCode,
    programmeId: profile && profile.programmeId,
    trackId: profile && profile.trackId,
    majorId: profile && profile.majorId,
    majorCode: profile && profile.majorCode,
    curriculumYear: profile && profile.curriculumYear,
    currentYear: profile && profile.currentYear
  };
  const query = Object.keys(params)
    .filter((key) => params[key] !== undefined && params[key] !== null && params[key] !== '')
    .map((key) => `${key}=${encodeURIComponent(params[key])}`)
    .join('&');
  return `/pages/onboarding/onboarding?${query || `mode=${mode}`}`;
}

function openOnboarding(profile = getProfile()) {
  const url = buildOnboardingUrl(profile);
  wx.navigateTo({
    url,
    fail() {
      // navigateTo can fail when the page stack is full, especially after repeated edits in DevTools.
      wx.reLaunch({
        url,
        fail() {
          wx.showToast({ title: '无法打开资料设置，请重新进入小程序后再试', icon: 'none' });
        }
      });
    }
  });
  return url;
}

function getPlanningCapability(profile = getProfile()) {
  if (!profile) {
    return {
      supported: false,
      reason: '请先在“我的资料”中设置学校和专业。',
      settingsUrl: buildOnboardingUrl(profile)
    };
  }
  const isBuiltInHkuCompSc = profile.profileType === 'undergraduate'
    && String(profile.programmeId) === '1'
    && String(profile.majorId) === '1';
  if (isBuiltInHkuCompSc) {
    return {
      supported: true,
      mode: 'hku-four-year-plan',
      reason: '',
      settingsUrl: buildOnboardingUrl(profile)
    };
  }
  if (profile.profileType === 'undergraduate') {
    const settingsUrl = buildOnboardingUrl(profile);
    const ugProfile = ugService.getMajorProfile(profile.programmeId, profile.majorId, profile.curriculumYear);
    if (!ugProfile) {
      return {
        supported: false,
        mode: 'ug-course-plan',
        reason: '当前 Programme 或 Major 不存在，请重新选择本科课程范围。',
        settingsUrl
      };
    }
    if (ugProfile.sourceStatus !== 'course_codes_available') {
      return {
        supported: false,
        mode: 'ug-course-plan',
        reason: '当前 Major 只有 Programme 索引，课程清单待开放，暂不能使用课程计划。',
        settingsUrl
      };
    }
    return {
      supported: true,
      mode: 'ug-course-plan',
      reason: '',
      settingsUrl
    };
  }
  if (profile.profileType === 'tpg') {
    const programme = tpgService.getProgramme(profile.programmeId);
    const settingsUrl = buildOnboardingUrl(profile);
    if (!programme) {
      return {
        supported: false,
        mode: 'tpg-course-plan',
        reason: '当前 Programme 不存在，请重新选择 Programme。',
        settingsUrl
      };
    }
    if (['blocked', 'archived'].includes(programme.courseVerificationStatus)) {
      return {
        supported: false,
        mode: 'tpg-course-plan',
        reason: '当前 Programme 的课程来源仍在复核中，暂不开放选课计划。',
        settingsUrl
      };
    }
    if (!tpgService.hasCourseGroups(programme)) {
      return {
        supported: false,
        mode: 'tpg-course-plan',
        reason: '当前 Programme 暂无已核验课程组，暂不开放选课计划。',
        settingsUrl
      };
    }
    if (!tpgService.isTrackSelectionComplete(programme, profile.trackId || '')) {
      return {
        supported: false,
        mode: 'tpg-course-plan',
        reason: '请先选择完整的 Track，再使用选课计划。',
        settingsUrl
      };
    }
    if (programme.courseVerificationStatus !== 'verified') {
      return {
        supported: false,
        mode: 'tpg-course-plan',
        reason: '当前 Programme 的课程结构尚未完成官方复核，暂不开放选课计划。',
        settingsUrl
      };
    }
    return {
      supported: true,
      mode: 'tpg-course-plan',
      reason: '',
      settingsUrl
    };
  }
  return {
    supported: false,
    reason: '当前专业的毕业规则尚未完成官方复核，因此暂不提供收藏、已修和 Study Plan 建议。你仍可浏览课程与资料状态。',
    settingsUrl: buildOnboardingUrl(profile)
  };
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
    favoriteCount: favoriteCodes.size + getFavoriteTpgCourseKeys().length,
    completedCount: getCompletedOfferingCodes().length + getCompletedTpgCourseKeys().length,
    studyPlanCount: getStudyPlanItems().length + getUgPlannedCourseKeys().length + getTpgPlannedCourseKeys().length,
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
    'favoriteTpgCourseKeys',
    'completedCourseIds',
    'completedOfferingCodes',
    'completedTpgCourseKeys',
    'plannedUgCourseKeys',
    'ugCoursePlanAssignments',
    'plannedTpgCourseKeys',
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
    if (key === 'plannedTpgCourseKeys' && value.some((item) => {
      if (typeof item !== 'string') return true;
      const separatorIndex = item.indexOf(':');
      if (separatorIndex <= 0 || separatorIndex === item.length - 1) return true;
      const programmeId = item.slice(0, separatorIndex);
      const courseCode = item.slice(separatorIndex + 1);
      return programmeId !== programmeId.trim()
        || courseCode.includes(':')
        || item !== buildTpgCourseKey(programmeId, courseCode);
    })) {
      throw new Error('Invalid plannedTpgCourseKeys');
    }
    if (key === 'plannedUgCourseKeys' && value.some((item) => {
      if (typeof item !== 'string') return true;
      const parts = item.split(':');
      if (parts.length !== 3 || parts.some((part) => !part || part !== part.trim())) return true;
      return item !== buildUgCourseKey(parts[0], parts[1], parts[2]);
    })) {
      throw new Error('Invalid plannedUgCourseKeys');
    }
    if (key === 'ugCoursePlanAssignments') {
      const seenCourseKeys = new Set();
      const invalid = value.some((item) => {
        if (!item || typeof item !== 'object' || Array.isArray(item)) return true;
        if (!Object.prototype.hasOwnProperty.call(item, 'courseKey')
          || !Object.prototype.hasOwnProperty.call(item, 'plannedYear')
          || !Object.prototype.hasOwnProperty.call(item, 'plannedTerm')) return true;
        const parts = typeof item.courseKey === 'string' ? item.courseKey.split(':') : [];
        if (parts.length !== 3 || parts.some((part) => !part || part !== part.trim())) return true;
        if (item.courseKey !== buildUgCourseKey(parts[0], parts[1], parts[2]) || seenCourseKeys.has(item.courseKey)) return true;
        seenCourseKeys.add(item.courseKey);
        const yearPending = item.plannedYear === null || item.plannedYear === '';
        const year = Number(item.plannedYear);
        if (!yearPending && (!Number.isInteger(year) || year < 1 || year > 6)) return true;
        if (typeof item.plannedTerm !== 'string' || (item.plannedTerm && !UG_COURSE_PLAN_TERMS.includes(item.plannedTerm))) return true;
        return yearPending && !item.plannedTerm;
      });
      if (invalid) throw new Error('Invalid ugCoursePlanAssignments');
    }
  });
  if (parsed.data.ugCoursePlanAssignments) {
    const plannedUgCourseKeys = new Set(parsed.data.plannedUgCourseKeys || []);
    if (parsed.data.ugCoursePlanAssignments.some((item) => !plannedUgCourseKeys.has(item.courseKey))) {
      throw new Error('Invalid ugCoursePlanAssignments');
    }
  }
  const importedProfile = parsed.data.userProfile;
  if (importedProfile && importedProfile.profileType === 'tpg') {
    const programme = tpgService.getProgramme(importedProfile.programmeId);
    if (!programme) throw new Error('Invalid TPG programme');
    if (!tpgService.isValidTrack(programme.id, importedProfile.trackId || '')) {
      throw new Error('Invalid TPG track');
    }
  }

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

function getCompletedTpgCourseKeys() {
  return wx.getStorageSync('completedTpgCourseKeys') || [];
}

function buildTpgCourseKey(programmeId, courseCode) {
  return `${programmeId}:${String(courseCode || '').trim().toUpperCase()}`;
}

function getFavoriteTpgCourseKeys() {
  return wx.getStorageSync('favoriteTpgCourseKeys') || [];
}

function isTpgCourseFavorite(programmeId, courseCode) {
  return getFavoriteTpgCourseKeys().includes(buildTpgCourseKey(programmeId, courseCode));
}

function toggleTpgCourseFavorite(programmeId, courseCode) {
  const key = buildTpgCourseKey(programmeId, courseCode);
  const favorites = getFavoriteTpgCourseKeys();
  const next = favorites.includes(key)
    ? favorites.filter((item) => item !== key)
    : favorites.concat(key);
  wx.setStorageSync('favoriteTpgCourseKeys', next);
  return next;
}

function isTpgCourseCompleted(programmeId, courseCode) {
  return getCompletedTpgCourseKeys().includes(buildTpgCourseKey(programmeId, courseCode));
}

function toggleTpgCourseCompleted(programmeId, courseCode) {
  const key = buildTpgCourseKey(programmeId, courseCode);
  const completed = getCompletedTpgCourseKeys();
  const next = completed.includes(key)
    ? completed.filter((item) => item !== key)
    : completed.concat(key);
  wx.setStorageSync('completedTpgCourseKeys', next);
  return next;
}

function getTpgPlannedCourseKeys() {
  return wx.getStorageSync('plannedTpgCourseKeys') || [];
}

function buildUgCourseKey(programmeId, majorId, courseId) {
  return [programmeId, majorId, courseId].map((part) => String(part || '').trim()).join(':');
}

function getUgPlannedCourseKeys() {
  return wx.getStorageSync('plannedUgCourseKeys') || [];
}

function isUgCoursePlanned(programmeId, majorId, courseId) {
  return getUgPlannedCourseKeys().includes(buildUgCourseKey(programmeId, majorId, courseId));
}

function toggleUgPlannedCourse(programmeId, majorId, courseId) {
  const key = buildUgCourseKey(programmeId, majorId, courseId);
  const planned = getUgPlannedCourseKeys();
  const removing = planned.includes(key);
  const next = removing ? planned.filter((item) => item !== key) : planned.concat(key);
  wx.setStorageSync('plannedUgCourseKeys', next);
  if (removing) clearUgCoursePlanAssignment(programmeId, majorId, courseId);
  return next;
}

function removeUgPlannedCourse(programmeId, majorId, courseId) {
  const key = buildUgCourseKey(programmeId, majorId, courseId);
  const next = getUgPlannedCourseKeys().filter((item) => item !== key);
  wx.setStorageSync('plannedUgCourseKeys', next);
  clearUgCoursePlanAssignment(programmeId, majorId, courseId);
  return next;
}

function getUgCoursePlanAssignments() {
  return wx.getStorageSync('ugCoursePlanAssignments') || [];
}

function getUgCoursePlanAssignment(programmeId, majorId, courseId) {
  const key = buildUgCourseKey(programmeId, majorId, courseId);
  return getUgCoursePlanAssignments().find((item) => item.courseKey === key) || null;
}

function saveUgCoursePlanAssignment(programmeId, majorId, courseId, plannedYear, plannedTerm) {
  const key = buildUgCourseKey(programmeId, majorId, courseId);
  if (!getUgPlannedCourseKeys().includes(key)) throw new Error('UG course is not in the plan');
  const yearPending = plannedYear === null || plannedYear === undefined || plannedYear === '';
  const year = yearPending ? null : Number(plannedYear);
  const term = String(plannedTerm || '').trim().toLowerCase();
  if (year !== null && (!Number.isInteger(year) || year < 1 || year > 6)) throw new Error('Invalid UG planned year');
  if (term && !UG_COURSE_PLAN_TERMS.includes(term)) throw new Error('Invalid UG planned term');
  if (year === null && !term) return clearUgCoursePlanAssignment(programmeId, majorId, courseId);
  const assignment = { courseKey: key, plannedYear: year, plannedTerm: term };
  const next = getUgCoursePlanAssignments().filter((item) => item.courseKey !== key).concat(assignment);
  wx.setStorageSync('ugCoursePlanAssignments', next);
  return assignment;
}

function clearUgCoursePlanAssignment(programmeId, majorId, courseId) {
  const key = buildUgCourseKey(programmeId, majorId, courseId);
  const next = getUgCoursePlanAssignments().filter((item) => item.courseKey !== key);
  wx.setStorageSync('ugCoursePlanAssignments', next);
  return next;
}

function isTpgCoursePlanned(programmeId, courseCode) {
  return getTpgPlannedCourseKeys().includes(buildTpgCourseKey(programmeId, courseCode));
}

function toggleTpgPlannedCourse(programmeId, courseCode) {
  const key = buildTpgCourseKey(programmeId, courseCode);
  const planned = getTpgPlannedCourseKeys();
  const next = planned.includes(key)
    ? planned.filter((item) => item !== key)
    : planned.concat(key);
  wx.setStorageSync('plannedTpgCourseKeys', next);
  return next;
}

function removeTpgPlannedCourse(programmeId, courseCode) {
  const key = buildTpgCourseKey(programmeId, courseCode);
  const next = getTpgPlannedCourseKeys().filter((item) => item !== key);
  wx.setStorageSync('plannedTpgCourseKeys', next);
  return next;
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
    if (!offering) return null;
    const note = getCourseNote(item.courseCode);
    const categoryKey = classifyStudyPlanCourse(offering);
    return {
      ...item,
      offering,
      categoryKey,
      categoryLabel: getStudyPlanCategoryLabel(categoryKey),
      completed: isOfferingCompleted(item.courseCode),
      favorite: isOfferingFavorite(item.courseCode),
      hasNote: Boolean(note),
      notePreview: note ? note.slice(0, 42) : ''
    };
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

function classifyStudyPlanCourse(offering = {}) {
  const text = [
    offering.title,
    ...(offering.categories || [])
  ].join(' ').toLowerCase();
  if (/capstone|final year project|project|dissertation|thesis/.test(text)) return 'capstone';
  if (/\bcore\b|required|compulsory/.test(text)) return 'core';
  if (/elective|optional|choice/.test(text)) return 'elective';
  return 'other';
}

function getStudyPlanCategoryLabel(categoryKey) {
  const found = STUDY_PLAN_CATEGORY_DEFS.find((item) => item.key === categoryKey);
  return found ? found.label : 'Other';
}

function termLabel(term) {
  return term === 'full year' ? 'Full Year' : `Semester ${term}`;
}

function buildStudyPlanLoadSuggestions(courses, termLoads) {
  return termLoads
    .filter((load) => load.overloaded)
    .map((load) => {
      const targetTerm = load.term === '1' ? '2' : '1';
      const candidates = courses
        .filter((item) => (
          item.plannedYear === load.year
          && item.plannedTerm === load.term
          && !item.completed
          && (item.offering.terms || []).includes(targetTerm)
        ))
        .map((item) => ({
          courseCode: item.courseCode,
          title: item.offering.title,
          credits: Number((item.offering.details && item.offering.details.credits) || 0),
          fromYear: load.year,
          fromTerm: load.term,
          toYear: load.year,
          toTerm: targetTerm,
          fromLabel: `Year ${load.year} ${termLabel(load.term)}`,
          toLabel: `Year ${load.year} ${termLabel(targetTerm)}`
        }))
        .sort((left, right) => (
          right.credits - left.credits
          || left.courseCode.localeCompare(right.courseCode)
        ))
        .slice(0, 3);

      return {
        id: `load-suggestion-${load.year}-${load.term}`,
        year: load.year,
        term: load.term,
        credits: load.credits,
        targetTerm,
        message: candidates.length
          ? `Year ${load.year} Semester ${load.term} 可考虑移动 ${candidates[0].courseCode} 到 Semester ${targetTerm}。`
          : `Year ${load.year} Semester ${load.term} 暂未找到同学年另一学期也开放的可移动课程。`,
        candidates
      };
    });
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
  const categoryMap = STUDY_PLAN_CATEGORY_DEFS.reduce((map, category) => ({
    ...map,
    [category.key]: {
      ...category,
      courseCount: 0,
      credits: 0,
      completedCount: 0
    }
  }), {});

  courses.forEach((item) => {
    const categoryKey = classifyStudyPlanCourse(item.offering);
    const bucket = categoryMap[categoryKey] || categoryMap.other;
    const credits = Number((item.offering.details && item.offering.details.credits) || 0);
    bucket.courseCount += 1;
    bucket.credits += credits;
    if (item.completed) bucket.completedCount += 1;
  });
  const loadSuggestions = buildStudyPlanLoadSuggestions(courses, termLoads);

  return {
    courseCount: courses.length,
    totalCredits,
    categoryStats: STUDY_PLAN_CATEGORY_DEFS
      .map((category) => categoryMap[category.key])
      .filter((category) => category.courseCount > 0),
    noticeCount: notices.length,
    noticeCounts,
    issueCodes: [...new Set(notices.map((notice) => notice.courseCode).filter(Boolean))],
    termLoads,
    loadSuggestions,
    notices
  };
}

function extractRecommendedYear(offering) {
  const categoryText = (offering.categories || []).join(' ');
  const match = categoryText.match(/Year\s+(\d+)/i);
  return match ? Number(match[1]) : 0;
}

function getStudyPlanSuggestions(limit = 5) {
  return getStudyPlanCoreGaps().slice(0, Number(limit) || 5);
}

function getStudyPlanCoreGaps() {
  const plannedCodes = new Set(getStudyPlanItems().map((item) => item.courseCode));
  const completedCodes = new Set(getCompletedOfferingCodes());
  return hkuOfferings.courses
    .filter((course) => (
      (course.categories || []).some((category) => /core/i.test(category))
      && !plannedCodes.has(course.courseCode)
      && !completedCodes.has(course.courseCode)
    ))
    .map((course) => ({
      courseCode: course.courseCode,
      title: course.title,
      credits: Number((course.details && course.details.credits) || 0),
      recommendedYear: extractRecommendedYear(course),
      categories: course.categories || [],
      terms: course.terms || [],
      termLabel: (course.terms || []).map((term) => term === 'full year' ? 'Full Year' : `Semester ${term}`).join(' / ')
    }))
    .sort((left, right) => (
      (left.recommendedYear || 99) - (right.recommendedYear || 99)
      || left.courseCode.localeCompare(right.courseCode)
    ));
}

function getStudyPlanCoreGapSummary() {
  const gaps = getStudyPlanCoreGaps();
  const groups = [1, 2, 3, 4, 0].map((year) => {
    const courses = gaps.filter((course) => (course.recommendedYear || 0) === year);
    return {
      year,
      yearLabel: year ? `Year ${year}` : 'Unspecified',
      courseCount: courses.length,
      credits: courses.reduce((sum, course) => sum + course.credits, 0),
      courses
    };
  }).filter((group) => group.courseCount > 0);

  return {
    courseCount: gaps.length,
    credits: gaps.reduce((sum, course) => sum + course.credits, 0),
    groups
  };
}

function formatStudyPlanCoreGapText(now = new Date()) {
  const summary = getStudyPlanCoreGapSummary();
  const profileContext = getStudyPlanProfileContext();
  const lines = [
    `${profileContext.title} · Remaining Core Checklist`,
    `Generated: ${now.toISOString().slice(0, 10)}`,
    `Remaining Core: ${summary.courseCount} courses · ${summary.credits} credits`,
    ''
  ];

  if (!summary.courseCount) {
    lines.push('No remaining core courses detected from current completed records and Study Plan.');
  } else {
    summary.groups.forEach((group) => {
      lines.push(`${group.yearLabel} · ${group.courseCount} courses · ${group.credits} credits`);
      group.courses.forEach((course) => {
        lines.push(`- ${course.courseCode} ${course.title} (${course.credits} credits · ${course.termLabel || 'Term TBC'})`);
      });
      lines.push('');
    });
  }

  lines.push('For planning reference only. Confirm official timetable, prerequisites and degree requirements with your university.');
  return lines.join('\n').trim();
}

function formatStudyPlanCheckText(now = new Date()) {
  const review = analyzeStudyPlan();
  const profileContext = getStudyPlanProfileContext();
  const lines = [
    `${profileContext.title} · Plan Check`,
    `Generated: ${now.toISOString().slice(0, 10)}`,
    `Checks: ${review.noticeCount}`,
    ''
  ];

  if (!review.noticeCount) {
    lines.push('No current reminders from offering term, prerequisite, corequisite or workload checks.');
  } else {
    lines.push('Reminders:');
    review.notices.forEach((notice) => {
      const label = notice.type === 'offering'
        ? 'Offering'
        : notice.type === 'prerequisite'
          ? 'Prerequisite'
          : notice.type === 'corequisite'
            ? 'Corequisite'
            : 'Workload';
      lines.push(`- [${label}] ${notice.message}`);
    });
  }

  if (review.loadSuggestions.length) {
    lines.push('', 'Possible load adjustments:');
    review.loadSuggestions.forEach((suggestion) => {
      lines.push(`- ${suggestion.message}`);
      suggestion.candidates.forEach((candidate) => {
        lines.push(`  - ${candidate.courseCode} ${candidate.title}: ${candidate.fromLabel} -> ${candidate.toLabel}`);
      });
    });
  }

  lines.push('', 'For planning reference only. Confirm official timetable, prerequisites and degree requirements with your university.');
  return lines.join('\n').trim();
}

function resolveProfileLabel(profile, key, resolver) {
  if (!profile) return '';
  if (profile[key]) return profile[key];
  const resolved = typeof resolver === 'function' ? resolver() : null;
  return resolved && (resolved.shortName || resolved.nameZh || resolved.nameEn || resolved.name || resolved.code) || '';
}

function getStudyPlanProfileContext(profile = getProfile()) {
  const typeLabel = profile && profile.profileType === 'tpg' ? 'TPG' : 'UG';
  const university = resolveProfileLabel(profile, 'universityName', () => (
    profile && (ugService.getUniversity(profile.universityId) || ugService.getUniversity(profile.universityCode))
  ));
  const programme = resolveProfileLabel(profile, 'programmeName', () => (
    profile && ugService.getProgramme(profile.programmeId)
  ));
  const major = resolveProfileLabel(profile, 'majorName', () => (
    profile && ugService.getMajor(profile.majorId)
  ));
  const curriculum = profile && profile.curriculumYear ? profile.curriculumYear : '未设置';
  const year = profile && profile.currentYear ? `Year ${profile.currentYear}` : '';
  const titleParts = [
    university || 'Selected University',
    programme || 'Selected Programme',
    'Study Plan'
  ];

  return {
    title: titleParts.join(' · '),
    typeLabel,
    university: university || '未设置',
    programme: programme || '未设置',
    major: major || '',
    curriculum,
    year
  };
}

function formatStudyPlanText(now = new Date()) {
  const courses = getStudyPlanCourses().slice().sort((left, right) => (
    studyPlanPosition(left) - studyPlanPosition(right)
    || left.courseCode.localeCompare(right.courseCode)
  ));
  const review = analyzeStudyPlan();
  const profileContext = getStudyPlanProfileContext();
  const lines = [
    profileContext.title,
    `Type: ${profileContext.typeLabel}`,
    `University: ${profileContext.university}`,
    `Programme: ${profileContext.programme}`,
    profileContext.major ? `Major: ${profileContext.major}` : '',
    `Curriculum: ${profileContext.curriculum}`,
    profileContext.year ? `Current Year: ${profileContext.year}` : '',
    `Generated: ${now.toISOString().slice(0, 10)}`,
    ''
  ].filter((line) => line !== '');

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
        const categoryLabel = getStudyPlanCategoryLabel(classifyStudyPlanCourse(course.offering));
        lines.push(`- ${course.courseCode} ${course.offering.title} (${credits} credits · ${categoryLabel})`);
      });
    });
    lines.push('');
  });

  lines.push(`Total: ${review.courseCount} courses · ${review.totalCredits} credits`);
  if (review.categoryStats.length) {
    lines.push('Categories:');
    review.categoryStats.forEach((category) => {
      lines.push(`- ${category.label}: ${category.courseCount} courses · ${category.credits} credits`);
    });
  }
  const coreGapSummary = getStudyPlanCoreGapSummary();
  if (coreGapSummary.courseCount) {
    lines.push('', `Remaining Core: ${coreGapSummary.courseCount} courses · ${coreGapSummary.credits} credits`);
    coreGapSummary.groups.forEach((group) => {
      lines.push(`- ${group.yearLabel}: ${group.courseCount} courses · ${group.credits} credits`);
    });
  }
  if (review.loadSuggestions.length) {
    lines.push('', 'Load suggestions:');
    review.loadSuggestions.forEach((suggestion) => {
      lines.push(`- ${suggestion.message}`);
      suggestion.candidates.forEach((candidate) => {
        lines.push(`  - ${candidate.courseCode} ${candidate.title} (${candidate.credits} credits): ${candidate.fromLabel} -> ${candidate.toLabel}`);
      });
    });
  }
  if (review.notices.length) {
    lines.push('', `Plan checks: ${review.noticeCount}`);
    review.notices.forEach((notice) => lines.push(`- ${notice.message}`));
  } else {
    lines.push('', 'Plan checks: no current reminders');
  }
  lines.push('', 'For planning reference only. Confirm official timetable, prerequisites and degree requirements with your university.');
  return lines.join('\n');
}

function formatStudyPlanStatusText(now = new Date()) {
  const courses = getStudyPlanCourses();
  const review = analyzeStudyPlan();
  const profileContext = getStudyPlanProfileContext();
  const completedCount = courses.filter((course) => course.completed).length;
  const favoriteCount = courses.filter((course) => course.favorite).length;
  const noteCount = courses.filter((course) => course.hasNote).length;
  const lines = [
    `${profileContext.title} · Status Summary`,
    `Generated: ${now.toISOString().slice(0, 10)}`,
    `Courses: ${review.courseCount}`,
    `Credits: ${review.totalCredits}`,
    `Completed: ${completedCount}`,
    `Favorites: ${favoriteCount}`,
    `Courses with notes: ${noteCount}`,
    `Plan checks: ${review.noticeCount}`,
    ''
  ];

  if (review.categoryStats.length) {
    lines.push('Category mix:');
    review.categoryStats.forEach((category) => {
      lines.push(`- ${category.label}: ${category.courseCount} courses · ${category.credits} credits · ${category.completedCount} completed`);
    });
  } else {
    lines.push('Category mix: no planned courses yet');
  }

  lines.push('', 'Privacy: this summary only includes counts and categories, not your course notes.');
  lines.push('For planning reference only. Confirm official timetable, prerequisites and degree requirements with your university.');
  return lines.join('\n').trim();
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
  formatStudyPlanCheckText,
  formatStudyPlanCoreGapText,
  formatStudyPlanStatusText,
  formatStudyPlanText,
  getCompletedCourseIds,
  getCompletedOfferingCodes,
  getCompletedOfferings,
  getCompletedTpgCourseKeys,
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
  getFavoriteTpgCourseKeys,
  getUgCoursePlanAssignment,
  getUgCoursePlanAssignments,
  getUgPlannedCourseKeys,
  getTpgPlannedCourseKeys,
  getFavoriteOfferings,
  getFavorites,
  getProfile,
  getPlanningCapability,
  buildOnboardingUrl,
  openOnboarding,
  getPrerequisiteCourseStatus,
  getRecentlyViewedOfferings,
  getStudyPlanCourses,
  getStudyPlanCoreGapSummary,
  getStudyPlanCoreGaps,
  getStudyPlanItem,
  getStudyPlanItems,
  getStudyPlanSuggestions,
  getUserDataSummary,
  isFavorite,
  isOfferingCompleted,
  isOfferingFavorite,
  isTpgCourseCompleted,
  isTpgCourseFavorite,
  isTpgCoursePlanned,
  isUgCoursePlanned,
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
  clearUgCoursePlanAssignment,
  removeUgPlannedCourse,
  removeTpgPlannedCourse,
  recordCourseSearch,
  recordTpgProgrammeSearch,
  recordRecentlyViewed,
  saveUgCoursePlanAssignment,
  saveStudyPlanItem,
  saveCourseNote,
  saveProfile,
  clearCourseSearchHistory,
  clearTpgProgrammeSearchHistory,
  clearUserData,
  toggleCompleted,
  toggleFavorite,
  toggleOfferingCompleted,
  toggleOfferingFavorite,
  toggleTpgCourseCompleted,
  toggleTpgCourseFavorite,
  toggleTpgPlannedCourse,
  toggleUgPlannedCourse
};
