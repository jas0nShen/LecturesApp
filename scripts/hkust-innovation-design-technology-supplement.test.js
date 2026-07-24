const assert = require('node:assert/strict');
const test = require('node:test');
const supplementFile = require('../data/ug-course-supplements/hkust-innovation-design-technology-curriculum-2026.json');
const { addGenericCourseSupplements } = require('./generate-ug-catalog');
const { validateSupplement } = require('./validate-ug-supplements');

const PROGRAMME_ID = 'HKUST-UG-JS5711-30';
const MAJOR_ID = `${PROGRAMME_ID}-M1`;

function applySupplement() {
  const supplement = {
    provider: supplementFile.provider,
    academicYear: supplementFile.academicYear,
    sourceUrl: supplementFile.sourceUrl,
    officialUrl: supplementFile.officialUrl,
    ...supplementFile.supplements[0]
  };
  validateSupplement(supplement, 0);

  const catalogue = {
    programmes: [{
      id: PROGRAMME_ID,
      universityCode: 'HKUST',
      nameEn: 'BSc in Innovation, Design and Technology',
      sourceStatus: 'programme_summary_only',
      courseCount: 1,
      codedCourseCount: 0
    }],
    majors: [{
      id: MAJOR_ID,
      programmeId: PROGRAMME_ID,
      nameEn: 'BSc in Innovation, Design and Technology',
      courseCount: 1,
      codedCourseCount: 0
    }],
    courses: []
  };

  addGenericCourseSupplements(catalogue, [supplement]);
  return { catalogue, supplement };
}

test('HKUST IDT binds all 98 explicit 2026-27 codes to the exact Programme and Major', () => {
  const { catalogue, supplement } = applySupplement();
  const courses = catalogue.courses.filter((course) => course.majorId === MAJOR_ID);

  assert.equal(supplementFile.academicYear, '2026/27');
  assert.equal(supplement.programmeId, PROGRAMME_ID);
  assert.equal(supplement.majorId, MAJOR_ID);
  assert.equal(catalogue.programmes[0].sourceStatus, 'course_codes_available');
  assert.equal(catalogue.programmes[0].codedCourseCount, 98);
  assert.equal(catalogue.majors[0].codedCourseCount, 98);
  assert.equal(courses.length, 98);
  assert.equal(new Set(courses.map((course) => course.courseCode)).size, 98);
});

test('HKUST IDT preserves all fixed Required Courses and Engineering Fundamental alternatives', () => {
  const { catalogue } = applySupplement();
  const courses = catalogue.courses;
  const byCode = Object.fromEntries(courses.map((course) => [course.courseCode, course]));
  const majorRequired = courses.filter((course) => course.requirementGroups[0] === 'Major Required');
  const fundamentals = courses.filter((course) => course.requirementGroups[0].startsWith('Engineering Fundamental'));

  assert.equal(majorRequired.length, 21);
  assert.equal(fundamentals.length, 14);
  assert.deepEqual([byCode.ISDN1004.credits, byCode.ISDN2001.credits, byCode.ISDN3200.credits], [1, 1, 2]);
  assert.match(byCode.MATH1014.requirementGroups[0], /program-office approval/);
  assert.match(byCode.COMP2011.requirementGroups[0], /store once and do not double count/);
  assert.equal(byCode.ISDN4001.courseType, 'capstone');
});

test('HKUST IDT preserves both official elective lists and all variable-credit boundaries', () => {
  const { catalogue } = applySupplement();
  const courses = catalogue.courses;
  const byCode = Object.fromEntries(courses.map((course) => [course.courseCode, course]));
  const product = courses.filter((course) => course.requirementGroups[0].startsWith('Product Management and Entrepreneurship'));
  const project = courses.filter((course) => course.requirementGroups[0].startsWith('Project-related Electives'));

  assert.equal(product.length, 13);
  assert.equal(project.length, 50);
  assert.deepEqual(
    [byCode.TEMG4940.credits, byCode.TEMG4950.credits, byCode.TEMG4970.credits, byCode.COMP4901.credits],
    [0, 0, 0, 0]
  );
  assert.match(byCode.TEMG4940.requirementGroups[0], /variable credit range 3-5/);
  assert.match(byCode.COMP4901.requirementGroups[0], /variable credit range 0-4/);
  assert.match(byCode.ELEC2100.requirementGroups[0], /open ranges.*not expanded/);
  assert.match(supplementFile.note, /not expanded into a permanent closed pool/);
});

test('HKUST IDT does not infer pathway placements from the unavailable official PDF', () => {
  const { catalogue, supplement } = applySupplement();

  assert.equal(supplement.unavailablePathwayUrl, 'https://ugadmin.hkust.edu.hk/prog_crs/ug/202627/pdf/26-27pw_idt.pdf');
  assert(catalogue.courses.every((course) => course.recommendedYear === 0));
  assert(catalogue.courses.every((course) => course.semester === ''));
});
