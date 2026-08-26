const assert = require('node:assert/strict');
const test = require('node:test');
const supplementFile = require('../data/ug-course-supplements/cuhk-archn-architectural-studies-courses-2025.json');
const { addGenericCourseSupplements } = require('./generate-ug-catalog');
const { validateSupplement } = require('./validate-ug-supplements');

const REQUIRED_STUDIO = 'ARCH2111 ARCH2112 ARCH3113 ARCH3114 ARCH4115 ARCH4116'.split(' ');
const REQUIRED_OTHER = 'ARCH1003 ARCH2222 ARCH2322 ARCH2323 ARCH2413 ARCH2422 ARCH3321 ARCH3424 ARCH3721 ARCH4425 ARCH4426'.split(' ');
const ELECTIVE_STANDARD = 'ARCH4131 ARCH4231 ARCH4331 ARCH4431 ARCH4531 ARCH4731 ARCH5131 ARCH5231 ARCH5331 ARCH5431 ARCH5531 ARCH5631 ARCH5731 ARCH5931'.split(' ');
const ELECTIVE_SENIOR = 'ARCH4131 ARCH4231 ARCH4331 ARCH4431 ARCH4531 ARCH4731 ARCH5131 ARCH5231 ARCH5331 ARCH5431 ARCH5731'.split(' ');
const ADDITIONAL = 'ARCH1002 ARCH1320'.split(' ');
const EXPECTED_CODES = ['ARCH1001', ...ADDITIONAL, ...REQUIRED_STUDIO, ...REQUIRED_OTHER, ...ELECTIVE_STANDARD].sort();

test('CUHK ARCHN exposes all 34 official 2025-26 ARCH rows without fabricating the three entry paths', () => {
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
      id: 'CUHK-UG-ARCHN-69', universityCode: 'CUHK', code: 'ARCHN', jupasCode: 'JS4812',
      nameEn: 'Architectural Studies', sourceStatus: 'programme_summary_only', courseCount: 1, codedCourseCount: 0
    }],
    majors: [{
      id: 'CUHK-UG-ARCHN-69-M1', programmeId: 'CUHK-UG-ARCHN-69',
      nameEn: 'Architectural Studies', courseCount: 1, codedCourseCount: 0
    }],
    courses: []
  };

  addGenericCourseSupplements(catalogue, [supplement]);

  const courses = catalogue.courses;
  const byCode = Object.fromEntries(courses.map((course) => [course.courseCode, course]));
  const sumCredits = (codes) => codes.reduce((sum, code) => sum + byCode[code].credits, 0);
  assert.equal(catalogue.programmes[0].sourceStatus, 'course_codes_available');
  assert.equal(catalogue.programmes[0].codedCourseCount, 34);
  assert.equal(catalogue.majors[0].codedCourseCount, 34);
  assert.equal(courses.length, 34);
  assert.deepEqual(courses.map((course) => course.courseCode).sort(), EXPECTED_CODES);
  assert.equal(new Set(courses.map((course) => course.courseCode)).size, 34);
  assert.equal(courses.filter((course) => course.courseType === 'foundation').length, 1);
  assert.equal(courses.filter((course) => course.courseType === 'core').length, 16);
  assert.equal(courses.filter((course) => course.courseType === 'capstone').length, 1);
  assert.equal(courses.filter((course) => course.courseType === 'major_elective').length, 14);
  assert.equal(courses.filter((course) => course.courseType === 'programme_course').length, 2);
  assert.equal(courses.reduce((sum, course) => sum + course.credits, 0), 112);
  assert.equal(sumCredits(REQUIRED_STUDIO), 30);
  assert.equal(sumCredits(REQUIRED_OTHER), 33);
  assert.equal(sumCredits(ELECTIVE_STANDARD), 40);
  assert.equal(sumCredits(ELECTIVE_SENIOR), 33);
  assert.equal(byCode.ARCH4116.courseType, 'capstone');
  assert.equal(byCode.ARCH5931.credits, 1);
  assert.deepEqual([byCode.ARCH1003.recommendedYear, byCode.ARCH1003.semester], [1, '1']);
  assert.deepEqual([byCode.ARCH4116.recommendedYear, byCode.ARCH4116.semester], [4, '2']);
  assert(courses.every((course) => course.sourceUrl === supplementFile.sourceUrl));

  assert.match(supplementFile.academicYear, /2025-26/);
  assert.match(supplementFile.note, /34 unique ARCH code-title-unit rows/);
  assert.match(supplementFile.note, /78 units/);
  assert.match(supplementFile.note, /59 units/);
  assert.match(supplementFile.note, /56 units/);
  assert.match(supplementFile.note, /totalCreditRequired=0/);
});
