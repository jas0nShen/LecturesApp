const assert = require('node:assert/strict');
const test = require('node:test');
const supplementFile = require('../data/ug-course-supplements/cuhk-jaspn-japanese-studies-courses-2025.json');
const { addGenericCourseSupplements } = require('./generate-ug-catalog');
const { validateSupplement } = require('./validate-ug-supplements');

test('CUHK Japanese Studies exposes only the 58 current Major-assigned JASP courses', () => {
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
      id: 'CUHK-UG-JASPN-8',
      universityCode: 'CUHK',
      code: 'JASPN',
      jupasCode: 'JS4068',
      nameEn: 'Japanese Studies',
      sourceStatus: 'programme_summary_only',
      courseCount: 1,
      codedCourseCount: 0
    }],
    majors: [{
      id: 'CUHK-UG-JASPN-8-M1',
      programmeId: 'CUHK-UG-JASPN-8',
      nameEn: 'Japanese Studies',
      courseCount: 1,
      codedCourseCount: 0
    }],
    courses: []
  };

  addGenericCourseSupplements(catalogue, [supplement]);

  const courses = catalogue.courses;
  const byCode = Object.fromEntries(courses.map((course) => [course.courseCode, course]));
  assert.equal(catalogue.programmes[0].sourceStatus, 'course_codes_available');
  assert.equal(catalogue.programmes[0].codedCourseCount, 58);
  assert.equal(catalogue.majors[0].codedCourseCount, 58);
  assert.equal(courses.length, 58);
  assert.equal(new Set(courses.map((course) => course.courseCode)).size, 58);

  assert.equal(courses.filter((course) => course.courseType === 'core').length, 8);
  assert.equal(courses.filter((course) => course.courseType === 'capstone').length, 2);
  assert.equal(courses.filter((course) => course.courseType === 'major_elective').length, 48);
  assert.equal(byCode.JASP2470.credits, 6);
  assert.equal(byCode.JASP2480.credits, 6);
  assert.equal(byCode.JASP1490.credits, 1);
  assert.equal(byCode.JASP4601.recommendedYear, 4);
  assert.equal(byCode.JASP4601.semester, 'Fall');
  assert.match(byCode.JASP2600.requirementGroups[0], /Business and Management Stream first pool/);
  assert.match(byCode.JASP2600.requirementGroups[0], /Japan in Global Perspective Stream first pool/);
  assert.match(byCode.JASP3700.requirementGroups[0], /Japanese Language and Linguistics Stream requires/);
  assert.match(byCode.JASP3180.requirementGroups[0], /offered only before resident study/);

  ['JASP1100', 'JASP1350', 'JASP1450', 'JASP1460', 'JASP1550', 'JASP2450', 'JASP2460'].forEach((courseCode) => {
    assert.equal(byCode[courseCode], undefined);
  });
  assert(courses.every((course) => course.sourceUrl === supplementFile.sourceUrl));

  assert.match(supplementFile.note, /66-unit standard Major/);
  assert.match(supplementFile.note, /18 approved resident-study units/);
  assert.match(supplementFile.note, /all 58 JASP codes/);
  assert.match(supplementFile.note, /browse-only/);
});
