const assert = require('node:assert/strict');
const test = require('node:test');
const supplementFile = require('../data/ug-course-supplements/cityu-js1201-architecture-civil-engineering-2026.json');
const { addGenericCourseSupplements } = require('./generate-ug-catalog');
const { validateSupplement } = require('./validate-ug-supplements');

test('CityU JS1201 keeps three current ACE Major curricula isolated and browse-only', () => {
  const supplements = supplementFile.supplements.map((supplement) => ({
    provider: supplementFile.provider,
    academicYear: supplementFile.academicYear,
    sourceUrl: supplement.sourceUrl || supplementFile.sourceUrl,
    officialUrl: supplement.officialUrl || supplementFile.officialUrl,
    additionalSourceUrls: supplementFile.additionalSourceUrls,
    note: supplementFile.note,
    ...supplement
  }));
  supplements.forEach(validateSupplement);
  assert.equal(supplements.length, 4);

  const programmeId = 'CITYU-UG-ACE-40';
  const catalogue = {
    programmes: [{
      id: programmeId,
      universityCode: 'CITYU',
      code: 'ACE',
      jupasCode: 'JS1201',
      nameEn: 'Architecture and Civil Engineering (Majors: BEng Architectural Engineering / BEng Civil Engineering / BSc Architecture and Surveying)',
      sourceStatus: 'programme_summary_only',
      courseCount: 1,
      codedCourseCount: 0
    }],
    majors: [
      ['M1', 'BENG-ARCHITECTURAL-ENGINEERING', 'BEng Architectural Engineering'],
      ['M2', 'BENG-CIVIL-ENGINEERING', 'BEng Civil Engineering'],
      ['M3', 'BSC-ARCHITECTURE-AND-SURVEYING', 'BSc Architecture and Surveying']
    ].map(([suffix, code, nameEn]) => ({
      id: `${programmeId}-${suffix}`,
      programmeId,
      code,
      nameEn,
      courseCount: 0,
      codedCourseCount: 0
    })),
    courses: []
  };

  addGenericCourseSupplements(catalogue, supplements);
  const counts = Object.fromEntries(catalogue.majors.map((major) => [
    major.nameEn,
    catalogue.courses.filter((course) => course.majorId === major.id).length
  ]));
  assert.deepEqual(counts, {
    'BEng Architectural Engineering': 41,
    'BEng Civil Engineering': 55,
    'BSc Architecture and Surveying': 64
  });
  assert.equal(catalogue.programmes[0].codedCourseCount, 160);
  const architectural = catalogue.courses.filter((course) => course.majorId === `${programmeId}-M1`);
  const civil = catalogue.courses.filter((course) => course.majorId === `${programmeId}-M2`);
  const surveying = catalogue.courses.filter((course) => course.majorId === `${programmeId}-M3`);
  assert(architectural.some((course) => course.courseCode === 'CA4749' && course.courseType === 'capstone'));
  assert(civil.some((course) => course.courseCode === 'CA3560' && /Structural Engineering \/ Infrastructure and Smart City/.test(course.requirementGroups[0])));
  assert(surveying.some((course) => course.courseCode === 'CA4539' && course.courseType === 'capstone'));
  assert(surveying.some((course) => course.courseCode === 'CA3508' && course.courseType === 'internship'));
  assert.match(supplementFile.note, /41, 55 and 64 unique stable codes/);
  assert.match(supplementFile.note, /totalCreditRequired=0/);
});
