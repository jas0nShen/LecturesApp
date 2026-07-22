const assert = require('node:assert/strict');
const test = require('node:test');
const supplementFile = require('../data/ug-course-supplements/cityu-js1202-chemistry-streams-2026.json');
const { addGenericCourseSupplements } = require('./generate-ug-catalog');
const { validateSupplement } = require('./validate-ug-supplements');

test('CityU JS1202 preserves the official 2026/27 Chemistry Stream pools', () => {
  const [rawSupplement] = supplementFile.supplements;
  const supplement = {
    provider: supplementFile.provider,
    academicYear: supplementFile.academicYear,
    sourceUrl: supplementFile.sourceUrl,
    officialUrl: supplementFile.officialUrl,
    ...rawSupplement
  };
  validateSupplement(supplement, 0);

  const majorNames = ['Comprehensive Chemistry', 'Cosmetic Chemistry', 'Forensic Chemistry', 'Global Research Enrichment and Technopreneurship (GREAT)'];
  const catalogue = {
    programmes: [{
      id: 'CITYU-UG-BSCCHEM-41', universityCode: 'CITYU', code: 'BScCHEM', jupasCode: 'JS1202',
      nameEn: 'BSc Chemistry', sourceStatus: 'programme_summary_only', courseCount: 0, codedCourseCount: 0
    }],
    majors: majorNames.map((nameEn, index) => ({
      id: `CITYU-UG-BSCCHEM-41-M${index + 1}`,
      programmeId: 'CITYU-UG-BSCCHEM-41',
      code: `STREAM-${index + 1}`,
      nameEn,
      courseCount: 0,
      codedCourseCount: 0
    })),
    courses: []
  };

  addGenericCourseSupplements(catalogue, [supplement]);

  const byMajor = Object.fromEntries(catalogue.majors.map((major) => [
    major.id,
    catalogue.courses.filter((course) => course.majorId === major.id)
  ]));
  const codes = (majorId) => new Set(byMajor[majorId].map((course) => course.courseCode));
  assert.equal(catalogue.programmes[0].sourceStatus, 'course_codes_available');
  assert.equal(catalogue.programmes[0].codedCourseCount, 281);
  assert.deepEqual(catalogue.majors.map((major) => major.codedCourseCount), [69, 69, 71, 72]);
  assert.equal(catalogue.courses.length, 281);
  assert(byMajor['CITYU-UG-BSCCHEM-41-M1'].every((course) => course.recommendedYear === 0 && course.semester === ''));

  assert(codes('CITYU-UG-BSCCHEM-41-M1').has('CHEM4036'));
  assert(codes('CITYU-UG-BSCCHEM-41-M2').has('CHEM4091'));
  assert(codes('CITYU-UG-BSCCHEM-41-M3').has('CHEM2809'));
  assert(codes('CITYU-UG-BSCCHEM-41-M3').has('CHEM3017'));
  assert(codes('CITYU-UG-BSCCHEM-41-M4').has('CSCI4007'));
  assert(codes('CITYU-UG-BSCCHEM-41-M4').has('CHEM4086'));
  assert(!codes('CITYU-UG-BSCCHEM-41-M4').has('CHEM4036'));
  const variable = byMajor['CITYU-UG-BSCCHEM-41-M1'].find((course) => course.courseCode === 'CHEM3042');
  assert.equal(variable.credits, 0);
  assert.match(variable.description, /1-4 variable credits/);
  assert.match(supplement.evidenceNote, /manual review/);
  assert.match(supplement.evidenceNote, /does not publish a complete recommended Year\/Semester plan/);
});
