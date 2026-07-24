const assert = require('node:assert/strict');
const test = require('node:test');
const supplementFile = require('../data/ug-course-supplements/hku-6755-bba-finance-curriculum-2025.json');
const { addGenericCourseSupplements } = require('./generate-ug-catalog');
const { validateSupplement } = require('./validate-ug-supplements');

const PROGRAMMES = [
  ['HKU-UG-6755-69', 'Entrepreneurship, Design and Innovation'],
  ['HKU-UG-6755-70', 'Finance'],
  ['HKU-UG-6755-71', 'Human Resource Management'],
  ['HKU-UG-6755-72', 'Information Systems and Analytics'],
  ['HKU-UG-6755-73', 'Marketing']
];

const EXPECTED_FINANCE_CODES = [
  'ACCT1101', 'ECON1210', 'FINA1310', 'ECON1280', 'IIMT1640',
  'ECON1220', 'MATH1009', 'MATH1013', 'ECON2280', 'FINA2320', 'FINA2322', 'ECON4200',
  'IIMT2601', 'MGMT2401', 'MKTG2501',
  'ACCT3114', 'FINA2311', 'FINA2312', 'FINA2330', 'FINA2331', 'FINA2332', 'FINA2334',
  'FINA2342', 'FINA2343', 'FINA2344', 'FINA2350', 'FINA2382', 'FINA2383', 'FINA2385',
  'FINA2386', 'FINA2390', 'FINA3316', 'FINA3317', 'FINA3318', 'FINA3319', 'FINA3322',
  'FINA3323', 'FINA3324', 'FINA3325', 'FINA3326', 'FINA3327', 'FINA3334', 'FINA3335',
  'FINA3336', 'FINA3337', 'FINA3338', 'FINA3339', 'FINA3340', 'FINA3350', 'FINA3351',
  'FINA3353', 'FINA3360', 'FINA3381', 'FINA3382', 'FINA3383', 'FINA3384', 'FINA3385',
  'FINA3386', 'FINA3391', 'FINA4341', 'FINA4354', 'FINA4359', 'FINA4392'
];

test('HKU BBA Finance preserves the closed 78-credit major structure without leaking to sibling 6755 programmes', () => {
  const [supplement] = supplementFile.supplements;
  validateSupplement({
    provider: supplementFile.provider,
    academicYear: supplementFile.academicYear,
    sourceUrl: supplementFile.sourceUrl,
    officialUrl: supplementFile.officialUrl,
    ...supplement
  }, 0);

  const catalogue = {
    programmes: PROGRAMMES.map(([id, majorName]) => ({
      id,
      universityCode: 'HKU',
      code: '6755',
      nameEn: `Bachelor of Business Administration (Major in ${majorName})`,
      sourceStatus: 'programme_summary_only',
      courseCount: 1,
      codedCourseCount: 0
    })),
    majors: PROGRAMMES.map(([programmeId, majorName]) => ({
      id: `${programmeId}-M1`,
      programmeId,
      nameEn: `Bachelor of Business Administration (Major in ${majorName})`,
      courseCount: 1,
      codedCourseCount: 0
    })),
    courses: []
  };

  addGenericCourseSupplements(catalogue, [{
    provider: supplementFile.provider,
    academicYear: supplementFile.academicYear,
    sourceUrl: supplementFile.sourceUrl,
    officialUrl: supplementFile.officialUrl,
    ...supplement
  }]);

  const financeProgramme = catalogue.programmes.find((programme) => programme.id === 'HKU-UG-6755-70');
  const financeMajor = catalogue.majors.find((major) => major.id === 'HKU-UG-6755-70-M1');
  const financeCourses = catalogue.courses.filter((course) => course.majorId === financeMajor.id);
  const siblingProgrammes = catalogue.programmes.filter((programme) => programme.id !== financeProgramme.id);
  const siblingMajors = catalogue.majors.filter((major) => major.id !== financeMajor.id);
  const foundation = financeCourses.filter((course) => course.courseType === 'foundation');
  const core = financeCourses.filter((course) => course.courseType === 'core');
  const capstone = financeCourses.filter((course) => course.courseType === 'capstone');
  const electives = financeCourses.filter((course) => course.courseType === 'major_elective');
  const financeElectivePool = electives.filter((course) => (
    course.requirementGroups[0].startsWith('Finance disciplinary elective pool')
  ));

  assert.equal(financeProgramme.sourceStatus, 'course_codes_available');
  assert.equal(financeProgramme.codedCourseCount, 63);
  assert.equal(financeMajor.codedCourseCount, 63);
  assert.equal(financeCourses.length, 63);
  assert.equal(new Set(financeCourses.map((course) => course.courseCode)).size, 63);
  assert.deepEqual(
    financeCourses.map((course) => course.courseCode).sort(),
    EXPECTED_FINANCE_CODES.sort()
  );

  assert.equal(foundation.length, 5);
  assert.equal(core.length, 6);
  assert.equal(capstone.length, 1);
  assert.equal(capstone[0].courseCode, 'ECON4200');
  assert.equal(electives.length, 51);
  assert.equal(financeElectivePool.length, 48);
  assert.equal(financeElectivePool.filter((course) => course.credits === 12).length, 1);
  assert.equal(financeElectivePool.find((course) => course.courseCode === 'FINA4392').credits, 12);
  assert.equal(
    financeElectivePool.find((course) => course.courseCode === 'FINA4359').titleEn,
    'Data analytics, quantitative finance, and blockchain finance'
  );

  assert.equal(24 + 36 + 6 + 12, 78);
  assert(['ACCT1101', 'ECON1280', 'IIMT1640', 'MATH1009', 'MATH1013', 'FINA2322', 'ECON4200', 'ACCT3114', 'FINA4359', 'FINA4392']
    .every((code) => financeCourses.some((course) => course.courseCode === code)));
  assert(financeCourses.every((course) => course.sourceUrl === supplementFile.sourceUrl));
  assert(!financeCourses.some((course) => /^(?:CCXX|AILTxxxx|CUNDxxxx|FINAxxxx)$/i.test(course.courseCode)));

  assert(siblingProgrammes.every((programme) => (
    programme.sourceStatus === 'programme_summary_only'
    && programme.codedCourseCount === 0
  )));
  assert(siblingMajors.every((major) => major.codedCourseCount === 0));
  assert.equal(catalogue.courses.filter((course) => course.majorId !== financeMajor.id).length, 0);
});
