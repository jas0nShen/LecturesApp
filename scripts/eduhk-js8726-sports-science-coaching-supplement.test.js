const assert = require('node:assert/strict');
const test = require('node:test');
const supplementFile = require('../data/ug-course-supplements/eduhk-js8726-sports-science-coaching-2026.json');
const { addGenericCourseSupplements } = require('./generate-ug-catalog');
const { validateSupplement } = require('./validate-ug-supplements');

test('EdUHK JS8726 preserves both admission structures and Year 1 Strands without inventing codes or credits', () => {
  const [rawSupplement] = supplementFile.supplements;
  const supplement = {
    provider: supplementFile.provider,
    academicYear: supplementFile.academicYear,
    sourceUrl: supplementFile.sourceUrl,
    officialUrl: supplementFile.officialUrl,
    ...rawSupplement
  };
  validateSupplement(supplement, 0);

  const catalogue = {
    programmes: [{
      id: 'EDUHK-UG-JS8726-24',
      universityCode: 'EDUHK',
      code: 'JS8726',
      jupasCode: 'JS8726',
      nameEn: 'Bachelor of Science (Honours) in Sports Science and Coaching',
      sourceStatus: 'programme_summary_only',
      courseCount: 0,
      codedCourseCount: 0
    }],
    majors: [{
      id: 'EDUHK-UG-JS8726-24-M1',
      programmeId: 'EDUHK-UG-JS8726-24',
      nameEn: 'Bachelor of Science (Honours) in Sports Science and Coaching',
      courseCount: 0,
      codedCourseCount: 0
    }],
    courses: []
  };

  addGenericCourseSupplements(catalogue, [supplement]);

  const courses = catalogue.courses;
  const byCode = Object.fromEntries(courses.map((course) => [course.courseCode, course]));
  assert.equal(catalogue.programmes[0].sourceStatus, 'course_codes_available');
  assert.equal(catalogue.programmes[0].codedCourseCount, 38);
  assert.equal(catalogue.majors[0].codedCourseCount, 38);
  assert.equal(courses.length, 38);
  assert.equal(new Set(courses.map((course) => course.courseCode)).size, 38);
  assert.equal(courses.filter((course) => course.requirementGroups[0].includes('Sports Coaching Strand')).length, 6);
  assert.equal(courses.filter((course) => course.requirementGroups[0].includes('Digital Technology and Sports Strand')).length, 6);
  assert.equal(courses.filter((course) => course.courseType === 'capstone').length, 4);
  assert.equal(courses.filter((course) => course.courseType === 'major_elective').length, 5);
  assert.equal(byCode.PES4292.credits, 3);
  assert.equal(byCode.PFS3066.credits, 3);
  assert.equal(byCode.PES1272.credits, 0);
  assert.equal(byCode.PES4293.credits, 0);
  assert(courses.every((course) => course.recommendedYear === 0 && course.semester === ''));
  assert(!courses.some((course) => /CFA|CFB|CFC|TBC/i.test(course.courseCode)));
  assert.match(supplement.evidenceNote, /38 unique confirmed course codes/);
  assert.match(supplement.evidenceNote, /does not assert one fixed graduation path/);
});
