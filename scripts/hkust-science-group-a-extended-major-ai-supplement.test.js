const assert = require('node:assert/strict');
const test = require('node:test');
const path = require('node:path');
const supplementFile = require('../data/ug-course-supplements/hkust-science-group-a-extended-major-ai-2025.json');
const { addGenericCourseSupplements, loadGenericCourseSupplements } = require('./generate-ug-catalog');
const { validateSupplement } = require('./validate-ug-supplements');

test('HKUST Science Group A plus AI exposes four isolated base-Major combinations', () => {
  const allSupplements = loadGenericCourseSupplements(path.join(__dirname, '..', 'data', 'ug-course-supplements'));
  const programmeId = 'HKUST-UG-JS5181-SCIENCE-GROUP-A-WITH-EXTENDED-MAJOR-IN-AR-48';
  const supplements = allSupplements.filter((item) => item.programmeId === programmeId);
  assert.equal(supplements.length, 8);
  supplements.forEach(validateSupplement);

  const catalogue = {
    programmes: [{
      id: programmeId, universityCode: 'HKUST',
      code: 'JS5181 Science (Group A) with Extended Major in Artificial Intelligence',
      jupasCode: 'JS5181 Science (Group A) with Extended Major in Artificial Intelligence',
      nameEn: 'Science (Group A) with Extended Major in Artificial Intelligence',
      sourceStatus: 'programme_summary_only', courseCount: 1, codedCourseCount: 0
    }],
    majors: [{
      id: `${programmeId}-M1`, programmeId, code: 'SCIENCE-GROUP-A-WITH-EXTENDED-MAJOR-IN-AI',
      nameEn: 'Science (Group A) with Extended Major in Artificial Intelligence',
      courseCount: 1, codedCourseCount: 0
    }],
    courses: []
  };

  addGenericCourseSupplements(catalogue, allSupplements);
  const majors = catalogue.majors.filter((major) => major.programmeId === programmeId);
  assert.equal(majors.length, 4);
  const sourceCourseSets = Object.fromEntries([
    ['Chemistry', 'BSc in Chemistry'],
    ['Mathematics', 'BSc in Mathematics'],
    ['Ocean Science and Technology', 'BSc in Ocean Science and Technology'],
    ['Physics', 'BSc in Physics']
  ].map(([label, sourceName]) => [label, new Set(
    allSupplements.find((item) => item.programmeName === sourceName).courses.map((course) => course.code)
  )]));
  const aiCodes = new Set(allSupplements.find((item) => (
    item.programmeId === 'HKUST-UG-JS5282-ENGINEERING-WITH-EXTENDED-MAJOR-IN-ARTIFI-23'
  )).courses.map((course) => course.code));

  majors.forEach((major) => {
    const label = major.nameEn.replace(' with Extended Major in Artificial Intelligence', '');
    const expected = new Set([...sourceCourseSets[label], ...aiCodes]);
    const actual = catalogue.courses.filter((course) => course.majorId === major.id);
    assert.equal(actual.length, expected.size);
    assert(actual.some((course) => course.courseCode === 'EMIA2010A'));
    assert(actual.some((course) => course.courseCode === 'EMIA4991'));
  });
  assert.equal(
    catalogue.programmes[0].codedCourseCount,
    majors.reduce((sum, major) => sum + major.codedCourseCount, 0)
  );
  assert.match(supplementFile.note, /four isolated Programme-local Major choices/);
  assert.match(supplementFile.note, /totalCreditRequired remains 0/);
});
