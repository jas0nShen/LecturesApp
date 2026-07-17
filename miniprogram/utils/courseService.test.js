const assert = require('node:assert/strict');
const { beforeEach, test } = require('node:test');

const storage = new Map();

global.wx = {
  getStorageSync(key) {
    return storage.get(key);
  },
  setStorageSync(key, value) {
    storage.set(key, value);
  },
  removeStorageSync(key) {
    storage.delete(key);
  },
  request(options) {
    options.fail(new Error('API unavailable in fallback test'));
  }
};

const service = require('./courseService');
const tpgService = require('./tpgService');

beforeEach(() => {
  storage.clear();
});

test('legacy curriculum profiles migrate to the verified intake label', () => {
  storage.set('userProfile', { programmeId: 1, curriculumYear: '2026' });
  assert.deepEqual(service.getProfile(), { programmeId: 1, curriculumYear: '2025-26' });
  assert.equal(storage.get('userProfile').curriculumYear, '2025-26');
});

test('Study Plan capability supports verified TPG structures and preserves the HKU UG mode', () => {
  assert.equal(service.getPlanningCapability().supported, false);
  assert.deepEqual(service.getPlanningCapability({
    profileType: 'undergraduate', universityCode: 'HKU', programmeId: 1, majorId: 1
  }), {
    supported: true,
    mode: 'hku-four-year-plan',
    reason: '',
    settingsUrl: '/pages/onboarding/onboarding?mode=undergraduate&profileType=undergraduate&universityCode=HKU&programmeId=1&majorId=1'
  });
  const ugCatalogue = service.getPlanningCapability({
    profileType: 'undergraduate', universityCode: 'HKU', programmeId: 'HKU-UG-6004-1', majorId: 'HKU-UG-6004-1-M1'
  });
  assert.equal(ugCatalogue.supported, true);
  assert.equal(ugCatalogue.mode, 'ug-course-plan');
  const ugIndexOnly = service.getPlanningCapability({
    profileType: 'undergraduate', universityCode: 'HKU', programmeId: 'HKU-UG-6066-20', majorId: 'HKU-UG-6066-20-M1'
  });
  assert.equal(ugIndexOnly.supported, false);
  assert.match(ugIndexOnly.reason, /课程清单待开放/);

  const supported = service.getPlanningCapability({ profileType: 'tpg', programmeId: 'HKU-TPG-024' });
  assert.equal(supported.supported, true);
  assert.equal(supported.mode, 'tpg-course-plan');

  const blocked = service.getPlanningCapability({ profileType: 'tpg', programmeId: 'HKU-TPG-027' });
  assert.equal(blocked.supported, false);
  assert.match(blocked.reason, /复核中/);

  const missingTrack = service.getPlanningCapability({ profileType: 'tpg', programmeId: 'POLYU-TPG-094' });
  assert.equal(missingTrack.supported, false);
  assert.match(missingTrack.reason, /Track/);
  assert.equal(service.getPlanningCapability({
    profileType: 'tpg',
    programmeId: 'POLYU-TPG-094',
    trackId: 'POLYU-TPG-094-LANGUAGE-AND-COMMUNICATION'
  }).supported, true);
});

test('TPG planning capability reports a missing verified course structure', () => {
  const originalGetProgramme = tpgService.getProgramme;
  tpgService.getProgramme = () => ({
    id: 'TEST-TPG-001',
    courseVerificationStatus: 'verified',
    courseGroups: []
  });
  try {
    const capability = service.getPlanningCapability({ profileType: 'tpg', programmeId: 'TEST-TPG-001' });
    assert.equal(capability.supported, false);
    assert.match(capability.reason, /暂无已核验课程组/);
  } finally {
    tpgService.getProgramme = originalGetProgramme;
  }
});

test('opening profile settings falls back to reLaunch when navigateTo fails', () => {
  const calls = [];
  const originalNavigateTo = global.wx.navigateTo;
  const originalReLaunch = global.wx.reLaunch;
  const originalShowToast = global.wx.showToast;
  global.wx.navigateTo = ({ url, fail }) => {
    calls.push({ type: 'navigateTo', url });
    fail({ errMsg: 'navigateTo:fail page limit exceed' });
  };
  global.wx.reLaunch = ({ url }) => calls.push({ type: 'reLaunch', url });
  global.wx.showToast = () => calls.push({ type: 'showToast' });

  try {
    const url = service.openOnboarding({
      profileType: 'undergraduate',
      universityId: 4,
      universityCode: 'POLYU',
      programmeId: 'POLYU-UG-12',
      programmeName: 'A deliberately long programme name that should stay out of the route',
      majorId: 'POLYU-UG-12-M1',
      majorCode: 'APPLIED-MATHEMATICS',
      curriculumYear: '2026',
      currentYear: '1'
    });
    assert.equal(calls.length, 2);
    assert.equal(calls[0].type, 'navigateTo');
    assert.equal(calls[1].type, 'reLaunch');
    assert.equal(calls[0].url, calls[1].url);
    assert.equal(calls[0].url, url);
    assert.equal(url.includes('programmeName='), false);
    assert.equal(url.includes('universityCode=POLYU'), true);
    assert.equal(url.includes('programmeId=POLYU-UG-12'), true);
  } finally {
    global.wx.navigateTo = originalNavigateTo;
    global.wx.reLaunch = originalReLaunch;
    global.wx.showToast = originalShowToast;
  }
});

test('TPG Track is preserved in the profile settings route', () => {
  const url = service.buildOnboardingUrl({
    profileType: 'tpg',
    universityCode: 'EDUHK',
    programmeId: 'EDUHK-TPG-DIR-MED',
    trackId: 'EDUHK-TPG-DIR-MED-CTA'
  });
  assert(url.includes('trackId=EDUHK-TPG-DIR-MED-CTA'));
});

test('saving a TPG profile cannot bypass a required Track selection', () => {
  const programmeId = 'POLYU-TPG-094';
  const trackId = 'POLYU-TPG-094-LANGUAGE-AND-COMMUNICATION';
  assert.throws(
    () => service.saveProfile({ profileType: 'tpg', programmeId }),
    /TPG Track selection is required/
  );
  assert.throws(
    () => service.saveProfile({ profileType: 'tpg', programmeId, trackId: 'OTHER-TRACK' }),
    /TPG Track selection is required/
  );

  service.saveProfile({ profileType: 'tpg', programmeId, trackId });
  assert.equal(service.getProfile().trackId, trackId);
});

test('local course filters match programme, major, type, prerequisite and keyword', () => {
  const courses = service.listCourses({
    programmeId: 1,
    majorId: 1,
    courseType: 'core',
    hasPrerequisite: false,
    keyword: 'comp'
  });

  assert.deepEqual(courses.map((course) => course.courseCode), ['COMP1117', 'COMP2121']);
  assert.deepEqual(service.listCourses({ programmeId: 999 }), []);
  assert.deepEqual(service.listCourses({ majorId: 999 }), []);
  assert.deepEqual(service.listCurriculumYears(1, 1), ['2025-26']);
  assert.deepEqual(service.listCurriculumYears(999, 999), []);
});

test('favorites are stored without duplicates and can be removed', () => {
  assert.deepEqual(service.toggleFavorite(1), [1]);
  assert.equal(service.isFavorite('1'), true);
  assert.deepEqual(service.toggleFavorite('1'), []);
  assert.equal(service.isFavorite(1), false);
});

test('completed courses are stored and used by the local graduation audit', () => {
  service.toggleCompleted(1);
  service.toggleCompleted(2);

  const audit = service.buildAudit({
    programmeId: 1,
    majorId: 1,
    curriculumYear: '2025-26'
  });
  const foundation = audit.sections.find((section) => section.type === 'foundation');

  assert.deepEqual(service.getCompletedCourseIds(), [1, 2]);
  assert.equal(audit.completedCredits, 12);
  assert.equal(audit.totalCreditRequired, 240);
  assert.equal(audit.totalProgress, 5);
  assert.equal(foundation.completedCredits, 12);
  assert.equal(foundation.trackingScope, 'partial');
  assert.deepEqual(foundation.missingCourses, []);
  assert.equal(audit.curriculumStructure.reduce((sum, section) => sum + section.credits, 0), 240);
});

test('remote course lookup falls back to local data when the API is unavailable', async () => {
  const result = await service.listCoursesRemote({
    programmeId: 1,
    majorId: 1,
    courseType: 'capstone'
  });

  assert.equal(result.source, 'mock');
  assert.deepEqual(result.data.map((course) => course.courseCode), ['COMP4801']);
});

test('remote graduation audit falls back to the local rule engine', async () => {
  const result = await service.buildAuditRemote({
    programmeId: 1,
    majorId: 1,
    curriculumYear: '2025-26'
  }, [1]);

  assert.equal(result.source, 'mock');
  assert.equal(result.data.completedCredits, 6);
  assert.equal(result.data.totalProgress, 3);
  assert.equal(result.data.curriculumYear, '2025-26');
});

test('local graduation audit reports the resolved fallback curriculum year', () => {
  const audit = service.buildAudit({
    programmeId: 1,
    majorId: 1,
    curriculumYear: '2099-00'
  });

  assert.equal(audit.curriculumYear, '2025-26');
  assert(audit.sections.length > 0);
});

test('official HKU offerings can be filtered offline by term and keyword', async () => {
  const result = await service.listCourseOfferingsRemote({
    academicYear: '2025-26',
    term: '2',
    keyword: 'machine'
  });

  assert.equal(result.source, 'mock');
  assert(result.data.courses.length > 0);
  assert(result.data.courses.every((course) => course.terms.includes('2')));
  assert(result.data.courses.some((course) => course.courseCode === 'COMP3314'));
});

test('official HKU offerings combine category and year filters offline', () => {
  const core = service.listCourseOfferings({ category: 'core', year: '1' });
  const electives = service.listCourseOfferings({ category: 'elective', year: '4' });

  assert(core.length > 0);
  assert(core.every((course) => course.categories.includes('Year 1 - Core')));
  assert(electives.length > 0);
  assert(electives.every((course) => course.categories.includes('Year 2 to 4 - Elective')));
});

test('official offering detail falls back locally and enriches known courses', async () => {
  const known = await service.getCourseOfferingRemote('comp1117');
  const catalogueOnly = await service.getCourseOfferingRemote('FITE1010');

  assert.equal(known.source, 'mock');
  assert.equal(known.data.offering.courseCode, 'COMP1117');
  assert.equal(known.data.course.credits, 6);
  assert.equal(catalogueOnly.data.offering.courseCode, 'FITE1010');
  assert.equal(catalogueOnly.data.course.credits, 6);
  assert(catalogueOnly.data.course.description);
});

test('course share info contains only a public title and deep link', () => {
  assert.deepEqual(service.getCourseShareInfo('comp1117'), {
    title: 'COMP1117 · Computer Programming',
    path: '/pages/offering-detail/offering-detail?code=COMP1117'
  });
  assert.equal(service.getCourseShareInfo('UNKNOWN1000'), null);
  assert(!JSON.stringify(service.getCourseShareInfo('COMP1117')).includes('note'));
});

test('official offering favorites are stored by stable course code', () => {
  assert.deepEqual(service.toggleOfferingFavorite('comp1117'), ['COMP1117']);
  assert.equal(service.isOfferingFavorite('COMP1117'), true);
  assert.deepEqual(service.getFavoriteOfferings().map((course) => course.courseCode), ['COMP1117']);
  assert.deepEqual(service.toggleOfferingFavorite('COMP1117'), []);
});

test('official completion records include known and catalogue-only courses', () => {
  service.toggleOfferingCompleted('COMP1117');
  service.toggleOfferingCompleted('FITE1010');

  assert.equal(service.isOfferingCompleted('comp1117'), true);
  assert.equal(service.isOfferingCompleted('FITE1010'), true);
  assert.deepEqual(service.getCompletedOfferingCodes(), ['COMP1117', 'FITE1010']);
  assert.deepEqual(
    service.getCompletedOfferings().map((course) => course.courseCode),
    ['COMP1117', 'FITE1010']
  );
  assert.deepEqual(
    service.getPrerequisiteCourseStatus('COMP1117 or ENGG1330'),
    [
      { courseCode: 'COMP1117', completed: true },
      { courseCode: 'ENGG1330', completed: false }
    ]
  );
});

test('catalogue-only completed courses count toward recorded credits', () => {
  service.toggleOfferingCompleted('FITE1010');
  const audit = service.buildAudit({
    programmeId: 1,
    majorId: 1,
    curriculumYear: '2025-26'
  });

  assert.equal(audit.completedCredits, 6);
  assert.equal(audit.totalProgress, 3);
});

test('study plan items can be added, updated, joined and removed', () => {
  service.saveStudyPlanItem('COMP1117', 1, '1');
  service.saveStudyPlanItem('COMP2113', 2, '2');
  service.saveStudyPlanItem('COMP1117', 1, '2');

  assert.deepEqual(service.getStudyPlanItems(), [
    { courseCode: 'COMP1117', plannedYear: 1, plannedTerm: '2' },
    { courseCode: 'COMP2113', plannedYear: 2, plannedTerm: '2' }
  ]);
  assert.equal(service.getStudyPlanCourses()[0].offering.title, 'Computer Programming');
  assert.equal(service.isCoursePlanned('comp1117'), true);
  assert.deepEqual(service.getStudyPlanItem('COMP1117'), {
    courseCode: 'COMP1117',
    plannedYear: 1,
    plannedTerm: '2'
  });
  assert.deepEqual(service.removeStudyPlanItem('comp1117'), [
    { courseCode: 'COMP2113', plannedYear: 2, plannedTerm: '2' }
  ]);
  assert.equal(service.isCoursePlanned('COMP1117'), false);
});

test('TPG planned courses use Programme-scoped normalized keys and can be removed', () => {
  assert.deepEqual(service.toggleTpgPlannedCourse('HKU-TPG-024', ' dent7103 '), [
    'HKU-TPG-024:DENT7103'
  ]);
  assert.equal(service.isTpgCoursePlanned('HKU-TPG-024', 'DENT7103'), true);
  assert.equal(service.isTpgCoursePlanned('HKU-TPG-025', 'DENT7103'), false);

  service.toggleTpgPlannedCourse('HKU-TPG-025', 'dent7103');
  assert.deepEqual(service.getTpgPlannedCourseKeys(), [
    'HKU-TPG-024:DENT7103',
    'HKU-TPG-025:DENT7103'
  ]);

  assert.deepEqual(service.toggleTpgPlannedCourse('HKU-TPG-024', 'DENT7103'), [
    'HKU-TPG-025:DENT7103'
  ]);
  assert.equal(service.isTpgCoursePlanned('HKU-TPG-024', 'DENT7103'), false);

  storage.set('plannedTpgCourseKeys', [
    'HKU-TPG-025:DENT7103',
    'HKU-TPG-025:DENT7103'
  ]);
  assert.deepEqual(service.removeTpgPlannedCourse('HKU-TPG-025', 'dent7103'), []);
  assert.deepEqual(service.removeTpgPlannedCourse('HKU-TPG-025', 'dent7103'), []);
});

test('TPG planned courses are backed up, restored, summarized and cleared', () => {
  service.toggleTpgPlannedCourse('HKU-TPG-024', 'DENT7103');
  service.toggleTpgPlannedCourse('HKU-TPG-025', 'DENT7103');
  assert.equal(service.getUserDataSummary().studyPlanCount, 2);

  const backup = service.exportUserData();
  assert.deepEqual(backup.data.plannedTpgCourseKeys, [
    'HKU-TPG-024:DENT7103',
    'HKU-TPG-025:DENT7103'
  ]);

  storage.clear();
  assert.equal(service.importUserData(backup), true);
  assert.deepEqual(service.getTpgPlannedCourseKeys(), backup.data.plannedTpgCourseKeys);
  assert.equal(service.clearUserData().studyPlanCount, 0);
  assert.deepEqual(service.getTpgPlannedCourseKeys(), []);

  assert.throws(() => service.importUserData({
    app: 'lectures-app',
    version: 1,
    data: { plannedTpgCourseKeys: ['HKU-TPG-024: dent7103 '] }
  }), /Invalid plannedTpgCourseKeys/);
  assert.throws(() => service.importUserData({
    app: 'lectures-app',
    version: 1,
    data: { plannedTpgCourseKeys: [123] }
  }), /Invalid plannedTpgCourseKeys/);
});

test('study plan analysis totals credits and flags prerequisite sequencing evidence', () => {
  service.saveStudyPlanItem('COMP2113', 1, '1');
  service.saveStudyPlanItem('COMP1117', 2, '1');

  const review = service.analyzeStudyPlan();
  assert.equal(review.courseCount, 2);
  assert.equal(review.totalCredits, 12);
  assert.equal(review.noticeCount, 1);
  assert.equal(review.notices[0].type, 'prerequisite');
  assert.deepEqual(review.notices[0].missingCodes, ['COMP1117', 'ENGG1330']);

  service.toggleOfferingCompleted('COMP1117');
  assert.equal(service.analyzeStudyPlan().noticeCount, 0);
});

test('study plan courses expose local completed favorite and note state', () => {
  service.saveStudyPlanItem('COMP1117', 1, '1');
  service.toggleOfferingCompleted('COMP1117');
  service.toggleOfferingFavorite('COMP1117');
  service.saveCourseNote('COMP1117', 'Ask whether the tutorial time clashes.');

  const [course] = service.getStudyPlanCourses();

  assert.equal(course.courseCode, 'COMP1117');
  assert.equal(course.completed, true);
  assert.equal(course.favorite, true);
  assert.equal(course.hasNote, true);
  assert.equal(course.notePreview, 'Ask whether the tutorial time clashes.');
});

test('study plan suggestions surface unplanned unfinished core courses', () => {
  service.saveStudyPlanItem('COMP1117', 1, '1');
  service.toggleOfferingCompleted('COMP1110');

  const suggestions = service.getStudyPlanSuggestions(4);
  const summary = service.getStudyPlanCoreGapSummary();

  assert.equal(suggestions.length, 4);
  assert(summary.courseCount > suggestions.length);
  assert(summary.credits > 0);
  assert(summary.groups.some((group) => group.year === 2 && group.courseCount > 0));
  assert(!suggestions.some((item) => item.courseCode === 'COMP1117'));
  assert(!suggestions.some((item) => item.courseCode === 'COMP1110'));
  assert(suggestions[0].recommendedYear <= suggestions[1].recommendedYear);
  assert(suggestions.every((item) => item.categories.some((category) => category.includes('Core'))));
  assert(suggestions.every((item) => item.credits > 0));
});

test('study plan core gap summary groups remaining core courses by recommended year', () => {
  service.saveStudyPlanItem('COMP1117', 1, '1');
  service.saveStudyPlanItem('COMP2113', 2, '1');
  service.toggleOfferingCompleted('COMP1110');

  const gaps = service.getStudyPlanCoreGaps();
  const summary = service.getStudyPlanCoreGapSummary();

  assert(!gaps.some((course) => course.courseCode === 'COMP1117'));
  assert(!gaps.some((course) => course.courseCode === 'COMP2113'));
  assert(!gaps.some((course) => course.courseCode === 'COMP1110'));
  assert.equal(summary.courseCount, gaps.length);
  assert.equal(summary.credits, gaps.reduce((sum, course) => sum + course.credits, 0));
  assert(summary.groups.every((group) => group.courseCount === group.courses.length));
  assert(summary.groups.some((group) => group.yearLabel === 'Year 2'));
});

test('study plan analysis flags unavailable terms, missing corequisites and heavy semesters', () => {
  service.saveStudyPlanItem('COMP3230', 3, '2');
  service.saveStudyPlanItem('COMP2120', 2, '2');

  ['COMP2113', 'COMP2121', 'COMP2396', 'COMP2119', 'COMP3234', 'COMP3251', 'COMP3278']
    .forEach((code) => service.saveStudyPlanItem(code, 1, '1'));

  const review = service.analyzeStudyPlan();
  assert(review.notices.some((notice) => notice.type === 'offering' && notice.courseCode === 'COMP3230'));
  assert(review.notices.some((notice) => notice.type === 'corequisite' && notice.courseCode === 'COMP2120'));
  assert(review.notices.some((notice) => notice.type === 'load' && notice.message.includes('42 学分')));
  assert(review.issueCodes.includes('COMP3230'));
  assert(review.termLoads.some((load) => load.year === 1 && load.term === '1' && load.overloaded));
  assert(review.loadSuggestions.some((suggestion) => (
    suggestion.year === 1
    && suggestion.term === '1'
    && suggestion.candidates.some((candidate) => candidate.toTerm === '2')
  )));
});

test('study plan load suggestions prefer movable courses in the alternate semester', () => {
  ['COMP1117', 'COMP2113', 'COMP2119', 'COMP2121', 'COMP2501', 'COMP3234', 'COMP3278']
    .forEach((code) => service.saveStudyPlanItem(code, 1, '1'));

  const review = service.analyzeStudyPlan();
  const suggestion = review.loadSuggestions.find((item) => item.year === 1 && item.term === '1');

  assert(suggestion);
  assert.equal(suggestion.credits, 42);
  assert(suggestion.message.includes('Semester 2'));
  assert(suggestion.candidates.length > 0);
  assert(suggestion.candidates.length <= 3);
  assert(suggestion.candidates.every((candidate) => candidate.fromLabel === 'Year 1 Semester 1'));
  assert(suggestion.candidates.every((candidate) => candidate.toLabel === 'Year 1 Semester 2'));
  assert(suggestion.candidates.every((candidate) => candidate.credits > 0));
});

test('study plan analysis summarizes core elective and capstone mix', () => {
  service.saveStudyPlanItem('COMP1117', 1, '1');
  service.saveStudyPlanItem('COMP3258', 3, '1');
  service.saveStudyPlanItem('COMP4801', 4, '2');
  service.toggleOfferingCompleted('COMP1117');

  const review = service.analyzeStudyPlan();
  const byKey = Object.fromEntries(review.categoryStats.map((item) => [item.key, item]));
  const plannedCourses = service.getStudyPlanCourses();

  assert.equal(byKey.core.courseCount, 1);
  assert.equal(byKey.core.credits, 6);
  assert.equal(byKey.core.completedCount, 1);
  assert.equal(byKey.elective.courseCount, 1);
  assert.equal(byKey.capstone.courseCount, 1);
  assert.equal(plannedCourses.find((course) => course.courseCode === 'COMP1117').categoryLabel, 'Core');
  assert.equal(plannedCourses.find((course) => course.courseCode === 'COMP3258').categoryLabel, 'Elective');
  assert.equal(plannedCourses.find((course) => course.courseCode === 'COMP4801').categoryLabel, 'Capstone');
});

test('study plan can be formatted as grouped shareable text with checks', () => {
  service.saveProfile({
    profileType: 'undergraduate',
    universityCode: 'HKU',
    universityName: '香港大学',
    programmeId: 1,
    programmeName: 'BEng(CompSc)',
    majorName: 'Computer Science',
    curriculumYear: '2025-26',
    currentYear: 1
  });
  service.saveStudyPlanItem('COMP2113', 2, '2');
  service.saveStudyPlanItem('COMP1117', 1, '1');

  const text = service.formatStudyPlanText(new Date('2026-07-05T00:00:00Z'));
  assert(text.includes('香港大学 · BEng(CompSc) · Study Plan'));
  assert(text.includes('Type: UG'));
  assert(text.includes('University: 香港大学'));
  assert(text.includes('Programme: BEng(CompSc)'));
  assert(text.includes('Major: Computer Science'));
  assert(text.includes('Curriculum: 2025-26'));
  assert(text.includes('Current Year: Year 1'));
  assert(text.includes('Generated: 2026-07-05'));
  assert(text.indexOf('Year 1') < text.indexOf('Year 2'));
  assert(text.includes('- COMP1117 Computer Programming (6 credits · Core)'));
  assert(text.includes('Total: 2 courses · 12 credits'));
  assert(text.includes('Categories:'));
  assert(text.includes('- Core: 2 courses · 12 credits'));
  assert(text.includes('Remaining Core:'));
  assert(text.includes('- Year 2:'));
  assert(text.includes('Plan checks:'));
  assert(!text.includes('courseNotes'));
  assert(!text.includes('Confirm official timetable, prerequisites and degree requirements with HKU.'));
});

test('study plan remaining core checklist can be copied separately', () => {
  service.saveProfile({
    profileType: 'undergraduate',
    universityCode: 'HKU',
    universityName: '香港大学',
    programmeId: 1,
    programmeName: 'BEng(CompSc)',
    majorName: 'Computer Science',
    curriculumYear: '2025-26',
    currentYear: 1
  });
  service.saveStudyPlanItem('COMP1117', 1, '1');

  const text = service.formatStudyPlanCoreGapText(new Date('2026-07-05T00:00:00Z'));

  assert(text.startsWith('香港大学 · BEng(CompSc) · Study Plan · Remaining Core Checklist'));
  assert(text.includes('Generated: 2026-07-05'));
  assert(text.includes('Remaining Core:'));
  assert(text.includes('Year 2 ·'));
  assert(text.includes('- COMP2113 Programming Technologies'));
  assert(!text.includes('courseNotes'));
  assert(text.includes('For planning reference only.'));
});

test('study plan status summary can be copied without leaking notes', () => {
  service.saveProfile({
    profileType: 'undergraduate',
    universityCode: 'HKU',
    universityName: '香港大学',
    programmeId: 1,
    programmeName: 'BEng(CompSc)',
    majorName: 'Computer Science',
    curriculumYear: '2025-26',
    currentYear: 1
  });
  service.saveStudyPlanItem('COMP1117', 1, '1');
  service.saveStudyPlanItem('COMP2113', 2, '2');
  service.toggleOfferingCompleted('COMP1117');
  service.toggleOfferingFavorite('COMP2113');
  service.saveCourseNote('COMP2113', 'Private note should stay local.');

  const text = service.formatStudyPlanStatusText(new Date('2026-07-05T00:00:00Z'));

  assert(text.startsWith('香港大学 · BEng(CompSc) · Study Plan · Status Summary'));
  assert(text.includes('Generated: 2026-07-05'));
  assert(text.includes('Courses: 2'));
  assert(text.includes('Credits: 12'));
  assert(text.includes('Completed: 1'));
  assert(text.includes('Favorites: 1'));
  assert(text.includes('Courses with notes: 1'));
  assert(text.includes('Category mix:'));
  assert(text.includes('- Core: 2 courses · 12 credits · 1 completed'));
  assert(text.includes('Privacy: this summary only includes counts and categories, not your course notes.'));
  assert(!text.includes('Private note should stay local.'));
  assert(!text.includes('courseNotes'));
});

test('study plan check reminders can be copied separately', () => {
  service.saveProfile({
    profileType: 'undergraduate',
    universityCode: 'HKU',
    universityName: '香港大学',
    programmeId: 1,
    programmeName: 'BEng(CompSc)',
    majorName: 'Computer Science',
    curriculumYear: '2025-26',
    currentYear: 1
  });
  ['COMP1117', 'COMP2113', 'COMP2119', 'COMP2121', 'COMP2501', 'COMP3234', 'COMP3278']
    .forEach((code) => service.saveStudyPlanItem(code, 1, '1'));

  const text = service.formatStudyPlanCheckText(new Date('2026-07-05T00:00:00Z'));

  assert(text.startsWith('香港大学 · BEng(CompSc) · Study Plan · Plan Check'));
  assert(text.includes('Generated: 2026-07-05'));
  assert(text.includes('Checks:'));
  assert(text.includes('Reminders:'));
  assert(text.includes('[Workload] Year 1 Semester 1 已安排'));
  assert(text.includes('Possible load adjustments:'));
  assert(text.includes('COMP2113 Programming Technologies'));
  assert(!text.includes('courseNotes'));
  assert(text.includes('For planning reference only.'));
});

test('study plan share text includes overload move suggestions when available', () => {
  ['COMP1117', 'COMP2113', 'COMP2119', 'COMP2121', 'COMP2501', 'COMP3234', 'COMP3278']
    .forEach((code) => service.saveStudyPlanItem(code, 1, '1'));

  const text = service.formatStudyPlanText(new Date('2026-07-05T00:00:00Z'));

  assert(text.includes('Load suggestions:'));
  assert(text.includes('Year 1 Semester 1 可考虑移动'));
  assert(text.includes('Year 1 Semester 1 -> Year 1 Semester 2'));
});

test('study plan share text uses the saved school and programme context', () => {
  service.saveProfile({
    profileType: 'undergraduate',
    universityCode: 'POLYU',
    universityName: '香港理工大学',
    programmeName: 'Applied Mathematics',
    majorName: 'Investment Science and Finance Analytics',
    curriculumYear: '2026',
    currentYear: 2
  });
  service.saveStudyPlanItem('COMP1117', 2, '1');

  const text = service.formatStudyPlanText(new Date('2026-07-05T00:00:00Z'));

  assert(text.startsWith('香港理工大学 · Applied Mathematics · Study Plan'));
  assert(text.includes('University: 香港理工大学'));
  assert(text.includes('Programme: Applied Mathematics'));
  assert(text.includes('Major: Investment Science and Finance Analytics'));
  assert(text.includes('Current Year: Year 2'));
  assert(!text.includes('HKU BEng(CompSc) Study Plan'));
  assert(text.includes('Confirm official timetable, prerequisites and degree requirements with your university.'));
});

test('user data can be exported and restored from a validated backup', () => {
  service.saveProfile({ universityCode: 'HKU', currentYear: 2 });
  service.toggleOfferingFavorite('COMP1117');
  service.saveStudyPlanItem('COMP1117', 2, '1');
  service.saveCourseNote('COMP1117', 'Check the assessment details.');

  const backup = service.exportUserData();
  const backupText = service.formatUserDataBackup(backup);
  storage.clear();
  assert(backupText.includes('\n  "app": "lectures-app"'));
  assert.equal(service.importUserData(backupText), true);
  assert.deepEqual(service.getProfile(), { universityCode: 'HKU', currentYear: 2 });
  assert.deepEqual(service.getFavoriteOfferingCodes(), ['COMP1117']);
  assert.equal(service.isCoursePlanned('COMP1117'), true);
  assert.equal(service.getCourseNote('COMP1117'), 'Check the assessment details.');
  assert.throws(() => service.importUserData('{"version":1}'), /Invalid backup format/);
});

test('recently viewed courses are deduplicated, ordered and capped', () => {
  ['COMP1117', 'COMP2113', 'COMP2121', 'COMP2396', 'COMP3278', 'COMP4801', 'COMP1117']
    .forEach((code) => service.recordRecentlyViewed(code));

  assert.deepEqual(
    service.getRecentlyViewedOfferings().map((course) => course.courseCode),
    ['COMP1117', 'COMP4801', 'COMP3278', 'COMP2396', 'COMP2121']
  );
  assert.deepEqual(service.exportUserData().data.recentlyViewedCourseCodes, [
    'COMP1117', 'COMP4801', 'COMP3278', 'COMP2396', 'COMP2121'
  ]);

  service.recordRecentlyViewed('UNKNOWN1000');
  assert.deepEqual(
    service.getRecentlyViewedOfferings().map((course) => course.courseCode),
    ['COMP1117', 'COMP4801', 'COMP3278', 'COMP2396', 'COMP2121']
  );
});

test('course notes can be saved, cleared and included in backups', () => {
  assert.equal(service.getCourseNote('COMP1117'), '');
  assert.equal(service.saveCourseNote('comp1117', '  Ask about tutorial times.  '), 'Ask about tutorial times.');
  service.saveCourseNote('COMP2113', 'Review prerequisites.');
  assert.equal(service.getCourseNote('COMP1117'), 'Ask about tutorial times.');
  assert.deepEqual(service.getCourseNotes().map((item) => item.courseCode), ['COMP1117', 'COMP2113']);
  assert.deepEqual(service.exportUserData().data.courseNotes, {
    COMP1117: 'Ask about tutorial times.',
    COMP2113: 'Review prerequisites.'
  });

  assert.equal(service.saveCourseNote('COMP1117', '   '), '');
  assert.equal(service.getCourseNote('COMP1117'), '');
  assert.deepEqual(service.getCourseNotes().map((item) => item.courseCode), ['COMP2113']);
});

test('course search history is deduplicated, capped, backed up and clearable', () => {
  ['machine', 'COMP1117', 'database', 'security', 'graphics', 'algorithm', 'MACHINE']
    .forEach((keyword) => service.recordCourseSearch(keyword));

  assert.deepEqual(service.getCourseSearchHistory(), [
    'MACHINE', 'algorithm', 'graphics', 'security', 'database', 'COMP1117'
  ]);
  assert.deepEqual(
    service.exportUserData().data.courseSearchHistory,
    service.getCourseSearchHistory()
  );
  assert.deepEqual(service.clearCourseSearchHistory(), []);
  assert.deepEqual(service.getCourseSearchHistory(), []);
});

test('TPG programme search history is local, deduplicated, backed up and clearable', () => {
  service.recordTpgProgrammeSearch('data science');
  service.recordTpgProgrammeSearch('finance');
  service.recordTpgProgrammeSearch('DATA SCIENCE');

  assert.deepEqual(service.getTpgProgrammeSearchHistory(), ['DATA SCIENCE', 'finance']);
  assert.equal(service.getUserDataSummary().searchCount, 2);

  const backup = service.exportUserData();
  assert.deepEqual(backup.data.tpgProgrammeSearchHistory, ['DATA SCIENCE', 'finance']);

  service.clearTpgProgrammeSearchHistory();
  assert.deepEqual(service.getTpgProgrammeSearchHistory(), []);

  service.importUserData(backup);
  assert.deepEqual(service.getTpgProgrammeSearchHistory(), ['DATA SCIENCE', 'finance']);
  assert.deepEqual(service.clearUserData().searchCount, 0);
});

test('data status reports source coverage and freshness', () => {
  const status = service.getDataStatus(new Date('2026-07-05T12:00:00+08:00'));
  assert.equal(status.status, 'current');
  assert.equal(status.offering.academicYear, '2025-26');
  assert.equal(status.offering.courseCount, 56);
  assert.equal(status.offering.detailCount, 56);
  assert.equal(status.curriculum.totalCredits, 240);
  assert.equal(status.curriculum.categoryCount, 7);

  assert.equal(
    service.getDataStatus(new Date('2026-11-01T12:00:00+08:00')).status,
    'review'
  );
});

test('user data summary counts local records and clear removes every user key', () => {
  service.saveProfile({ programmeId: 1, curriculumYear: '2025-26' });
  service.toggleOfferingFavorite('COMP1117');
  service.toggleTpgCourseFavorite('POLYU-TPG-090', 'COMP5521');
  service.toggleOfferingCompleted('COMP1117');
  service.toggleTpgCourseCompleted('POLYU-TPG-090', 'COMP5521');
  service.toggleUgPlannedCourse('HKU-UG-6004-1', 'HKU-UG-6004-1-M1', 'HKU-UG-6004-1-M1-SUP-ARCH1079-3');
  service.saveUgCoursePlanAssignment('HKU-UG-6004-1', 'HKU-UG-6004-1-M1', 'HKU-UG-6004-1-M1-SUP-ARCH1079-3', 2, 'summer');
  service.saveStudyPlanItem('COMP1117', 1, '1');
  service.saveCourseNote('COMP1117', 'Remember this.');
  service.recordRecentlyViewed('COMP1117');
  service.recordCourseSearch('COMP');
  service.recordTpgProgrammeSearch('finance');

  assert.deepEqual(service.getUserDataSummary(), {
    hasProfile: true,
    favoriteCount: 2,
    completedCount: 2,
    studyPlanCount: 2,
    noteCount: 1,
    recentCount: 1,
    searchCount: 2
  });
  assert.deepEqual(service.clearUserData(), {
    hasProfile: false,
    favoriteCount: 0,
    completedCount: 0,
    studyPlanCount: 0,
    noteCount: 0,
    recentCount: 0,
    searchCount: 0
  });
  assert.deepEqual(service.exportUserData().data, {});
});

test('all declared local user keys are backup and restore aware', () => {
  assert.deepEqual(service.USER_DATA_KEYS, [
    'userProfile',
    'favoriteCourseIds',
    'favoriteOfferingCodes',
    'favoriteTpgCourseKeys',
    'completedCourseIds',
    'completedOfferingCodes',
    'completedTpgCourseKeys',
    'plannedUgCourseKeys',
    'ugCoursePlanAssignments',
    'plannedTpgCourseKeys',
    'studyPlanItems',
    'recentlyViewedCourseCodes',
    'courseSearchHistory',
    'tpgProgrammeSearchHistory',
    'courseNotes'
  ]);

  const backup = {
    app: 'lectures-app',
    version: 1,
    data: {
      userProfile: { universityCode: 'HKU', programmeId: 'hku-msc-cs' },
      favoriteCourseIds: [1],
      favoriteOfferingCodes: ['COMP1117'],
      favoriteTpgCourseKeys: ['POLYU-TPG-090:COMP5521'],
      completedCourseIds: [2],
      completedOfferingCodes: ['COMP2113'],
      completedTpgCourseKeys: ['POLYU-TPG-090:COMP5521'],
      plannedUgCourseKeys: ['HKU-UG-6004-1:HKU-UG-6004-1-M1:HKU-UG-6004-1-M1-SUP-ARCH1079-3'],
      ugCoursePlanAssignments: [{
        courseKey: 'HKU-UG-6004-1:HKU-UG-6004-1-M1:HKU-UG-6004-1-M1-SUP-ARCH1079-3',
        plannedYear: 2,
        plannedTerm: 'summer'
      }],
      plannedTpgCourseKeys: ['POLYU-TPG-090:COMP5521'],
      studyPlanItems: [{ courseCode: 'COMP3278', year: 2, term: '1' }],
      recentlyViewedCourseCodes: ['COMP4801'],
      courseSearchHistory: ['security'],
      tpgProgrammeSearchHistory: ['data science'],
      courseNotes: { COMP1117: 'Check project deadline.' }
    }
  };

  assert.equal(service.importUserData(backup), true);
  assert.deepEqual(service.exportUserData().data, backup.data);
  assert.throws(
    () => service.importUserData({ app: 'lectures-app', version: 1, data: { favoriteOfferingCodes: 'COMP1117' } }),
    /Invalid favoriteOfferingCodes/
  );
  assert.throws(
    () => service.importUserData({ app: 'lectures-app', version: 1, data: { plannedUgCourseKeys: ['HKU-UG-6004-1::COURSE'] } }),
    /Invalid plannedUgCourseKeys/
  );
  assert.throws(
    () => service.importUserData({ app: 'lectures-app', version: 1, data: { ugCoursePlanAssignments: [{ courseKey: 'A:B:C', plannedYear: 7, plannedTerm: '1' }] } }),
    /Invalid ugCoursePlanAssignments/
  );
  assert.throws(
    () => service.importUserData({ app: 'lectures-app', version: 1, data: { ugCoursePlanAssignments: [{ courseKey: 'A:B:C', plannedYear: 2, plannedTerm: 'winter' }] } }),
    /Invalid ugCoursePlanAssignments/
  );
  assert.throws(
    () => service.importUserData({ app: 'lectures-app', version: 1, data: { ugCoursePlanAssignments: [{ courseKey: 'A:B:C', plannedYear: 2, plannedTerm: '1' }] } }),
    /Invalid ugCoursePlanAssignments/
  );
  assert.throws(
    () => service.importUserData({
      app: 'lectures-app',
      version: 1,
      data: {
        plannedUgCourseKeys: ['A:B:C'],
        ugCoursePlanAssignments: [
          { courseKey: 'A:B:C', plannedYear: 2, plannedTerm: '1' },
          { courseKey: 'A:B:C', plannedYear: 3, plannedTerm: '2' }
        ]
      }
    }),
    /Invalid ugCoursePlanAssignments/
  );
  assert.throws(
    () => service.importUserData({
      app: 'lectures-app',
      version: 1,
      data: {
        plannedUgCourseKeys: ['A:B:C'],
        ugCoursePlanAssignments: [{ courseKey: 'A:B:C', plannedYear: null, plannedTerm: '' }]
      }
    }),
    /Invalid ugCoursePlanAssignments/
  );
});

test('UG planned courses use Programme, Major and course identity and keep other Majors isolated', () => {
  const programmeId = 'POLYU-UG-JS3868-14';
  const otherProgrammeId = 'POLYU-UG-OTHER';
  const majorId = 'POLYU-UG-JS3868-14-M1';
  const otherMajorId = 'POLYU-UG-JS3868-14-M2';
  const courseId = 'POLYU-UG-JS3868-14-M1-C1';

  service.toggleUgPlannedCourse(programmeId, majorId, courseId);
  service.toggleUgPlannedCourse(programmeId, majorId, courseId);
  assert.deepEqual(service.getUgPlannedCourseKeys(), []);

  service.toggleUgPlannedCourse(programmeId, majorId, courseId);
  service.toggleUgPlannedCourse(programmeId, otherMajorId, courseId);
  service.toggleUgPlannedCourse(otherProgrammeId, majorId, courseId);
  assert.equal(service.isUgCoursePlanned(programmeId, majorId, courseId), true);
  assert.equal(service.isUgCoursePlanned(programmeId, otherMajorId, courseId), true);
  assert.equal(service.isUgCoursePlanned(otherProgrammeId, majorId, courseId), true);
  service.removeUgPlannedCourse(programmeId, majorId, courseId);
  assert.deepEqual(service.getUgPlannedCourseKeys(), [
    `${programmeId}:${otherMajorId}:${courseId}`,
    `${otherProgrammeId}:${majorId}:${courseId}`
  ]);
});

test('UG course assignments persist Year and Term per Programme and Major and clear with plan removal', () => {
  const programmeId = 'POLYU-UG-JS3868-14';
  const majorId = 'POLYU-UG-JS3868-14-M1';
  const otherMajorId = 'POLYU-UG-JS3868-14-M2';
  const courseId = 'POLYU-UG-JS3868-14-M1-C1';

  service.toggleUgPlannedCourse(programmeId, majorId, courseId);
  service.toggleUgPlannedCourse(programmeId, otherMajorId, courseId);
  assert.equal(service.getUgCoursePlanAssignment(programmeId, majorId, courseId), null);

  assert.deepEqual(service.saveUgCoursePlanAssignment(programmeId, majorId, courseId, 2, '3'), {
    courseKey: `${programmeId}:${majorId}:${courseId}`,
    plannedYear: 2,
    plannedTerm: '3'
  });
  service.saveUgCoursePlanAssignment(programmeId, otherMajorId, courseId, 5, 'full year');
  assert.equal(service.getUgCoursePlanAssignment(programmeId, majorId, courseId).plannedYear, 2);
  assert.equal(service.getUgCoursePlanAssignment(programmeId, otherMajorId, courseId).plannedYear, 5);

  service.saveUgCoursePlanAssignment(programmeId, majorId, courseId, 4, 'summer');
  assert.equal(service.getUgCoursePlanAssignment(programmeId, majorId, courseId).plannedTerm, 'summer');
  service.removeUgPlannedCourse(programmeId, majorId, courseId);
  assert.equal(service.getUgCoursePlanAssignment(programmeId, majorId, courseId), null);
  assert.equal(service.getUgCoursePlanAssignment(programmeId, otherMajorId, courseId).plannedTerm, 'full year');
});

test('UG course assignments support partial pending values and explicit clearing', () => {
  const ids = ['HKU-UG-6004-1', 'HKU-UG-6004-1-M1', 'HKU-UG-6004-1-M1-SUP-ARCH1079-3'];
  service.toggleUgPlannedCourse(...ids);
  service.saveUgCoursePlanAssignment(...ids, 3, '');
  assert.deepEqual(service.getUgCoursePlanAssignment(...ids), {
    courseKey: ids.join(':'),
    plannedYear: 3,
    plannedTerm: ''
  });
  assert.deepEqual(service.saveUgCoursePlanAssignment(...ids, '', ''), []);
  assert.equal(service.getUgCoursePlanAssignment(...ids), null);
  assert.throws(() => service.saveUgCoursePlanAssignment(...ids, 0, '1'), /Invalid UG planned year/);
  assert.throws(() => service.saveUgCoursePlanAssignment(...ids, 2, 'winter'), /Invalid UG planned term/);
});

test('backup import accepts legacy TPG profiles and validates optional Track ownership', () => {
  const programmeId = 'EDUHK-TPG-DIR-MED';
  assert.equal(service.importUserData({
    app: 'lectures-app', version: 1, data: { userProfile: { profileType: 'tpg', programmeId } }
  }), true);
  assert.equal(service.importUserData({
    app: 'lectures-app', version: 1, data: {
      userProfile: { profileType: 'tpg', programmeId, trackId: `${programmeId}-CTA` }
    }
  }), true);
  assert.throws(() => service.importUserData({
    app: 'lectures-app', version: 1, data: {
      userProfile: { profileType: 'tpg', programmeId, trackId: 'POLYU-TRACK' }
    }
  }), /Invalid TPG track/);
  assert.throws(() => service.importUserData({
    app: 'lectures-app', version: 1, data: {
      userProfile: { profileType: 'tpg', programmeId: 'MISSING' }
    }
  }), /Invalid TPG programme/);
});
