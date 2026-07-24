const assert = require('node:assert/strict');
const test = require('node:test');

const supplementFile = require('../data/ug-course-supplements/hkbu-js2950-individualised-major-2025.json');
const { addGenericCourseSupplements } = require('./generate-ug-catalog');
const { validateSupplement } = require('./validate-ug-supplements');

const PROGRAMME_ID = 'HKBU-UG-BASCT-21';
const MAJOR_ID = `${PROGRAMME_ID}-M1`;

function applySupplement() {
  const supplement = {
    provider: supplementFile.provider,
    academicYear: supplementFile.academicYear,
    sourceUrl: supplementFile.sourceUrl,
    officialUrl: supplementFile.officialUrl,
    ...supplementFile.supplements[0]
  };
  validateSupplement(supplement, 0);

  const catalogue = {
    programmes: [{
      id: PROGRAMME_ID,
      universityCode: 'HKBU',
      jupasCode: 'JS2950',
      nameEn: 'Bachelor of Arts, Science and Technology (Hons) in Individualised Major',
      sourceStatus: 'programme_summary_only',
      courseCount: 1,
      codedCourseCount: 0
    }],
    majors: [{
      id: MAJOR_ID,
      programmeId: PROGRAMME_ID,
      nameEn: 'Bachelor of Arts, Science and Technology (Hons) in Individualised Major',
      courseCount: 1,
      codedCourseCount: 0
    }],
    courses: []
  };

  addGenericCourseSupplements(catalogue, [supplement]);
  return { catalogue, supplement };
}

test('HKBU JS2950 binds all 14 fixed coded requirements to the exact Programme and Major', () => {
  const { catalogue, supplement } = applySupplement();
  const courses = catalogue.courses.filter((course) => course.majorId === MAJOR_ID);

  assert.equal(supplement.programmeId, PROGRAMME_ID);
  assert.equal(supplement.majorId, MAJOR_ID);
  assert.equal(catalogue.programmes[0].sourceStatus, 'course_codes_available');
  assert.equal(catalogue.programmes[0].codedCourseCount, 14);
  assert.equal(catalogue.majors[0].codedCourseCount, 14);
  assert.equal(courses.length, 14);
  assert.equal(new Set(courses.map((course) => course.courseCode)).size, 14);
  assert(courses.every((course) => course.programmeId === PROGRAMME_ID && course.majorId === MAJOR_ID));
});

test('HKBU JS2950 preserves the official fixed-course titles, units and requirement groups', () => {
  const { catalogue } = applySupplement();
  const courses = catalogue.courses;
  const byCode = Object.fromEntries(courses.map((course) => [course.courseCode, course]));

  assert.deepEqual(
    courses.map((course) => [course.courseCode, course.titleEn, course.credits]),
    [
      ['ITS1005', 'Global Challenges I', 3],
      ['ITS2028', 'Global Challenges II', 3],
      ['ITS2029', 'Global Challenges II', 3],
      ['ITS1007', 'Methods of Inquiry', 3],
      ['RELI1006', 'Reasoning for Real World Problem Solving', 3],
      ['ITS1018', 'Transdisciplinary Guided Study I', 3],
      ['ITS1019', 'Transdisciplinary Guided Study II', 3],
      ['ITS2018', 'Transdisciplinary Problem Solving I', 3],
      ['ITS2019', 'Transdisciplinary Problem Solving II', 3],
      ['ITS3008', 'Transdisciplinary Knowledge Application and Transfer I', 6],
      ['ITS3009', 'Transdisciplinary Knowledge Application and Transfer II', 6],
      ['ITS3005', 'Internship', 6],
      ['ITS4898', 'Transdisciplinary Honours Project I', 6],
      ['ITS4899', 'Transdisciplinary Honours Project II', 6]
    ]
  );
  assert.equal(courses.reduce((sum, course) => sum + course.credits, 0), 57);
  assert.equal(courses.filter((course) => course.requirementGroups[0].startsWith('Transdisciplinary Common Core')).length, 3);
  assert.equal(courses.filter((course) => course.requirementGroups[0].startsWith('Learning to Learn Courses')).length, 2);
  assert.equal(courses.filter((course) => course.requirementGroups[0].startsWith('Solution-Based Learning Modules')).length, 6);
  assert.equal(byCode.ITS3005.courseType, 'internship');
  assert.equal(byCode.ITS4898.courseType, 'capstone');
  assert.equal(byCode.ITS4899.courseType, 'capstone');
});

test('HKBU JS2950 keeps the 36-unit Personalised Knowledge and Skills pool open and manual', () => {
  const { catalogue, supplement } = applySupplement();
  const rule = supplement.openPoolRule;

  assert.equal(rule.label, 'Personalised Knowledge and Skills');
  assert.equal(rule.credits, 36);
  assert.match(rule.eligibility, /Any course offered by HKBU except courses offered by the School of Chinese Medicine/);
  assert.equal(rule.academicSupervisorConsultationRequired, true);
  assert.equal(rule.prerequisitesApply, true);
  assert.equal(rule.studyPlanAndCourseSelectionApprovalRequired, true);
  assert.equal(rule.exhaustiveCodeListPublished, false);
  assert.equal(rule.manualReviewRequired, true);
  assert.match(supplementFile.note, /no exhaustive stable code list/);
  assert.match(supplementFile.note, /not expanded into fabricated course records/);
  assert.match(supplementFile.note, /not a closed Programme pool or a graduation-completion decision/);
  assert(catalogue.courses.every((course) => !course.requirementGroups[0].includes('Personalised Knowledge and Skills')));
  assert(catalogue.courses.every((course) => !/(?:TODO|TBC|TBD|PLACEHOLDER|待填|待补)/i.test(course.courseCode)));
});

test('HKBU JS2950 does not infer Year or Term for fixed courses', () => {
  const { catalogue } = applySupplement();

  assert(catalogue.courses.every((course) => course.recommendedYear === 0));
  assert(catalogue.courses.every((course) => course.semester === ''));
});
