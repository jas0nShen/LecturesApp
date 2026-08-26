const assert = require('node:assert/strict');
const test = require('node:test');
const supplementFile = require('../data/ug-course-supplements/cityu-js1221-computer-science-computational-finance-double-degree-2026.json');
const { addGenericCourseSupplements } = require('./generate-ug-catalog');
const { validateSupplement } = require('./validate-ug-supplements');

test('CityU JS1221 preserves only the explicitly coded double-degree curriculum rows', () => {
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
  assert.equal(supplement.courses.length, 17);
  assert.equal(new Set(supplement.courses.map((course) => course.code)).size, 17);

  const programmeId = 'CITYU-UG-BSCCS-BSCCFFT-53';
  const catalogue = {
    programmes: [{
      id: programmeId,
      universityCode: 'CITYU',
      code: 'BSCCS&BSCCFFT',
      jupasCode: 'JS1221',
      nameEn: 'BSc Computer Science and BSc Computational Finance and Financial Technology(Double Degree;Features:Corporate Accounting & Economics/Computational Finance/Advanced Statistics/Financial Technologies)',
      sourceStatus: 'programme_summary_only',
      courseCount: 4,
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
  assert.equal(majors[0].nameEn, 'BSc Computer Science and BSc Computational Finance and Financial Technology');
  assert.equal(majors[0].codedCourseCount, 17);
  assert.equal(catalogue.programmes[0].codedCourseCount, 17);

  const byCode = Object.fromEntries(catalogue.courses.map((course) => [course.courseCode, course]));
  assert.equal(byCode.GE1601.credits, 1);
  assert.match(byCode.GE2410.requirementGroups[0], /GE2410 or GE2402/);
  assert.match(byCode.CS2204.requirementGroups[0], /in lieu of CB2240/);
  assert.match(byCode.CB2400.requirementGroups[0], /shared between the two degrees/);
  assert.match(supplementFile.note, /99 Major credits/);
  assert.match(supplementFile.note, /Standalone CS and CFFT Major pools are not copied/);
  assert.match(supplementFile.note, /totalCreditRequired=0/);
});
