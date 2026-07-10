const data = require('./mockData');
const catalogue = require('./ugCatalogue');
const ugCourseShards = require('./ugCourseShards');

function normalizeKeyword(keyword = '') {
  return String(keyword).trim().toLowerCase();
}

function sameId(left, right) {
  return String(left) === String(right);
}

function getSeedUniversityByCode(code) {
  return data.universities.find((university) => university.code === code) || null;
}

function getSeedProgramme(programmeId) {
  return data.programmes.find((programme) => sameId(programme.id, programmeId)) || null;
}

function getSeedMajor(majorId) {
  return data.majors.find((major) => sameId(major.id, majorId)) || null;
}

function getCatalogueProgramme(programmeId) {
  return catalogue.programmes.find((programme) => sameId(programme.id, programmeId)) || null;
}

function getCatalogueCoursesByProgramme(programmeId) {
  const programme = getCatalogueProgramme(programmeId);
  if (!programme) return [];
  return ugCourseShards.getCoursesByUniversityCode(programme.universityCode || programme.universityId)
    .filter((course) => sameId(course.programmeId, programmeId));
}

function getCatalogueCourseCount() {
  return typeof ugCourseShards.getCourseCount === 'function'
    ? ugCourseShards.getCourseCount()
    : catalogue.courses.length;
}

function getCatalogueGeneratedDate() {
  return catalogue.generatedAt ? String(catalogue.generatedAt).slice(0, 10) : '';
}

function summarizePendingSourceReadiness(programmes = []) {
  return programmes.reduce((summary, programme) => {
    if (programme.codedCourseCount || 0) return summary;
    if (programme.sourceStatus || programme.courseCount || programme.officialUrl) {
      summary.indexOnly += 1;
    } else {
      summary.noSource += 1;
    }
    return summary;
  }, {
    indexOnly: 0,
    noSource: 0
  });
}

function formatPendingSourceReadiness(sourceReadiness = {}) {
  return `${sourceReadiness.indexOnly || 0} 个仅索引 / 来源 · ${sourceReadiness.noSource || 0} 个缺来源`;
}

function getPendingSourceStatus(programme = {}) {
  if (programme.codedCourseCount || 0) return '已开放课程';
  if (programme.sourceStatus || programme.courseCount || programme.officialUrl) return '仅索引 / 来源';
  return '缺来源';
}

function getPendingSourceReadinessKey(programme = {}) {
  if (programme.codedCourseCount || 0) return 'open';
  if (programme.sourceStatus || programme.courseCount || programme.officialUrl) return 'indexOnly';
  return 'noSource';
}

function normalizePendingReadinessFilter(readiness = '') {
  const normalized = String(readiness || '').trim().toLowerCase().replace(/_/g, '-');
  if (!normalized || normalized === 'all') return '';
  if (['index', 'index-only', 'source-index', 'source-index-only'].includes(normalized)) return 'indexOnly';
  if (['none', 'missing-source', 'no-source'].includes(normalized)) return 'noSource';
  throw new Error(`Unknown pending readiness "${readiness}". Use all, index-only, or no-source.`);
}

function normalizePendingPriorityMode(priority = '') {
  const normalized = String(priority || '').trim().toLowerCase().replace(/_/g, '-');
  if (!normalized || normalized === 'none') return '';
  if (['launch', 'mvp', 'first-batch'].includes(normalized)) return 'launch';
  throw new Error(`Unknown pending priority "${priority}". Use launch or none.`);
}

const LAUNCH_SCHOOL_PRIORITY = [
  'POLYU',
  'LINGNAN',
  'CITYU',
  'HKU',
  'HKUST',
  'CUHK',
  'HKBU',
  'EDUHK'
];

const LAUNCH_READINESS_PRIORITY = [
  'indexOnly',
  'noSource'
];

function priorityIndex(values, value) {
  const index = values.indexOf(value);
  return index === -1 ? values.length : index;
}

function isUmbrellaSchemeProgramme(programme = {}) {
  return /^Bachelor[’']s Degree Scheme in\b/i.test(String(programme.name || programme.nameEn || programme.programmeName || ''));
}

function sortPendingProgrammesByPriority(programmes = [], options = {}) {
  const priorityMode = normalizePendingPriorityMode(options.priority);
  if (priorityMode !== 'launch') return programmes;
  return [...programmes].sort((a, b) => {
    const schoolDelta = priorityIndex(LAUNCH_SCHOOL_PRIORITY, a.universityCode) - priorityIndex(LAUNCH_SCHOOL_PRIORITY, b.universityCode);
    if (schoolDelta) return schoolDelta;
    const readinessDelta = priorityIndex(LAUNCH_READINESS_PRIORITY, a.sourceReadiness) - priorityIndex(LAUNCH_READINESS_PRIORITY, b.sourceReadiness);
    if (readinessDelta) return readinessDelta;
    const umbrellaDelta = Number(isUmbrellaSchemeProgramme(a)) - Number(isUmbrellaSchemeProgramme(b));
    if (umbrellaDelta) return umbrellaDelta;
    return String(a.code || a.name || '').localeCompare(String(b.code || b.name || ''));
  });
}

function listUniversities() {
  return catalogue.universities.length ? catalogue.universities : data.universities;
}

function listFaculties(universityId) {
  const catalogueFaculties = catalogue.faculties.filter((faculty) => !universityId || sameId(faculty.universityId, universityId));
  if (catalogueFaculties.length) return catalogueFaculties;
  return data.faculties.filter((faculty) => !universityId || sameId(faculty.universityId, universityId));
}

function listProgrammes(filters = {}) {
  const catalogueProgrammes = catalogue.programmes.filter((programme) => (
    (!filters.universityId || sameId(programme.universityId, filters.universityId))
    && (!filters.facultyId || sameId(programme.facultyId, filters.facultyId))
    && (!filters.degreeLevel || programme.degreeLevel === filters.degreeLevel)
  ));
  const seedProgrammes = data.programmes.filter((programme) => (
    (!filters.universityId || sameId(programme.universityId, filters.universityId) || getSeedUniversityByCode(filters.universityId)?.id === programme.universityId)
    && (!filters.facultyId || sameId(programme.facultyId, filters.facultyId))
    && (!filters.degreeLevel || programme.degreeLevel === filters.degreeLevel)
  ));
  return catalogueProgrammes.concat(seedProgrammes);
}

function listMajors(programmeId) {
  const catalogueMajors = catalogue.majors.filter((major) => !programmeId || sameId(major.programmeId, programmeId));
  const seedMajors = data.majors.filter((major) => !programmeId || sameId(major.programmeId, programmeId));
  return catalogueMajors.concat(seedMajors);
}

function getUniversity(universityId) {
  return catalogue.universities.find((university) => sameId(university.id, universityId))
    || data.universities.find((university) => sameId(university.id, universityId) || sameId(university.code, universityId))
    || null;
}

function getFaculty(facultyId) {
  return catalogue.faculties.find((faculty) => sameId(faculty.id, facultyId))
    || data.faculties.find((faculty) => sameId(faculty.id, facultyId))
    || null;
}

function getProgramme(programmeId) {
  return getCatalogueProgramme(programmeId)
    || getSeedProgramme(programmeId)
    || null;
}

function getMajor(majorId) {
  return catalogue.majors.find((major) => sameId(major.id, majorId))
    || getSeedMajor(majorId)
    || null;
}

function listCurriculumYears(programmeId, majorId) {
  const programme = getProgramme(programmeId);
  const catalogueMajor = catalogue.majors.find((major) => sameId(major.id, majorId));
  if (catalogueMajor && programme) return [programme.curriculumYear || '2026'];
  return [...new Set(data.requirements
    .filter((requirement) => (
      (!programmeId || sameId(requirement.programmeId, programmeId))
      && (!majorId || sameId(requirement.majorId, majorId))
    ))
    .map((requirement) => requirement.curriculumYear))];
}

function listRequirementGroups(programmeId, majorId, curriculumYear) {
  return data.requirements.filter((requirement) => (
    requirement.programmeId === Number(programmeId)
    && requirement.majorId === Number(majorId)
    && (!curriculumYear || requirement.curriculumYear === curriculumYear)
  )).map((requirement) => ({
    ...requirement,
    courses: data.courses.filter((course) => requirement.courseIds.includes(course.id))
  }));
}

function listMajorCourses(programmeId, majorId, filters = {}) {
  const catalogueCourses = getCatalogueCoursesByProgramme(programmeId)
    .filter((course) => sameId(course.majorId, majorId));
  if (catalogueCourses.length) {
    const keyword = normalizeKeyword(filters.keyword);
    return catalogueCourses.filter((course) => {
      const searchable = [
        course.courseCode,
        course.titleEn,
        course.titleZh,
        course.semester,
        course.courseType
      ].filter(Boolean).join(' ').toLowerCase();
      return (!filters.recommendedYear || Number(course.recommendedYear) === Number(filters.recommendedYear))
        && (!keyword || searchable.includes(keyword));
    });
  }
  const keyword = normalizeKeyword(filters.keyword);
  return data.courses.filter((course) => {
    const searchable = [
      course.courseCode,
      course.titleEn,
      course.titleZh,
      course.department,
      course.courseType
    ].filter(Boolean).join(' ').toLowerCase();
    return sameId(course.programmeId, programmeId)
      && sameId(course.majorId, majorId)
      && (!filters.courseType || filters.courseType === 'all' || course.courseType === filters.courseType)
      && (!filters.recommendedYear || Number(course.recommendedYear) === Number(filters.recommendedYear))
      && (!keyword || searchable.includes(keyword));
  });
}

function getCatalogueCourse(courseId) {
  const id = String(courseId || '');
  return ugCourseShards.listAllCourses().find((course) => String(course.id) === id) || null;
}

function getMajorProfile(programmeId, majorId, curriculumYear) {
  const programme = getProgramme(programmeId);
  const major = getMajor(majorId);
  if (!programme || !major || !sameId(major.programmeId, programme.id)) return null;
  const catalogueProgramme = catalogue.programmes.find((item) => sameId(item.id, programme.id));
  if (catalogueProgramme) {
    const university = getUniversity(programme.universityId);
    const faculty = getFaculty(programme.facultyId);
    const courses = listMajorCourses(programme.id, major.id);
    return {
      university,
      faculty,
      programme,
      major,
      curriculumYear: curriculumYear || programme.curriculumYear,
      totalCreditRequired: 0,
      curriculumStructure: [],
      requirementGroups: [],
      courses,
      courseCount: courses.length,
      trackedRequirementCount: 0,
      trackedCredits: 0,
      sourceUrl: programme.officialUrl || major.officialUrl,
      verifiedAt: catalogue.generatedAt ? catalogue.generatedAt.slice(0, 10) : '',
      sourceStatus: programme.sourceStatus,
      codedCourseCount: programme.codedCourseCount || 0
    };
  }
  const university = getUniversity(programme.universityId);
  const faculty = getFaculty(programme.facultyId);
  const effectiveYear = curriculumYear || listCurriculumYears(programme.id, major.id)[0] || programme.curriculumYear;
  const requirementGroups = listRequirementGroups(programme.id, major.id, effectiveYear);
  const courses = listMajorCourses(programme.id, major.id);
  const trackedCredits = requirementGroups.reduce((sum, group) => (
    sum + group.courses.reduce((courseSum, course) => courseSum + course.credits, 0)
  ), 0);

  return {
    university,
    faculty,
    programme,
    major,
    curriculumYear: effectiveYear,
    totalCreditRequired: programme.totalCreditRequired,
    curriculumStructure: programme.curriculumStructure || [],
    requirementGroups,
    courses,
    courseCount: courses.length,
    trackedRequirementCount: requirementGroups.length,
    trackedCredits,
    sourceUrl: programme.curriculumSourceUrl || programme.officialUrl || major.officialUrl,
    verifiedAt: programme.curriculumVerifiedAt || ''
  };
}

function searchMajors(keyword = '') {
  const normalized = normalizeKeyword(keyword);
  const majors = catalogue.majors.concat(data.majors);
  if (!normalized) return majors;
  return majors.filter((major) => {
    const programme = getProgramme(major.programmeId);
    const faculty = programme ? getFaculty(programme.facultyId) : null;
    const university = programme ? getUniversity(programme.universityId) : null;
    return [
      major.code,
      major.nameEn,
      major.nameZh,
      programme && programme.code,
      programme && programme.nameEn,
      faculty && faculty.nameEn,
      faculty && faculty.nameZh,
      university && university.code
    ].filter(Boolean).join(' ').toLowerCase().includes(normalized);
  });
}

function searchProgrammes(programmes, keyword = '') {
  const normalized = normalizeKeyword(keyword);
  if (!normalized) return programmes;
  return programmes.filter((programme) => {
    const university = getUniversity(programme.universityId);
    const faculty = getFaculty(programme.facultyId);
    return [
      programme.code,
      programme.jupasCode,
      programme.nameEn,
      programme.nameZh,
      programme.faculty,
      faculty && faculty.nameEn,
      faculty && faculty.nameZh,
      university && university.code,
      university && university.nameEn,
      university && university.nameZh
    ].filter(Boolean).join(' ').toLowerCase().includes(normalized);
  });
}

function getCatalogueSummary() {
  const undergraduateProgrammes = listProgrammes({ degreeLevel: 'undergraduate' });
  const sourceProgrammes = catalogue.programmes || [];
  const majorIds = new Set();
  const programmeWithCoursesCount = sourceProgrammes.filter((programme) => (programme.codedCourseCount || 0) > 0).length;
  const pendingProgrammeCount = Math.max(sourceProgrammes.length - programmeWithCoursesCount, 0);
  const sourceReadiness = summarizePendingSourceReadiness(sourceProgrammes);
  const coveragePercent = sourceProgrammes.length
    ? Math.round((programmeWithCoursesCount / sourceProgrammes.length) * 100)
    : 0;
  undergraduateProgrammes.forEach((programme) => {
    listMajors(programme.id).forEach((major) => majorIds.add(major.id));
  });
  return {
    universityCount: listUniversities().length,
    facultyCount: listFaculties().length,
    programmeCount: undergraduateProgrammes.length,
    majorCount: majorIds.size,
    courseCount: getCatalogueCourseCount() + data.courses.length,
    requirementCount: data.requirements.length,
    codedCourseCount: getCatalogueCourseCount(),
    programmeWithCoursesCount,
    pendingProgrammeCount,
    sourceReadiness,
    sourceReadinessLabel: formatPendingSourceReadiness(sourceReadiness),
    coveragePercent,
    sourceProgrammeCount: catalogue.programmes.length,
    generatedAt: catalogue.generatedAt || '',
    generatedDate: getCatalogueGeneratedDate()
  };
}

function getSchoolCoverage() {
  const generatedDate = getCatalogueGeneratedDate();
  return listUniversities().map((university) => {
    const sourceProgrammes = catalogue.programmes.filter((programme) => sameId(programme.universityId, university.id));
    const sourceProgrammeIds = new Set(sourceProgrammes.map((programme) => programme.id));
    const sourceMajors = catalogue.majors.filter((major) => sourceProgrammeIds.has(major.programmeId));
    const codedCourseCount = sourceProgrammes.reduce((sum, programme) => sum + (programme.codedCourseCount || 0), 0);
    const programmeWithCoursesCount = sourceProgrammes.filter((programme) => (programme.codedCourseCount || 0) > 0).length;
    const pendingProgrammeCount = Math.max(sourceProgrammes.length - programmeWithCoursesCount, 0);
    const sourceReadiness = summarizePendingSourceReadiness(sourceProgrammes);
    const coveragePercent = sourceProgrammes.length
      ? Math.round((programmeWithCoursesCount / sourceProgrammes.length) * 100)
      : 0;

    return {
      ...university,
      programmeCount: sourceProgrammes.length,
      majorCount: sourceMajors.length,
      codedCourseCount,
      programmeWithCoursesCount,
      pendingProgrammeCount,
      sourceReadiness,
      sourceReadinessLabel: formatPendingSourceReadiness(sourceReadiness),
      coveragePercent,
      generatedDate,
      updatedLabel: generatedDate ? `更新于 ${generatedDate}` : '更新时间待确认',
      badge: codedCourseCount ? 'COURSES' : 'INDEX',
      coverageLabel: codedCourseCount
        ? `${programmeWithCoursesCount} 个 Programme 已开放课程代码`
        : 'Programme / Major 索引已导入'
    };
  });
}

function listPendingProgrammes(options = {}) {
  const universityCode = String(options.universityCode || options.schoolCode || '').trim().toUpperCase();
  const limit = Number.isFinite(Number(options.limit)) ? Number(options.limit) : 12;
  const shouldLimit = limit >= 0;
  const readinessFilter = normalizePendingReadinessFilter(options.readiness);
  const rows = catalogue.programmes
    .filter((programme) => !(programme.codedCourseCount || 0))
    .filter((programme) => !readinessFilter || getPendingSourceReadinessKey(programme) === readinessFilter)
    .map((programme) => {
      const university = getUniversity(programme.universityId) || {};
      const faculty = getFaculty(programme.facultyId) || {};
      return {
        universityCode: university.code || programme.universityCode || '',
        universityName: university.nameZh || university.nameEn || '',
        code: programme.jupasCode || programme.code || '',
        name: programme.nameEn || programme.nameZh || '',
        faculty: programme.faculty || faculty.nameEn || faculty.nameZh || '',
        officialUrl: programme.officialUrl || '',
        sourceStatus: programme.sourceStatus || '',
        sourceReadiness: getPendingSourceReadinessKey(programme),
        sourceStatusLabel: getPendingSourceStatus(programme),
        curriculumYear: programme.curriculumYear || ''
      };
    })
    .filter((programme) => !universityCode || programme.universityCode === universityCode);
  const sortedRows = sortPendingProgrammesByPriority(rows, options);
  return shouldLimit ? sortedRows.slice(0, limit) : sortedRows;
}

function buildPendingCollectionText(options = {}) {
  const pending = listPendingProgrammes(options);
  const totalPending = listPendingProgrammes({
    universityCode: options.universityCode || options.schoolCode || '',
    limit: -1
  }).length;
  const filteredTotal = options.readiness
    ? listPendingProgrammes({
      universityCode: options.universityCode || options.schoolCode || '',
      readiness: options.readiness,
      limit: -1
    }).length
    : totalPending;
  const scope = String(options.universityCode || options.schoolCode || '').trim().toUpperCase() || '全部学校';
  const lines = [
    '【本科课程资料待补清单】',
    `范围：${scope}`,
    `待补 Programme：${totalPending}`,
    ...(options.readiness ? [`当前筛选：${options.readiness} · ${filteredTotal} 个`] : []),
    ...(options.priority ? [`优先级：${normalizePendingPriorityMode(options.priority)}`] : []),
    '',
    '采集要求：',
    '- 只补官方来源或可信资料能验证的课程。',
    '- 尽量包含课程代码、课程名、学分/units、Year/Semester、课程类别和来源链接。',
    '- 如果只有 Programme 简介但没有课程码，保持“课程清单待开放”，不要推测课程。',
    '',
    `待补项目（前 ${pending.length} 个）：`
  ];

  if (!pending.length) {
    lines.push('- 暂无待补 Programme。');
  } else {
    pending.forEach((programme, index) => {
      lines.push(`${index + 1}. ${programme.universityCode} · ${programme.code} · ${programme.name}`);
      if (programme.faculty) lines.push(`   学院：${programme.faculty}`);
      lines.push(`   当前状态：${programme.sourceStatusLabel}`);
      lines.push(`   官方入口：${programme.officialUrl || '待查'}`);
      lines.push('   待补资料：课程代码 / 课程名 / 学分 / Year / Semester / 课程类别 / 来源链接');
    });
  }

  return lines.join('\n');
}

module.exports = {
  buildPendingCollectionText,
  formatPendingSourceReadiness,
  getCatalogueSummary,
  getCatalogueCourse,
  getFaculty,
  getMajor,
  getMajorProfile,
  getProgramme,
  getPendingSourceStatus,
  getPendingSourceReadinessKey,
  getSchoolCoverage,
  getUniversity,
  listPendingProgrammes,
  listCurriculumYears,
  listFaculties,
  listMajorCourses,
  listMajors,
  listProgrammes,
  listRequirementGroups,
  listUniversities,
  normalizePendingReadinessFilter,
  normalizePendingPriorityMode,
  isUmbrellaSchemeProgramme,
  sortPendingProgrammesByPriority,
  summarizePendingSourceReadiness,
  searchMajors,
  searchProgrammes
};
