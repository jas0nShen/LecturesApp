const assert = require('node:assert/strict');
const test = require('node:test');
const supplementFile = require('../data/ug-course-supplements/cuhk-js4136-chinese-studies-2025.json');
const { addGenericCourseSupplements } = require('./generate-ug-catalog');
const { validateSupplement } = require('./validate-ug-supplements');

function withFileMetadata(supplement) {
  return {
    provider: supplementFile.provider,
    academicYear: supplementFile.academicYear,
    sourceUrl: supplementFile.sourceUrl,
    officialUrl: supplementFile.officialUrl,
    ...supplement
  };
}

test('CUHK JS4136 keeps both language Streams isolated with the complete CHES-coded course pool', () => {
  const supplements = supplementFile.supplements.map(withFileMetadata);
  supplements.forEach(validateSupplement);

  const programmeId = 'CUHK-UG-CHESB-4';
  const catalogue = {
    programmes: [{
      id: programmeId,
      universityCode: 'CUHK',
      code: 'CHESB',
      jupasCode: 'JS4136',
      nameEn: 'Chinese Studies',
      sourceStatus: 'programme_summary_only',
      courseCount: 1,
      codedCourseCount: 0
    }],
    majors: [{
      id: `${programmeId}-M1`,
      programmeId,
      code: 'CHINESE-STUDIES',
      nameEn: 'Chinese Studies',
      nameZh: 'Chinese Studies',
      courseCount: 1,
      codedCourseCount: 0
    }],
    courses: []
  };

  addGenericCourseSupplements(catalogue, supplements);

  const majors = catalogue.majors
    .filter((major) => major.programmeId === programmeId)
    .sort((a, b) => a.id.localeCompare(b.id));
  assert.deepEqual(majors.map((major) => major.nameEn), ['International Stream', 'Chinese Native Stream']);
  assert(majors.every((major) => major.courseCount === 47 && major.codedCourseCount === 47));
  assert.equal(catalogue.programmes[0].sourceStatus, 'course_codes_available');
  assert.equal(catalogue.programmes[0].codedCourseCount, 94);
  assert.equal(catalogue.courses.length, 94);

  majors.forEach((major) => {
    const courses = catalogue.courses.filter((course) => course.majorId === major.id);
    const byCode = Object.fromEntries(courses.map((course) => [course.courseCode, course]));
    assert.equal(Object.keys(byCode).length, 47);
    assert.equal(courses.reduce((sum, course) => sum + course.credits, 0), 141);
    assert.equal(byCode.CHES1000.recommendedYear, 1);
    assert.equal(byCode.CHES1000.semester, 'Term 1');
    assert.equal(byCode.CHES3300.recommendedYear, 2);
    assert.equal(byCode.CHES3300.courseType, 'fieldwork');
    assert.equal(byCode.CHES3400.recommendedYear, 3);
    assert.equal(byCode.CHES3402.courseType, 'internship');
    assert.match(byCode.CHES3402.requirementGroups[0], /prior approval required/);
    assert.equal(byCode.CHES4500.recommendedYear, 4);
    assert.equal(byCode.CHES4500.semester, 'Term 2');
    assert.equal(byCode.CHES4500.courseType, 'capstone');
  });

  assert.match(supplementFile.note, /CLCP\/approved CLCC language pools are not included/);
  assert.match(supplementFile.note, /does not claim/);
});
