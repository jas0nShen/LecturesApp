const data = require('./mockData');
const catalogue = require('./ugCatalogue');

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
  return catalogue.programmes.find((programme) => sameId(programme.id, programmeId))
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
  const catalogueCourses = catalogue.courses.filter((course) => (
    sameId(course.programmeId, programmeId)
    && sameId(course.majorId, majorId)
  ));
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
  const majorIds = new Set();
  undergraduateProgrammes.forEach((programme) => {
    listMajors(programme.id).forEach((major) => majorIds.add(major.id));
  });
  return {
    universityCount: listUniversities().length,
    facultyCount: listFaculties().length,
    programmeCount: undergraduateProgrammes.length,
    majorCount: majorIds.size,
    courseCount: catalogue.courses.length + data.courses.length,
    requirementCount: data.requirements.length,
    codedCourseCount: catalogue.courses.length,
    sourceProgrammeCount: catalogue.programmes.length
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
  searchMajors,
  searchProgrammes
};
