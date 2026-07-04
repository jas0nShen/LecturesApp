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

function getProfile() {
  return wx.getStorageSync('userProfile') || null;
}

function saveProfile(profile) {
  wx.setStorageSync('userProfile', profile);
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
  const category = (filters.category || '').trim().toLowerCase();
  return hkuOfferings.courses.filter((course) => {
    const matchesKeyword = !keyword
      || course.courseCode.toLowerCase().includes(keyword)
      || course.title.toLowerCase().includes(keyword);
    const matchesTerm = !filters.term || filters.term === 'all' || course.terms.includes(filters.term);
    const matchesCategory = !category
      || course.categories.some((item) => item.toLowerCase().includes(category));
    return matchesKeyword && matchesTerm && matchesCategory;
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
      category: filters.category
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
  return {
    universityCode: hkuOfferings.universityCode,
    provider: hkuOfferings.provider,
    academicYear: hkuOfferings.academicYear,
    offering,
    course: data.courses.find((item) => item.courseCode === normalizedCode) || null
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
  getCompletedCourseIds,
  getCourse,
  getCourseRemote,
  getCourseOffering,
  getCourseOfferingRemote,
  getFavoriteCourses,
  getFavoriteCoursesRemote,
  getFavorites,
  getProfile,
  isFavorite,
  listCourses,
  listCoursesRemote,
  listCourseOfferings,
  listCourseOfferingsRemote,
  listMajorsRemote,
  listProgrammesRemote,
  listUniversitiesRemote,
  saveProfile,
  toggleCompleted,
  toggleFavorite
};
