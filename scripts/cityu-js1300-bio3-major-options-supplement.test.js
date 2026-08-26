const assert = require('node:assert/strict');
const test = require('node:test');
const targetFile = require('../data/ug-course-supplements/cityu-js1300-bio3-major-options-2026.json');
const biomedicalEngineeringFile = require('../data/ug-course-supplements/cityu-js1211-biomedical-engineering-2026.json');
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

test('CityU JS1300 keeps all three Bio3 Major curricula and research requirements isolated', () => {
  const targetSupplements = flatten(targetFile);
  targetSupplements.forEach(validateSupplement);
  assert.equal(targetSupplements.length, 3);
  assert(targetSupplements.every((supplement) => supplement.copyCoursesFrom));

  const programmeId = 'CITYU-UG-BIO3-54';
  const catalogue = {
    programmes: [
      [programmeId, 'Bio3', 'JS1300', 'Integrative Bioscience & Bioengineering Programme (Bio3) (Features: Free Choice of Major / Overseas Research Opportunities / Interdisciplinary)'],
      ['CITYU-UG-BENGBME-48', 'BEngBME', 'JS1211', 'BEng Biomedical Engineering (Features: Medical Technology / Bioinstrumentation / Cell and Tissue Engineering / Biomedical Robotics)'],
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
    })),
    majors: [
      ...Array.from({ length: 3 }, (_, index) => [`${programmeId}-M${index + 1}`, programmeId, `Feature ${index + 1}`]),
      ...Array.from({ length: 4 }, (_, index) => [`CITYU-UG-BENGBME-48-M${index + 1}`, 'CITYU-UG-BENGBME-48', `Feature ${index + 1}`]),
      ...Array.from({ length: 6 }, (_, index) => [`CITYU-UG-BSCBISI-57-M${index + 1}`, 'CITYU-UG-BSCBISI-57', `Feature ${index + 1}`]),
      ...Array.from({ length: 5 }, (_, index) => [`CITYU-UG-BSCBMS-58-M${index + 1}`, 'CITYU-UG-BSCBMS-58', `Feature ${index + 1}`])
    ].map(([id, targetProgrammeId, nameEn]) => ({
      id,
      programmeId: targetProgrammeId,
      code: nameEn.toUpperCase().replace(/[^A-Z0-9]+/g, '-'),
      nameEn,
      courseCount: 0,
      codedCourseCount: 0
    })),
    courses: []
  };

  addGenericCourseSupplements(catalogue, [
    ...flatten(biomedicalEngineeringFile),
    ...flatten(biologicalFile),
    ...flatten(biomedicalFile),
    ...targetSupplements
  ]);
  const targetProgramme = catalogue.programmes.find((programme) => programme.id === programmeId);
  const targetMajors = catalogue.majors.filter((major) => major.programmeId === programmeId);
  const coursesByMajor = Object.fromEntries(targetMajors.map((major) => [
    major.nameEn,
    catalogue.courses.filter((course) => course.majorId === major.id)
  ]));

  assert.equal(targetProgramme.sourceStatus, 'course_codes_available');
  assert.deepEqual(targetMajors.map((major) => major.nameEn), [
    'BEng Biomedical Engineering',
    'BSc Biological Sciences',
    'BSc Biomedical Sciences'
  ]);
  assert.deepEqual(Object.fromEntries(Object.entries(coursesByMajor).map(([name, courses]) => [name, courses.length])), {
    'BEng Biomedical Engineering': 60,
    'BSc Biological Sciences': 67,
    'BSc Biomedical Sciences': 50
  });
  assert.equal(targetProgramme.codedCourseCount, 177);
  Object.values(coursesByMajor).forEach((courses) => {
    assert(courses.some((course) => course.courseCode === 'CBM4000' && course.credits === 1));
    assert(courses.some((course) => course.courseCode === 'CBM4001' && course.credits === 3));
  });
  assert.notEqual(coursesByMajor['BEng Biomedical Engineering'][0].majorId, coursesByMajor['BSc Biological Sciences'][0].majorId);
  assert.match(targetFile.note, /upon offer acceptance/);
  assert.match(targetFile.note, /totalCreditRequired=0/);
});
