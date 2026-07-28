const assert = require('node:assert/strict');
const test = require('node:test');
const supplementFile = require('../data/ug-course-supplements/cuhk-puhsn-public-humanities-courses-2025.json');
const { addGenericCourseSupplements } = require('./generate-ug-catalog');
const { validateSupplement } = require('./validate-ug-supplements');

const EXPECTED_CODES = `
CURE1000 CURE1004 CURE1009 CURE1400 CURE1401 CURE1403 CURE2001 CURE4014 CURE4038
CURE3015
CURE2007 CURE2010 CURE2031 CURE2032 CURE2042 CURE2051 CURE3011 CURE3030 CURE3038 CURE4008 CURE4028 COMM3840 COMM3841 HIST2010
CURE2003 CURE2005 CURE2018 CURE2019 CURE2025 CURE2145 CURE2228 CURE3003 CURE3012 CURE3025 CURE3032 CURE3037 CURE3144 CURE4031
CURE2014 CURE2022 CURE2036 CURE2047 CURE3007 CURE3013
CURE2006 CURE2030 CURE2040 CURE2066 CURE3014 CURE3026 CURE3033 CURE3034 CURE3066 CURE4021 CURE4033 CURE4040
CURE2404 CURE3401 CURE3409 CURE4403 CURE4404 CURE4411 ANTH2370 ANTH2730
CURE2406 CURE2407 CURE3036 CURE3405 CURE3408 CURE4401 CURE4421 FAAS3108
CURE2403 CURE2405 CURE2410 CURE3508 CURE4408 CURE4431 ANTH4720
CURE2409 CURE2411 CURE2412 CURE3402 CURE3403 CURE3404 CURE3406 CURE3407 CURE4441
`.trim().split(/\s+/).sort();

test('CUHK Public Humanities preserves the complete 88-course intake list as browse-only', () => {
  const [rawSupplement] = supplementFile.supplements;
  const supplement = {
    provider: supplementFile.provider,
    academicYear: supplementFile.academicYear,
    sourceUrl: supplementFile.sourceUrl,
    officialUrl: supplementFile.officialUrl,
    ...rawSupplement
  };
  validateSupplement(supplement, 0);

  const catalogue = {
    programmes: [{
      id: 'CUHK-UG-PUHSN-13',
      universityCode: 'CUHK',
      code: 'PUHSN',
      jupasCode: 'JS4100',
      nameEn: 'Public Humanities',
      sourceStatus: 'programme_summary_only',
      courseCount: 1,
      codedCourseCount: 0
    }],
    majors: [{
      id: 'CUHK-UG-PUHSN-13-M1',
      programmeId: 'CUHK-UG-PUHSN-13',
      nameEn: 'Public Humanities',
      courseCount: 1,
      codedCourseCount: 0
    }],
    courses: []
  };

  addGenericCourseSupplements(catalogue, [supplement]);

  const courses = catalogue.courses;
  const byCode = Object.fromEntries(courses.map((course) => [course.courseCode, course]));
  assert.equal(catalogue.programmes[0].sourceStatus, 'course_codes_available');
  assert.equal(catalogue.programmes[0].codedCourseCount, 88);
  assert.equal(catalogue.majors[0].codedCourseCount, 88);
  assert.equal(courses.length, 88);
  assert.deepEqual(courses.map((course) => course.courseCode).sort(), EXPECTED_CODES);

  assert.equal(courses.filter((course) => course.courseType === 'core').length, 7);
  assert.equal(courses.filter((course) => course.courseType === 'capstone').length, 2);
  assert.equal(courses.filter((course) => course.courseType === 'major_elective').length, 79);
  assert(courses.every((course) => course.credits === 3));
  assert.equal(byCode.CURE1000.semester, 'Fall / Spring');
  assert.equal(byCode.CURE1009.semester, 'Spring');
  assert.equal(byCode.CURE4014.courseType, 'capstone');
  assert.equal(byCode.CURE4038.courseType, 'capstone');
  assert.match(byCode.CURE2006.requirementGroups[0], /choose any 3/);
  assert.match(byCode.CURE2404.requirementGroups[0], /CURE2024/);
  assert.match(byCode.CURE3013.requirementGroups[0], /CURE3031/);
  assert.equal(byCode.CURE3408.titleEn, 'Curating and Managing Arts Festival');
  assert.match(byCode.CURE3408.requirementGroups[0], /Curating and Organizing Arts Festival/);
  assert.equal(byCode.CURE2024, undefined);
  assert.equal(byCode.CURE3031, undefined);
  assert(courses.every((course) => course.sourceUrl === supplementFile.sourceUrl));

  assert.match(supplementFile.note, /66-unit standard Major/);
  assert.match(supplementFile.note, /51-unit senior-entry Major/);
  assert.match(supplementFile.note, /all 88 courses/);
  assert.match(supplementFile.note, /CURE2024\/CURE2404/);
  assert.match(supplementFile.note, /Religious Studies Areas pool/);
  assert.match(supplementFile.note, /browse-only/);
});
