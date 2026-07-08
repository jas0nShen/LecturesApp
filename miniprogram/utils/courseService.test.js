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

beforeEach(() => {
  storage.clear();
});

test('legacy curriculum profiles migrate to the verified intake label', () => {
  storage.set('userProfile', { programmeId: 1, curriculumYear: '2026' });
  assert.deepEqual(service.getProfile(), { programmeId: 1, curriculumYear: '2025-26' });
  assert.equal(storage.get('userProfile').curriculumYear, '2025-26');
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
  service.toggleOfferingCompleted('COMP1117');
  service.saveStudyPlanItem('COMP1117', 1, '1');
  service.saveCourseNote('COMP1117', 'Remember this.');
  service.recordRecentlyViewed('COMP1117');
  service.recordCourseSearch('COMP');
  service.recordTpgProgrammeSearch('finance');

  assert.deepEqual(service.getUserDataSummary(), {
    hasProfile: true,
    favoriteCount: 1,
    completedCount: 1,
    studyPlanCount: 1,
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
    'completedCourseIds',
    'completedOfferingCodes',
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
      completedCourseIds: [2],
      completedOfferingCodes: ['COMP2113'],
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
});
