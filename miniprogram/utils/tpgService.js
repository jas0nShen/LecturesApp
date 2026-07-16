const catalogue = require('./tpgCatalog');
const courseShards = require('./tpgCourseShards');

const EMPTY_UNIVERSITY = {
  code: '',
  shortName: '学校待确认',
  academicYear: '待确认',
  sourceFile: ''
};

function normalizeKeyword(keyword = '') {
  return String(keyword).trim().toLowerCase();
}

function listUniversities() {
  return catalogue.universities;
}

function listProgrammes(universityCode) {
  return catalogue.programmes.filter(
    (programme) => !universityCode || programme.universityCode === universityCode
  ).map(hydrateProgramme);
}

function getProgramme(programmeId) {
  const programme = catalogue.programmes.find((item) => item.id === programmeId) || null;
  return hydrateProgramme(programme);
}

function hydrateProgramme(programme) {
  if (!programme || (Array.isArray(programme.courseGroups) && programme.courseGroups.length)) return programme;
  if (!Number(programme.courseCount)) return programme;
  const structure = courseShards.getProgrammesByUniversityCode(programme.universityCode).find((item) => item.id === programme.id);
  return structure ? { ...programme, courseGroups: structure.courseGroups } : programme;
}

function listTracks(programmeOrId) {
  const programme = typeof programmeOrId === 'string' ? getProgramme(programmeOrId) : programmeOrId;
  return programme && Array.isArray(programme.tracks) ? programme.tracks : [];
}

function getTrack(programmeId, trackId) {
  return listTracks(programmeId).find((track) => track.id === trackId) || null;
}

function isValidTrack(programmeId, trackId) {
  if (!trackId) return true;
  return Boolean(getTrack(programmeId, trackId));
}

function isTrackSelectionComplete(programmeOrId, trackId = '') {
  const programme = typeof programmeOrId === 'string' ? getProgramme(programmeOrId) : programmeOrId;
  if (!programme) return false;
  const tracks = listTracks(programme);
  if (!tracks.length) return true;
  if (!trackId) return programme.trackSelectionOptional === true;
  return Boolean(getTrack(programme.id, trackId));
}

function getCreditsRequired(programmeOrId, trackId = '') {
  const programme = typeof programmeOrId === 'string' ? getProgramme(programmeOrId) : programmeOrId;
  const track = programme && trackId ? getTrack(programme.id, trackId) : null;
  return Number((track && track.creditsRequired) || (programme && programme.creditsRequired) || 0);
}

function getUniversity(universityCode) {
  return catalogue.universities.find((university) => university.code === universityCode) || {
    ...EMPTY_UNIVERSITY,
    code: universityCode || ''
  };
}

function getProgrammeUniversity(programme) {
  return getUniversity(programme && programme.universityCode);
}

function resolveCourseCredits(course = {}) {
  if (course.credits !== undefined && course.credits !== null && course.credits !== '' && Number.isFinite(Number(course.credits)) && Number(course.credits) >= 0) return Number(course.credits);
  return null;
}

function resolveAuditCredits(course = {}) {
  if (course.countsTowardProgrammeCredits === false) return 0;
  if (course.programmeCredits !== undefined && Number.isFinite(Number(course.programmeCredits)) && Number(course.programmeCredits) >= 0) return Number(course.programmeCredits);
  return resolveCourseCredits(course);
}

function getCourseCreditLabel(course = {}) {
  const unit = course.creditUnit || 'credits';
  if (course.credits !== undefined && course.credits !== null && course.credits !== '' && Number.isFinite(Number(course.credits)) && Number(course.credits) >= 0) return `${Number(course.credits)} ${unit}`;
  if (Number(course.creditsMin) > 0 && Number(course.creditsMax) >= Number(course.creditsMin)) {
    return course.creditsMin === course.creditsMax ? `${course.creditsMin} ${unit}` : `${course.creditsMin}–${course.creditsMax} ${unit}`;
  }
  return '学分待确认';
}

function appliesToTrack(item = {}, trackId = '') {
  const trackIds = Array.isArray(item.appliesToTrackIds) ? item.appliesToTrackIds : [];
  const excludedTrackIds = Array.isArray(item.excludesTrackIds) ? item.excludesTrackIds : [];
  if (trackId && excludedTrackIds.includes(trackId)) return false;
  return trackIds.length === 0 || Boolean(trackId && trackIds.includes(trackId));
}

function resolveTrackRequirement(item = {}, field, trackId = '') {
  const overrides = item[`${field}ByTrackIds`];
  if (trackId && overrides && typeof overrides === 'object' && !Array.isArray(overrides) && Object.prototype.hasOwnProperty.call(overrides, trackId)) {
    return Number(overrides[trackId]);
  }
  const value = item[field];
  return value === undefined || value === null || value === '' ? null : Number(value);
}

function getGroupCreditsRequired(group = {}, trackId = '') {
  return resolveTrackRequirement(group, 'creditsRequired', trackId);
}

function getGroupCoursesRequired(group = {}, trackId = '') {
  return resolveTrackRequirement(group, 'coursesRequired', trackId);
}

function getGroupType(group = {}, trackId = '') {
  const overrides = group.typeByTrackIds;
  if (trackId && overrides && typeof overrides === 'object' && !Array.isArray(overrides) && Object.prototype.hasOwnProperty.call(overrides, trackId)) {
    return overrides[trackId];
  }
  return group.type || '';
}

function getTrackResolvedName(item = {}, trackId = '') {
  const overrides = item.nameByTrackIds;
  if (trackId && overrides && typeof overrides === 'object' && !Array.isArray(overrides) && Object.prototype.hasOwnProperty.call(overrides, trackId)) {
    return overrides[trackId];
  }
  return item.name || '';
}

function resolveCourseGroups(programme, trackId = '') {
  if (!programme) return [];
  return (programme.courseGroups || []).filter((group) => appliesToTrack(group, trackId)).map((group) => ({
    ...group,
    name: getTrackResolvedName(group, trackId),
    type: getGroupType(group, trackId),
    creditsRequired: getGroupCreditsRequired(group, trackId),
    coursesRequired: getGroupCoursesRequired(group, trackId),
    courses: (group.courses || []).filter((course) => appliesToTrack(course, trackId)).map((course) => ({
      ...course,
      name: getTrackResolvedName(course, trackId)
    }))
  }));
}

function buildProgrammeSourceText(programme) {
  if (!programme) return '';
  const university = getProgrammeUniversity(programme);
  return [
    `${programme.universityCode} · ${programme.name}`,
    programme.faculty ? `Faculty: ${programme.faculty}` : '',
    programme.creditsRequired ? `Credits / units: ${programme.creditsRequired}` : '',
    programme.sourceUrl ? `Official URL: ${programme.sourceUrl}` : '',
    `Source file: ${university.sourceFile || 'PDF source pending'}`,
    `Academic year: ${university.academicYear || '待确认'}`,
    'Note: For planning reference only. Please confirm final requirements with the university official website and course selection system.'
  ].filter(Boolean).join('\n');
}

function flattenCourses(programme, keyword = '', trackId = '') {
  if (!programme) return [];
  const normalized = normalizeKeyword(keyword);
  return resolveCourseGroups(programme, trackId).flatMap((group, groupIndex) => (
    (group.courses || []).map((course, courseIndex) => ({
      ...course,
      rowKey: `${groupIndex}-${course.code}-${courseIndex}`,
      groupName: group.name,
      credits: resolveCourseCredits(course),
      creditStatus: course.credits !== undefined && course.credits !== null && Number.isFinite(Number(course.credits)) && Number(course.credits) >= 0 ? 'official' : Number(course.creditsMin) > 0 ? 'official_range' : 'unknown',
      creditLabel: getCourseCreditLabel(course),
      groupCreditsRequired: group.creditsRequired,
      groupType: group.type || '',
      ruleText: group.ruleText || '',
      searchableText: `${course.code} ${course.name} ${group.name}`.toLowerCase()
    }))
  )).filter((course) => !normalized || course.searchableText.includes(normalized));
}

function getProgrammeCourse(programmeId, courseCode, trackId = '') {
  const programme = getProgramme(programmeId);
  if (!programme) return null;
  const normalizedCode = String(courseCode || '').trim().toUpperCase();
  return flattenCourses(programme, '', trackId).find((course) => String(course.code || '').toUpperCase() === normalizedCode) || null;
}

function countCourses(programme) {
  if (!programme) return 0;
  if (!Array.isArray(programme.courseGroups) && Number.isFinite(Number(programme.courseCount))) return Number(programme.courseCount);
  return (programme.courseGroups || []).reduce(
    (total, group) => total + (Array.isArray(group.courses) ? group.courses.length : 0),
    0
  );
}

function hasCourseGroups(programme) {
  return countCourses(programme) > 0;
}

function getStatus(programme) {
  const courseCount = countCourses(programme);
  const hasStructure = programme && programme.dataLevel === 'structure';
  const isComplete = Boolean(programme && programme.courseVerificationStatus === 'verified' && courseCount > 0);
  const isBlocked = Boolean(programme && ['blocked', 'archived'].includes(programme.courseVerificationStatus));
  return {
    courseCount,
    hasCourseGroups: courseCount > 0,
    hasStructure,
    isComplete,
    isBlocked,
    title: isComplete ? '课程结构已开放' : courseCount ? '课程清单已录入，结构复核中' : isBlocked ? '课程来源待解决' : hasStructure ? '结构资料待拆分' : 'Programme 索引',
    copy: isComplete
      ? '以下课程结构已按官方资料核验，正式选课前仍应对照学校系统。'
      : courseCount
        ? '课程代码可供浏览，但学分或分组规则尚未达到完整开放标准。'
      : hasStructure
        ? 'PDF 中包含部分结构信息，课程名称与分组仍在逐项整理。'
        : isBlocked
          ? programme.courseStatusNote || '当前官方来源不足，暂不生成课程结构。'
          : '当前已确认 Programme 基本资料，必修与选修课程尚未完成核验。'
  };
}

function searchProgrammes(programmes, keyword = '') {
  const normalized = normalizeKeyword(keyword);
  if (!normalized) return programmes;
  return programmes.map((programme, index) => {
    const name = String(programme.name || '').toLowerCase();
    const programmeCode = String(programme.programmeCode || '').toLowerCase();
    const faculty = String(programme.faculty || '').toLowerCase();
    const universityCode = String(programme.universityCode || '').toLowerCase();
    const courses = (programme.courseGroups || []).flatMap((group) => group.courses || []);
    let score = Number.POSITIVE_INFINITY;
    if (name === normalized) score = 0;
    else if (name.startsWith(normalized)) score = 1;
    else if (name.includes(normalized)) score = 2;
    else if (programmeCode === normalized) score = 3;
    else if (programmeCode.includes(normalized)) score = 4;
    else if (faculty.includes(normalized) || universityCode.includes(normalized)) score = 5;
    else if (courses.some((course) => String(course.code || '').toLowerCase() === normalized)) score = 6;
    else if (courses.some((course) => String(course.code || '').toLowerCase().includes(normalized))) score = 7;
    else if (courses.some((course) => String(course.name || '').toLowerCase().includes(normalized))) score = 8;
    return { programme, index, score };
  }).filter((item) => Number.isFinite(item.score))
    .sort((left, right) => left.score - right.score || left.index - right.index)
    .map((item) => item.programme);
}

function filterProgrammesByAvailability(programmes, availability = 'all') {
  if (availability === 'courses') {
    return programmes.filter(hasCourseGroups);
  }
  if (availability === 'pending') {
    return programmes.filter((programme) => !hasCourseGroups(programme));
  }
  return programmes;
}

function getProfileSummary(profile) {
  if (!profile || profile.profileType !== 'tpg') return null;
  const programme = getProgramme(profile.programmeId);
  const university = programme ? getProgrammeUniversity(programme) : getUniversity(profile.universityCode);
  const courseCount = programme ? countCourses(programme) : profile.courseCount || 0;
  const track = programme && profile.trackId ? getTrack(programme.id, profile.trackId) : null;
  return {
    programme,
    track,
    university,
    courseCount,
    schoolLabel: university.shortName || profile.universityName || profile.universityCode,
    yearLabel: (programme && programme.academicYear) || university.academicYear || profile.curriculumYear,
    statusLabel: courseCount ? `已录入 ${courseCount} 门课程` : '课程清单待开放',
    creditsLabel: programme && getCreditsRequired(programme, profile.trackId)
      ? `${getCreditsRequired(programme, profile.trackId)} credits / units`
      : profile.creditsRequired
        ? `${profile.creditsRequired} credits / units`
        : '学分待确认'
  };
}

function getSchoolCoverage() {
  const schools = listUniversities().map((university) => {
    const programmes = listProgrammes(university.code);
    const programmeWithCourses = programmes.filter(hasCourseGroups);
    const courseCount = programmes.reduce((sum, programme) => sum + countCourses(programme), 0);
    const hasStructure = programmes.some((programme) => programme.dataLevel === 'structure');
    return {
      ...university,
      programmeCount: programmes.length,
      programmeWithCoursesCount: programmeWithCourses.length,
      courseCount,
      coverageLabel: courseCount
        ? `${programmeWithCourses.length} 个 Programme 已拆课程`
        : hasStructure
          ? '结构资料已导入，课程待拆分'
          : 'Programme 索引已导入',
      badge: courseCount ? 'COURSES' : hasStructure ? 'STRUCTURE' : 'INDEX'
    };
  });
  const totals = schools.reduce((summary, school) => ({
    programmeCount: summary.programmeCount + school.programmeCount,
    programmeWithCoursesCount: summary.programmeWithCoursesCount + school.programmeWithCoursesCount,
    courseCount: summary.courseCount + school.courseCount
  }), {
    programmeCount: 0,
    programmeWithCoursesCount: 0,
    courseCount: 0
  });

  return {
    schoolCount: schools.length,
    schools,
    ...totals,
    sourceSummary: schools.map((school) => `${school.code}: ${school.sourceFile}`).join('\n')
  };
}

module.exports = {
  buildProgrammeSourceText,
  flattenCourses,
  getProgramme,
  getProgrammeCourse,
  getTrack,
  getCourseCreditLabel,
  getCreditsRequired,
  getGroupCoursesRequired,
  getGroupCreditsRequired,
  getGroupType,
  getTrackResolvedName,
  getProgrammeUniversity,
  getProfileSummary,
  getSchoolCoverage,
  getStatus,
  getUniversity,
  hasCourseGroups,
  filterProgrammesByAvailability,
  listProgrammes,
  listTracks,
  listUniversities,
  isTrackSelectionComplete,
  isValidTrack,
  appliesToTrack,
  resolveCourseCredits,
  resolveAuditCredits,
  resolveCourseGroups,
  searchProgrammes,
  hydrateProgramme
};
