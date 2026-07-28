const assert = require('node:assert/strict');
const test = require('node:test');
const supplementFile = require('../data/ug-course-supplements/cuhk-chedn-early-childhood-education-courses.json');
const { addGenericCourseSupplements } = require('./generate-ug-catalog');
const { validateSupplement } = require('./validate-ug-supplements');

test('CUHK Early Childhood Education preserves the complete 55-unit Major structure', () => {
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
      id: 'CUHK-UG-CHEDN-30',
      universityCode: 'CUHK',
      code: 'CHEDN',
      nameEn: 'Early Childhood Education',
      sourceStatus: 'programme_summary_only',
      courseCount: 1,
      codedCourseCount: 0
    }],
    majors: [{
      id: 'CUHK-UG-CHEDN-30-M1',
      programmeId: 'CUHK-UG-CHEDN-30',
      nameEn: 'Early Childhood Education',
      courseCount: 1,
      codedCourseCount: 0
    }],
    courses: []
  };

  addGenericCourseSupplements(catalogue, [supplement]);

  const courses = catalogue.courses;
  const byCode = Object.fromEntries(courses.map((course) => [course.courseCode, course]));
  assert.equal(catalogue.programmes[0].sourceStatus, 'course_codes_available');
  assert.equal(catalogue.programmes[0].codedCourseCount, 31);
  assert.equal(catalogue.majors[0].codedCourseCount, 31);
  assert.equal(courses.length, 31);
  assert.equal(new Set(courses.map((course) => course.courseCode)).size, 31);

  const required = courses.filter((course) => course.courseType !== 'major_elective');
  const electives = courses.filter((course) => course.courseType === 'major_elective');
  assert.equal(required.length, 16);
  assert.equal(required.reduce((sum, course) => sum + course.credits, 0), 47);
  assert.equal(electives.length, 15);
  assert.equal(byCode.CHED4540.courseType, 'capstone');
  assert.equal(byCode.CHED4540.credits, 4);
  assert.equal(byCode.CHED4550.courseType, 'internship');
  assert.equal(byCode.CHED4550.credits, 3);
  assert.match(byCode.BECE3130.requirementGroups[0], /official # Major GPA marker/);
  assert.equal(byCode.MUSC2545.credits, 2);
  assert.equal(byCode.SPED3920.titleEn, 'Human Growth and Health Education');

  assert.match(supplementFile.note, /55 Major units/i);
  assert.match(supplementFile.note, /47 Required units and 8 Elective units/i);
  assert.match(supplementFile.note, /all 31 codes, English titles and per-course units/i);
});
