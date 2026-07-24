const assert = require('node:assert/strict');
const test = require('node:test');
const supplementFile = require('../data/ug-course-supplements/hkust-data-science-technology-curriculum-2025.json');
const { addGenericCourseSupplements } = require('./generate-ug-catalog');
const { validateSupplement } = require('./validate-ug-supplements');

const PROGRAMME_ID = 'HKUST-UG-JS5102-SCIENCE-GROUP-A-JS5282-ENGINEERING-WITH-E-16';
const MAJOR_ID = `${PROGRAMME_ID}-M1`;
const EXTENDED_MAJOR_CONTROL_ID = `${PROGRAMME_ID}-M2`;

function applySupplement() {
  const rawSupplement = supplementFile.supplements[0];
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
      id: PROGRAMME_ID,
      universityCode: 'HKUST',
      nameEn: 'BSc in Data Science and Technology',
      sourceStatus: 'programme_summary_only',
      courseCount: 1,
      codedCourseCount: 0
    }],
    majors: [
      {
        id: MAJOR_ID,
        programmeId: PROGRAMME_ID,
        nameEn: 'BSc in Data Science and Technology',
        courseCount: 1,
        codedCourseCount: 0
      },
      {
        id: EXTENDED_MAJOR_CONTROL_ID,
        programmeId: PROGRAMME_ID,
        nameEn: 'Engineering with Extended Major in Artificial Intelligence',
        courseCount: 0,
        codedCourseCount: 0
      }
    ],
    courses: []
  };

  addGenericCourseSupplements(catalogue, [supplement]);
  return { catalogue, supplement };
}

test('HKUST DSCT binds the joint-program supplement to exact M1 and isolates Extended Major content', () => {
  const { catalogue, supplement } = applySupplement();
  const targetCourses = catalogue.courses.filter((course) => course.majorId === MAJOR_ID);
  const extendedMajorCourses = catalogue.courses.filter((course) => course.majorId === EXTENDED_MAJOR_CONTROL_ID);

  assert.equal(supplementFile.academicYear, '2025/26');
  assert.equal(supplement.programmeId, PROGRAMME_ID);
  assert.equal(supplement.majorId, MAJOR_ID);
  assert.equal(catalogue.programmes[0].sourceStatus, 'course_codes_available');
  assert.equal(catalogue.programmes[0].codedCourseCount, 67);
  assert.equal(catalogue.majors.find((major) => major.id === MAJOR_ID).codedCourseCount, 67);
  assert.equal(catalogue.majors.find((major) => major.id === EXTENDED_MAJOR_CONTROL_ID).codedCourseCount, 0);
  assert.equal(targetCourses.length, 67);
  assert.equal(new Set(targetCourses.map((course) => course.courseCode)).size, 67);
  assert.equal(extendedMajorCourses.length, 0);
  assert.match(supplementFile.note, /joint-disciplinary across MATH, COMP and ELEC/);
  assert.match(supplementFile.note, /exempted from School Requirements/);
  assert(!targetCourses.some((course) => /Extended Major/.test(course.requirementGroups[0])));
});

test('HKUST DSCT preserves all pre-enrollment and Major Required alternatives', () => {
  const { catalogue } = applySupplement();
  const courses = catalogue.courses.filter((course) => course.majorId === MAJOR_ID);
  const prerequisites = courses.filter((course) => course.courseType === 'prerequisite');
  const core = courses.filter((course) => course.courseType === 'core');
  const capstones = courses.filter((course) => course.courseType === 'capstone');
  const byCode = Object.fromEntries(courses.map((course) => [course.courseCode, course]));

  assert.equal(prerequisites.length, 6);
  assert.equal(core.length, 20);
  assert.equal(capstones.length, 4);
  assert.match(byCode.MATH1013.requirementGroups[0], /complete before enrollment into DSCT/);
  assert.match(byCode.MATH2121.requirementGroups[0], /choose MATH2121 or MATH2131/);
  assert.match(byCode.MATH4432.requirementGroups[0], /choose MATH4432 or COMP4211/);
  assert.match(byCode.COMP2011.requirementGroups[0], /take COMP2011 and COMP2012, or COMP2012H/);
  assert.match(byCode.COMP3711.requirementGroups[0], /choose COMP3711 or COMP3711H/);
  assert.equal(byCode.DSCT4900.credits, 0);
});

test('HKUST DSCT preserves the bounded elective areas and capstone-dependent counting rules', () => {
  const { catalogue } = applySupplement();
  const courses = catalogue.courses.filter((course) => course.majorId === MAJOR_ID);
  const electives = courses.filter((course) => course.courseType === 'major_elective');
  const compElec = electives.filter((course) => course.requirementGroups[0].includes('COMP/ELEC area'));
  const math = electives.filter((course) => course.requirementGroups[0].includes('MATH area'));

  assert.equal(electives.length, 37);
  assert.equal(compElec.length, 17);
  assert.equal(math.length, 20);
  assert(electives.every((course) => /bounded 2025-26 list/.test(course.requirementGroups[0])));
  assert(compElec.every((course) => /3-course\/9-credit or 4-course\/12-credit rule/.test(course.requirementGroups[0])));
  assert(math.every((course) => /at least 1 and no more than 2 MATH electives/.test(course.requirementGroups[0])));
  assert(!courses.some((course) => /XXXX|0000-LEVEL/.test(course.courseCode)));
});

test('HKUST DSCT retains the unresolved COMP4910 elective-scaling boundary', () => {
  const { catalogue } = applySupplement();
  const byCode = Object.fromEntries(
    catalogue.courses
      .filter((course) => course.majorId === MAJOR_ID)
      .map((course) => [course.courseCode, course])
  );

  assert.equal(byCode.COMP4910.credits, 6);
  assert.match(byCode.COMP4910.requirementGroups[0], /does not state whether the COMP4910 path uses the 9- or 12-credit elective rule/);
  assert.match(byCode.COMP4910.requirementGroups[0], /manual review required/);
  assert.match(byCode.MATH4995.requirementGroups[0], /4 Data Science electives \/ 12 credits/);
  assert.match(byCode.COMP4981.requirementGroups[0], /3 Data Science electives \/ 9 credits/);
  assert.match(byCode.COMP4981H.requirementGroups[0], /3 Data Science electives \/ 9 credits/);
});

test('HKUST DSCT has no variable-credit rows and assigns only pathway-selected placements', () => {
  const { catalogue, supplement } = applySupplement();
  const courses = catalogue.courses.filter((course) => course.majorId === MAJOR_ID);
  const byCode = Object.fromEntries(courses.map((course) => [course.courseCode, course]));
  const alternativesWithoutPlacement = ['MATH1020', 'MATH1023', 'MATH1024', 'MATH2131', 'MATH2431', 'MATH4432', 'COMP4981', 'COMP4981H', 'COMP2012H', 'COMP2711H', 'COMP3711H'];

  assert(!supplement.courses.some((course) => course.creditRange || course.creditsMin !== undefined || course.creditsMax !== undefined));
  assert.deepEqual([byCode.MATH1013.recommendedYear, byCode.MATH1013.semester], [1, 'Fall']);
  assert.deepEqual([byCode.MATH1014.recommendedYear, byCode.MATH1014.semester], [1, 'Spring']);
  assert.deepEqual([byCode.COMP1023.recommendedYear, byCode.COMP1023.semester], [1, 'Spring']);
  assert.deepEqual([byCode.MATH2023.recommendedYear, byCode.MATH2023.semester], [2, 'Fall']);
  assert.deepEqual([byCode.COMP4211.recommendedYear, byCode.COMP4211.semester], [3, 'Spring']);
  assert.deepEqual([byCode.MATH4995.recommendedYear, byCode.MATH4995.semester], [4, 'Fall']);
  assert.deepEqual([byCode.COMP2011.recommendedYear, byCode.COMP2011.semester], [2, 'Fall']);
  assert.deepEqual([byCode.COMP2012.recommendedYear, byCode.COMP2012.semester], [3, 'Fall']);
  alternativesWithoutPlacement.forEach((code) => {
    assert.equal(byCode[code].recommendedYear, 0);
    assert.equal(byCode[code].semester, '');
  });
  assert.equal(byCode.DSCT4900.recommendedYear, 0);
  assert.match(byCode.DSCT4900.description, /every term from Year 2 Fall through Year 4 Spring/);
});
