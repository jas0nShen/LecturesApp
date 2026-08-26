const assert = require('node:assert/strict');
const test = require('node:test');
const supplementFile = require('../data/ug-course-supplements/cityu-js1052-environmental-engineering-finance-double-degree-2026.json');
const { addGenericCourseSupplements } = require('./generate-ug-catalog');
const { validateSupplement } = require('./validate-ug-supplements');

test('CityU JS1052 preserves the official integrated environmental engineering and finance curriculum', () => {
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
  assert.equal(supplement.courses.length, 74);
  assert.equal(new Set(supplement.courses.map((course) => course.code)).size, 74);

  const programmeId = 'CITYU-UG-BENGESE-BBAFIN-21';
  const catalogue = {
    programmes: [{
      id: programmeId,
      universityCode: 'CITYU',
      code: 'BEngESE&BBAFIN',
      jupasCode: 'JS1052',
      nameEn: 'BEng Environmental Science and Engineering and BBA Finance (Double Degree; Features: Environmental, Social & Governance (ESG) / Green Finance / Environmental Technology / Interdisciplinary Education)',
      sourceStatus: 'programme_summary_only',
      courseCount: 1,
      codedCourseCount: 0
    }],
    majors: Array.from({ length: 5 }, (_, index) => ({
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
  assert.equal(majors[0].nameEn, 'BEng Environmental Science and Engineering and BBA Finance');
  assert.equal(majors[0].codedCourseCount, 74);
  assert.equal(catalogue.programmes[0].codedCourseCount, 74);

  const byCode = Object.fromEntries(catalogue.courses.map((course) => [course.courseCode, course]));
  assert.equal(byCode.SEE1000.credits, 0);
  assert.equal(byCode.SEE3101.credits, 4);
  assert.equal(byCode.SEE4996.credits, 6);
  assert.match(byCode.MA1200.requirementGroups[0], /MA1200 or MA1300/);
  assert.match(byCode.EF4328.requirementGroups[0], /choose 3 credits/);
  assert.match(supplementFile.note, /154-credit.*153 credits/);
  assert.match(supplementFile.note, /totalCreditRequired=0/);
});
