const assert = require('node:assert/strict');
const test = require('node:test');
const supplementFile = require('../data/ug-course-supplements/cityu-js1053-environment-sustainable-business-2025.json');
const { addGenericCourseSupplements } = require('./generate-ug-catalog');
const { validateSupplement } = require('./validate-ug-supplements');

test('CityU JS1053 preserves the official 2025 Environment and Sustainable Business curriculum', () => {
  const supplement = {
    provider: supplementFile.provider,
    academicYear: supplementFile.academicYear,
    sourceUrl: supplementFile.sourceUrl,
    officialUrl: supplementFile.officialUrl,
    additionalSourceUrls: supplementFile.additionalSourceUrls,
    note: supplementFile.note,
    ...supplementFile.supplements[0]
  };
  validateSupplement(supplement);
  assert.equal(supplement.courses.length, 58);
  assert.equal(new Set(supplement.courses.map((course) => course.code)).size, 58);

  const programmeId = 'CITYU-UG-BSCESB-22';
  const catalogue = {
    programmes: [{
      id: programmeId,
      universityCode: 'CITYU',
      code: 'BScESB',
      jupasCode: 'JS1053',
      nameEn: 'BSc Environment and Sustainable Business (Features: Environmental Science / Business Sustainability / Environmental, Social & Governance (ESG))',
      sourceStatus: 'programme_summary_only',
      courseCount: 1,
      codedCourseCount: 0
    }],
    majors: Array.from({ length: 4 }, (_, index) => ({
      id: `${programmeId}-M${index + 1}`,
      programmeId,
      code: `FEATURE-${index + 1}`,
      nameEn: `Feature ${index + 1}`,
      courseCount: 1,
      codedCourseCount: 0
    })),
    courses: []
  };

  addGenericCourseSupplements(catalogue, [supplement]);
  const majors = catalogue.majors.filter((major) => major.programmeId === programmeId);
  assert.equal(majors.length, 1);
  assert.equal(majors[0].nameEn, 'BSc Environment and Sustainable Business');
  assert.equal(majors[0].codedCourseCount, 58);
  assert.equal(catalogue.programmes[0].codedCourseCount, 58);

  const byCode = Object.fromEntries(catalogue.courses.map((course) => [course.courseCode, course]));
  assert.equal(byCode.SEE1006.credits, 0);
  assert.equal(byCode.SEE2002.credits, 4);
  assert.equal(byCode.SEE4992.credits, 6);
  assert.match(byCode.MA1200.requirementGroups[0], /MA1200 or MA1300/);
  assert.match(byCode.LW4625.requirementGroups[0], /choose 9 credits/);
  assert.match(supplementFile.note, /131-credit.*130 credits/);
  assert.match(supplementFile.note, /totalCreditRequired=0/);
});
