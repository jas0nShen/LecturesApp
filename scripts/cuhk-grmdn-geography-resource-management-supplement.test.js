const assert = require('node:assert/strict');
const test = require('node:test');
const supplementFile = require('../data/ug-course-supplements/cuhk-grmdn-geography-resource-management-courses-2025.json');
const { addGenericCourseSupplements } = require('./generate-ug-catalog');
const { validateSupplement } = require('./validate-ug-supplements');

const EXPECTED_CODES = `
GRMD1001 GRMD1011 GRMD1003 GRMD1301 GRMD1302 GRMD1401 GRMD1402 GRMD1403
GRMD2001 GRMD2011 GRMD2102 GRMD2104 GRMD2105 GRMD2106 GRMD2209 GRMD2221
GRMD2292 GRMD2303 GRMD2321 GRMD2401 GRMD2402 GRMD2403 GRMD2501
GRMD3001 GRMD3011 GRMD3012 GRMD3013 GRMD3014 GRMD3015 GRMD3016 GRMD3017
GRMD3018 GRMD3102 GRMD3104 GRMD3106 GRMD3108 GRMD3202 GRMD3203 GRMD3205
GRMD3209 GRMD3224 GRMD3301 GRMD3302 GRMD3304 GRMD3305 GRMD3323 GRMD3401
GRMD3402 GRMD3404 GRMD4001 GRMD4002 GRMD4003 GRMD4004 GRMD4101 GRMD4202
GRMD4203 GRMD4204 GRMD4302 GRMD4403 GRMD4502 GRMD4503 GRMD5110
`.trim().split(/\s+/).sort();

const REQUIRED_ROLES = {
  GRMD1401: 'core',
  GRMD1403: 'core',
  GRMD2102: 'core',
  GRMD2105: 'core',
  GRMD3102: 'core',
  GRMD3301: 'core',
  GRMD1011: 'fieldwork',
  GRMD2011: 'fieldwork',
  GRMD3011: 'fieldwork',
  GRMD4001: 'capstone',
  GRMD4002: 'capstone'
};

const CONCENTRATION_POOLS = {
  'Urban and Regional Development Concentration': `
    GRMD2303 GRMD2321 GRMD3302 GRMD3304 GRMD3305 GRMD3323 GRMD3402 GRMD4302
  `,
  'Physical Environment and Resource Management Concentration': `
    GRMD2209 GRMD2221 GRMD2292 GRMD2401 GRMD2402 GRMD2403 GRMD3202 GRMD3203
    GRMD3205 GRMD3209 GRMD3224 GRMD3401 GRMD3404 GRMD4202 GRMD4203 GRMD4204
    GRMD4403
  `,
  'Geo-spatial Data Science Concentration': `
    GRMD2104 GRMD2106 GRMD3104 GRMD3106 GRMD3108 GRMD4101 GRMD4403 GRMD4502
    GRMD5110
  `,
  'Smart Cities and Sustainability Governance Concentration': `
    GRMD2401 GRMD2501 GRMD3106 GRMD3203 GRMD3305 GRMD3323 GRMD4502 GRMD4503
  `
};

test('CUHK GRMD preserves the official 62-course Programme pool as browse-only', () => {
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
      id: 'CUHK-UG-GRMDN-74',
      universityCode: 'CUHK',
      code: 'GRMDN',
      jupasCode: 'JS4836',
      nameEn: 'Geography and Resource Management',
      sourceStatus: 'programme_summary_only',
      courseCount: 1,
      codedCourseCount: 0
    }],
    majors: [{
      id: 'CUHK-UG-GRMDN-74-M1',
      programmeId: 'CUHK-UG-GRMDN-74',
      nameEn: 'Geography and Resource Management',
      courseCount: 1,
      codedCourseCount: 0
    }],
    courses: []
  };

  addGenericCourseSupplements(catalogue, [supplement]);

  const courses = catalogue.courses;
  const byCode = Object.fromEntries(courses.map((course) => [course.courseCode, course]));

  assert.equal(catalogue.programmes[0].sourceStatus, 'course_codes_available');
  assert.equal(catalogue.programmes[0].codedCourseCount, 62);
  assert.equal(catalogue.majors[0].codedCourseCount, 62);
  assert.equal(courses.length, 62);
  assert.equal(new Set(courses.map((course) => course.courseCode)).size, 62);
  assert.deepEqual(courses.map((course) => course.courseCode).sort(), EXPECTED_CODES);

  for (const [code, courseType] of Object.entries(REQUIRED_ROLES)) {
    assert.equal(byCode[code].courseType, courseType, `${code} role`);
    assert.match(byCode[code].requirementGroups[0], /Required|Faculty Package/);
  }

  assert.deepEqual(
    courses.filter((course) => course.credits > 0).map((course) => [course.courseCode, course.credits]).sort(),
    [['GRMD1011', 2], ['GRMD1401', 3], ['GRMD1403', 3]]
  );
  assert.equal(courses.filter((course) => course.credits === 0).length, 59);

  for (const [label, rawCodes] of Object.entries(CONCENTRATION_POOLS)) {
    const expected = rawCodes.trim().split(/\s+/).sort();
    const actual = courses
      .filter((course) => course.requirementGroups[0].includes(label))
      .map((course) => course.courseCode)
      .sort();
    assert.deepEqual(actual, expected, label);
  }

  assert.match(byCode.GRMD2321.requirementGroups[0], /GRMD2321, GRMD3305 or GRMD3323/);
  assert.match(byCode.GRMD3202.requirementGroups[0], /GRMD3202 or GRMD3205/);
  assert.match(byCode.GRMD2104.requirementGroups[0], /GRMD2104 or GRMD3106/);
  assert.match(byCode.GRMD2501.requirementGroups[0], /required together with any other 3/);

  const additionalFieldTrips = Array.from({ length: 7 }, (_, index) => `GRMD301${index + 2}`);
  for (const code of additionalFieldTrips) {
    assert(byCode[code], code);
    assert.equal(byCode[code].courseType, 'major_elective');
    assert.match(byCode[code].requirementGroups[0], /official Field Study Trips pool/);
    assert.match(byCode[code].requirementGroups[0], /not marked as offered/);
  }

  for (const level of [1, 2, 3]) {
    const electiveCode = `GRMD${level}001`;
    const requiredCode = `GRMD${level}011`;
    assert.notEqual(byCode[electiveCode].titleEn, byCode[requiredCode].titleEn);
    assert.equal(byCode[electiveCode].courseType, 'major_elective');
    assert.equal(byCode[requiredCode].courseType, 'fieldwork');
  }

  assert.match(supplementFile.note, /62-course list/);
  assert.match(supplementFile.note, /credits 0 to mean unknown/);
  assert.match(supplementFile.note, /senior-entry path/);
  assert.match(supplementFile.note, /browse-only/);
});
