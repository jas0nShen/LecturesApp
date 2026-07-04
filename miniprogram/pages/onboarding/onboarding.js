const service = require('../../utils/courseService');

Page({
  data: {
    universities: [],
    programmes: [],
    majors: [],
    selectedUniversity: {},
    selectedProgramme: {},
    selectedMajor: {},
    curriculumYears: [],
    curriculumYear: '2025-26',
    yearOptions: ['1', '2', '3', '4'],
    currentYear: '1'
  },

  async onLoad() {
    const profile = service.getProfile();
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
      currentYear: profile ? String(profile.currentYear) : '1'
    });
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

  save() {
    if (!this.data.selectedMajor.id || !this.data.curriculumYear) {
      wx.showToast({ title: '当前专业还没有可用培养方案', icon: 'none' });
      return;
    }

    service.saveProfile({
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

    wx.showToast({ title: '已保存' });
    wx.switchTab({ url: '/pages/home/home' });
  }
});
