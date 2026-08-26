const assert = require('node:assert/strict');
const test = require('node:test');
const path = require('node:path');
const supplementFile = require('../data/ug-course-supplements/hkust-international-research-enrichment-majors-2025.json');
const { addGenericCourseSupplements, loadGenericCourseSupplements } = require('./generate-ug-catalog');
const { validateSupplement } = require('./validate-ug-supplements');

test('HKUST IRE exposes six isolated official Science Major choices', () => {
  const allSupplements = loadGenericCourseSupplements(path.join(__dirname, '..', 'data', 'ug-course-supplements'));
  const programmeId = 'HKUST-UG-JS5101-INTERNATIONAL-RESEARCH-ENRICHMENT-34';
  const supplements = allSupplements.filter((item) => item.programmeId === programmeId);
  assert.equal(supplements.length, 6);
  supplements.forEach(validateSupplement);

  const catalogue = {
    programmes: [{
      id: programmeId, universityCode: 'HKUST',
      code: 'JS5101 International Research Enrichment', jupasCode: 'JS5101 International Research Enrichment',
      nameEn: 'International Research Enrichment', sourceStatus: 'programme_summary_only',
      courseCount: 1, codedCourseCount: 0
    }],
    majors: [{
      id: `${programmeId}-M1`, programmeId, code: 'INTERNATIONAL-RESEARCH-ENRICHMENT',
      nameEn: 'International Research Enrichment', courseCount: 1, codedCourseCount: 0
    }],
    courses: []
  };

  addGenericCourseSupplements(catalogue, allSupplements);
  const majors = catalogue.majors.filter((major) => major.programmeId === programmeId);
  assert.equal(majors.length, 6);
  assert.deepEqual(majors.map((major) => major.codedCourseCount), [37, 52, 57, 85, 52, 56]);
  assert.equal(catalogue.programmes[0].codedCourseCount, 339);
  assert.equal(catalogue.courses.length, 339);
  assert(majors.every((major) => (
    catalogue.courses.some((course) => course.majorId === major.id && course.courseCode === 'SCIE3500')
  )));
  assert(majors.every((major) => (
    catalogue.courses.some((course) => course.majorId === major.id && course.courseCode === 'SCIE4500')
  )));
  assert.match(supplementFile.note, /six isolated Programme-local Major choices/);
  assert.match(supplementFile.note, /totalCreditRequired remains 0/);
});
