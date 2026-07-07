const assert = require('node:assert/strict');
const { test } = require('node:test');

const tpgService = require('./tpgService');

test('TPG catalogue coverage summarizes eight-school MVP data', () => {
  const coverage = tpgService.getSchoolCoverage();

  assert.equal(coverage.schoolCount, 8);
  assert.equal(coverage.programmeCount, 348);
  assert.equal(coverage.programmeWithCoursesCount, 6);
  assert.equal(coverage.courseCount, 257);
  assert.deepEqual(
    coverage.schools.map((school) => [school.code, school.programmeCount]),
    [
      ['HKU', 62],
      ['CUHK', 18],
      ['HKUST', 53],
      ['POLYU', 105],
      ['CITYU', 62],
      ['HKBU', 48],
      ['EDUHK', 0],
      ['LINGNAN', 0]
    ]
  );
});

test('TPG programme helpers expose course status and searchable courses', () => {
  const programme = tpgService.getProgramme('HKU-TPG-048');
  const university = tpgService.getProgrammeUniversity(programme);
  const status = tpgService.getStatus(programme);
  const courses = tpgService.flattenCourses(programme, 'ARIN7600');

  assert.equal(programme.name, 'Master of Science in Artificial Intelligence (MSc(AI))');
  assert.equal(university.code, 'HKU');
  assert.equal(status.hasCourseGroups, true);
  assert.equal(status.courseCount, 22);
  assert.equal(courses.length, 1);
  assert.equal(courses[0].name, 'Artificial intelligence project');
});

test('TPG programme search matches names, codes, faculties and course text', () => {
  const hkuProgrammes = tpgService.listProgrammes('HKU');

  assert(tpgService.searchProgrammes(hkuProgrammes, 'data science').some(
    (programme) => programme.name.includes('Master of Data Science')
  ));
  assert(tpgService.searchProgrammes(hkuProgrammes, 'COMP7404').some(
    (programme) => programme.name.includes('Computer Science')
  ));
});

test('TPG programmes can be filtered by course availability', () => {
  const hkuProgrammes = tpgService.listProgrammes('HKU');
  const withCourses = tpgService.filterProgrammesByAvailability(hkuProgrammes, 'courses');
  const pending = tpgService.filterProgrammesByAvailability(hkuProgrammes, 'pending');

  assert.equal(withCourses.length, 6);
  assert.equal(withCourses.every(tpgService.hasCourseGroups), true);
  assert.equal(pending.length, hkuProgrammes.length - withCourses.length);
  assert.equal(pending.some(tpgService.hasCourseGroups), false);
  assert.equal(tpgService.filterProgrammesByAvailability(hkuProgrammes, 'all').length, hkuProgrammes.length);
});

test('TPG programme source text is copyable even without a direct URL', () => {
  const programme = tpgService.getProgramme('HKU-TPG-001');
  const sourceText = tpgService.buildProgrammeSourceText(programme);

  assert(sourceText.includes('HKU · Master of Architecture'));
  assert(sourceText.includes('Source file: HKU_Master_Course_Guide.pdf'));
  assert(sourceText.includes('Academic year: 2025-26'));
  assert(sourceText.includes('For planning reference only'));
});
