const assert = require('node:assert/strict');
const test = require('node:test');
const supplementFile = require('../data/ug-course-supplements/polyu-js3789-surveying-2025.json');
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

test('PolyU JS3789 keeps all five surveying disciplines isolated with their official coded progression', () => {
  const supplements = supplementFile.supplements.map(withFileMetadata);
  supplements.forEach(validateSupplement);

  const programmeId = 'POLYU-UG-JS3789-46';
  const catalogue = {
    programmes: [{
      id: programmeId,
      universityCode: 'POLYU',
      code: 'JS3789',
      jupasCode: 'JS3789',
      nameEn: 'Bachelor of Science (Honours) in Surveying',
      sourceStatus: 'programme_summary_only',
      courseCount: 2,
      codedCourseCount: 0
    }],
    majors: [{
      id: `${programmeId}-M1`,
      programmeId,
      code: 'BACHELOR-OF-SCIENCE-HONOURS-IN-SURVEYING',
      nameEn: 'Bachelor of Science (Honours) in Surveying',
      nameZh: 'Bachelor of Science (Honours) in Surveying',
      courseCount: 2,
      codedCourseCount: 0
    }],
    courses: []
  };

  addGenericCourseSupplements(catalogue, supplements);

  const expectedMajorNames = [
    'Building Surveying',
    'General Practice Surveying',
    'Planning and Development',
    'Property and Facility Management',
    'Quantity Surveying'
  ];
  const majors = catalogue.majors
    .filter((major) => major.programmeId === programmeId)
    .sort((a, b) => a.id.localeCompare(b.id));

  assert.deepEqual(majors.map((major) => major.nameEn), expectedMajorNames);
  assert(majors.every((major) => major.codedCourseCount === 35 && major.courseCount === 35));
  assert.equal(catalogue.programmes[0].sourceStatus, 'course_codes_available');
  assert.equal(catalogue.programmes[0].codedCourseCount, 175);
  assert.equal(catalogue.courses.length, 175);

  const coursesByMajor = Object.fromEntries(majors.map((major) => [
    major.nameEn,
    catalogue.courses.filter((course) => course.majorId === major.id)
  ]));
  const codeSet = (majorName) => new Set(coursesByMajor[majorName].map((course) => course.courseCode));
  const sharedCodes = [
    'MM1031', 'CE1001', 'AMA1140', 'APSS1L01', 'CE1002', 'AP10001',
    'BRE299', 'ELC3421', 'BRE350', 'BRE258', 'BRE2031', 'BRE263',
    'BRE2171', 'BRE2061', 'BRE2691', 'BRE349', 'BRE265', 'BRE336',
    'BRE365', 'BRE366', 'BRE3261', 'BRE369', 'BRE466', 'BRE469'
  ];

  expectedMajorNames.forEach((majorName) => {
    const courses = coursesByMajor[majorName];
    const codes = codeSet(majorName);
    assert.equal(courses.length, 35);
    assert.equal(codes.size, 35);
    assert(sharedCodes.every((code) => codes.has(code)));
    assert.equal(courses.reduce((total, course) => total + course.credits, 0), 95);
  });

  const building = codeSet('Building Surveying');
  const generalPractice = codeSet('General Practice Surveying');
  const planning = codeSet('Planning and Development');
  const propertyFacility = codeSet('Property and Facility Management');
  const quantity = codeSet('Quantity Surveying');

  assert(building.has('BRE204') && building.has('BRE435') && !building.has('BRE439'));
  assert(quantity.has('BRE439') && quantity.has('BRE442') && !quantity.has('BRE204'));
  assert(generalPractice.has('BRE436') && !generalPractice.has('BRE464'));
  assert(planning.has('BRE464') && !planning.has('BRE436'));
  assert.deepEqual([...generalPractice].sort(), [...propertyFacility].sort());

  const buildingByCode = Object.fromEntries(coursesByMajor['Building Surveying']
    .map((course) => [course.courseCode, course]));
  assert.equal(buildingByCode.BRE204.recommendedYear, 3);
  assert.equal(buildingByCode.BRE204.semester, 'Semester 1');
  assert.equal(buildingByCode.BRE435.recommendedYear, 4);
  assert.equal(buildingByCode.BRE435.semester, 'Semester 2');
  assert.equal(buildingByCode.BRE299.credits, 2);
  assert.equal(buildingByCode.BRE299.courseType, 'internship');
  assert.equal(buildingByCode.BRE299.recommendedYear, 0);
  assert.equal(buildingByCode.BRE299.semester, 'Stage 1 or Stage 2 Summer Semester');
  assert.equal(buildingByCode.BRE365.credits, 1);
  assert.equal(buildingByCode.BRE365.recommendedYear, 0);
  assert.match(buildingByCode.BRE365.semester, /Stage 3 Semester 1/);
  assert.equal(buildingByCode.BRE466.credits, 6);
  assert.equal(buildingByCode.BRE466.courseType, 'capstone');

  assert.equal(supplementFile.additionalSourceUrls.length, 2);
  assert.match(supplementFile.note, /separate Major\/Track identities/);
  assert.match(supplementFile.note, /Uncoded LCR, CAR, GUR and Free Elective slots are omitted/);
  assert.match(supplementFile.note, /does not assert graduation completion/);
});
