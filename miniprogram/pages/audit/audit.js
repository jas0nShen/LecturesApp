const service = require('../../utils/courseService');

Page({
  data: {
    courses: [],
    audit: {
      sections: [],
      recommendations: [],
      completedCredits: 0,
      totalCreditRequired: 240,
      totalProgress: 0
    },
    dataSource: 'loading'
  },

  onShow() {
    this.refresh();
  },

  async refresh() {
    const profile = service.getProfile() || { programmeId: 1, majorId: 1, curriculumYear: '2026' };
    const completedIds = service.getCompletedCourseIds();
    const coursesResult = await service.listCoursesRemote({ programmeId: profile.programmeId, majorId: profile.majorId });
    const auditResult = await service.buildAuditRemote(profile, completedIds);
    const courses = coursesResult.data.map((course) => ({
      ...course,
      completed: completedIds.includes(course.id)
    }));
    this.setData({
      courses,
      audit: auditResult.data,
      dataSource: auditResult.source
    });
  },

  toggleCompleted(event) {
    service.toggleCompleted(event.currentTarget.dataset.id);
    this.refresh();
  }
});
