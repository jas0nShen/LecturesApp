const assert = require('node:assert/strict');
const test = require('node:test');
const supplementFile = require('../data/ug-course-supplements/hkust-marketing-curriculum-2025.json');
const { addGenericCourseSupplements } = require('./generate-ug-catalog');
const { validateSupplement } = require('./validate-ug-supplements');

const PROGRAMME_ID = 'HKUST-UG-JS5316-36';
const MAJOR_ID = `${PROGRAMME_ID}-M1`;
const EXTENDED_MAJOR_ID = `${PROGRAMME_ID}-M2`;

function applySupplement() {
  const supplement = {
    provider: supplementFile.provider,
    academicYear: supplementFile.academicYear,
    sourceUrl: supplementFile.sourceUrl,
    officialUrl: supplementFile.officialUrl,
    ...supplementFile.supplements[0]
  };
  validateSupplement(supplement, 0);

  const catalogue = {
    programmes: [{
      id: PROGRAMME_ID,
      universityCode: 'HKUST',
      nameEn: 'BBA in Marketing',
      sourceStatus: 'programme_summary_only',
      courseCount: 1,
      codedCourseCount: 0
    }],
    majors: [
      {
        id: MAJOR_ID,
        programmeId: PROGRAMME_ID,
        nameEn: 'BBA in Marketing',
        courseCount: 1,
        codedCourseCount: 0
      },
      {
        id: EXTENDED_MAJOR_ID,
        programmeId: PROGRAMME_ID,
        nameEn: 'Business with Extended Major in AI / DMCA / SUST',
        courseCount: 1,
        codedCourseCount: 0
      }
    ],
    courses: []
  };

  addGenericCourseSupplements(catalogue, [supplement]);
  return { catalogue, supplement };
}

test('HKUST BBA in Marketing binds the 2025-26 supplement only to the plain M1 Major', () => {
  const { catalogue, supplement } = applySupplement();
  const targetCourses = catalogue.courses.filter((course) => course.majorId === MAJOR_ID);
  const extendedMajorCourses = catalogue.courses.filter((course) => course.majorId === EXTENDED_MAJOR_ID);

  assert.equal(supplementFile.academicYear, '2025/26');
  assert.equal(supplement.programmeId, PROGRAMME_ID);
  assert.equal(supplement.majorId, MAJOR_ID);
  assert.equal(catalogue.programmes[0].sourceStatus, 'course_codes_available');
  assert.equal(catalogue.programmes[0].codedCourseCount, 13);
  assert.equal(catalogue.majors.find((major) => major.id === MAJOR_ID).codedCourseCount, 13);
  assert.equal(catalogue.majors.find((major) => major.id === EXTENDED_MAJOR_ID).codedCourseCount, 0);
  assert.equal(targetCourses.length, 13);
  assert.equal(new Set(targetCourses.map((course) => course.courseCode)).size, 13);
  assert.equal(extendedMajorCourses.length, 0);
});

test('HKUST BBA in Marketing preserves required rows, the dated open-pool snapshot, and variable credits', () => {
  const { catalogue } = applySupplement();
  const courses = catalogue.courses.filter((course) => course.majorId === MAJOR_ID);
  const byCode = Object.fromEntries(courses.map((course) => [course.courseCode, course]));
  const required = courses.filter((course) => course.courseType === 'core');
  const electives = courses.filter((course) => course.courseType === 'major_elective');

  assert.deepEqual(required.map((course) => course.courseCode), ['MARK3220', 'MARK3420', 'MARK4210']);
  assert.equal(electives.length, 10);
  assert.equal(byCode.MARK4290.credits, 0);
  assert.equal(byCode.MARK4980.credits, 0);
  assert.match(byCode.MARK4290.requirementGroups[0], /variable credit range 0-4/);
  assert.match(byCode.MARK4980.requirementGroups[0], /variable credit range 2-4/);
  assert(electives.every((course) => course.requirementGroups[0].includes('open pool')));
  assert.match(supplementFile.note, /dated snapshot/);
  assert.match(supplementFile.note, /not a permanent closed graduation pool/);
  assert(!courses.some((course) => /3XXX|4XXX/.test(course.courseCode)));
});

test('HKUST BBA in Marketing assigns only named placements from the official normative pathway', () => {
  const { catalogue } = applySupplement();
  const courses = catalogue.courses.filter((course) => course.majorId === MAJOR_ID);
  const byCode = Object.fromEntries(courses.map((course) => [course.courseCode, course]));

  assert.deepEqual([byCode.MARK3220.recommendedYear, byCode.MARK3220.semester], [3, 'Fall']);
  assert.deepEqual([byCode.MARK3420.recommendedYear, byCode.MARK3420.semester], [2, 'Spring']);
  assert.deepEqual([byCode.MARK4210.recommendedYear, byCode.MARK4210.semester], [4, 'Spring']);
  assert.match(byCode.MARK3220.requirementGroups[0], /Year 2 Spring as another offered term/);
  assert.match(byCode.MARK3420.requirementGroups[0], /Year 3 Fall as another offered term/);
  assert.equal(byCode.MARK3410.recommendedYear, 0);
  assert.equal(byCode.MARK4450.recommendedYear, 0);
});
