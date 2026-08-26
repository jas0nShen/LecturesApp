const assert = require('node:assert/strict');
const test = require('node:test');
const supplementFile = require('../data/ug-course-supplements/cityu-js1806-biological-sciences-2026.json');
const { addGenericCourseSupplements } = require('./generate-ug-catalog');
const { validateSupplement } = require('./validate-ug-supplements');

test('CityU JS1806 exposes the current normative Biological Sciences curriculum', () => {
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
  assert.equal(supplement.courses.length, 67);
  assert.equal(new Set(supplement.courses.map((course) => course.code)).size, 67);

  const programmeId = 'CITYU-UG-BSCBISI-57';
  const catalogue = {
    programmes: [{
      id: programmeId,
      universityCode: 'CITYU',
      code: 'BScBISI',
      jupasCode: 'JS1806',
      nameEn: 'BSc Biological Sciences (Features: Bioinformatics, Biochemistry, Genetics, Cellular & Molecular Biology, Immunology / Research Rotation Projects for Hands-on Experience)',
      sourceStatus: 'programme_summary_only',
      courseCount: 1,
      codedCourseCount: 0
    }],
    majors: Array.from({ length: 6 }, (_, index) => ({
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
  assert.equal(majors[0].nameEn, 'BSc Biological Sciences');
  assert.equal(majors[0].codedCourseCount, 67);
  assert.equal(catalogue.programmes[0].codedCourseCount, 67);

  const byCode = Object.fromEntries(catalogue.courses.map((course) => [course.courseCode, course]));
  assert.equal(byCode.BMS2205.credits, 4);
  assert.equal(byCode.BMS4206.courseType, 'capstone');
  assert.equal(byCode.BMS4304.courseType, 'internship');
  assert.equal(byCode.NS4003.credits, 6);
  assert.match(byCode.NS2003.requirementGroups[0], /also Major Elective; no double-counting/);
  assert.match(supplementFile.note, /121- or 128-credit graduation structure/);
  assert.match(supplementFile.note, /totalCreditRequired=0/);
});
