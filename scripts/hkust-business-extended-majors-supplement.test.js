const assert = require('node:assert/strict');
const test = require('node:test');
const path = require('node:path');
const supplementFile = require('../data/ug-course-supplements/hkust-business-extended-majors-2025.json');
const { addGenericCourseSupplements, loadGenericCourseSupplements } = require('./generate-ug-catalog');
const { validateSupplement } = require('./validate-ug-supplements');

test('HKUST Business Extended Majors remain isolated as AI, DMCA and Sustainability choices', () => {
  const allSupplements = loadGenericCourseSupplements(path.join(__dirname, '..', 'data', 'ug-course-supplements'));
  const supplements = allSupplements.filter((item) => item.programmeId === 'HKUST-UG-BUSINESS-WITH-EXTENDED-MAJOR-IN-ARTIFICIAL-INTEL-8');
  assert.equal(supplements.length, 3);
  supplements.forEach(validateSupplement);

  const programmeId = 'HKUST-UG-BUSINESS-WITH-EXTENDED-MAJOR-IN-ARTIFICIAL-INTEL-8';
  const catalogue = {
    programmes: [{
      id: programmeId, universityCode: 'HKUST', code: '', jupasCode: '',
      nameEn: 'Business with Extended Major in Artificial Intelligence / Digital Media and Creative Arts / Sustainability',
      sourceStatus: 'programme_summary_only', courseCount: 1, codedCourseCount: 0
    }],
    majors: [{
      id: `${programmeId}-M1`, programmeId,
      code: 'BUSINESS-WITH-EXTENDED-MAJOR', nameEn: 'Business with Extended Major in Artificial Intelligence / Digital Media and Creative Arts / Sustainability',
      courseCount: 1, codedCourseCount: 0
    }],
    courses: []
  };

  addGenericCourseSupplements(catalogue, allSupplements);
  const majors = catalogue.majors.filter((major) => major.programmeId === programmeId);
  const counts = Object.fromEntries(majors.map((major) => [major.nameEn, major.codedCourseCount]));
  assert.deepEqual(counts, {
    'Extended Major in Artificial Intelligence': 75,
    'Extended Major in Digital Media and Creative Arts': 86,
    'Extended Major in Sustainability': 55
  });
  assert.equal(catalogue.programmes[0].codedCourseCount, 216);
  assert.equal(catalogue.courses.length, 216);

  const coursesFor = (name) => {
    const major = majors.find((item) => item.nameEn === name);
    return catalogue.courses.filter((course) => course.majorId === major.id);
  };
  const ai = coursesFor('Extended Major in Artificial Intelligence');
  const dmca = coursesFor('Extended Major in Digital Media and Creative Arts');
  const sust = coursesFor('Extended Major in Sustainability');
  assert(ai.some((course) => course.courseCode === 'COMP4211'));
  assert(!ai.some((course) => course.courseCode === 'HUMA3150'));
  assert(dmca.some((course) => course.courseCode === 'HUMA3150' && course.credits === 0));
  assert(dmca.some((course) => course.courseCode === 'HUMA3105' && /deleted subsequently/.test(course.requirementGroups[0])));
  assert(sust.some((course) => course.courseCode === 'SUST1001' && course.credits === 0));
  assert(sust.some((course) => course.courseCode === 'CIVL4560' && /deleted subsequently/.test(course.requirementGroups[0])));
  assert.match(supplementFile.note, /three isolated Programme-local Major choices/);
  assert.match(supplementFile.note, /86 unique coded rows/);
  assert.match(supplementFile.note, /55 unique coded rows/);
  assert.match(supplementFile.note, /totalCreditRequired=0/);
});
