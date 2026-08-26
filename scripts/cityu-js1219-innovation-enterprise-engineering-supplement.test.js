const assert = require('node:assert/strict');
const test = require('node:test');
const supplementFile = require('../data/ug-course-supplements/cityu-js1219-innovation-enterprise-engineering-2026.json');
const { addGenericCourseSupplements } = require('./generate-ug-catalog');
const { validateSupplement } = require('./validate-ug-supplements');

test('CityU JS1219 exposes the current normative Innovation and Enterprise Engineering curriculum', () => {
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
  assert.equal(supplement.courses.length, 44);
  assert.equal(new Set(supplement.courses.map((course) => course.code)).size, 44);

  const programmeId = 'CITYU-UG-BENGIEEG-52';
  const catalogue = {
    programmes: [{
      id: programmeId,
      universityCode: 'CITYU',
      code: 'BEngIEEG',
      jupasCode: 'JS1219',
      nameEn: 'BEng Innovation and Enterprise Engineering (Features: Engineering / Technology / Innovation / Enterprise / Entrepreneurship)',
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
  assert.equal(majors[0].nameEn, 'BEng Innovation and Enterprise Engineering');
  assert.equal(majors[0].codedCourseCount, 44);
  assert.equal(catalogue.programmes[0].codedCourseCount, 44);

  const byCode = Object.fromEntries(catalogue.courses.map((course) => [course.courseCode, course]));
  assert.equal(byCode.SYE1001.credits, 0);
  assert.equal(byCode.FS3002.courseType, 'core');
  assert.equal(byCode.FS4002.courseType, 'major_elective');
  assert.match(byCode.FS4002.requirementGroups[0], /also listed as optional/);
  assert.equal(byCode.SYE4068C.credits, 6);
  assert.equal(byCode.FS4001.credits, 8);
  assert.match(supplementFile.note, /36 Free Elective credits/);
  assert.match(supplementFile.note, /totalCreditRequired=0/);
});
