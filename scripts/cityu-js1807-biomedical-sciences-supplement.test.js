const assert = require('node:assert/strict');
const test = require('node:test');
const supplementFile = require('../data/ug-course-supplements/cityu-js1807-biomedical-sciences-2026.json');
const { addGenericCourseSupplements } = require('./generate-ug-catalog');
const { validateSupplement } = require('./validate-ug-supplements');

test('CityU JS1807 exposes the current normative Biomedical Sciences curriculum', () => {
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
  assert.equal(supplement.courses.length, 50);
  assert.equal(new Set(supplement.courses.map((course) => course.code)).size, 50);

  const programmeId = 'CITYU-UG-BSCBMS-58';
  const catalogue = {
    programmes: [{
      id: programmeId,
      universityCode: 'CITYU',
      code: 'BScBMS',
      jupasCode: 'JS1807',
      nameEn: 'BSc Biomedical Sciences (Features: Clinical Chemistry, Hematology, Microbiology and Pathology / Clinical or Industrial Attachment / Intensive Laboratory Experience)',
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
  assert.equal(majors[0].nameEn, 'BSc Biomedical Sciences');
  assert.equal(majors[0].codedCourseCount, 50);
  assert.equal(catalogue.programmes[0].codedCourseCount, 50);

  const byCode = Object.fromEntries(catalogue.courses.map((course) => [course.courseCode, course]));
  assert.equal(byCode.BMS3009.credits, 9);
  assert.equal(byCode.BMS3009.courseType, 'internship');
  assert.equal(byCode.BMS4006.courseType, 'capstone');
  assert.equal(byCode.CBM4000.credits, 1);
  assert.match(supplementFile.note, /90- or 97-credit Major/);
  assert.match(supplementFile.note, /totalCreditRequired=0/);
});
