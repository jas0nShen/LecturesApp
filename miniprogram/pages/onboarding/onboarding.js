const service = require('../../utils/courseService');
const tpgCatalogue = require('../../utils/tpgCatalog');

Page({
  data: {
    mode: 'undergraduate',
    universities: [],
    programmes: [],
    majors: [],
    selectedUniversity: {},
    selectedProgramme: {},
    selectedMajor: {},
    curriculumYears: [],
    curriculumYear: '2025-26',
    yearOptions: ['1', '2', '3', '4'],
    currentYear: '1',
    tpgUniversities: tpgCatalogue.universities,
    tpgTotalProgrammes: tpgCatalogue.programmes.length,
    tpgProgrammes: [],
    selectedTpgUniversity: {},
    selectedTpgProgramme: {},
    tpgCourseCount: 0
  },

  async onLoad() {
    const profile = service.getProfile();
    await this.loadUndergraduate(profile);
    this.loadTpg(profile);
    this.setData({
      mode: profile && profile.profileType === 'tpg' ? 'tpg' : 'undergraduate'
    });
  },

  async loadUndergraduate(profile) {
    const universitiesResult = await service.listUniversitiesRemote();
    const universities = universitiesResult.data;
    const selectedUniversity = universities.find((item) => item.id === (profile && profile.universityId)) || universities[0];
    const programmesResult = await service.listProgrammesRemote(selectedUniversity.id);
    const programmes = programmesResult.data;
    const selectedProgramme = programmes.find((item) => item.id === (profile && profile.programmeId)) || programmes[0];
    const majorsResult = await service.listMajorsRemote(selectedProgramme.id);
    const majors = majorsResult.data;
    const selectedMajor = majors.find((item) => item.id === (profile && profile.majorId)) || majors[0];
    const curriculumYears = service.listCurriculumYears(selectedProgramme.id, selectedMajor.id);
    const curriculumYear = profile && curriculumYears.includes(profile.curriculumYear)
      ? profile.curriculumYear
      : curriculumYears[0] || '';

    this.setData({
      universities,
      programmes,
      majors,
      selectedUniversity,
      selectedProgramme,
      selectedMajor,
      curriculumYears,
      curriculumYear,
      currentYear: profile && profile.profileType !== 'tpg' ? String(profile.currentYear) : '1'
    });
  },

  loadTpg(profile) {
    const selectedTpgUniversity = tpgCatalogue.universities.find(
      (item) => item.code === (profile && profile.universityCode)
    ) || tpgCatalogue.universities[0];
    const tpgProgrammes = tpgCatalogue.programmes.filter(
      (item) => item.universityCode === selectedTpgUniversity.code
    );
    const selectedTpgProgramme = tpgProgrammes.find(
      (item) => item.id === (profile && profile.programmeId)
    ) || tpgProgrammes[0] || {};
    this.setTpgSelection(selectedTpgUniversity, tpgProgrammes, selectedTpgProgramme);
  },

  selectMode(event) {
    this.setData({ mode: event.currentTarget.dataset.mode });
  },

  async onUniversityChange(event) {
    const selectedUniversity = this.data.universities[Number(event.detail.value)];
    const programmesResult = await service.listProgrammesRemote(selectedUniversity.id);
    const programmes = programmesResult.data;
    const selectedProgramme = programmes[0] || {};
    const majorsResult = selectedProgramme.id
      ? await service.listMajorsRemote(selectedProgramme.id)
      : { data: [] };
    const majors = majorsResult.data;
    const selectedMajor = majors[0] || {};
    const curriculumYears = selectedMajor.id
      ? service.listCurriculumYears(selectedProgramme.id, selectedMajor.id)
      : [];
    this.setData({
      selectedUniversity,
      programmes,
      selectedProgramme,
      majors,
      selectedMajor,
      curriculumYears,
      curriculumYear: curriculumYears[0] || ''
    });
  },

  async onProgrammeChange(event) {
    const selectedProgramme = this.data.programmes[Number(event.detail.value)];
    const majorsResult = await service.listMajorsRemote(selectedProgramme.id);
    const majors = majorsResult.data;
    const selectedMajor = majors[0] || {};
    const curriculumYears = selectedMajor.id
      ? service.listCurriculumYears(selectedProgramme.id, selectedMajor.id)
      : [];
    this.setData({
      selectedProgramme,
      majors,
      selectedMajor,
      curriculumYears,
      curriculumYear: curriculumYears[0] || ''
    });
  },

  onMajorChange(event) {
    const selectedMajor = this.data.majors[Number(event.detail.value)];
    const curriculumYears = service.listCurriculumYears(this.data.selectedProgramme.id, selectedMajor.id);
    this.setData({
      selectedMajor,
      curriculumYears,
      curriculumYear: curriculumYears[0] || ''
    });
  },

  onCurriculumYearChange(event) {
    this.setData({ curriculumYear: this.data.curriculumYears[Number(event.detail.value)] });
  },

  onCurrentYearChange(event) {
    this.setData({ currentYear: this.data.yearOptions[Number(event.detail.value)] });
  },

  onTpgUniversityChange(event) {
    const selectedTpgUniversity = this.data.tpgUniversities[Number(event.detail.value)];
    const tpgProgrammes = tpgCatalogue.programmes.filter(
      (item) => item.universityCode === selectedTpgUniversity.code
    );
    this.setTpgSelection(selectedTpgUniversity, tpgProgrammes, tpgProgrammes[0] || {});
  },

  onTpgProgrammeChange(event) {
    const selectedTpgProgramme = this.data.tpgProgrammes[Number(event.detail.value)];
    this.setTpgSelection(
      this.data.selectedTpgUniversity,
      this.data.tpgProgrammes,
      selectedTpgProgramme
    );
  },

  setTpgSelection(selectedTpgUniversity, tpgProgrammes, selectedTpgProgramme) {
    const tpgCourseCount = (selectedTpgProgramme.courseGroups || []).reduce(
      (total, group) => total + group.courses.length,
      0
    );
    this.setData({
      selectedTpgUniversity,
      tpgProgrammes,
      selectedTpgProgramme,
      tpgCourseCount
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
