const assert = require('node:assert/strict');
const { test } = require('node:test');

const ugService = require('./ugService');

test('UG catalogue summarizes current undergraduate seed data', () => {
  const summary = ugService.getCatalogueSummary();

  assert.equal(summary.universityCount, 8);
  assert(summary.facultyCount > 20);
  assert(summary.programmeCount >= 445);
  assert(summary.majorCount >= 690);
  assert.equal(summary.requirementCount, 4);
  assert(summary.courseCount >= 4050);
  assert.equal(summary.sourceProgrammeCount, 444);
  assert.equal(summary.codedCourseCount, 4060);
  assert.match(summary.generatedAt, /^2026-07-08T/);
  assert.equal(summary.generatedDate, '2026-07-08');
});

test('UG catalogue exposes the multi-school hierarchy needed for onboarding', () => {
  const universities = ugService.listUniversities();
  const university = universities.find((item) => item.code === 'POLYU');
  const faculty = ugService.listFaculties(university.id)[0];
  const programme = ugService.listProgrammes({ universityId: university.id, facultyId: faculty.id })[0];
  const major = ugService.listMajors(programme.id)[0];

  assert.deepEqual(universities.map((item) => item.code), ['HKU', 'CUHK', 'HKUST', 'POLYU', 'CITYU', 'HKBU', 'EDUHK', 'LINGNAN']);
  assert.equal(university.nameZh, '香港理工大学');
  assert(programme.nameEn);
  assert(major.nameEn);
  assert.deepEqual(ugService.listCurriculumYears(programme.id, major.id), ['2026']);
});

test('UG per-school coverage stays visible for setup validation', () => {
  const coverage = Object.fromEntries(ugService.listUniversities().map((university) => {
    const programmes = ugService.listProgrammes({ universityId: university.id, degreeLevel: 'undergraduate' });
    const majors = programmes.flatMap((programme) => ugService.listMajors(programme.id));
    const codedCourseCount = programmes.reduce((sum, programme) => sum + (programme.codedCourseCount || 0), 0);
    return [university.code, {
      programmeCount: programmes.length,
      majorCount: majors.length,
      codedCourseCount
    }];
  }));

  assert.deepEqual(coverage, {
    HKU: { programmeCount: 137, majorCount: 137, codedCourseCount: 955 },
    CUHK: { programmeCount: 84, majorCount: 84, codedCourseCount: 131 },
    HKUST: { programmeCount: 50, majorCount: 64, codedCourseCount: 121 },
    POLYU: { programmeCount: 46, majorCount: 110, codedCourseCount: 166 },
    CITYU: { programmeCount: 58, majorCount: 201, codedCourseCount: 1966 },
    HKBU: { programmeCount: 22, majorCount: 46, codedCourseCount: 0 },
    EDUHK: { programmeCount: 25, majorCount: 25, codedCourseCount: 0 },
    LINGNAN: { programmeCount: 23, majorCount: 23, codedCourseCount: 721 }
  });
});

test('UG school coverage summarizes imported source data for the status page', () => {
  const coverage = ugService.getSchoolCoverage();
  const hku = coverage.find((school) => school.code === 'HKU');
  const cityu = coverage.find((school) => school.code === 'CITYU');
  const lingnan = coverage.find((school) => school.code === 'LINGNAN');
  const polyu = coverage.find((school) => school.code === 'POLYU');

  assert.equal(coverage.length, 8);
  assert.equal(hku.programmeCount, 136);
  assert.equal(hku.majorCount, 136);
  assert.equal(hku.programmeWithCoursesCount, 14);
  assert.equal(hku.pendingProgrammeCount, 122);
  assert.equal(hku.coveragePercent, 10);
  assert.equal(hku.codedCourseCount, 955);
  assert.equal(hku.generatedDate, '2026-07-08');
  assert.equal(hku.updatedLabel, '更新于 2026-07-08');
  assert.equal(hku.badge, 'COURSES');
  const cuhk = coverage.find((school) => school.code === 'CUHK');
  assert.equal(cuhk.programmeWithCoursesCount, 3);
  assert(cuhk.pendingProgrammeCount > 0);
  assert(cuhk.coveragePercent > 0);
  assert.equal(cuhk.codedCourseCount, 131);
  assert.equal(cuhk.badge, 'COURSES');
  assert.equal(polyu.programmeWithCoursesCount, 1);
  assert.equal(polyu.pendingProgrammeCount, 45);
  assert.equal(polyu.coveragePercent, 2);
  assert.equal(polyu.codedCourseCount, 166);
  assert.equal(polyu.badge, 'COURSES');
  assert.equal(cityu.programmeWithCoursesCount, 20);
  assert.equal(cityu.pendingProgrammeCount, 38);
  assert.equal(cityu.coveragePercent, 34);
  assert.equal(cityu.codedCourseCount, 1966);
  assert.equal(cityu.badge, 'COURSES');
  assert.equal(lingnan.programmeWithCoursesCount, 23);
  assert.equal(lingnan.pendingProgrammeCount, 0);
  assert.equal(lingnan.coveragePercent, 100);
  assert.equal(lingnan.codedCourseCount, 721);
  assert.equal(lingnan.badge, 'COURSES');
  assert(polyu.coverageLabel.includes('课程代码'));
});

test('HKU Computing and Data Science catalogue profiles expose official course offerings', () => {
  const hku = ugService.listUniversities().find((item) => item.code === 'HKU');
  const programmes = ugService.listProgrammes({ universityId: hku.id, degreeLevel: 'undergraduate' });
  const cds = programmes.find((programme) => programme.nameEn === 'Computing and Data Science');
  const delta = programmes.find((programme) => programme.nameEn === 'Computing and Data Science (Delta+)');
  const major = ugService.listMajors(cds.id)[0];
  const profile = ugService.getMajorProfile(cds.id, major.id, '2026');
  const machineLearning = ugService.listMajorCourses(cds.id, major.id, { keyword: 'machine learning' });

  assert.equal(cds.sourceStatus, 'course_codes_available');
  assert.equal(cds.codedCourseCount, 56);
  assert.equal(delta.codedCourseCount, 56);
  assert.equal(profile.courseCount, 56);
  assert.equal(profile.codedCourseCount, 56);
  assert(machineLearning.some((course) => course.courseCode === 'COMP3314'));
});

test('UG major profile groups requirements with traceable courses and sources', () => {
  const profile = ugService.getMajorProfile(1, 1, '2025-26');
  const capstone = profile.requirementGroups.find((group) => group.type === 'capstone');

  assert.equal(profile.university.code, 'HKU');
  assert.equal(profile.faculty.nameEn, 'Faculty of Engineering');
  assert.equal(profile.programme.code, 'BENG');
  assert.equal(profile.major.code, 'COMP');
  assert.equal(profile.totalCreditRequired, 240);
  assert.equal(profile.courseCount, 14);
  assert.equal(profile.trackedRequirementCount, 4);
  assert(profile.trackedCredits > 0);
  assert(profile.sourceUrl.startsWith('https://'));
  assert.equal(capstone.requiredCredits, 12);
  assert.deepEqual(capstone.courses.map((course) => course.courseCode), ['COMP4801']);
});

test('UG course and major search support the next import workflow', () => {
  assert.deepEqual(
    ugService.listMajorCourses(1, 1, { courseType: 'core', recommendedYear: 3 })
      .map((course) => course.courseCode),
    ['COMP3230', 'COMP3234', 'COMP3251', 'COMP3297']
  );
  assert.deepEqual(
    ugService.listMajorCourses(1, 1, { keyword: 'machine learning' })
      .map((course) => course.courseCode),
    ['COMP3314']
  );
  assert(ugService.searchMajors('engineering').some((major) => major.code === 'COMP'));
  assert.equal(ugService.getMajorProfile(1, 999), null);
});

test('imported UG programme profiles preserve source status without faking course rules', () => {
  const hku = ugService.listUniversities().find((item) => item.code === 'HKU');
  const programmes = ugService.listProgrammes({ universityId: hku.id, degreeLevel: 'undergraduate' });
  const hkuArts = programmes.find((programme) => programme.code === '6054' && programme.nameEn === 'Bachelor of Arts (Major in History)');
  const major = ugService.listMajors(hkuArts.id)[0];
  const profile = ugService.getMajorProfile(hkuArts.id, major.id, '2026');

  assert.equal(programmes.filter((programme) => typeof programme.id === 'string').length, 136);
  assert.equal(profile.sourceStatus, 'programme_summary_only');
  assert.equal(profile.codedCourseCount, 0);
  assert.equal(profile.trackedRequirementCount, 0);
  assert.equal(profile.courseCount, 0);
  assert(profile.sourceUrl.startsWith('https://'));
});

test('imported UG coded courses are searchable when public course rows exist', () => {
  const polyu = ugService.listUniversities().find((item) => item.code === 'POLYU');
  const programmes = ugService.listProgrammes({ universityId: polyu.id, degreeLevel: 'undergraduate' });
  const computing = programmes.find((programme) => programme.code === 'JS3868');
  const computerScience = ugService.listMajors(computing.id).find((major) => major.nameEn === 'Computer Science');
  const profile = ugService.getMajorProfile(computing.id, computerScience.id, '2026');

  assert(profile.codedCourseCount > 0);
  assert(ugService.listMajorCourses(computing.id, computerScience.id, { keyword: 'Artificial Intelligence' }).length > 0);
});

test('imported UG coded courses are deduplicated by course code within a major', () => {
  const polyu = ugService.listUniversities().find((item) => item.code === 'POLYU');
  const programmes = ugService.listProgrammes({ universityId: polyu.id, degreeLevel: 'undergraduate' });
  const computing = programmes.find((programme) => programme.code === 'JS3868');
  const computerScience = ugService.listMajors(computing.id).find((major) => major.nameEn === 'Computer Science');
  const courses = ugService.listMajorCourses(computing.id, computerScience.id);
  const comp1004 = courses.filter((course) => course.courseCode === 'COMP1004');

  assert.equal(computing.codedCourseCount, 166);
  assert.equal(computerScience.codedCourseCount, 83);
  assert.equal(courses.length, 83);
  assert.equal(comp1004.length, 1);
  assert.equal(comp1004[0].semester, 'Semester 1 / Semester 2');
});

test('HKUST Computer Science majors expose official programme requirement courses', () => {
  const hkust = ugService.listUniversities().find((item) => item.code === 'HKUST');
  const programmes = ugService.listProgrammes({ universityId: hkust.id, degreeLevel: 'undergraduate' });
  const computerScience = programmes.find((programme) => programme.nameEn === 'BEng/BSc in Computer Science');
  const majors = ugService.listMajors(computerScience.id);
  const beng = majors.find((major) => major.nameEn === 'BEng in Computer Science');
  const bsc = majors.find((major) => major.nameEn === 'BSc in Computer Science');
  const bengCourses = ugService.listMajorCourses(computerScience.id, beng.id);
  const bscCourses = ugService.listMajorCourses(computerScience.id, bsc.id);

  assert.equal(computerScience.sourceStatus, 'course_codes_available');
  assert.equal(computerScience.codedCourseCount, 121);
  assert.equal(bengCourses.length, 92);
  assert.equal(bscCourses.length, 29);
  assert(bengCourses.some((course) => course.courseCode === 'COMP4211' && course.titleEn === 'Machine Learning'));
  assert(bscCourses.some((course) => course.courseCode === 'COMP4900' && course.credits === 0));
});

test('CUHK Computer Science exposes official CSE undergraduate course list', () => {
  const cuhk = ugService.listUniversities().find((item) => item.code === 'CUHK');
  const programmes = ugService.listProgrammes({ universityId: cuhk.id, degreeLevel: 'undergraduate' });
  const computerScience = programmes.find((programme) => programme.nameEn === 'Computer Science');
  const computerEngineering = programmes.find((programme) => programme.nameEn === 'Computer Engineering');
  const artificialIntelligence = programmes.find((programme) => programme.nameEn === 'Artificial Intelligence: Systems and Technologies');
  const major = ugService.listMajors(computerScience.id)[0];
  const cengMajor = ugService.listMajors(computerEngineering.id)[0];
  const aistMajor = ugService.listMajors(artificialIntelligence.id)[0];
  const courses = ugService.listMajorCourses(computerScience.id, major.id);
  const cengCourses = ugService.listMajorCourses(computerEngineering.id, cengMajor.id);
  const aistCourses = ugService.listMajorCourses(artificialIntelligence.id, aistMajor.id);
  const machineLearning = ugService.listMajorCourses(computerScience.id, major.id, { keyword: 'machine learning' });

  assert.equal(computerScience.sourceStatus, 'course_codes_available');
  assert.equal(computerScience.codedCourseCount, 69);
  assert.equal(courses.length, 69);
  assert(courses.some((course) => course.courseCode.startsWith('CSCI2100') && course.titleEn === 'Data Structures'));
  assert(machineLearning.some((course) => course.courseCode === 'CSCI3320'));
  assert.equal(computerEngineering.sourceStatus, 'course_codes_available');
  assert.equal(computerEngineering.codedCourseCount, 26);
  assert.equal(cengCourses.length, 26);
  assert(cengCourses.some((course) => course.courseCode === 'CENG3420' && course.titleEn === 'Computer Organization and Design'));
  assert.equal(artificialIntelligence.sourceStatus, 'course_codes_available');
  assert.equal(artificialIntelligence.codedCourseCount, 36);
  assert.equal(aistCourses.length, 36);
  assert(aistCourses.some((course) => course.courseCode.startsWith('AIST4010') && course.titleEn === 'Foundation of Applied Deep Learning'));
});

test('CityU Computer Science programmes expose official undergraduate requirement courses', () => {
  const cityu = ugService.listUniversities().find((item) => item.code === 'CITYU');
  const programmes = ugService.listProgrammes({ universityId: cityu.id, degreeLevel: 'undergraduate' });
  const computerScience = programmes.find((programme) => programme.nameEn.startsWith('BSc Computer Science (Streams:'));
  const cybersecurity = programmes.find((programme) => programme.nameEn.startsWith('BSc Cybersecurity'));
  const aiMajor = ugService.listMajors(computerScience.id).find((major) => major.nameEn === 'Artificial Intelligence');
  const cryptographyMajor = ugService.listMajors(cybersecurity.id).find((major) => major.nameEn === 'Cryptography');
  const aiCourses = ugService.listMajorCourses(computerScience.id, aiMajor.id);
  const cryptographyCourses = ugService.listMajorCourses(cybersecurity.id, cryptographyMajor.id);

  assert.equal(computerScience.sourceStatus, 'course_codes_available');
  assert.equal(computerScience.codedCourseCount, 305);
  assert.equal(aiCourses.length, 61);
  assert(aiCourses.some((course) => course.courseCode === 'CS4486' && course.titleEn === 'Artificial Intelligence'));
  assert(aiCourses.some((course) => course.courseCode === 'CS4514' && course.courseType === 'capstone'));
  assert.equal(cybersecurity.sourceStatus, 'course_codes_available');
  assert.equal(cybersecurity.codedCourseCount, 235);
  assert.equal(cryptographyCourses.length, 47);
  assert(cryptographyCourses.some((course) => course.courseCode === 'CS2117' && course.titleEn === 'Foundation of Cybersecurity'));
  assert(cryptographyCourses.some((course) => course.courseCode === 'CS4192' && course.titleEn === 'Algorithms for Private Data Analytics'));
});

test('CityU Global Business exposes official BBA curriculum courses', () => {
  const cityu = ugService.listUniversities().find((item) => item.code === 'CITYU');
  const programmes = ugService.listProgrammes({ universityId: cityu.id, degreeLevel: 'undergraduate' });
  const globalBusiness = programmes.find((programme) => programme.jupasCode === 'JS1001');
  const major = ugService.listMajors(globalBusiness.id)[0];
  const courses = ugService.listMajorCourses(globalBusiness.id, major.id);

  assert.equal(globalBusiness.sourceStatus, 'course_codes_available');
  assert.equal(globalBusiness.codedCourseCount, 170);
  assert.equal(courses.length, 34);
  assert(courses.some((course) => course.courseCode === 'CB2100' && course.titleEn === 'Introduction to Financial Accounting'));
  assert(courses.some((course) => course.courseCode === 'CB4605' && course.courseType === 'capstone'));
});

test('CityU CFFT exposes official stream-specific curriculum courses', () => {
  const cityu = ugService.listUniversities().find((item) => item.code === 'CITYU');
  const programmes = ugService.listProgrammes({ universityId: cityu.id, degreeLevel: 'undergraduate' });
  const cfft = programmes.find((programme) => programme.jupasCode === 'JS1000');
  const majors = ugService.listMajors(cfft.id);
  const computationalFinance = majors.find((major) => major.nameEn === 'Computational Finance');
  const financialTechnology = majors.find((major) => major.nameEn === 'Financial Technology');
  const computationalFinanceCourses = ugService.listMajorCourses(cfft.id, computationalFinance.id);
  const financialTechnologyCourses = ugService.listMajorCourses(cfft.id, financialTechnology.id);

  assert.equal(cfft.sourceStatus, 'course_codes_available');
  assert.equal(cfft.codedCourseCount, 101);
  assert.equal(computationalFinanceCourses.length, 51);
  assert.equal(financialTechnologyCourses.length, 50);
  assert(computationalFinanceCourses.some((course) => course.courseCode === 'EF4820' && course.titleEn === 'Derivatives Pricing I: Stock and FX'));
  assert(computationalFinanceCourses.some((course) => course.courseCode === 'CB4001' && course.courseType === 'capstone'));
  assert(financialTechnologyCourses.some((course) => course.courseCode === 'IS3101' && course.titleEn === 'Blockchain and Digital Currency'));
  assert(financialTechnologyCourses.some((course) => course.courseCode === 'IS4920' && course.courseType === 'capstone'));
});

test('CityU Accountancy exposes official stream-specific curriculum courses', () => {
  const cityu = ugService.listUniversities().find((item) => item.code === 'CITYU');
  const programmes = ugService.listProgrammes({ universityId: cityu.id, degreeLevel: 'undergraduate' });
  const accountancy = programmes.find((programme) => programme.jupasCode === 'JS1002');
  const majors = ugService.listMajors(accountancy.id);
  const professionalAccounting = majors.find((major) => major.nameEn === 'Professional Accounting');
  const esgAndTech = majors.find((major) => major.nameEn === 'ESG and Tech');
  const professionalAccountingCourses = ugService.listMajorCourses(accountancy.id, professionalAccounting.id);
  const esgAndTechCourses = ugService.listMajorCourses(accountancy.id, esgAndTech.id);

  assert.equal(accountancy.sourceStatus, 'course_codes_available');
  assert.equal(accountancy.codedCourseCount, 83);
  assert.equal(professionalAccountingCourses.length, 42);
  assert.equal(esgAndTechCourses.length, 41);
  assert(professionalAccountingCourses.some((course) => course.courseCode === 'AC4342' && course.titleEn === 'Auditing'));
  assert(professionalAccountingCourses.some((course) => course.courseCode === 'AC4385' && course.courseType === 'capstone'));
  assert(esgAndTechCourses.some((course) => course.courseCode === 'AC3390' && course.titleEn === 'ESG Reporting and Disclosure'));
  assert(esgAndTechCourses.some((course) => course.courseCode === 'IS3101' && course.titleEn === 'Blockchain and Digital Currency'));
});

test('CityU Global Operations Management exposes official programme curriculum courses', () => {
  const cityu = ugService.listUniversities().find((item) => item.code === 'CITYU');
  const programmes = ugService.listProgrammes({ universityId: cityu.id, degreeLevel: 'undergraduate' });
  const gom = programmes.find((programme) => programme.jupasCode === 'JS1027');
  const majors = ugService.listMajors(gom.id);
  const supplyChain = majors.find((major) => major.nameEn === 'Supply Chain Management');
  const operationsAnalytics = majors.find((major) => major.nameEn === 'Operations Analytics');
  const supplyChainCourses = ugService.listMajorCourses(gom.id, supplyChain.id);
  const operationsAnalyticsCourses = ugService.listMajorCourses(gom.id, operationsAnalytics.id);

  assert.equal(gom.sourceStatus, 'course_codes_available');
  assert.equal(gom.codedCourseCount, 280);
  assert.equal(supplyChainCourses.length, 56);
  assert.equal(operationsAnalyticsCourses.length, 56);
  assert(supplyChainCourses.some((course) => course.courseCode === 'MS3124' && course.titleEn === 'Global Supply Chain Management'));
  assert(supplyChainCourses.some((course) => course.courseCode === 'MS4118' && course.courseType === 'capstone'));
  assert(operationsAnalyticsCourses.some((course) => course.courseCode === 'MS3253' && course.titleEn === 'Operations Analytics'));
  assert(operationsAnalyticsCourses.some((course) => course.courseCode === 'MS4227' && course.titleEn === 'Pricing and Revenue Management'));
});

test('CityU Business Decision Analytics exposes official stream-specific curriculum courses', () => {
  const cityu = ugService.listUniversities().find((item) => item.code === 'CITYU');
  const programmes = ugService.listProgrammes({ universityId: cityu.id, degreeLevel: 'undergraduate' });
  const bdan = programmes.find((programme) => programme.jupasCode === 'JS1026');
  const majors = ugService.listMajors(bdan.id);
  const decisionAnalytics = majors.find((major) => major.nameEn === 'Decision Analytics');
  const dataInformatics = majors.find((major) => major.nameEn === 'Data Informatics');
  const decisionAnalyticsCourses = ugService.listMajorCourses(bdan.id, decisionAnalytics.id);
  const dataInformaticsCourses = ugService.listMajorCourses(bdan.id, dataInformatics.id);

  assert.equal(bdan.sourceStatus, 'course_codes_available');
  assert.equal(bdan.codedCourseCount, 81);
  assert.equal(decisionAnalyticsCourses.length, 39);
  assert.equal(dataInformaticsCourses.length, 42);
  assert(decisionAnalyticsCourses.some((course) => course.courseCode === 'MS3128' && course.titleEn === 'Managerial Decision Analytics'));
  assert(decisionAnalyticsCourses.some((course) => course.courseCode === 'MS4253' && course.courseType === 'capstone'));
  assert(dataInformaticsCourses.some((course) => course.courseCode === 'IS3100' && course.titleEn === 'Techniques for Big Data'));
  assert(dataInformaticsCourses.some((course) => course.courseCode === 'IS4937' && course.courseType === 'capstone'));
});

test('Lingnan Data Science exposes official undergraduate course list', () => {
  const lingnan = ugService.listUniversities().find((item) => item.code === 'LINGNAN');
  const programmes = ugService.listProgrammes({ universityId: lingnan.id, degreeLevel: 'undergraduate' });
  const dataScience = programmes.find((programme) => programme.jupasCode === 'JS7225');
  const major = ugService.listMajors(dataScience.id)[0];
  const courses = ugService.listMajorCourses(dataScience.id, major.id);
  const deepLearning = ugService.listMajorCourses(dataScience.id, major.id, { keyword: 'deep learning' });

  assert.equal(dataScience.sourceStatus, 'course_codes_available');
  assert.equal(dataScience.codedCourseCount, 22);
  assert.equal(courses.length, 22);
  assert(courses.some((course) => course.courseCode === 'CDS1001' && course.titleEn === 'Introduction to Programming for Data Science'));
  assert(courses.some((course) => course.courseCode === 'CDS4001' && course.courseType === 'capstone'));
  assert(deepLearning.some((course) => course.courseCode === 'CDS4006'));
});

test('Lingnan Translation exposes official undergraduate course descriptions', () => {
  const lingnan = ugService.listUniversities().find((item) => item.code === 'LINGNAN');
  const programmes = ugService.listProgrammes({ universityId: lingnan.id, degreeLevel: 'undergraduate' });
  const translation = programmes.find((programme) => programme.jupasCode === 'JS7204');
  const major = ugService.listMajors(translation.id)[0];
  const courses = ugService.listMajorCourses(translation.id, major.id);
  const interpreting = ugService.listMajorCourses(translation.id, major.id, { keyword: 'interpreting' });

  assert.equal(translation.sourceStatus, 'course_codes_available');
  assert.equal(translation.codedCourseCount, 68);
  assert.equal(courses.length, 68);
  assert(courses.some((course) => course.courseCode === 'TRA2001' && course.titleEn === 'Introduction to Computer-aided Translation'));
  assert(courses.some((course) => course.courseCode === 'TRA4318' && course.courseType === 'capstone'));
  assert(interpreting.some((course) => course.courseCode === 'TRA4326'));
});

test('Lingnan Government and International Affairs exposes official course offerings', () => {
  const lingnan = ugService.listUniversities().find((item) => item.code === 'LINGNAN');
  const programmes = ugService.listProgrammes({ universityId: lingnan.id, degreeLevel: 'undergraduate' });
  const gia = programmes.find((programme) => programme.jupasCode === 'JS7302');
  const major = ugService.listMajors(gia.id)[0];
  const courses = ugService.listMajorCourses(gia.id, major.id);

  assert.equal(gia.sourceStatus, 'course_codes_available');
  assert.equal(gia.codedCourseCount, 24);
  assert.equal(courses.length, 24);
  assert(courses.some((course) => course.courseCode === 'GOV2101' && course.titleEn === 'Introduction to Political Science'));
  assert(courses.some((course) => course.courseCode === 'SSC4319' && course.courseType === 'capstone'));
});

test('Lingnan Animation and Digital Arts exposes official programme structure courses', () => {
  const lingnan = ugService.listUniversities().find((item) => item.code === 'LINGNAN');
  const programmes = ugService.listProgrammes({ universityId: lingnan.id, degreeLevel: 'undergraduate' });
  const ada = programmes.find((programme) => programme.jupasCode === 'JS7133');
  const major = ugService.listMajors(ada.id)[0];
  const courses = ugService.listMajorCourses(ada.id, major.id);

  assert.equal(ada.sourceStatus, 'course_codes_available');
  assert.equal(ada.codedCourseCount, 15);
  assert.equal(courses.length, 15);
  assert(courses.some((course) => course.courseCode === 'ADA1003' && course.titleEn === 'Computer Graphics'));
  assert(courses.some((course) => course.courseCode === 'ADA4001' && course.courseType === 'capstone'));
});

test('Lingnan Film and Visual Arts exposes official course descriptions', () => {
  const lingnan = ugService.listUniversities().find((item) => item.code === 'LINGNAN');
  const programmes = ugService.listProgrammes({ universityId: lingnan.id, degreeLevel: 'undergraduate' });
  const fva = programmes.find((programme) => programme.jupasCode === 'JS7905');
  const major = ugService.listMajors(fva.id)[0];
  const courses = ugService.listMajorCourses(fva.id, major.id);

  assert.equal(fva.sourceStatus, 'course_codes_available');
  assert.equal(fva.codedCourseCount, 39);
  assert.equal(courses.length, 39);
  assert(courses.some((course) => course.courseCode === 'FVA2105' && course.titleEn === 'Film Art and Storytelling'));
  assert(courses.some((course) => course.courseCode === 'FVA4306' && course.courseType === 'capstone'));
});

test('Lingnan Psychology exposes official undergraduate course offerings', () => {
  const lingnan = ugService.listUniversities().find((item) => item.code === 'LINGNAN');
  const programmes = ugService.listProgrammes({ universityId: lingnan.id, degreeLevel: 'undergraduate' });
  const psychology = programmes.find((programme) => programme.jupasCode === 'JS7303');
  const major = ugService.listMajors(psychology.id)[0];
  const courses = ugService.listMajorCourses(psychology.id, major.id);

  assert.equal(psychology.sourceStatus, 'course_codes_available');
  assert.equal(psychology.codedCourseCount, 23);
  assert.equal(courses.length, 23);
  assert(courses.some((course) => course.courseCode === 'PSY2101' && course.titleEn === 'Introduction to Psychology'));
  assert(courses.some((course) => course.courseCode === 'PSY4325' && course.titleEn === 'Industrial and Organisational Psychology'));
});

test('Lingnan Philosophy exposes official undergraduate course descriptions', () => {
  const lingnan = ugService.listUniversities().find((item) => item.code === 'LINGNAN');
  const programmes = ugService.listProgrammes({ universityId: lingnan.id, degreeLevel: 'undergraduate' });
  const philosophy = programmes.find((programme) => programme.jupasCode === 'JS7802');
  const major = ugService.listMajors(philosophy.id)[0];
  const courses = ugService.listMajorCourses(philosophy.id, major.id);
  const aiCourses = ugService.listMajorCourses(philosophy.id, major.id, { keyword: 'Artificial Intelligence' });

  assert.equal(philosophy.sourceStatus, 'course_codes_available');
  assert.equal(philosophy.codedCourseCount, 68);
  assert.equal(courses.length, 68);
  assert(courses.some((course) => course.courseCode === 'PHI1002' && course.titleEn.includes('Introduction to Philosophy')));
  assert(aiCourses.some((course) => course.courseCode === 'PHI4375'));
});

test('Lingnan English Studies exposes official course syllabi', () => {
  const lingnan = ugService.listUniversities().find((item) => item.code === 'LINGNAN');
  const programmes = ugService.listProgrammes({ universityId: lingnan.id, degreeLevel: 'undergraduate' });
  const english = programmes.find((programme) => programme.jupasCode === 'JS7503');
  const major = ugService.listMajors(english.id)[0];
  const courses = ugService.listMajorCourses(english.id, major.id);

  assert.equal(english.sourceStatus, 'course_codes_available');
  assert.equal(english.codedCourseCount, 42);
  assert(courses.some((course) => course.courseCode === 'ENG2101' && course.titleEn === 'Introduction to the Study of Language'));
  assert(courses.some((course) => course.courseCode === 'ENG4301' && course.courseType === 'capstone'));
});

test('Lingnan sociology and social policy programmes expose official department offerings', () => {
  const lingnan = ugService.listUniversities().find((item) => item.code === 'LINGNAN');
  const programmes = ugService.listProgrammes({ universityId: lingnan.id, degreeLevel: 'undergraduate' });
  const sociology = programmes.find((programme) => programme.jupasCode === 'JS7304');
  const hssm = programmes.find((programme) => programme.jupasCode === 'JS7305');
  const spps = programmes.find((programme) => programme.jupasCode === 'JS7306');

  assert.equal(sociology.codedCourseCount, 29);
  assert.equal(hssm.codedCourseCount, 11);
  assert.equal(spps.codedCourseCount, 20);
  assert(ugService.listMajorCourses(sociology.id, ugService.listMajors(sociology.id)[0].id).some((course) => course.courseCode === 'SOC2101'));
  assert(ugService.listMajorCourses(hssm.id, ugService.listMajors(hssm.id)[0].id).some((course) => course.courseCode === 'HSM4002' && course.courseType === 'capstone'));
  assert(ugService.listMajorCourses(spps.id, ugService.listMajors(spps.id)[0].id).some((course) => course.courseCode === 'SSC3102'));
});

test('Lingnan Social Data Science exposes official major structure courses', () => {
  const lingnan = ugService.listUniversities().find((item) => item.code === 'LINGNAN');
  const programmes = ugService.listProgrammes({ universityId: lingnan.id, degreeLevel: 'undergraduate' });
  const socialDataScience = programmes.find((programme) => programme.jupasCode === 'JS7307');
  const major = ugService.listMajors(socialDataScience.id)[0];
  const courses = ugService.listMajorCourses(socialDataScience.id, major.id);

  assert.equal(socialDataScience.sourceStatus, 'course_codes_available');
  assert.equal(socialDataScience.codedCourseCount, 18);
  assert(courses.some((course) => course.courseCode === 'SDA1001' && course.titleEn === 'Introduction to Social Data Science'));
  assert(courses.some((course) => course.courseCode === 'GOV3219' && course.titleEn === 'Introduction to Computational Political Science'));
});

test('Lingnan Cultural Studies exposes official undergraduate curriculum courses', () => {
  const lingnan = ugService.listUniversities().find((item) => item.code === 'LINGNAN');
  const programmes = ugService.listProgrammes({ universityId: lingnan.id, degreeLevel: 'undergraduate' });
  const culturalStudies = programmes.find((programme) => programme.jupasCode === 'JS7606');
  const major = ugService.listMajors(culturalStudies.id)[0];
  const courses = ugService.listMajorCourses(culturalStudies.id, major.id);

  assert.equal(culturalStudies.sourceStatus, 'course_codes_available');
  assert.equal(culturalStudies.codedCourseCount, 24);
  assert(courses.some((course) => course.courseCode === 'CUS3007' && course.titleEn === 'Social Media Literacy'));
  assert(courses.some((course) => course.courseCode === 'CUS3410' && course.titleEn === 'Cultural Policy & Community Practice'));
});

test('Lingnan Marketing and Social Media exposes official undergraduate courses', () => {
  const lingnan = ugService.listUniversities().find((item) => item.code === 'LINGNAN');
  const programmes = ugService.listProgrammes({ universityId: lingnan.id, degreeLevel: 'undergraduate' });
  const marketing = programmes.find((programme) => programme.jupasCode === 'JS7215');
  const major = ugService.listMajors(marketing.id)[0];
  const courses = ugService.listMajorCourses(marketing.id, major.id);

  assert.equal(marketing.sourceStatus, 'course_codes_available');
  assert.equal(marketing.codedCourseCount, 26);
  assert(courses.some((course) => course.courseCode === 'MKT3001' && course.titleEn === 'Social Media Marketing'));
  assert(courses.some((course) => course.courseCode === 'MKT4312' && course.titleEn === 'Strategic Brand Management'));
});

test('Lingnan Chinese exposes official undergraduate required courses', () => {
  const lingnan = ugService.listUniversities().find((item) => item.code === 'LINGNAN');
  const programmes = ugService.listProgrammes({ universityId: lingnan.id, degreeLevel: 'undergraduate' });
  const chinese = programmes.find((programme) => programme.jupasCode === 'JS7101');
  const major = ugService.listMajors(chinese.id)[0];
  const courses = ugService.listMajorCourses(chinese.id, major.id);

  assert.equal(chinese.sourceStatus, 'course_codes_available');
  assert.equal(chinese.codedCourseCount, 12);
  assert(courses.some((course) => course.courseCode === 'CHI2105' && course.titleEn === 'Modern Chinese Literature'));
  assert(courses.some((course) => course.courseCode === 'CHI4302' && course.courseType === 'capstone'));
});

test('Lingnan Global Development and Sustainability exposes official required courses', () => {
  const lingnan = ugService.listUniversities().find((item) => item.code === 'LINGNAN');
  const programmes = ugService.listProgrammes({ universityId: lingnan.id, degreeLevel: 'undergraduate' });
  const gds = programmes.find((programme) => programme.jupasCode === 'JS7123');
  const major = ugService.listMajors(gds.id)[0];
  const courses = ugService.listMajorCourses(gds.id, major.id);

  assert.equal(gds.sourceStatus, 'course_codes_available');
  assert.equal(gds.codedCourseCount, 13);
  assert(courses.some((course) => course.courseCode === 'GDS1001' && course.titleEn === 'Interdisciplinary Inquiry for Global Challenges'));
  assert(courses.some((course) => course.courseCode === 'GDS4000' && course.courseType === 'capstone'));
});

test('Lingnan Economics exposes official undergraduate course outlines', () => {
  const lingnan = ugService.listUniversities().find((item) => item.code === 'LINGNAN');
  const programmes = ugService.listProgrammes({ universityId: lingnan.id, degreeLevel: 'undergraduate' });
  const economics = programmes.find((programme) => programme.jupasCode === 'JS7301');
  const major = ugService.listMajors(economics.id)[0];
  const courses = ugService.listMajorCourses(economics.id, major.id);

  assert.equal(economics.sourceStatus, 'course_codes_available');
  assert.equal(economics.codedCourseCount, 39);
  assert(courses.some((course) => course.courseCode === 'ECO2101' && course.titleEn === 'Introduction to Economics'));
  assert(courses.some((course) => course.courseCode === 'ECO4324' && course.titleEn === 'Environmental Economics and Policy'));
});

test('Lingnan BBA programmes expose official programme structure courses', () => {
  const lingnan = ugService.listUniversities().find((item) => item.code === 'LINGNAN');
  const programmes = ugService.listProgrammes({ universityId: lingnan.id, degreeLevel: 'undergraduate' });
  const expectations = [
    ['JS7211', 34, 'ACT2200', 'RIM2200'],
    ['JS7212', 22, 'BAI3007', 'BAI4010'],
    ['JS7213', 23, 'FIN2200', 'FIN4399'],
    ['JS7214', 17, 'MGT3352', 'MGT4358'],
    ['JS7216', 31, 'RIM2200', 'RIM3355']
  ];

  expectations.forEach(([jupasCode, count, firstCourseCode, secondCourseCode]) => {
    const programme = programmes.find((item) => item.jupasCode === jupasCode);
    const major = ugService.listMajors(programme.id)[0];
    const courses = ugService.listMajorCourses(programme.id, major.id);

    assert.equal(programme.sourceStatus, 'course_codes_available');
    assert.equal(programme.codedCourseCount, count);
    assert(courses.some((course) => course.courseCode === firstCourseCode));
    assert(courses.some((course) => course.courseCode === secondCourseCode));
  });
});

test('Lingnan History exposes official undergraduate course descriptions', () => {
  const lingnan = ugService.listUniversities().find((item) => item.code === 'LINGNAN');
  const programmes = ugService.listProgrammes({ universityId: lingnan.id, degreeLevel: 'undergraduate' });
  const history = programmes.find((programme) => programme.jupasCode === 'JS7709');
  const major = ugService.listMajors(history.id)[0];
  const courses = ugService.listMajorCourses(history.id, major.id);

  assert.equal(history.sourceStatus, 'course_codes_available');
  assert.equal(history.codedCourseCount, 101);
  assert.equal(courses.length, 101);
  assert(courses.some((course) => course.courseCode === 'HST1001' && course.titleEn === 'Historian’s Craft'));
  assert(courses.some((course) => course.courseCode === 'HST4499' && course.titleEn === 'History Capstone Seminar'));
});

test('CityU BBA Marketing exposes stream-specific undergraduate courses', () => {
  const cityu = ugService.listUniversities().find((item) => item.code === 'CITYU');
  const programmes = ugService.listProgrammes({ universityId: cityu.id, degreeLevel: 'undergraduate' });
  const marketing = programmes.find((programme) => programme.jupasCode === 'JS1007');
  const globalMarketing = ugService.listMajors(marketing.id).find((major) => major.nameEn === 'Global Marketing');
  const marketingAnalytics = ugService.listMajors(marketing.id).find((major) => major.nameEn === 'Marketing Analytics');
  const globalCourses = ugService.listMajorCourses(marketing.id, globalMarketing.id);
  const analyticsCourses = ugService.listMajorCourses(marketing.id, marketingAnalytics.id);

  assert.equal(marketing.sourceStatus, 'course_codes_available');
  assert.equal(marketing.codedCourseCount, 37);
  assert.equal(globalCourses.length, 18);
  assert.equal(analyticsCourses.length, 19);
  assert(globalCourses.some((course) => course.courseCode === 'CB4601' && course.titleEn === 'Global Marketing'));
  assert(globalCourses.some((course) => course.courseCode === 'CB3042' && course.titleEn === 'China Business Environment'));
  assert(analyticsCourses.some((course) => course.courseCode === 'MKT3608' && course.titleEn === 'Marketing Intelligence and Applications of Analytics'));
  assert(analyticsCourses.some((course) => course.courseCode === 'IS3100' && course.titleEn === 'Techniques for Big Data'));
});

test('CityU College of Business pending programmes expose shared undergraduate core courses', () => {
  const cityu = ugService.listUniversities().find((item) => item.code === 'CITYU');
  const programmes = ugService.listProgrammes({ universityId: cityu.id, degreeLevel: 'undergraduate' });
  const expectations = [
    ['JS1005', 28, 2],
    ['JS1012', 28, 2],
    ['JS1013', 56, 4],
    ['JS1014', 70, 5],
    ['JS1017', 28, 2],
    ['JS1018', 42, 3],
    ['JS1019', 56, 4]
  ];

  expectations.forEach(([jupasCode, programmeCourseCount, majorCount]) => {
    const programme = programmes.find((item) => item.jupasCode === jupasCode);
    const majors = ugService.listMajors(programme.id);

    assert.equal(programme.sourceStatus, 'course_codes_available');
    assert.equal(programme.codedCourseCount, programmeCourseCount);
    assert.equal(majors.length, majorCount);
    majors.forEach((major) => {
      const courses = ugService.listMajorCourses(programme.id, major.id);
      assert.equal(courses.length, 14);
      assert(courses.some((course) => course.courseCode === 'CB2100' && course.titleEn === 'Introduction to Financial Accounting'));
      assert(courses.some((course) => course.courseCode === 'CB4303' && course.titleEn === 'Strategic Management'));
    });
  });
});

test('CityU School of Creative Media programmes expose official undergraduate core courses', () => {
  const cityu = ugService.listUniversities().find((item) => item.code === 'CITYU');
  const programmes = ugService.listProgrammes({ universityId: cityu.id, degreeLevel: 'undergraduate' });
  const expectations = [
    ['JS1042', 84, 6, 14, ['SM2105', 'SM4712A']],
    ['JS1043', 95, 5, 19, ['CS2303', 'SM4712B']],
    ['JS1044', 76, 4, 19, ['SM3807', 'SM4712C']]
  ];

  expectations.forEach(([jupasCode, programmeCourseCount, majorCount, coursesPerMajor, courseCodes]) => {
    const programme = programmes.find((item) => item.jupasCode === jupasCode);
    const majors = ugService.listMajors(programme.id);

    assert.equal(programme.sourceStatus, 'course_codes_available');
    assert.equal(programme.codedCourseCount, programmeCourseCount);
    assert.equal(majors.length, majorCount);
    majors.forEach((major) => {
      const courses = ugService.listMajorCourses(programme.id, major.id);
      assert.equal(courses.length, coursesPerMajor);
      courseCodes.forEach((courseCode) => {
        assert(courses.some((course) => course.courseCode === courseCode));
      });
    });
  });
});

test('CityU School of Creative Media entry programmes reuse degree-track course templates', () => {
  const cityu = ugService.listUniversities().find((item) => item.code === 'CITYU');
  const programmes = ugService.listProgrammes({ universityId: cityu.id, degreeLevel: 'undergraduate' });
  const expectations = [
    ['JS1040', 59, [
      ['Creative Media (School-based)', 7, ['SM1701', 'SM1702A']],
      ['BA Creative Media', 14, ['SM2105', 'SM4712A']],
      ['BSc Creative Media', 19, ['CS2303', 'SM4712B']],
      ['BAS New Media', 19, ['SM3807', 'SM4712C']]
    ]],
    ['JS1041', 52, [
      ['BA Creative Media', 14, ['SM2105', 'SM4712A']],
      ['BSc Creative Media', 19, ['CS2303', 'SM4712B']],
      ['BAS New Media', 19, ['SM3807', 'SM4712C']]
    ]]
  ];

  expectations.forEach(([jupasCode, programmeCourseCount, majorExpectations]) => {
    const programme = programmes.find((item) => item.jupasCode === jupasCode);
    const majors = ugService.listMajors(programme.id);

    assert.equal(programme.sourceStatus, 'course_codes_available');
    assert.equal(programme.codedCourseCount, programmeCourseCount);
    majorExpectations.forEach(([majorName, coursesPerMajor, courseCodes]) => {
      const major = majors.find((item) => item.nameEn === majorName);
      const courses = ugService.listMajorCourses(programme.id, major.id);
      assert.equal(courses.length, coursesPerMajor);
      courseCodes.forEach((courseCode) => {
        assert(courses.some((course) => course.courseCode === courseCode));
      });
    });
  });
});

test('imported UG programmes can be searched by title, code and faculty', () => {
  const hku = ugService.listUniversities().find((item) => item.code === 'HKU');
  const hkuProgrammes = ugService.listProgrammes({ universityId: hku.id, degreeLevel: 'undergraduate' });
  const architecture = ugService.searchProgrammes(hkuProgrammes, '6004');
  const engineering = ugService.searchProgrammes(hkuProgrammes, 'Engineering');

  assert(architecture.some((programme) => programme.nameEn === 'Bachelor of Arts in Architectural Studies'));
  assert(engineering.length > 0);
  assert(ugService.searchProgrammes(hkuProgrammes, '').length >= hkuProgrammes.length);
});

test('HKU Architectural Studies exposes official BA(AS) timetable courses', () => {
  const hku = ugService.listUniversities().find((item) => item.code === 'HKU');
  const programmes = ugService.listProgrammes({ universityId: hku.id, degreeLevel: 'undergraduate' });
  const architecture = programmes.find((programme) => programme.code === '6004');
  const major = ugService.listMajors(architecture.id)[0];
  const profile = ugService.getMajorProfile(architecture.id, major.id, '2026');
  const courses = ugService.listMajorCourses(architecture.id, major.id);

  assert.equal(architecture.sourceStatus, 'course_codes_available');
  assert.equal(profile.codedCourseCount, 24);
  assert.equal(courses.length, 24);
  assert(courses.some((course) => course.courseCode === 'ARCH1079' && course.semester === 'Semester 1'));
  assert(courses.some((course) => course.courseCode === 'ARCH1080' && course.semester === 'Semester 2'));
  assert(courses.some((course) => course.courseCode === 'ARCH4603' && course.courseType === 'capstone'));
  assert(ugService.listMajorCourses(architecture.id, major.id, { keyword: 'Building Technology' }).some((course) => course.courseCode === 'ARCH2056'));
});

test('HKU Surveying and Urban Studies expose official syllabus courses', () => {
  const hku = ugService.listUniversities().find((item) => item.code === 'HKU');
  const programmes = ugService.listProgrammes({ universityId: hku.id, degreeLevel: 'undergraduate' });
  const expectations = [
    ['6016', 'Bachelor of Science in Surveying', 31, ['RECO1018', 'RECO4011', 'RECO4016'], 'Construction Project Management'],
    ['6042', 'Bachelor of Arts in Urban Studies', 22, ['URBS1003', 'URBS4005', 'URBS4006'], 'Urban Environmental Science']
  ];

  expectations.forEach(([programmeCode, programmeName, courseCount, courseCodes, keyword]) => {
    const programme = programmes.find((item) => item.code === programmeCode);
    const major = ugService.listMajors(programme.id).find((item) => item.nameEn === programmeName);
    const profile = ugService.getMajorProfile(programme.id, major.id, '2026');
    const courses = ugService.listMajorCourses(programme.id, major.id);

    assert.equal(programme.sourceStatus, 'course_codes_available');
    assert.equal(profile.codedCourseCount, courseCount);
    assert.equal(courses.length, courseCount);
    courseCodes.forEach((courseCode) => {
      assert(courses.some((course) => course.courseCode === courseCode));
    });
    assert(ugService.listMajorCourses(programme.id, major.id, { keyword }).length > 0);
  });
});

test('HKU Landscape Studies exposes official syllabus courses', () => {
  const hku = ugService.listUniversities().find((item) => item.code === 'HKU');
  const programmes = ugService.listProgrammes({ universityId: hku.id, degreeLevel: 'undergraduate' });
  const landscape = programmes.find((programme) => programme.code === '6028');
  const major = ugService.listMajors(landscape.id).find((item) => item.nameEn === 'Bachelor of Arts in Landscape Studies');
  const profile = ugService.getMajorProfile(landscape.id, major.id, '2026');
  const courses = ugService.listMajorCourses(landscape.id, major.id);

  assert.equal(landscape.sourceStatus, 'course_codes_available');
  assert.equal(profile.codedCourseCount, 33);
  assert.equal(courses.length, 33);
  ['ARCH2113', 'ARCH4201', 'ARCH4717'].forEach((courseCode) => {
    assert(courses.some((course) => course.courseCode === courseCode));
  });
  assert(ugService.listMajorCourses(landscape.id, major.id, { keyword: 'Landscape Ecology' }).some((course) => course.courseCode === 'ARCH4717'));
});

test('HKU Art History exposes official BA syllabus courses', () => {
  const hku = ugService.listUniversities().find((item) => item.code === 'HKU');
  const programmes = ugService.listProgrammes({ universityId: hku.id, degreeLevel: 'undergraduate' });
  const artHistory = programmes.find((programme) => programme.code === '6054' && programme.nameEn.includes('Art History'));
  const major = ugService.listMajors(artHistory.id).find((item) => item.nameEn === 'Art History');
  const profile = ugService.getMajorProfile(artHistory.id, major.id, '2026');
  const courses = ugService.listMajorCourses(artHistory.id, major.id);

  assert.equal(artHistory.sourceStatus, 'course_codes_available');
  assert.equal(profile.codedCourseCount, 94);
  assert.equal(courses.length, 94);
  ['ARTH1001', 'ARTH2081', 'ARTH4005'].forEach((courseCode) => {
    assert(courses.some((course) => course.courseCode === courseCode));
  });
  assert(courses.some((course) => course.courseCode === 'ARTH4005' && course.courseType === 'capstone'));
  assert(ugService.listMajorCourses(artHistory.id, major.id, { keyword: 'museum' }).some((course) => course.courseCode === 'ARTH2056'));
});

test('HKU Chinese History and Culture exposes official BA syllabus courses', () => {
  const hku = ugService.listUniversities().find((item) => item.code === 'HKU');
  const programmes = ugService.listProgrammes({ universityId: hku.id, degreeLevel: 'undergraduate' });
  const chineseHistory = programmes.find((programme) => programme.code === '6054' && programme.nameEn.includes('Chinese History and Culture'));
  const major = ugService.listMajors(chineseHistory.id).find((item) => item.nameEn === 'Chinese History and Culture');
  const profile = ugService.getMajorProfile(chineseHistory.id, major.id, '2026');
  const courses = ugService.listMajorCourses(chineseHistory.id, major.id);

  assert.equal(chineseHistory.sourceStatus, 'course_codes_available');
  assert.equal(profile.codedCourseCount, 62);
  assert.equal(courses.length, 62);
  ['CHIN1201', 'CHIN3221', 'HIST2018'].forEach((courseCode) => {
    assert(courses.some((course) => course.courseCode === courseCode));
  });
  assert(courses.some((course) => course.courseCode === 'CHIN3221' && course.courseType === 'capstone'));
  assert(ugService.listMajorCourses(chineseHistory.id, major.id, { keyword: 'Silk Road' }).some((course) => course.courseCode === 'CHIN2276'));
});

test('HKU Chinese Language and Literature exposes official BA syllabus courses', () => {
  const hku = ugService.listUniversities().find((item) => item.code === 'HKU');
  const programmes = ugService.listProgrammes({ universityId: hku.id, degreeLevel: 'undergraduate' });
  const chineseLanguage = programmes.find((programme) => programme.code === '6054' && programme.nameEn.includes('Chinese Language and Literature'));
  const major = ugService.listMajors(chineseLanguage.id).find((item) => item.nameEn === 'Chinese Language and Literature');
  const profile = ugService.getMajorProfile(chineseLanguage.id, major.id, '2026');
  const courses = ugService.listMajorCourses(chineseLanguage.id, major.id);

  assert.equal(chineseLanguage.sourceStatus, 'course_codes_available');
  assert.equal(profile.codedCourseCount, 63);
  assert.equal(courses.length, 63);
  ['CHIN1116', 'CHIN2187', 'CHIN4101'].forEach((courseCode) => {
    assert(courses.some((course) => course.courseCode === courseCode));
  });
  assert(courses.some((course) => course.courseCode === 'CHIN4101' && course.courseType === 'capstone'));
  assert(ugService.listMajorCourses(chineseLanguage.id, major.id, { keyword: 'Cantopop' }).some((course) => course.courseCode === 'CHIN2183'));
});

test('HKU Comparative Literature exposes official BA syllabus courses', () => {
  const hku = ugService.listUniversities().find((item) => item.code === 'HKU');
  const programmes = ugService.listProgrammes({ universityId: hku.id, degreeLevel: 'undergraduate' });
  const comparativeLiterature = programmes.find((programme) => programme.code === '6054' && programme.nameEn.includes('Comparative Literature'));
  const major = ugService.listMajors(comparativeLiterature.id).find((item) => item.nameEn === 'Comparative Literature');
  const profile = ugService.getMajorProfile(comparativeLiterature.id, major.id, '2026');
  const courses = ugService.listMajorCourses(comparativeLiterature.id, major.id);

  assert.equal(comparativeLiterature.sourceStatus, 'course_codes_available');
  assert.equal(profile.codedCourseCount, 71);
  assert.equal(courses.length, 71);
  ['CLIT1001', 'CLIT3020', 'GEND2001', 'SINO2008'].forEach((courseCode) => {
    assert(courses.some((course) => course.courseCode === courseCode));
  });
  assert(courses.some((course) => course.courseCode === 'CLIT3020' && course.courseType === 'capstone'));
  assert(ugService.listMajorCourses(comparativeLiterature.id, major.id, { keyword: 'Cantopop' }).some((course) => course.courseCode === 'HKGS2008'));
  assert(ugService.listMajorCourses(comparativeLiterature.id, major.id, { keyword: 'World heritage' }).some((course) => course.courseCode === 'SINO2008'));
});

test('HKU English Studies exposes official BA syllabus courses', () => {
  const hku = ugService.listUniversities().find((item) => item.code === 'HKU');
  const programmes = ugService.listProgrammes({ universityId: hku.id, degreeLevel: 'undergraduate' });
  const englishStudies = programmes.find((programme) => programme.code === '6054' && programme.nameEn.includes('English Studies'));
  const major = ugService.listMajors(englishStudies.id).find((item) => item.nameEn === 'English Studies');
  const profile = ugService.getMajorProfile(englishStudies.id, major.id, '2026');
  const courses = ugService.listMajorCourses(englishStudies.id, major.id);

  assert.equal(englishStudies.sourceStatus, 'course_codes_available');
  assert.equal(profile.codedCourseCount, 125);
  assert.equal(courses.length, 125);
  ['ENGL1011', 'ENGL2079', 'ENGL3041', 'ENGL2187'].forEach((courseCode) => {
    assert(courses.some((course) => course.courseCode === courseCode));
  });
  assert(courses.some((course) => course.courseCode === 'ENGL3041' && course.courseType === 'capstone'));
  assert(ugService.listMajorCourses(englishStudies.id, major.id, { keyword: 'Shakespeare' }).some((course) => course.courseCode === 'ENGL2079'));
  assert(ugService.listMajorCourses(englishStudies.id, major.id, { keyword: 'World Englishes' }).some((course) => course.courseCode === 'ENGL1042'));
});

test('HKU Gender Studies exposes official BA syllabus courses', () => {
  const hku = ugService.listUniversities().find((item) => item.code === 'HKU');
  const programmes = ugService.listProgrammes({ universityId: hku.id, degreeLevel: 'undergraduate' });
  const genderStudies = programmes.find((programme) => programme.code === '6054' && programme.nameEn.includes('Gender Studies'));
  const major = ugService.listMajors(genderStudies.id).find((item) => item.nameEn === 'Gender Studies');
  const profile = ugService.getMajorProfile(genderStudies.id, major.id, '2026');
  const courses = ugService.listMajorCourses(genderStudies.id, major.id);

  assert.equal(genderStudies.sourceStatus, 'course_codes_available');
  assert.equal(profile.codedCourseCount, 82);
  assert.equal(courses.length, 82);
  ['GEND1001', 'GEND3901', 'LLAW3071', 'BSTC2049'].forEach((courseCode) => {
    assert(courses.some((course) => course.courseCode === courseCode));
  });
  assert(courses.some((course) => course.courseCode === 'GEND3901' && course.courseType === 'capstone'));
  assert(ugService.listMajorCourses(genderStudies.id, major.id, { keyword: 'non-discrimination' }).some((course) => course.courseCode === 'LLAW3071'));
  assert(ugService.listMajorCourses(genderStudies.id, major.id, { keyword: 'Buddhism' }).some((course) => course.courseCode === 'BSTC2049'));
});

test('HKU General Linguistics exposes official BA syllabus courses', () => {
  const hku = ugService.listUniversities().find((item) => item.code === 'HKU');
  const programmes = ugService.listProgrammes({ universityId: hku.id, degreeLevel: 'undergraduate' });
  const generalLinguistics = programmes.find((programme) => programme.code === '6054' && programme.nameEn.includes('General Linguistics'));
  const major = ugService.listMajors(generalLinguistics.id).find((item) => item.nameEn === 'General Linguistics');
  const profile = ugService.getMajorProfile(generalLinguistics.id, major.id, '2026');
  const courses = ugService.listMajorCourses(generalLinguistics.id, major.id);

  assert.equal(generalLinguistics.sourceStatus, 'course_codes_available');
  assert.equal(profile.codedCourseCount, 47);
  assert.equal(courses.length, 47);
  ['LING1000', 'LING2067', 'LING3005', 'LING3007'].forEach((courseCode) => {
    assert(courses.some((course) => course.courseCode === courseCode));
  });
  assert(courses.some((course) => course.courseCode === 'LING3005' && course.courseType === 'capstone'));
  assert(ugService.listMajorCourses(generalLinguistics.id, major.id, { keyword: 'Natural language processing' }).some((course) => course.courseCode === 'LING2067'));
  assert(ugService.listMajorCourses(generalLinguistics.id, major.id, { keyword: 'Cantonese' }).some((course) => course.courseCode === 'LING2058'));
});

test('HKU Global and Area Studies exposes official BA syllabus courses', () => {
  const hku = ugService.listUniversities().find((item) => item.code === 'HKU');
  const programmes = ugService.listProgrammes({ universityId: hku.id, degreeLevel: 'undergraduate' });
  const globalAreaStudies = programmes.find((programme) => programme.code === '6054' && programme.nameEn.includes('Global and Area Studies'));
  const major = ugService.listMajors(globalAreaStudies.id).find((item) => item.nameEn === 'Global and Area Studies');
  const profile = ugService.getMajorProfile(globalAreaStudies.id, major.id, '2026');
  const courses = ugService.listMajorCourses(globalAreaStudies.id, major.id);

  assert.equal(globalAreaStudies.sourceStatus, 'course_codes_available');
  assert.equal(profile.codedCourseCount, 189);
  assert.equal(courses.length, 189);
  ['GLAS1001', 'GLAS2001', 'GLAS3111', 'GLAS4901', 'GRMN3029', 'THAI3003'].forEach((courseCode) => {
    assert(courses.some((course) => course.courseCode === courseCode));
  });
  assert(courses.some((course) => course.courseCode === 'GLAS2001' && course.courseType === 'core'));
  assert(courses.some((course) => course.courseCode === 'GLAS4901' && course.courseType === 'capstone'));
  assert(ugService.listMajorCourses(globalAreaStudies.id, major.id, { keyword: 'European Union' }).some((course) => course.courseCode === 'GLAS3102'));
  assert(ugService.listMajorCourses(globalAreaStudies.id, major.id, { keyword: 'internship' }).some((course) => course.courseCode === 'GLAS3111'));
  assert(ugService.listMajorCourses(globalAreaStudies.id, major.id, { keyword: 'Thailand today' }).some((course) => course.courseCode === 'THAI3003'));
});
