const service = require('../../utils/courseService');
const tpgService = require('../../utils/tpgService');
const ugService = require('../../utils/ugService');

Page({
  data: {
    mode: 'tpg',
    universities: [],
    programmes: [],
    filteredUgProgrammes: [],
    visibleUgProgrammes: [],
    majors: [],
    selectedUniversity: {},
    selectedProgramme: {},
    selectedMajor: {},
    curriculumYears: [],
    curriculumYear: '2025-26',
    yearOptions: ['1', '2', '3', '4'],
    currentYear: '1',
    ugKeyword: '',
    ugSelectedIndexLabel: '',
    ugSchoolStats: null,
    ugMajorProfile: null,
    ugCourseStatus: '',
    tpgUniversities: tpgService.listUniversities(),
    tpgTotalProgrammes: tpgService.getSchoolCoverage().programmeCount,
    tpgProgrammes: [],
    filteredTpgProgrammes: [],
    visibleTpgProgrammes: [],
    tpgKeyword: '',
    selectedTpgUniversity: {},
    selectedTpgProgramme: {},
    tpgCourseCount: 0,
    tpgCourseStatus: '',
    tpgSelectedIndexLabel: '',
    savedTpgProfile: null
  },

  async onLoad() {
    const profile = service.getProfile();
    const savedTpgProfile = tpgService.getProfileSummary(profile);
    this.loadTpg(profile);
    this.setData({
      mode: 'tpg',
      savedTpgProfile: savedTpgProfile && savedTpgProfile.programme ? savedTpgProfile : null
    });
    await this.loadUndergraduate(profile);
  },

  async loadUndergraduate(profile) {
    const universities = ugService.listUniversities();
    const selectedUniversity = universities.find((item) => item.id === (profile && profile.universityId)) || universities[0];
    const programmes = ugService.listProgrammes({ universityId: selectedUniversity.id, degreeLevel: 'undergraduate' });
    const selectedProgramme = programmes.find((item) => item.id === (profile && profile.programmeId)) || programmes[0];
    this.setData({
      universities,
      selectedUniversity,
      currentYear: profile && profile.profileType !== 'tpg' ? String(profile.currentYear) : '1'
    });
    this.setUgSelection(selectedUniversity, programmes, selectedProgramme, '', profile);
  },

  loadTpg(profile) {
    const selectedTpgUniversity = tpgService.listUniversities().find(
      (item) => item.code === (profile && profile.universityCode)
    ) || tpgService.listUniversities()[0];
    const tpgProgrammes = tpgService.listProgrammes(selectedTpgUniversity.code);
    const selectedTpgProgramme = tpgProgrammes.find(
      (item) => item.id === (profile && profile.programmeId)
    ) || tpgProgrammes[0] || {};
    this.setTpgSelection(selectedTpgUniversity, tpgProgrammes, selectedTpgProgramme);
  },

  selectMode(event) {
    this.setData({ mode: event.currentTarget.dataset.mode });
  },

  switchToTpg() {
    this.setData({ mode: 'tpg' });
  },

  async onUniversityChange(event) {
    const selectedUniversity = this.data.universities[Number(event.detail.value)];
    const programmes = ugService.listProgrammes({ universityId: selectedUniversity.id, degreeLevel: 'undergraduate' });
    this.setUgSelection(selectedUniversity, programmes, programmes[0] || {}, '');
  },

  async onProgrammeChange(event) {
    const selectedProgramme = this.data.filteredUgProgrammes[Number(event.detail.value)];
    this.applyUgProgrammeSelection(selectedProgramme);
  },

  onUgKeyword(event) {
    const keyword = event.detail.value;
    const filteredUgProgrammes = ugService.searchProgrammes(this.data.programmes, keyword);
    const selectedProgramme = filteredUgProgrammes.find(
      (item) => item.id === this.data.selectedProgramme.id
    ) || filteredUgProgrammes[0] || {};
    this.setUgSelection(
      this.data.selectedUniversity,
      this.data.programmes,
      selectedProgramme,
      keyword
    );
  },

  clearUgKeyword() {
    this.setUgSelection(
      this.data.selectedUniversity,
      this.data.programmes,
      this.data.programmes[0] || {},
      ''
    );
  },

  selectUgProgramme(event) {
    const programme = this.data.filteredUgProgrammes.find(
      (item) => item.id === event.currentTarget.dataset.id
    );
    if (!programme) return;
    this.setUgSelection(
      this.data.selectedUniversity,
      this.data.programmes,
      programme,
      this.data.ugKeyword
    );
  },

  applyUgProgrammeSelection(selectedProgramme = {}, profile = null) {
    const majors = selectedProgramme.id ? ugService.listMajors(selectedProgramme.id) : [];
    const selectedMajor = majors.find((item) => item.id === (profile && profile.majorId)) || majors[0] || {};
    const curriculumYears = selectedMajor.id
      ? ugService.listCurriculumYears(selectedProgramme.id, selectedMajor.id)
      : [];
    const curriculumYear = profile && curriculumYears.includes(profile.curriculumYear)
      ? profile.curriculumYear
      : curriculumYears[0] || '';
    const ugMajorProfile = selectedMajor.id
      ? ugService.getMajorProfile(selectedProgramme.id, selectedMajor.id, curriculumYear)
      : null;
    this.setData({
      selectedProgramme,
      majors,
      selectedMajor,
      curriculumYears,
      curriculumYear,
      ugMajorProfile,
      ugCourseStatus: this.buildUgCourseStatus(ugMajorProfile)
    });
  },

  setUgSelection(selectedUniversity, programmes, selectedProgramme, ugKeyword = this.data.ugKeyword, profile = null) {
    const filteredUgProgrammes = ugService.searchProgrammes(programmes, ugKeyword);
    const effectiveProgramme = selectedProgramme && selectedProgramme.id
      ? selectedProgramme
      : filteredUgProgrammes[0] || {};
    const selectedIndex = filteredUgProgrammes.findIndex((item) => item.id === effectiveProgramme.id);
    const programmeIds = new Set(programmes.map((programme) => programme.id));
    const majorCount = programmes.reduce((sum, programme) => sum + ugService.listMajors(programme.id).length, 0);
    const codedCourseCount = programmes.reduce((sum, programme) => sum + (programme.codedCourseCount || 0), 0);
    this.setData({
      selectedUniversity,
      programmes,
      filteredUgProgrammes,
      visibleUgProgrammes: filteredUgProgrammes.slice(0, 5),
      ugKeyword,
      ugSelectedIndexLabel: selectedIndex >= 0 ? `${selectedIndex + 1} / ${filteredUgProgrammes.length}` : `0 / ${filteredUgProgrammes.length}`,
      ugSchoolStats: {
        schoolCount: this.data.universities.length || ugService.listUniversities().length,
        programmeCount: programmes.length,
        majorCount,
        codedCourseCount,
        hasDuplicateProgrammeIds: programmeIds.size !== programmes.length
      }
    });
    this.applyUgProgrammeSelection(effectiveProgramme, profile);
  },

  onMajorChange(event) {
    const selectedMajor = this.data.majors[Number(event.detail.value)];
    const curriculumYears = ugService.listCurriculumYears(this.data.selectedProgramme.id, selectedMajor.id);
    const curriculumYear = curriculumYears[0] || '';
    const ugMajorProfile = ugService.getMajorProfile(this.data.selectedProgramme.id, selectedMajor.id, curriculumYear);
    this.setData({
      selectedMajor,
      curriculumYears,
      curriculumYear,
      ugMajorProfile,
      ugCourseStatus: this.buildUgCourseStatus(ugMajorProfile)
    });
  },

  onCurriculumYearChange(event) {
    const curriculumYear = this.data.curriculumYears[Number(event.detail.value)];
    const ugMajorProfile = ugService.getMajorProfile(
      this.data.selectedProgramme.id,
      this.data.selectedMajor.id,
      curriculumYear
    );
    this.setData({
      curriculumYear,
      ugMajorProfile,
      ugCourseStatus: this.buildUgCourseStatus(ugMajorProfile)
    });
  },

  onCurrentYearChange(event) {
    this.setData({ currentYear: this.data.yearOptions[Number(event.detail.value)] });
  },

  buildUgCourseStatus(majorProfile) {
    if (!majorProfile) return '当前专业还没有可用培养方案';
    if (majorProfile.codedCourseCount > 0) {
      return `已录入 ${majorProfile.codedCourseCount} 门课程 · ${majorProfile.curriculumYear}`;
    }
    if (majorProfile.sourceStatus === 'programme_summary_only') {
      return `Programme / Major 已录入 · 课程清单待开放 · ${majorProfile.curriculumYear}`;
    }
    return `${majorProfile.courseCount} 门课程 · ${majorProfile.trackedRequirementCount} 个要求组 · ${majorProfile.curriculumYear}`;
  },

  onTpgUniversityChange(event) {
    const selectedTpgUniversity = this.data.tpgUniversities[Number(event.detail.value)];
    const tpgProgrammes = tpgService.listProgrammes(selectedTpgUniversity.code);
    this.setTpgSelection(selectedTpgUniversity, tpgProgrammes, tpgProgrammes[0] || {}, '');
  },

  onTpgProgrammeChange(event) {
    const selectedTpgProgramme = this.data.filteredTpgProgrammes[Number(event.detail.value)];
    this.setTpgSelection(
      this.data.selectedTpgUniversity,
      this.data.tpgProgrammes,
      selectedTpgProgramme,
      this.data.tpgKeyword
    );
  },

  onTpgKeyword(event) {
    const keyword = event.detail.value;
    const filteredTpgProgrammes = tpgService.searchProgrammes(this.data.tpgProgrammes, keyword);
    const selectedTpgProgramme = filteredTpgProgrammes.find(
      (item) => item.id === this.data.selectedTpgProgramme.id
    ) || filteredTpgProgrammes[0] || {};
    this.setTpgSelection(
      this.data.selectedTpgUniversity,
      this.data.tpgProgrammes,
      selectedTpgProgramme,
      keyword
    );
  },

  clearTpgKeyword() {
    this.setTpgSelection(
      this.data.selectedTpgUniversity,
      this.data.tpgProgrammes,
      this.data.tpgProgrammes[0] || {},
      ''
    );
  },

  selectTpgProgramme(event) {
    const programme = this.data.filteredTpgProgrammes.find(
      (item) => item.id === event.currentTarget.dataset.id
    );
    if (!programme) return;
    this.setTpgSelection(
      this.data.selectedTpgUniversity,
      this.data.tpgProgrammes,
      programme,
      this.data.tpgKeyword
    );
  },

  previewTpgProgramme() {
    const programme = this.data.selectedTpgProgramme;
    if (!programme || !programme.id) {
      wx.showToast({ title: '请选择 Programme', icon: 'none' });
      return;
    }
    wx.navigateTo({
      url: `/pages/tpg-programme/tpg-programme?id=${encodeURIComponent(programme.id)}`
    });
  },

  previewSavedTpgProgramme() {
    const saved = this.data.savedTpgProfile;
    if (!saved || !saved.programme) return;
    wx.navigateTo({
      url: `/pages/tpg-programme/tpg-programme?id=${encodeURIComponent(saved.programme.id)}`
    });
  },

  setTpgSelection(selectedTpgUniversity, tpgProgrammes, selectedTpgProgramme, tpgKeyword = this.data.tpgKeyword) {
    const filteredTpgProgrammes = tpgService.searchProgrammes(tpgProgrammes, tpgKeyword);
    const effectiveProgramme = selectedTpgProgramme && selectedTpgProgramme.id
      ? selectedTpgProgramme
      : filteredTpgProgrammes[0] || {};
    const tpgCourseCount = tpgService.flattenCourses(effectiveProgramme).length;
    const selectedIndex = filteredTpgProgrammes.findIndex((item) => item.id === effectiveProgramme.id);
    this.setData({
      selectedTpgUniversity,
      tpgProgrammes,
      filteredTpgProgrammes,
      visibleTpgProgrammes: filteredTpgProgrammes.slice(0, 5),
      tpgKeyword,
      selectedTpgProgramme: effectiveProgramme,
      tpgCourseCount,
      tpgCourseStatus: tpgCourseCount ? `已录入 ${tpgCourseCount} 门课程` : 'Programme 索引已录入，课程清单待开放',
      tpgSelectedIndexLabel: selectedIndex >= 0 ? `${selectedIndex + 1} / ${filteredTpgProgrammes.length}` : `0 / ${filteredTpgProgrammes.length}`
    });
  },

  save() {
    if (this.data.mode === 'tpg') {
      const university = this.data.selectedTpgUniversity;
      const programme = this.data.selectedTpgProgramme;
      if (!programme.id) {
        wx.showToast({ title: '请选择 Programme', icon: 'none' });
        return;
      }
      service.saveProfile({
        profileType: 'tpg',
        universityCode: university.code,
        universityName: university.shortName,
        programmeId: programme.id,
        programmeName: programme.name,
        programmeCode: programme.programmeCode,
        faculty: programme.faculty,
        curriculumYear: university.academicYear,
        creditsRequired: programme.creditsRequired,
        courseCount: this.data.tpgCourseCount
      });
      wx.showToast({ title: '授课硕士资料已保存' });
      wx.switchTab({ url: '/pages/home/home' });
      return;
    }

    if (!this.data.selectedMajor.id || !this.data.curriculumYear) {
      wx.showToast({ title: '当前专业还没有可用培养方案', icon: 'none' });
      return;
    }

    service.saveProfile({
      profileType: 'undergraduate',
      universityId: this.data.selectedUniversity.id,
      universityCode: this.data.selectedUniversity.code,
      programmeId: this.data.selectedProgramme.id,
      programmeName: this.data.selectedProgramme.nameEn,
      majorId: this.data.selectedMajor.id,
      majorCode: this.data.selectedMajor.code,
      majorName: this.data.selectedMajor.nameEn,
      curriculumYear: this.data.curriculumYear,
      currentYear: Number(this.data.currentYear)
    });

    wx.showToast({ title: '本科培养方案已保存' });
    wx.switchTab({ url: '/pages/home/home' });
  }
});
