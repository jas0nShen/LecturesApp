const assert = require('node:assert/strict');
const test = require('node:test');
const supplementFile = require('../data/ug-course-supplements/polyu-js3791-building-engineering-management-2025.json');
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

test('PolyU JS3791 exposes the complete coded standard BEM progression without uncoded requirement slots', () => {
  const supplements = supplementFile.supplements.map(withFileMetadata);
  supplements.forEach(validateSupplement);

  const programmeId = 'POLYU-UG-JS3791-8';
  const majorId = `${programmeId}-M1`;
  const catalogue = {
    programmes: [{
      id: programmeId,
      universityCode: 'POLYU',
      code: 'JS3791',
      nameEn: 'Bachelor of Science (Honours) in Building Engineering and Management',
      sourceStatus: 'programme_summary_only',
      courseCount: 1,
      codedCourseCount: 0
    }],
    majors: [{
      id: majorId,
      programmeId,
      code: 'BACHELOR-OF-SCIENCE-HONOURS-IN-BUILDING-ENGINEER',
      nameEn: 'Bachelor of Science (Honours) in Building Engineering and Management',
      nameZh: 'Bachelor of Science (Honours) in Building Engineering and Management',
      courseCount: 1,
      codedCourseCount: 0
    }],
    courses: []
  };

  addGenericCourseSupplements(catalogue, supplements);

  assert.equal(catalogue.programmes[0].sourceStatus, 'course_codes_available');
  assert.equal(catalogue.programmes[0].codedCourseCount, 34);
  assert.equal(catalogue.majors[0].codedCourseCount, 34);
  assert.equal(catalogue.courses.length, 34);

  const byCode = Object.fromEntries(catalogue.courses.map((course) => [course.courseCode, course]));
  assert.equal(Object.keys(byCode).length, 34);
  assert.equal(byCode.BRE302.recommendedYear, 3);
  assert.equal(byCode.BRE302.semester, 'Semester 2');
  assert.equal(byCode.BRE299.credits, 2);
  assert.equal(byCode.BRE299.courseType, 'internship');
  assert.equal(byCode.BRE299.recommendedYear, 0);
  assert.match(byCode.BRE299.semester, /Stage 1 or Stage 2/);
  assert.equal(byCode.BRE365.credits, 1);
  assert.equal(byCode.BRE365.recommendedYear, 0);
  assert.match(byCode.BRE365.semester, /Stage 4 Semester 1/);
  assert.equal(byCode.BRE4393.credits, 3);
  assert.equal(byCode.BRE4393.recommendedYear, 4);
  assert.equal(byCode.BRE4393.semester, 'Semester 1 / Semester 2');
  assert.equal(byCode.BRE466.credits, 6);
  assert.equal(byCode.BRE466.courseType, 'capstone');
  assert.equal(catalogue.courses.reduce((sum, course) => sum + course.credits, 0), 95);

  assert.match(supplementFile.note, /Uncoded LCR, CAR, GUR and Free Elective slots are omitted/);
  assert.match(supplementFile.note, /Secondary Major in AI and Data Analytics/);
  assert.match(supplementFile.note, /does not assert graduation completion/);
});
