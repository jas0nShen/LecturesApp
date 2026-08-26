const assert = require('node:assert/strict');
const test = require('node:test');
const supplementFile = require('../data/ug-course-supplements/hkust-extended-major-ai-requirements-2025.json');
const { addGenericCourseSupplements } = require('./generate-ug-catalog');
const { validateSupplement } = require('./validate-ug-supplements');

const REQUIRED = 'EMIA2010A EMIA2020 EMIA4110 COMP4211 MATH4432 EMIA4990 EMIA4991 COMP1023 COMP2211'.split(' ');

test('HKUST Extended Major in AI exposes its 75 official rows without copying a base Engineering Major', () => {
  const [rawSupplement] = supplementFile.supplements;
  const supplement = {
    provider: supplementFile.provider,
    academicYear: supplementFile.academicYear,
    sourceUrl: supplementFile.sourceUrl,
    officialUrl: supplementFile.officialUrl,
    ...rawSupplement
  };
  validateSupplement(supplement, 0);

  const programmeId = 'HKUST-UG-JS5282-ENGINEERING-WITH-EXTENDED-MAJOR-IN-ARTIFI-23';
  const catalogue = {
    programmes: [{
      id: programmeId, universityCode: 'HKUST', code: 'JS5282 Engineering with Extended Major in Artificial Intelligence',
      jupasCode: 'JS5282 Engineering with Extended Major in Artificial Intelligence',
      nameEn: 'Engineering with Extended Major in Artificial Intelligence', sourceStatus: 'programme_summary_only',
      courseCount: 1, codedCourseCount: 0
    }],
    majors: [{
      id: `${programmeId}-M1`, programmeId,
      nameEn: 'Engineering with Extended Major in Artificial Intelligence', courseCount: 1, codedCourseCount: 0
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
  assert.equal(new Set(courses.map((course) => course.courseCode)).size, 75);
  assert(REQUIRED.every((code) => byCode[code]));
  assert.equal(courses.filter((course) => course.courseType === 'core').length, 7);
  assert.equal(courses.filter((course) => course.courseType === 'capstone').length, 2);
  assert.equal(courses.filter((course) => course.courseType === 'major_elective').length, 66);
  assert.equal(byCode.EMIA2010A.credits, 0);
  assert.equal(byCode.EMIA3500A.credits, 2);
  assert.equal(byCode.ISOM3340.credits, 1);
  assert.equal(byCode.PHYS4811.credits, 1);
  assert.match(byCode.ELEC4230.requirementGroups[0], /deleted subsequently/);
  assert(courses.every((course) => course.sourceUrl === supplementFile.sourceUrl));
  assert.match(supplementFile.note, /75 unique coded rows/);
  assert.match(supplementFile.note, /at least 22 Extended Major credits/);
  assert.match(supplementFile.note, /totalCreditRequired=0/);
});
