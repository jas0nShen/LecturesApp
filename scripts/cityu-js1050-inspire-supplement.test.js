const assert = require('node:assert/strict');
const test = require('node:test');
const path = require('node:path');
const supplementFile = require('../data/ug-course-supplements/cityu-js1050-inspire-first-year-courses-2026.json');
const { addGenericCourseSupplements, loadGenericCourseSupplements } = require('./generate-ug-catalog');
const { validateSupplement } = require('./validate-ug-supplements');

test('CityU JS1050 INSPIRE exposes two isolated Majors with the verified common first-year curriculum', () => {
  const allSupplements = loadGenericCourseSupplements(path.join(__dirname, '..', 'data', 'ug-course-supplements'));
  const programmeId = 'CITYU-UG-INSPIRE-19';
  const supplements = allSupplements.filter((item) => item.programmeId === programmeId);
  assert.equal(supplements.length, 2);
  supplements.forEach(validateSupplement);

  const catalogue = {
    programmes: [{
      id: programmeId,
      universityCode: 'CITYU',
      code: 'INSPIRE',
      jupasCode: 'JS1050',
      nameEn: 'International Sustainability Programme for Innovation, Research & Entrepreneurship(INSPIRE) (Majors: BEng Energy Science & Engineering/BEng Environmental Science & Engineering +Features: Global Focus)',
      sourceStatus: 'programme_summary_only',
      courseCount: 1,
      codedCourseCount: 0
    }],
    majors: [
      { id: `${programmeId}-M1`, programmeId, code: 'BENG-ENERGY-SCIENCE-ENGINEERING', nameEn: 'BEng Energy Science & Engineering', courseCount: 1, codedCourseCount: 0 },
      { id: `${programmeId}-M2`, programmeId, code: 'BENG-ENVIRONMENTAL-SCIENCE-ENGINEERING-FEATURES-', nameEn: 'BEng Environmental Science & Engineering +Features: Global Focus', courseCount: 1, codedCourseCount: 0 },
      { id: `${programmeId}-M3`, programmeId, code: 'GLOBAL-FOCUS', nameEn: 'Global Focus', courseCount: 1, codedCourseCount: 0 }
    ],
    courses: []
  };

  addGenericCourseSupplements(catalogue, allSupplements);
  const majors = catalogue.majors.filter((major) => major.programmeId === programmeId);
  assert.deepEqual(majors.map((major) => major.nameEn), [
    'BEng Energy Science and Engineering (INSPIRE)',
    'BEng Environmental Science and Engineering (INSPIRE)'
  ]);
  assert.deepEqual(majors.map((major) => major.codedCourseCount), [15, 15]);
  assert.equal(catalogue.programmes[0].codedCourseCount, 30);
  assert.equal(catalogue.courses.length, 30);
  assert(majors.every((major) => (
    catalogue.courses.some((course) => course.majorId === major.id && course.courseCode === 'SEE1002')
  )));
  assert(majors.every((major) => (
    catalogue.courses.some((course) => course.majorId === major.id && course.courseCode === 'SEE1003')
  )));
  assert(!majors.some((major) => major.nameEn === 'Global Focus'));
  assert.match(supplementFile.note, /not converted into courses/);
  assert.match(supplementFile.note, /totalCreditRequired remains 0/);
});
