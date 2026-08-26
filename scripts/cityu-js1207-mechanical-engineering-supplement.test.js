const assert = require('node:assert/strict');
const test = require('node:test');
const supplementFile = require('../data/ug-course-supplements/cityu-js1207-mechanical-engineering-2026.json');
const { addGenericCourseSupplements } = require('./generate-ug-catalog');
const { validateSupplement } = require('./validate-ug-supplements');

test('CityU JS1207 keeps three Mechanical Engineering Major curricula isolated', () => {
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

  const programmeId = 'CITYU-UG-MNE-45';
  const catalogue = {
    programmes: [{
      id: programmeId,
      universityCode: 'CITYU',
      code: 'MNE',
      jupasCode: 'JS1207',
      nameEn: 'Mechanical Engineering (Majors: BEng Aerospace Engineering / BEng Mechanical Engineering / BEng Nuclear and Risk Engineering)',
      sourceStatus: 'programme_summary_only',
      courseCount: 1,
      codedCourseCount: 0
    }],
    majors: [
      ['M1', 'BENG-AEROSPACE-ENGINEERING', 'BEng Aerospace Engineering'],
      ['M2', 'BENG-MECHANICAL-ENGINEERING', 'BEng Mechanical Engineering'],
      ['M3', 'BENG-NUCLEAR-AND-RISK-ENGINEERING', 'BEng Nuclear and Risk Engineering']
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
  const byMajor = Object.fromEntries(catalogue.majors.map((major) => [
    major.nameEn,
    catalogue.courses.filter((course) => course.majorId === major.id)
  ]));
  assert.equal(catalogue.programmes[0].codedCourseCount, 204);
  assert.deepEqual(Object.fromEntries(Object.entries(byMajor).map(([name, courses]) => [name, courses.length])), {
    'BEng Aerospace Engineering': 65,
    'BEng Mechanical Engineering': 61,
    'BEng Nuclear and Risk Engineering': 78
  });
  assert(byMajor['BEng Aerospace Engineering'].some((course) => course.courseCode === 'MNE2020' && course.credits === 0));
  assert(byMajor['BEng Aerospace Engineering'].some((course) => course.courseCode === 'MNE4068' && course.courseType === 'capstone'));
  assert(byMajor['BEng Mechanical Engineering'].some((course) => course.courseCode === 'MNE3123' && course.courseType === 'internship'));
  assert(byMajor['BEng Nuclear and Risk Engineering'].some((course) => course.courseCode === 'MNE4118' && course.credits === 6));
  assert(byMajor['BEng Nuclear and Risk Engineering'].some((course) => course.courseCode === 'FS4001' && course.credits === 8));
  assert.match(supplementFile.note, /65, 61 and 78 unique stable course codes/);
  assert.match(supplementFile.note, /totalCreditRequired=0/);
});
