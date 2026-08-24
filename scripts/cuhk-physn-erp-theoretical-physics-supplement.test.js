const assert = require('node:assert/strict');
const test = require('node:test');
const supplementFile = require('../data/ug-course-supplements/cuhk-physn-erp-theoretical-physics-courses-2026.json');
const { addGenericCourseSupplements } = require('./generate-ug-catalog');
const { validateSupplement } = require('./validate-ug-supplements');

const FIXED_CODES = `
PHYS1111 PHYS1113 MATH1010 MATH1018 PHYS2520 MATH2010 MATH2530 PHYS1122
PHYS1712 PHYS2041 PHYS2061 PHYS2510 PHYS2711 PHYS2722 PHYS3011 PHYS3051
PHYS3021 PHYS3041 PHYS3710 PHYS3031 PHYS4031 PHYS4610 PHYS4801 PHYS4620 PHYS4802
`.trim().split(/\s+/);
const ASTRO_CODES = 'PHYS4430 PHYS4470 PHYS2401 PHYS3430 PHYS3440 PHYS3810 PHYS4460'.split(' ');
const AI_CODES = 'PHYS3061 PHYS4061 CSCI3320 STAT3006'.split(' ');
const QUANTUM_CODES = 'PHYS3022 PHYS3023 PHYS4021 PHYS4050 PHYS4440 PHYS4450'.split(' ');
const EXPECTED_CODES = [...FIXED_CODES, ...ASTRO_CODES, ...AI_CODES, ...QUANTUM_CODES].sort();
const EXCLUDED_UNKNOWN_UNIT_CODES = [
  'CHEM1070', 'CHEM1072', 'PHYS5061', 'PHYS5320', 'PHYS5430',
  'PHYS5510', 'PHYS5550', 'PHYS5562', 'PHYS5590'
];

test('CUHK PHYSN-ERP exposes the official 42-course evidence-backed subset as browse-only', () => {
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
      id: 'CUHK-UG-PHYSN-ERP-65',
      universityCode: 'CUHK',
      code: 'PHYSN-ERP',
      jupasCode: 'JS4690',
      nameEn: 'Enrichment Stream in Theoretical Physics',
      sourceStatus: 'programme_summary_only',
      courseCount: 1,
      codedCourseCount: 0
    }],
    majors: [{
      id: 'CUHK-UG-PHYSN-ERP-65-M1',
      programmeId: 'CUHK-UG-PHYSN-ERP-65',
      nameEn: 'Enrichment Stream in Theoretical Physics',
      courseCount: 1,
      codedCourseCount: 0
    }],
    courses: []
  };

  addGenericCourseSupplements(catalogue, [supplement]);

  const courses = catalogue.courses;
  const byCode = Object.fromEntries(courses.map((course) => [course.courseCode, course]));
  assert.equal(catalogue.programmes[0].sourceStatus, 'course_codes_available');
  assert.equal(catalogue.programmes[0].codedCourseCount, 42);
  assert.equal(catalogue.majors[0].codedCourseCount, 42);
  assert.equal(courses.length, 42);
  assert.deepEqual(courses.map((course) => course.courseCode).sort(), EXPECTED_CODES);
  assert.equal(courses.filter((course) => course.courseType === 'foundation').length, 4);
  assert.equal(courses.filter((course) => course.courseType === 'core').length, 17);
  assert.equal(courses.filter((course) => course.courseType === 'capstone').length, 4);
  assert.equal(courses.filter((course) => course.courseType === 'major_elective').length, 17);
  assert.deepEqual([byCode.PHYS3430.credits, byCode.PHYS3440.credits], [2, 2]);
  assert.deepEqual([byCode.PHYS3810.credits, byCode.PHYS3710.credits], [1, 1]);
  assert.equal(byCode.MATH2530.semester, 'Term 2');
  assert.equal(byCode.PHYS3710.semester, 'Term 1 / Term 2');
  assert.equal(byCode.PHYS4450.titleEn, 'Optical Physics');
  assert.match(byCode.PHYS2061.requirementGroups[0], /choose 2/);
  assert.match(byCode.PHYS3022.requirementGroups[0], /unused counterpart/);
  EXCLUDED_UNKNOWN_UNIT_CODES.forEach((code) => assert.equal(byCode[code], undefined));
  assert(courses.every((course) => course.sourceUrl === supplementFile.sourceUrl));

  assert.match(supplementFile.note, /Nine explicitly named options are not imported/);
  assert.match(supplementFile.note, /42-course evidence-backed subset/);
  assert.match(supplementFile.note, /browse-only/);
});
