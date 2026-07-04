const service = require('../../utils/courseService');

Page({
  data: {
    universities: [],
    programmes: [],
    majors: [],
    selectedUniversity: {},
    selectedProgramme: {},
    selectedMajor: {},
    curriculumYears: ['2026', '2025', '2024'],
    curriculumYear: '2026',
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

    this.setData({
      universities,
      programmes,
      majors,
      selectedUniversity,
      selectedProgramme,
      selectedMajor,
      curriculumYear: profile ? profile.curriculumYear : '2026',
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
    this.setData({
      selectedUniversity,
      programmes,
      selectedProgramme,
      majors,
      selectedMajor: majors[0] || {}
    });
  },

  async onProgrammeChange(event) {
    const selectedProgramme = this.data.programmes[Number(event.detail.value)];
    const majorsResult = await service.listMajorsRemote(selectedProgramme.id);
    const majors = majorsResult.data;
    this.setData({
      selectedProgramme,
      majors,
      selectedMajor: majors[0] || {}
    });
  },

  onMajorChange(event) {
    this.setData({ selectedMajor: this.data.majors[Number(event.detail.value)] });
  },

  onCurriculumYearChange(event) {
    this.setData({ curriculumYear: this.data.curriculumYears[Number(event.detail.value)] });
  },

  onCurrentYearChange(event) {
    this.setData({ currentYear: this.data.yearOptions[Number(event.detail.value)] });
  },

  save() {
    if (!this.data.selectedMajor.id) {
      wx.showToast({ title: '请选择 Major', icon: 'none' });
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
