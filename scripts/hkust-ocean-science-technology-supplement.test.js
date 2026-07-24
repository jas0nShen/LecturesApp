const assert = require('node:assert/strict');
const test = require('node:test');
const supplementFile = require('../data/ug-course-supplements/hkust-ocean-science-technology-curriculum-2025.json');
const { addGenericCourseSupplements } = require('./generate-ug-catalog');
const { validateSupplement } = require('./validate-ug-supplements');

const PROGRAMME_ID = 'HKUST-UG-JS5102-SCIENCE-GROUP-A-JS5103-SCIENCE-GROUP-B-41';
const MAJOR_ID = `${PROGRAMME_ID}-M1`;
const CONTROL_MAJOR_ID = `${PROGRAMME_ID}-M2`;
const OTHER_PROGRAMME_ID = 'HKUST-UG-SYNTHETIC-OST-CONTROL';
const OTHER_MAJOR_ID = `${OTHER_PROGRAMME_ID}-M1`;

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
    programmes: [
      {
        id: PROGRAMME_ID,
        universityCode: 'HKUST',
        nameEn: 'BSc in Ocean Science and Technology',
        sourceStatus: 'programme_summary_only',
        courseCount: 1,
        codedCourseCount: 0
      },
      {
        id: OTHER_PROGRAMME_ID,
        universityCode: 'HKUST',
        nameEn: 'Synthetic Ocean Science Control',
        sourceStatus: 'programme_summary_only',
        courseCount: 1,
        codedCourseCount: 0
      }
    ],
    majors: [
      {
        id: MAJOR_ID,
        programmeId: PROGRAMME_ID,
        nameEn: 'BSc in Ocean Science and Technology',
        courseCount: 1,
        codedCourseCount: 0
      },
      {
        id: CONTROL_MAJOR_ID,
        programmeId: PROGRAMME_ID,
        nameEn: 'Synthetic second Major control',
        courseCount: 1,
        codedCourseCount: 0
      },
      {
        id: OTHER_MAJOR_ID,
        programmeId: OTHER_PROGRAMME_ID,
        nameEn: 'Synthetic Ocean Science Control',
        courseCount: 1,
        codedCourseCount: 0
      }
    ],
    courses: []
  };

  addGenericCourseSupplements(catalogue, [supplement]);
  return { catalogue, supplement };
}

test('HKUST Ocean Science and Technology binds all 52 unique codes to M1 only', () => {
  const { catalogue, supplement } = applySupplement();
  const targetCourses = catalogue.courses.filter((course) => course.majorId === MAJOR_ID);

  assert.equal(supplementFile.academicYear, '2025/26');
  assert.equal(supplement.programmeId, PROGRAMME_ID);
  assert.equal(supplement.majorId, MAJOR_ID);
  assert.equal(catalogue.programmes[0].sourceStatus, 'course_codes_available');
  assert.equal(catalogue.programmes[0].codedCourseCount, 52);
  assert.equal(catalogue.majors.find((major) => major.id === MAJOR_ID).codedCourseCount, 52);
  assert.equal(catalogue.majors.find((major) => major.id === CONTROL_MAJOR_ID).codedCourseCount, 0);
  assert.equal(catalogue.programmes.find((programme) => programme.id === OTHER_PROGRAMME_ID).codedCourseCount, 0);
  assert.equal(catalogue.majors.find((major) => major.id === OTHER_MAJOR_ID).codedCourseCount, 0);
  assert.equal(targetCourses.length, 52);
  assert.equal(new Set(targetCourses.map((course) => course.courseCode)).size, 52);
  assert.equal(catalogue.courses.filter((course) => course.majorId !== MAJOR_ID).length, 0);
});

test('HKUST Ocean Science and Technology preserves required choices and capstone alternatives', () => {
  const { catalogue } = applySupplement();
  const courses = catalogue.courses.filter((course) => course.majorId === MAJOR_ID);
  const byCode = Object.fromEntries(courses.map((course) => [course.courseCode, course]));
  const capstones = ['OCES4964', 'OCES4974', 'OCES4984', 'SCIE3500', 'SCIE4500'];

  assert.match(byCode.MATH1005.requirementGroups[0], /choose MATH1005, MATH1006, MATH1013, MATH1020, or MATH1023/);
  assert.match(byCode.PHYS1101.requirementGroups[0], /choose PHYS1101, PHYS1111, PHYS1112, or PHYS1312/);
  assert.match(byCode.COMP1021.requirementGroups[0], /choose COMP1021 or COMP1023/);
  assert.match(byCode.LIFS1901.requirementGroups[0], /0-3 credits attained/);
  assert.match(byCode.LIFS1901.requirementGroups[0], /HKDSE Biology are exempted/);
  assert(capstones.every((code) => /choose OCES4964, or OCES4974 plus OCES4984, or SCIE3500 plus SCIE4500/.test(byCode[code].requirementGroups[0])));
  assert(capstones.every((code) => /IRE Track must use the SCIE pair/.test(byCode[code].requirementGroups[0])));
});

test('HKUST Ocean Science and Technology keeps the IRE Track and both optional Options distinct', () => {
  const { catalogue } = applySupplement();
  const courses = catalogue.courses.filter((course) => course.majorId === MAJOR_ID);
  const byCode = Object.fromEntries(courses.map((course) => [course.courseCode, course]));
  const marineEcologyChoices = ['OCES3005', 'OCES3302', 'OCES4103', 'OCES4204', 'OCES4320'];

  assert.match(byCode.OCES4303.requirementGroups[0], /IRE Track · required/);
  assert.match(byCode.OCES4303.requirementGroups[0], /Oceanography Option · required/);
  assert.match(byCode.LIFS3150.requirementGroups[0], /IRE Track also requires LIFS3150 or MATH2411/);
  assert.match(byCode.MATH2411.requirementGroups[0], /IRE Track also requires LIFS3150 or MATH2411/);
  assert.match(byCode.LANG4010.requirementGroups[0], /IRE Track students are exempted and take LANG3027 instead/);
  assert.match(byCode.LANG3027.requirementGroups[0], /required instead of LANG4010/);
  assert.match(byCode.OCES4301.requirementGroups[0], /must be used as one of the 12 Major Elective credits/);
  assert.match(byCode.OCES4301.requirementGroups[0], /in addition to 3 courses \/ 9 credits/);
  assert(marineEcologyChoices.every((code) => /Marine Ecology Option · choose 3 courses \/ 9 credits/.test(byCode[code].requirementGroups[0])));
  assert.match(byCode.MATH1014.requirementGroups[0], /Oceanography Option students must use MATH1014 as one of the 12 Major Elective credits/);
  assert.match(byCode.OCES3204.requirementGroups[0], /Oceanography Option · all required/);
  assert.match(supplementFile.note, /Students may graduate without an Option/);
  assert.match(supplementFile.note, /complete either the Marine Ecology or Oceanography Option/);
});

test('HKUST Ocean Science and Technology prevents Track and Option double counting', () => {
  const { catalogue } = applySupplement();
  const courses = catalogue.courses.filter((course) => course.majorId === MAJOR_ID);
  const byCode = Object.fromEntries(courses.map((course) => [course.courseCode, course]));
  const noDoubleCountCodes = [
    'LANG3027',
    'LIFS3150',
    'MATH2411',
    'OCES4303',
    'OCES3005',
    'OCES3302',
    'OCES4103',
    'OCES4204',
    'OCES4320',
    'OCES3204'
  ];

  assert(noDoubleCountCodes.every((code) => /may not|cannot/.test(byCode[code].requirementGroups[0])));
  assert.equal(courses.filter((course) => course.courseCode === 'LIFS3150').length, 1);
  assert.equal(courses.filter((course) => course.courseCode === 'MATH2411').length, 1);
  assert.equal(courses.filter((course) => course.courseCode === 'MATH1014').length, 1);
  assert.equal(courses.filter((course) => course.courseCode === 'OCES4303').length, 1);
  assert.equal(courses.filter((course) => course.courseCode === 'SCIE3500').length, 1);
  assert.equal(courses.filter((course) => course.courseCode === 'SCIE4500').length, 1);
});

test('HKUST Ocean Science and Technology keeps OCES2201 variable and the OCES elective pool open', () => {
  const { catalogue, supplement } = applySupplement();
  const courses = catalogue.courses.filter((course) => course.majorId === MAJOR_ID);
  const byCode = Object.fromEntries(courses.map((course) => [course.courseCode, course]));
  const sourceInternship = supplement.courses.find((course) => course.code === 'OCES2201');
  const boundedElectives = ['OCES2201', 'OCES2330', 'CHEM2311', 'LIFS2011', 'LIFS2060', 'LIFS3150', 'MATH1014', 'MATH2350', 'MATH2411', 'MATH4326'];

  assert.equal(sourceInternship.creditRange, '2-4');
  assert.equal(sourceInternship.creditsMin, 2);
  assert.equal(sourceInternship.creditsMax, 4);
  assert.equal(byCode.OCES2201.credits, 0);
  assert.match(byCode.OCES2201.description, /credits 0 means/);
  assert(boundedElectives.every((code) => /minimum 12 credits/.test(byCode[code].requirementGroups[0])));
  assert.match(supplementFile.note, /open pool of any OCES course at 3000- or 4000-level/);
  assert.match(supplementFile.note, /not expanded into a fabricated permanent course list/);
  assert(!courses.some((course) => /XXXX|3000-LEVEL|4000-LEVEL/.test(course.courseCode)));
});

test('HKUST Ocean Science and Technology assigns only code-specific pathway placements', () => {
  const { catalogue } = applySupplement();
  const courses = catalogue.courses.filter((course) => course.majorId === MAJOR_ID);
  const byCode = Object.fromEntries(courses.map((course) => [course.courseCode, course]));
  const placedCodes = courses
    .filter((course) => course.recommendedYear > 0)
    .map((course) => course.courseCode);

  assert.deepEqual(placedCodes, [
    'OCES1001',
    'OCES1010',
    'OCES2002',
    'OCES2003',
    'OCES2004',
    'OCES2005',
    'OCES2130',
    'OCES3001',
    'OCES3003',
    'OCES3160',
    'OCES3301',
    'OCES4001',
    'OCES4203',
    'OCES4964',
    'CHEM1011',
    'LIFS1901',
    'LIFS1902',
    'LANG4010'
  ]);
  assert.deepEqual([byCode.OCES2002.recommendedYear, byCode.OCES2002.semester], [2, 'Spring']);
  assert.deepEqual([byCode.OCES3001.recommendedYear, byCode.OCES3001.semester], [3, 'Spring']);
  assert.deepEqual([byCode.OCES4964.recommendedYear, byCode.OCES4964.semester], [4, 'Fall']);
  assert.equal(byCode.MATH1005.recommendedYear, 0);
  assert.equal(byCode.PHYS1101.recommendedYear, 0);
  assert.equal(byCode.COMP1021.recommendedYear, 0);
  assert.equal(byCode.COMP1023.recommendedYear, 0);
  assert(courses
    .filter((course) => course.courseType === 'major_elective')
    .every((course) => course.recommendedYear === 0 && course.semester === ''));
});
