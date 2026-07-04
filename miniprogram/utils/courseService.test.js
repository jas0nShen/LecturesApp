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
    curriculumYear: '2026'
  });
  const core = audit.sections.find((section) => section.type === 'core');

  assert.deepEqual(service.getCompletedCourseIds(), [1, 2]);
  assert.equal(audit.completedCredits, 12);
  assert.equal(audit.totalCreditRequired, 240);
  assert.equal(audit.totalProgress, 5);
  assert.equal(core.completedCredits, 12);
  assert.deepEqual(core.missingCourses.map((course) => course.id), [3, 4]);
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
    curriculumYear: '2026'
  }, [1]);

  assert.equal(result.source, 'mock');
  assert.equal(result.data.completedCredits, 6);
  assert.equal(result.data.totalProgress, 3);
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
