const data = require('./mockData');

function normalizeKeyword(keyword = '') {
  return String(keyword).trim().toLowerCase();
}

function listUniversities() {
  return data.universities;
}

function listFaculties(universityId) {
  return data.faculties.filter((faculty) => !universityId || faculty.universityId === Number(universityId));
}

function listProgrammes(filters = {}) {
  return data.programmes.filter((programme) => (
    (!filters.universityId || programme.universityId === Number(filters.universityId))
    && (!filters.facultyId || programme.facultyId === Number(filters.facultyId))
    && (!filters.degreeLevel || programme.degreeLevel === filters.degreeLevel)
  ));
}

function listMajors(programmeId) {
  return data.majors.filter((major) => !programmeId || major.programmeId === Number(programmeId));
}

function getUniversity(universityId) {
  return data.universities.find((university) => university.id === Number(universityId)) || null;
}

function getFaculty(facultyId) {
  return data.faculties.find((faculty) => faculty.id === Number(facultyId)) || null;
}

function getProgramme(programmeId) {
  return data.programmes.find((programme) => programme.id === Number(programmeId)) || null;
}

function getMajor(majorId) {
  return data.majors.find((major) => major.id === Number(majorId)) || null;
}

function listCurriculumYears(programmeId, majorId) {
  return [...new Set(data.requirements
    .filter((requirement) => (
      (!programmeId || requirement.programmeId === Number(programmeId))
      && (!majorId || requirement.majorId === Number(majorId))
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
  const keyword = normalizeKeyword(filters.keyword);
  return data.courses.filter((course) => {
    const searchable = [
      course.courseCode,
      course.titleEn,
      course.titleZh,
      course.department,
      course.courseType
    ].filter(Boolean).join(' ').toLowerCase();
    return course.programmeId === Number(programmeId)
      && course.majorId === Number(majorId)
      && (!filters.courseType || filters.courseType === 'all' || course.courseType === filters.courseType)
      && (!filters.recommendedYear || Number(course.recommendedYear) === Number(filters.recommendedYear))
      && (!keyword || searchable.includes(keyword));
  });
}

function getMajorProfile(programmeId, majorId, curriculumYear) {
  const programme = getProgramme(programmeId);
  const major = getMajor(majorId);
  if (!programme || !major || major.programmeId !== programme.id) return null;
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
  if (!normalized) return data.majors;
  return data.majors.filter((major) => {
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

function getCatalogueSummary() {
  const undergraduateProgrammes = listProgrammes({ degreeLevel: 'undergraduate' });
  const majorIds = new Set();
  undergraduateProgrammes.forEach((programme) => {
    listMajors(programme.id).forEach((major) => majorIds.add(major.id));
  });
  return {
    universityCount: data.universities.length,
    facultyCount: data.faculties.length,
    programmeCount: undergraduateProgrammes.length,
    majorCount: majorIds.size,
    courseCount: data.courses.length,
    requirementCount: data.requirements.length
  };
}

module.exports = {
  getCatalogueSummary,
  getFaculty,
  getMajor,
  getMajorProfile,
  getProgramme,
  getUniversity,
  listCurriculumYears,
  listFaculties,
  listMajorCourses,
  listMajors,
  listProgrammes,
  listRequirementGroups,
  listUniversities,
  searchMajors
};
