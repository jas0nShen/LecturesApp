const assert = require('node:assert/strict');
const test = require('node:test');
const targetFile = require('../data/ug-course-supplements/cityu-js1805-biomedical-sciences-options-2026.json');
const biologicalFile = require('../data/ug-course-supplements/cityu-js1806-biological-sciences-2026.json');
const biomedicalFile = require('../data/ug-course-supplements/cityu-js1807-biomedical-sciences-2026.json');
const { addGenericCourseSupplements } = require('./generate-ug-catalog');
const { validateSupplement } = require('./validate-ug-supplements');

function flatten(file) {
  return file.supplements.map((supplement) => ({
    provider: file.provider,
    academicYear: file.academicYear,
    sourceUrl: supplement.sourceUrl || file.sourceUrl,
    officialUrl: supplement.officialUrl || file.officialUrl,
    additionalSourceUrls: file.additionalSourceUrls,
    note: file.note,
    ...supplement
  }));
}

test('CityU JS1805 keeps the two allocated Major curricula isolated', () => {
  const targetSupplements = flatten(targetFile);
  targetSupplements.forEach(validateSupplement);
  assert.equal(targetSupplements.length, 2);
  assert(targetSupplements.every((supplement) => supplement.copyCoursesFrom));

  const programmes = [
    ['CITYU-UG-BMS-56', 'BMS', 'JS1805', 'Biomedical Sciences (Majors: BSc Biological Sciences / BSc Biomedical Sciences)'],
    ['CITYU-UG-BSCBISI-57', 'BScBISI', 'JS1806', 'BSc Biological Sciences (Features: Bioinformatics, Biochemistry, Genetics, Cellular & Molecular Biology, Immunology / Research Rotation Projects for Hands-on Experience)'],
    ['CITYU-UG-BSCBMS-58', 'BScBMS', 'JS1807', 'BSc Biomedical Sciences (Features: Clinical Chemistry, Hematology, Microbiology and Pathology / Clinical or Industrial Attachment / Intensive Laboratory Experience)']
  ].map(([id, code, jupasCode, nameEn]) => ({
    id,
    universityCode: 'CITYU',
    code,
    jupasCode,
    nameEn,
    sourceStatus: 'programme_summary_only',
    courseCount: 1,
    codedCourseCount: 0
  }));
  const majors = [
    ['CITYU-UG-BMS-56-M1', 'CITYU-UG-BMS-56', 'BSc Biological Sciences'],
    ['CITYU-UG-BMS-56-M2', 'CITYU-UG-BMS-56', 'BSc Biomedical Sciences'],
    ...Array.from({ length: 6 }, (_, index) => [`CITYU-UG-BSCBISI-57-M${index + 1}`, 'CITYU-UG-BSCBISI-57', `Feature ${index + 1}`]),
    ...Array.from({ length: 5 }, (_, index) => [`CITYU-UG-BSCBMS-58-M${index + 1}`, 'CITYU-UG-BSCBMS-58', `Feature ${index + 1}`])
  ].map(([id, programmeId, nameEn]) => ({
    id,
    programmeId,
    code: nameEn.toUpperCase().replace(/[^A-Z0-9]+/g, '-'),
    nameEn,
    courseCount: 0,
    codedCourseCount: 0
  }));
  const catalogue = { programmes, majors, courses: [] };
  const supplements = [
    ...flatten(biologicalFile),
    ...flatten(biomedicalFile),
    ...targetSupplements
  ];

  addGenericCourseSupplements(catalogue, supplements);
  const targetProgramme = catalogue.programmes.find((programme) => programme.id === 'CITYU-UG-BMS-56');
  const targetMajors = catalogue.majors.filter((major) => major.programmeId === targetProgramme.id);
  const biologicalCourses = catalogue.courses.filter((course) => course.majorId === 'CITYU-UG-BMS-56-M1');
  const biomedicalCourses = catalogue.courses.filter((course) => course.majorId === 'CITYU-UG-BMS-56-M2');

  assert.equal(targetProgramme.sourceStatus, 'course_codes_available');
  assert.deepEqual(targetMajors.map((major) => major.nameEn), ['BSc Biological Sciences', 'BSc Biomedical Sciences']);
  assert.equal(targetProgramme.codedCourseCount, 117);
  assert.equal(biologicalCourses.length, 67);
  assert.equal(biomedicalCourses.length, 50);
  assert(biologicalCourses.some((course) => course.courseCode === 'BMS4206' && course.courseType === 'capstone'));
  assert(biomedicalCourses.some((course) => course.courseCode === 'BMS3009' && course.courseType === 'internship'));
  assert.notEqual(biologicalCourses[0].majorId, biomedicalCourses[0].majorId);
  assert.match(targetFile.note, /after Semester A and Semester B of Year 1/);
  assert.match(targetFile.note, /totalCreditRequired=0/);
});
