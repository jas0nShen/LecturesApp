const assert = require('node:assert/strict');
const test = require('node:test');
const supplementFile = require('../data/ug-course-supplements/cityu-js1211-biomedical-engineering-2026.json');
const { addGenericCourseSupplements } = require('./generate-ug-catalog');
const { validateSupplement } = require('./validate-ug-supplements');

test('CityU JS1211 exposes the current normative Biomedical Engineering curriculum', () => {
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
  assert.equal(supplement.courses.length, 60);
  assert.equal(new Set(supplement.courses.map((course) => course.code)).size, 60);

  const programmeId = 'CITYU-UG-BENGBME-48';
  const catalogue = {
    programmes: [{
      id: programmeId,
      universityCode: 'CITYU',
      code: 'BEngBME',
      jupasCode: 'JS1211',
      nameEn: 'BEng Biomedical Engineering (Features: Medical Technology / Bioinstrumentation / Cell and Tissue Engineering / Biomedical Robotics)',
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
  assert.equal(majors[0].nameEn, 'BEng Biomedical Engineering');
  assert.equal(majors[0].codedCourseCount, 60);
  assert.equal(catalogue.programmes[0].codedCourseCount, 60);

  const byCode = Object.fromEntries(catalogue.courses.map((course) => [course.courseCode, course]));
  assert.equal(byCode.BME4102.credits, 9);
  assert.equal(byCode.BME4102.courseType, 'capstone');
  assert.equal(byCode.BME3200.courseType, 'internship');
  assert.match(byCode.BMS3101.requirementGroups[0], /also B3 Major Elective/);
  assert.equal(byCode.CBM4000.credits, 1);
  assert.match(supplementFile.note, /121- or 128-credit structure/);
  assert.match(supplementFile.note, /totalCreditRequired=0/);
});
