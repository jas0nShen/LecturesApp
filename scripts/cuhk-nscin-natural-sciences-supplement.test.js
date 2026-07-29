const assert = require('node:assert/strict');
const test = require('node:test');
const supplementFile = require('../data/ug-course-supplements/cuhk-nscin-natural-sciences-courses-2026.json');
const { addGenericCourseSupplements } = require('./generate-ug-catalog');
const { validateSupplement } = require('./validate-ug-supplements');

const EXPECTED_CODES = `
BCHE2030 BIOL2120 BIOL2210 CHEM1070 CHEM1072 CHEM2110 CHEM2120 CHEM2200
CHEM2300 CHEM2400 CHEM2872 CHEM3410 CHEM3420 CHEM3870 CHEM4960 CHEM4970
EESC2270 EESC2515 EESC3520 FNSC2001 FNSC2002 LSCI1002 LSCI2002 MATH1010
MATH1520 MBTE2000 MBTE2010 MBTE4033 NSCI3000 NSCI3100 NSCI3200 NSCI4051
PHYS1002 PHYS1111 STAT1011 STAT1012 STAT2001 STAT2005 STAT2006 STAT3008
`.trim().split(/\s+/).sort();

const COMMON_CODES = ['NSCI3000', 'NSCI3100', 'NSCI3200'];
const CONCENTRATION_CODES = {
  'Biological Sciences': ['BCHE2030', 'BIOL2120', 'BIOL2210', 'MBTE2010'],
  Biotechnology: ['BCHE2030', 'BIOL2120', 'LSCI2002', 'MBTE2000', 'MBTE2010', 'MBTE4033'],
  'Environmental Studies': ['BIOL2210', 'EESC2270', 'EESC2515', 'EESC3520'],
  'Food and Nutrition': ['BCHE2030', 'BIOL2120', 'FNSC2001', 'FNSC2002', 'LSCI1002'],
  'Data Science': ['NSCI4051', 'STAT2001', 'STAT2005', 'STAT2006', 'STAT3008'],
  'Chemical and Testing Sciences': [
    'CHEM2110', 'CHEM2120', 'CHEM2200', 'CHEM2300', 'CHEM2400', 'CHEM2872',
    'CHEM3410', 'CHEM3420', 'CHEM3870', 'CHEM4960', 'CHEM4970', 'STAT1011',
    'STAT1012'
  ],
  'Physical Sciences': ['CHEM1070', 'CHEM1072', 'MATH1010', 'MATH1520', 'PHYS1002', 'PHYS1111']
};

const UNKNOWN_CREDIT_CODES = `
CHEM1070 CHEM1072 CHEM2110 CHEM2120 CHEM2200 CHEM2300
MATH1010 MATH1520 PHYS1002 PHYS1111
`.trim().split(/\s+/).sort();

test('CUHK Natural Sciences preserves all seven current Concentration required-code pools as browse-only', () => {
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
      id: 'CUHK-UG-NSCIN-66',
      universityCode: 'CUHK',
      code: 'NSCIN',
      jupasCode: '',
      nameEn: 'Natural Sciences',
      sourceStatus: 'programme_summary_only',
      courseCount: 1,
      codedCourseCount: 0
    }],
    majors: [{
      id: 'CUHK-UG-NSCIN-66-M1',
      programmeId: 'CUHK-UG-NSCIN-66',
      nameEn: 'Natural Sciences',
      courseCount: 1,
      codedCourseCount: 0
    }],
    courses: []
  };

  addGenericCourseSupplements(catalogue, [supplement]);

  const courses = catalogue.courses;
  const byCode = Object.fromEntries(courses.map((course) => [course.courseCode, course]));

  assert.equal(catalogue.programmes[0].sourceStatus, 'course_codes_available');
  assert.equal(catalogue.programmes[0].codedCourseCount, 40);
  assert.equal(catalogue.majors[0].codedCourseCount, 40);
  assert.equal(courses.length, 40);
  assert.equal(new Set(courses.map((course) => course.courseCode)).size, 40);
  assert.deepEqual(courses.map((course) => course.courseCode).sort(), EXPECTED_CODES);

  for (const [concentration, pathCodes] of Object.entries(CONCENTRATION_CODES)) {
    for (const code of pathCodes) {
      assert.match(byCode[code].requirementGroups[0], new RegExp(concentration));
    }
    const actualPathCodes = courses
      .filter((course) => (
        COMMON_CODES.includes(course.courseCode)
        || course.requirementGroups[0].includes(concentration)
      ))
      .map((course) => course.courseCode)
      .sort();
    assert.deepEqual(actualPathCodes, [...new Set([...COMMON_CODES, ...pathCodes])].sort());
  }

  assert.equal(byCode.NSCI3100.courseType, 'core');
  assert.equal(byCode.NSCI3100.credits, 1);
  assert.equal(byCode.NSCI3000.credits, 2);
  assert.equal(byCode.NSCI3200.credits, 2);
  assert.match(byCode.NSCI3000.requirementGroups[0], /choose NSCI3000 or NSCI3200/);
  assert.equal(byCode.NSCI4051.credits, 3);
  assert.equal(byCode.CHEM4960.credits, 2);
  assert.equal(byCode.CHEM4970.credits, 2);

  assert.deepEqual(
    courses.filter((course) => course.credits === 0).map((course) => course.courseCode).sort(),
    UNKNOWN_CREDIT_CODES
  );
  for (const code of ['CHEM2110', 'CHEM2120', 'CHEM2200', 'CHEM2300']) {
    assert.match(byCode[code].requirementGroups[0], /any 3/);
    assert.match(byCode[code].requirementGroups[0], /7-8 units/);
  }
  for (const code of ['CHEM1070', 'CHEM1072', 'MATH1010', 'MATH1520', 'PHYS1002', 'PHYS1111']) {
    assert.match(byCode[code].requirementGroups[0], /any 2/);
    assert.match(byCode[code].requirementGroups[0], /6 units/);
  }

  assert.match(supplementFile.note, /2026-27-and-thereafter/);
  assert.match(supplementFile.note, /40-course required-code list/);
  assert.match(supplementFile.note, /open elective universes/);
  assert.match(supplementFile.note, /browse-only/);
});
