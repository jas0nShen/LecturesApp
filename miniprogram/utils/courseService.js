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
  'studyPlanItems'
];

function getProfile() {
  return wx.getStorageSync('userProfile') || null;
}

function saveProfile(profile) {
  wx.setStorageSync('userProfile', profile);
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
    'studyPlanItems'
  ]);
  USER_DATA_KEYS.forEach((key) => {
    if (!Object.prototype.hasOwnProperty.call(parsed.data, key)) return;
    const value = parsed.data[key];
    if (arrayKeys.has(key) && !Array.isArray(value)) throw new Error(`Invalid ${key}`);
    if (key === 'userProfile' && (typeof value !== 'object' || Array.isArray(value))) {
      throw new Error('Invalid userProfile');
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

function analyzeStudyPlan() {
  const courses = getStudyPlanCourses();
  const completedCodes = getCompletedOfferingCodes();
  const notices = [];
  const totalCredits = courses.reduce(
    (sum, item) => sum + Number((item.offering.details && item.offering.details.credits) || 0),
    0
  );

  courses.forEach((item) => {
    const prerequisiteText = (item.offering.details && item.offering.details.prerequisites) || 'None';
    const prerequisiteCodes = [...new Set(prerequisiteText.toUpperCase().match(/[A-Z]{4}\d{4}/g) || [])];
    if (!prerequisiteCodes.length) return;

    const availableCodes = prerequisiteCodes.filter((code) => {
      if (completedCodes.includes(code)) return true;
      const planned = courses.find((course) => course.courseCode === code);
      return planned && studyPlanPosition(planned) < studyPlanPosition(item);
    });
    const isAlternative = /\sor\s/i.test(prerequisiteText);
    const missingCodes = isAlternative && availableCodes.length
      ? []
      : prerequisiteCodes.filter((code) => !availableCodes.includes(code));

    if (missingCodes.length) {
      notices.push({
        courseCode: item.courseCode,
        missingCodes,
        message: `${item.courseCode} 的先修说明提到 ${missingCodes.join(' / ')}，目前没有更早的已修或计划记录。`
      });
    }
  });

  return {
    courseCount: courses.length,
    totalCredits,
    noticeCount: notices.length,
    notices
  };
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
  const effectiveProfile = profile || getProfile() || { programmeId: 1, majorId: 1, curriculumYear: '2026' };
  const completedIds = completedCourseIds || getCompletedCourseIds();
  const completedCourses = data.courses.filter((course) => completedIds.includes(course.id));
  const completedCredits = completedCourses.reduce((sum, course) => sum + course.credits, 0);
  const programme = data.programmes.find((item) => item.id === Number(effectiveProfile.programmeId)) || data.programmes[0];
  const requirements = data.requirements.filter((item) => (
    item.programmeId === Number(effectiveProfile.programmeId)
    && item.majorId === Number(effectiveProfile.majorId)
    && item.curriculumYear === effectiveProfile.curriculumYear
  ));

  const sections = requirements.map((requirement) => {
    const requirementCourses = data.courses.filter((course) => requirement.courseIds.includes(course.id));
    const done = requirementCourses.filter((course) => completedIds.includes(course.id));
    const doneCredits = done.reduce((sum, course) => sum + course.credits, 0);
    const missing = requirementCourses.filter((course) => !completedIds.includes(course.id));

    return {
      type: requirement.type,
      name: requirement.name,
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
      reason: section.type === 'core' ? '未完成必修课' : `还缺 ${section.name} 学分`
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
  const effectiveProfile = profile || getProfile() || { programmeId: 1, majorId: 1, curriculumYear: '2026' };
  const completedIds = completedCourseIds || getCompletedCourseIds();

  return withFallback(
    async () => {
      const result = await api.request('/api/graduation-audit', {
        method: 'POST',
        data: {
          programmeId: effectiveProfile.programmeId,
          majorId: effectiveProfile.majorId,
          curriculumYear: effectiveProfile.curriculumYear,
          completedCourseIds: completedIds
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
  data,
  buildAudit,
  buildAuditRemote,
  exportUserData,
  getCompletedCourseIds,
  getCompletedOfferingCodes,
  analyzeStudyPlan,
  getCourse,
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
  getStudyPlanCourses,
  getStudyPlanItem,
  getStudyPlanItems,
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
  saveStudyPlanItem,
  saveProfile,
  toggleCompleted,
  toggleFavorite,
  toggleOfferingCompleted,
  toggleOfferingFavorite
};
