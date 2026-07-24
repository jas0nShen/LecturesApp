const assert = require('node:assert/strict');
const test = require('node:test');
const supplementFile = require('../data/ug-course-supplements/hkust-management-curriculum-2025.json');
const { addGenericCourseSupplements } = require('./generate-ug-catalog');
const { validateSupplement } = require('./validate-ug-supplements');

const PROGRAMME_ID = 'HKUST-UG-JS5315-35';
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
      nameEn: 'BBA in Management',
      sourceStatus: 'programme_summary_only',
      courseCount: 1,
      codedCourseCount: 0
    }],
    majors: [
      {
        id: MAJOR_ID,
        programmeId: PROGRAMME_ID,
        nameEn: 'BBA in Management',
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

test('HKUST BBA in Management binds the 2025-26 supplement only to the plain M1 Major', () => {
  const { catalogue, supplement } = applySupplement();
  const targetCourses = catalogue.courses.filter((course) => course.majorId === MAJOR_ID);
  const extendedMajorCourses = catalogue.courses.filter((course) => course.majorId === EXTENDED_MAJOR_ID);

  assert.equal(supplementFile.academicYear, '2025/26');
  assert.equal(supplement.programmeId, PROGRAMME_ID);
  assert.equal(supplement.majorId, MAJOR_ID);
  assert.equal(catalogue.programmes[0].sourceStatus, 'course_codes_available');
  assert.equal(catalogue.programmes[0].codedCourseCount, 14);
  assert.equal(catalogue.majors.find((major) => major.id === MAJOR_ID).codedCourseCount, 14);
  assert.equal(catalogue.majors.find((major) => major.id === EXTENDED_MAJOR_ID).codedCourseCount, 0);
  assert.equal(targetCourses.length, 14);
  assert.equal(new Set(targetCourses.map((course) => course.courseCode)).size, 14);
  assert.equal(extendedMajorCourses.length, 0);
});

test('HKUST BBA in Management preserves required alternatives, optional Options, and the open elective boundary', () => {
  const { catalogue } = applySupplement();
  const courses = catalogue.courses.filter((course) => course.majorId === MAJOR_ID);
  const byCode = Object.fromEntries(courses.map((course) => [course.courseCode, course]));
  const required = courses.filter((course) => course.courseType === 'core');
  const consulting = courses.filter((course) => course.requirementGroups[0].startsWith('Optional Consulting Option'));
  const csr = courses.filter((course) => course.requirementGroups[0].startsWith('Optional Corporate Social Responsibility'));
  const humanResources = courses.filter((course) => course.requirementGroups[0].startsWith('Optional Human Resources Option'));

  assert.deepEqual(required.map((course) => course.courseCode), [
    'MGMT3110',
    'MGMT3120',
    'MGMT3130',
    'MGMT3140',
    'MGMT4210',
    'MGMT4220'
  ]);
  assert.deepEqual(consulting.map((course) => course.courseCode), ['MGMT3160', 'MGMT4230', 'MGMT4250']);
  assert.deepEqual(csr.map((course) => course.courseCode), ['MGMT3170']);
  assert.deepEqual(humanResources.map((course) => course.courseCode), [
    'MGMT4270',
    'MGMT4280',
    'MGMT4290',
    'MGMT4300'
  ]);
  assert.equal(byCode.MGMT4210.credits, 3);
  assert.equal(byCode.MGMT4220.credits, 4);
  assert.match(byCode.MGMT3110.requirementGroups[0], /Human Resources Option students must take MGMT 3110/);
  assert.match(byCode.MGMT4250.requirementGroups[0], /required together with one of MGMT 3110, MGMT 3160, or MGMT 4230/);
  assert.match(byCode.MGMT4270.requirementGroups[0], /choose two/);
  assert.match(supplementFile.note, /any three MGMT courses at 3000 level or above/);
  assert.match(supplementFile.note, /not converted into a permanent closed elective pool/);
  assert(!courses.some((course) => /3XXX|4XXX/.test(course.courseCode)));
});

test('HKUST BBA in Management assigns only named placements from the official normative pathway', () => {
  const { catalogue } = applySupplement();
  const courses = catalogue.courses.filter((course) => course.majorId === MAJOR_ID);
  const byCode = Object.fromEntries(courses.map((course) => [course.courseCode, course]));

  assert.deepEqual([byCode.MGMT3110.recommendedYear, byCode.MGMT3110.semester], [2, 'Spring']);
  assert.deepEqual([byCode.MGMT3120.recommendedYear, byCode.MGMT3120.semester], [2, 'Spring']);
  assert.deepEqual([byCode.MGMT3130.recommendedYear, byCode.MGMT3130.semester], [3, 'Fall']);
  assert.deepEqual([byCode.MGMT3140.recommendedYear, byCode.MGMT3140.semester], [3, 'Fall']);
  assert.deepEqual([byCode.MGMT4210.recommendedYear, byCode.MGMT4210.semester], [3, 'Spring']);
  assert.deepEqual([byCode.MGMT4220.recommendedYear, byCode.MGMT4220.semester], [3, 'Spring']);
  assert.deepEqual([byCode.MGMT4250.recommendedYear, byCode.MGMT4250.semester], [4, 'Fall']);
  assert.equal(byCode.MGMT3160.recommendedYear, 0);
  assert.equal(byCode.MGMT3170.recommendedYear, 0);
  assert.equal(byCode.MGMT4270.recommendedYear, 0);
});
