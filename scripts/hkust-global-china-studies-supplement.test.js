const assert = require('node:assert/strict');
const test = require('node:test');
const supplementFile = require('../data/ug-course-supplements/hkust-global-china-studies-curriculum-2025.json');
const { addGenericCourseSupplements } = require('./generate-ug-catalog');
const { validateSupplement } = require('./validate-ug-supplements');

test('HKUST Global China Studies preserves both Tracks, seven Research Options, and open-pool review boundaries', () => {
  const supplement = {
    provider: supplementFile.provider,
    academicYear: supplementFile.academicYear,
    sourceUrl: supplementFile.sourceUrl,
    officialUrl: supplementFile.officialUrl,
    ...supplementFile.supplements[0]
  };
  validateSupplement(supplement, 0);

  const programmeId = 'HKUST-UG-JS5411-29';
  const catalogue = {
    programmes: [{
      id: programmeId,
      universityCode: 'HKUST',
      nameEn: 'BSc in Global China Studies',
      sourceStatus: 'programme_summary_only',
      courseCount: 1,
      codedCourseCount: 0
    }],
    majors: [
      {
        id: `${programmeId}-M1`,
        programmeId,
        nameEn: 'BSc in Global China Studies',
        courseCount: 1,
        codedCourseCount: 0
      },
      {
        id: `${programmeId}-M2`,
        programmeId,
        nameEn: 'Synthetic isolation control',
        courseCount: 0,
        codedCourseCount: 0
      }
    ],
    courses: []
  };

  addGenericCourseSupplements(catalogue, [supplement]);
  const courses = catalogue.courses.filter((course) => course.majorId === `${programmeId}-M1`);
  const controlCourses = catalogue.courses.filter((course) => course.majorId === `${programmeId}-M2`);
  const byCode = Object.fromEntries(courses.map((course) => [course.courseCode, course]));
  const groupText = (code) => byCode[code].requirementGroups[0];
  const optionNames = [
    'Applied Economics Research Option',
    'Environment and Technology Research Option',
    'Heritage and Cultural Sustainability Research Option',
    'History Research Option',
    'Language and Literature Research Option',
    'Politics Research Option',
    'Sociology Research Option'
  ];
  const deletedCourses = {
    HUMA1020: '2020-21',
    HUMA1630: '2020-21',
    SOSC1150: '2020-21',
    SOSC1661: '2020-21',
    SOSC3530: '2020-21',
    SOSC4290: '2023-24'
  };

  assert.equal(catalogue.programmes[0].sourceStatus, 'course_codes_available');
  assert.equal(catalogue.programmes[0].codedCourseCount, 88);
  assert.equal(catalogue.majors[0].codedCourseCount, 88);
  assert.equal(courses.length, 88);
  assert.equal(new Set(courses.map((course) => course.courseCode)).size, 88);
  assert.equal(controlCourses.length, 0);
  assert.equal(byCode.SHSS4992.credits, 6);
  assert(courses.every((course) => course.recommendedYear === 0));
  assert.equal(courses.filter((course) => course.requirementGroups[0].startsWith('Major Required')).length, 8);
  assert.equal(courses.filter((course) => course.requirementGroups[0].includes('HUMA/SOSC Restricted Electives')).length, 21);
  assert.equal(courses.filter((course) => course.requirementGroups[0].includes('Social Science Track · Restricted Electives')).length, 11);
  assert.equal(courses.filter((course) => course.requirementGroups[0].includes('Social Science Track · Disciplinary Foundation Electives')).length, 4);

  assert.match(groupText('HUMA2400'), /Integrated Humanities and Social Science Track · Required/);
  assert.match(groupText('SOSC1100'), /Social Science Track · Required/);
  assert.match(groupText('SOSC2140'), /Integrated Humanities and Social Science Track · Required/);
  assert.match(groupText('SOSC2140'), /Social Science Track · Required/);
  assert.match(groupText('SOSC3120'), /Area: Environment, Economy & Globalization/);
  assert.match(groupText('SOSC3120'), /Applied Economics Research Option/);
  assert.match(groupText('SOSC3120'), /Social Science Track · Restricted Electives/);
  assert.match(groupText('HUMA2590'), /Major Required/);
  assert.match(groupText('HUMA2590'), /History Research Option/);
  assert.match(groupText('SHSS4991'), /Research Options require SHSS4992 or SHSS4991 and SHSS4993/);
  assert.match(groupText('SOSC1780'), /Introductory Demography/);
  assert.match(groupText('SOSC1960'), /Introductory Psychology/);

  const expectedOptionCourseCounts = [3, 6, 22, 16, 18, 11, 6];
  optionNames.forEach((optionName, index) => {
    const optionCourses = courses.filter((course) => course.requirementGroups[0].includes(optionName));
    assert.equal(optionCourses.length, expectedOptionCourseCounts[index], `${optionName} course count`);
  });
  Object.entries(deletedCourses).forEach(([code, year]) => {
    assert.match(groupText(code), new RegExp(`last offered in ${year} and deleted subsequently`));
  });

  assert.match(supplementFile.note, /open HUMA\/SOSC\/SHSS Electives pool/);
  assert.match(supplementFile.note, /Any ECON courses/);
  assert.match(supplementFile.note, /Any SOSC courses/);
  assert.match(supplementFile.note, /require manual review/);
  assert(!courses.some((course) => /^(?:ECON|HUMA|SOSC|SHSS)$/.test(course.courseCode)));
  assert(!courses.some((course) => /X{2,}/.test(course.courseCode)));
});
