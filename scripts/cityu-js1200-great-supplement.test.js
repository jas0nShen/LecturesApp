const assert = require('node:assert/strict');
const test = require('node:test');
const path = require('node:path');
const supplementFile = require('../data/ug-course-supplements/cityu-js1200-great-streams-2026.json');
const { addGenericCourseSupplements, loadGenericCourseSupplements } = require('./generate-ug-catalog');
const { validateSupplement } = require('./validate-ug-supplements');

test('CityU JS1200 GREAT exposes three isolated evidence-bounded Major choices', () => {
  const allSupplements = loadGenericCourseSupplements(path.join(__dirname, '..', 'data', 'ug-course-supplements'));
  const programmeId = 'CITYU-UG-GREAT-39';
  const supplements = allSupplements.filter((item) => item.programmeId === programmeId);
  assert.equal(supplements.length, 3);
  supplements.forEach(validateSupplement);

  const catalogue = {
    programmes: [{
      id: programmeId,
      universityCode: 'CITYU',
      code: 'GREAT',
      jupasCode: 'JS1200',
      nameEn: 'Global Research Enrichment and Technopreneurship (GREAT) [Majors: BSc Chemistry / BSc Computing Mathematics / BSc Physics + Global Research Enrichment and Technopreneurship (GREAT)]',
      sourceStatus: 'programme_summary_only',
      courseCount: 1,
      codedCourseCount: 0
    }],
    majors: [
      { id: `${programmeId}-M1`, programmeId, code: 'BSC-CHEMISTRY', nameEn: 'BSc Chemistry', courseCount: 1, codedCourseCount: 0 },
      { id: `${programmeId}-M2`, programmeId, code: 'BSC-COMPUTING-MATHEMATICS', nameEn: 'BSc Computing Mathematics', courseCount: 1, codedCourseCount: 0 },
      { id: `${programmeId}-M3`, programmeId, code: 'BSC-PHYSICS-GREAT', nameEn: 'BSc Physics + Global Research Enrichment and Technopreneurship (GREAT)]', courseCount: 1, codedCourseCount: 0 }
    ],
    courses: []
  };

  addGenericCourseSupplements(catalogue, allSupplements);
  const majors = catalogue.majors.filter((major) => major.programmeId === programmeId);
  assert.deepEqual(majors.map((major) => major.nameEn), [
    'BSc Chemistry (GREAT)',
    'BSc Computing Mathematics (GREAT)',
    'BSc Physics (GREAT)'
  ]);
  assert.deepEqual(majors.map((major) => major.codedCourseCount), [72, 23, 14]);
  assert.equal(catalogue.programmes[0].codedCourseCount, 109);
  assert.equal(catalogue.courses.length, 109);

  const chemistryCourses = catalogue.courses.filter((course) => course.majorId === `${programmeId}-M1`);
  assert(chemistryCourses.some((course) => course.courseCode === 'CHEM4086'));
  assert(chemistryCourses.some((course) => course.courseCode === 'CSCI4007'));
  assert(!chemistryCourses.some((course) => course.courseCode === 'CHEM4036'));
  assert(catalogue.courses.some((course) => course.majorId === `${programmeId}-M2` && course.courseCode === 'MA3517'));
  assert(catalogue.courses.some((course) => course.majorId === `${programmeId}-M3` && course.courseCode === 'PHY1203'));
  assert.match(supplementFile.note, /three isolated Programme-local GREAT Major choices/);
  assert.match(supplementFile.note, /totalCreditRequired=0/);
});
