const assert = require('node:assert/strict');
const test = require('node:test');
const supplementFile = require('../data/ug-course-supplements/cityu-js1216-intelligent-manufacturing-engineering-2026.json');
const { addGenericCourseSupplements } = require('./generate-ug-catalog');
const { validateSupplement } = require('./validate-ug-supplements');

test('CityU JS1216 exposes the current normative Intelligent Manufacturing Engineering curriculum', () => {
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
  assert.equal(supplement.courses.length, 64);
  assert.equal(new Set(supplement.courses.map((course) => course.code)).size, 64);

  const programmeId = 'CITYU-UG-BENGITME-49';
  const catalogue = {
    programmes: [{
      id: programmeId,
      universityCode: 'CITYU',
      code: 'BEngITME',
      jupasCode: 'JS1216',
      nameEn: 'BEng Intelligent Manufacturing Engineering (Features: Industrial Internet-of-Things / Industrial Big Data / Robotics and Automation / Logistics and Supply Chain / Smart City Engineering)',
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
  assert.equal(majors[0].nameEn, 'BEng Intelligent Manufacturing Engineering');
  assert.equal(majors[0].codedCourseCount, 64);
  assert.equal(catalogue.programmes[0].codedCourseCount, 64);

  const byCode = Object.fromEntries(catalogue.courses.map((course) => [course.courseCode, course]));
  assert.equal(byCode.SYE2016.credits, 0);
  assert.equal(byCode.SYE4068.credits, 6);
  assert.equal(byCode.SYE4116.courseType, 'capstone');
  assert.equal(byCode.FS4001.credits, 8);
  assert.equal(byCode.SYE5009, undefined);
  assert.match(byCode.MA1200.requirementGroups[0], /MA1200 or MA1300/);
  assert.match(supplementFile.note, /121-credit structure/);
  assert.match(supplementFile.note, /totalCreditRequired=0/);
});
