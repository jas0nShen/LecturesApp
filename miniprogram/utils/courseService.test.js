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
    service.getPrerequisiteCourseStatus('COMP1117 or ENGG1330'),
    [
      { courseCode: 'COMP1117', completed: true },
      { courseCode: 'ENGG1330', completed: false }
    ]
  );
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
  assert.deepEqual(review.notices[0].missingCodes, ['COMP1117', 'ENGG1330']);

  service.toggleOfferingCompleted('COMP1117');
  assert.equal(service.analyzeStudyPlan().noticeCount, 0);
});

test('user data can be exported and restored from a validated backup', () => {
  service.saveProfile({ universityCode: 'HKU', currentYear: 2 });
  service.toggleOfferingFavorite('COMP1117');
  service.saveStudyPlanItem('COMP1117', 2, '1');
  service.saveCourseNote('COMP1117', 'Check the assessment details.');

  const backup = service.exportUserData();
  storage.clear();
  assert.equal(service.importUserData(JSON.stringify(backup)), true);
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
