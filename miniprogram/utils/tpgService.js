const catalogue = require('./tpgCatalog');

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
  );
}

function getProgramme(programmeId) {
  return catalogue.programmes.find((programme) => programme.id === programmeId) || null;
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

function flattenCourses(programme, keyword = '') {
  if (!programme) return [];
  const normalized = normalizeKeyword(keyword);
  return (programme.courseGroups || []).flatMap((group, groupIndex) => (
    (group.courses || []).map((course, courseIndex) => ({
      ...course,
      rowKey: `${groupIndex}-${course.code}-${courseIndex}`,
      groupName: group.name,
      creditsRequired: group.creditsRequired,
      searchableText: `${course.code} ${course.name} ${group.name}`.toLowerCase()
    }))
  )).filter((course) => !normalized || course.searchableText.includes(normalized));
}

function countCourses(programme) {
  return flattenCourses(programme).length;
}

function hasCourseGroups(programme) {
  return countCourses(programme) > 0;
}

function getStatus(programme) {
  const courseCount = countCourses(programme);
  const hasStructure = programme && programme.dataLevel === 'structure';
  return {
    courseCount,
    hasCourseGroups: courseCount > 0,
    hasStructure,
    title: courseCount ? '课程结构已录入' : hasStructure ? '结构资料待拆分' : 'Programme 索引',
    copy: courseCount
      ? '以下必修与选修课程已从资料中录入，仍建议在选课前对照学校官网。'
      : hasStructure
        ? 'PDF 中包含部分结构信息，课程名称与分组仍在逐项整理。'
        : '当前已确认 Programme 基本资料，必修与选修课程尚未完成核验。'
  };
}

function searchProgrammes(programmes, keyword = '') {
  const normalized = normalizeKeyword(keyword);
  if (!normalized) return programmes;
  return programmes.filter((programme) => {
    const courseText = (programme.courseGroups || []).flatMap((group) => (
      (group.courses || []).flatMap((course) => [course.code, course.name])
    ));
    return [
      programme.name,
      programme.programmeCode,
      programme.faculty,
      programme.universityCode,
      ...courseText
    ].filter(Boolean).join(' ').toLowerCase().includes(normalized);
  });
}

function getProfileSummary(profile) {
  if (!profile || profile.profileType !== 'tpg') return null;
  const programme = getProgramme(profile.programmeId);
  const university = programme ? getProgrammeUniversity(programme) : getUniversity(profile.universityCode);
  const courseCount = programme ? countCourses(programme) : profile.courseCount || 0;
  return {
    programme,
    university,
    courseCount,
    schoolLabel: university.shortName || profile.universityName || profile.universityCode,
    yearLabel: university.academicYear || profile.curriculumYear,
    statusLabel: courseCount ? `已录入 ${courseCount} 门课程` : '课程清单待开放',
    creditsLabel: programme && programme.creditsRequired
      ? `${programme.creditsRequired} credits / units`
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
  getProgrammeUniversity,
  getProfileSummary,
  getSchoolCoverage,
  getStatus,
  getUniversity,
  hasCourseGroups,
  listProgrammes,
  listUniversities,
  searchProgrammes
};
