const assert = require('node:assert/strict');
const test = require('node:test');
const supplementFile = require('../data/ug-course-supplements/cuhk-bmedn-mathematics-education-courses.json');
const { addGenericCourseSupplements } = require('./generate-ug-catalog');
const { validateSupplement } = require('./validate-ug-supplements');

const EDUCATIONAL_STUDIES = 'EDUC2120 EDUC2140 EDUC2240 EDUC3160 EDUC3201 EDUC3330 EDUC4360'.split(' ');
const PEDAGOGY = 'BMED3011 BMED3021 BMED3031 BMED3051 BMED3071 BMED3081 BMED3091 BMED4910 BMED4920'.split(' ');
const RESEARCH = 'BMED4510 BMED4520'.split(' ');
const SUBJECT_KNOWLEDGE = `
MATH1010 MATH1018 MATH1025 MATH1028 MATH1030 MATH1038 MATH1090 MATH1098
MATH2010 MATH2018 MATH2020 MATH2028 MATH2040 MATH2048 MATH2050 MATH2058
MATH2060 MATH2068 MATH2070 MATH2078 MATH2221 MATH2230 MATH3020 MATH3030
MATH3040 MATH3060 MATH3070 MATH3080 MATH3093 MATH3215 MATH3230 MATH3240
MATH3250 MATH3260 MATH3270 MATH3280 MATH3290 MATH3310 MATH3320 MATH3330
MATH3340 MATH3360 MATH4010 MATH4020 MATH4030 MATH4050 MATH4060 MATH4080
MATH4210 MATH4220 MATH4230 MATH4240 MATH4250 MATH4260 MATH4280
`.trim().split(/\s+/);
const TEACHING_PRACTICE = ['EDUC4030', 'EDUC4040'];
const EXPECTED_CODES = [
  ...EDUCATIONAL_STUDIES,
  ...PEDAGOGY,
  ...RESEARCH,
  ...SUBJECT_KNOWLEDGE,
  ...TEACHING_PRACTICE
].sort();

test('CUHK BMEDN exposes all 75 official Course List rows without treating the pool as required', () => {
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
      id: 'CUHK-UG-BMEDN-35',
      universityCode: 'CUHK',
      code: 'BMEDN',
      jupasCode: 'JS4361',
      nameEn: 'Mathematics and Mathematics Education',
      sourceStatus: 'programme_summary_only',
      courseCount: 1,
      codedCourseCount: 0
    }],
    majors: [{
      id: 'CUHK-UG-BMEDN-35-M1',
      programmeId: 'CUHK-UG-BMEDN-35',
      nameEn: 'Mathematics and Mathematics Education',
      courseCount: 1,
      codedCourseCount: 0
    }],
    courses: []
  };

  addGenericCourseSupplements(catalogue, [supplement]);

  const courses = catalogue.courses;
  const byCode = Object.fromEntries(courses.map((course) => [course.courseCode, course]));
  assert.equal(catalogue.programmes[0].sourceStatus, 'course_codes_available');
  assert.equal(catalogue.programmes[0].codedCourseCount, 75);
  assert.equal(catalogue.majors[0].codedCourseCount, 75);
  assert.equal(courses.length, 75);
  assert.deepEqual(courses.map((course) => course.courseCode).sort(), EXPECTED_CODES);
  assert.equal(courses.filter((course) => course.courseType === 'major_elective').length, 71);
  assert.equal(courses.filter((course) => course.courseType === 'capstone').length, 2);
  assert.equal(courses.filter((course) => course.courseType === 'internship').length, 2);
  assert.equal(courses.reduce((sum, course) => sum + course.credits, 0), 225);
  assert.deepEqual([byCode.EDUC2140.credits, byCode.EDUC3160.credits, byCode.EDUC3201.credits], [2, 2, 2]);
  assert.equal(byCode.MATH2221.credits, 2);
  assert.deepEqual([byCode.EDUC4030.credits, byCode.EDUC4040.credits], [5, 5]);
  assert.equal(byCode.BMED3011.titleEn, 'Mathematics Curriculum and Teaching: Basic Theoryand Practice');
  assert.equal(byCode.MATH3320.titleEn, 'Foundation of Data Analysis');
  assert.equal(byCode.MATH4280.titleEn, 'Innovation and Design in Big Data Analysis');
  assert(courses.every((course) => course.sourceUrl === supplementFile.sourceUrl));

  assert.match(supplementFile.note, /75 unique code-title-unit rows/);
  assert.match(supplementFile.note, /far above the 102-unit Major requirement/);
  assert.match(supplementFile.note, /totalCreditRequired remains 0/);
});
