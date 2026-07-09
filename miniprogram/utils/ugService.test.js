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
  assert(summary.courseCount >= 4630);
  assert.equal(summary.sourceProgrammeCount, 444);
  assert.equal(summary.codedCourseCount, 5936);
  assert.equal(summary.programmeWithCoursesCount, 79);
  assert.equal(summary.pendingProgrammeCount, 365);
  assert.equal(summary.sourceReadiness.indexOnly + summary.sourceReadiness.noSource, summary.pendingProgrammeCount);
  assert(summary.sourceReadiness.indexOnly > 0);
  assert.match(summary.sourceReadinessLabel, /仅索引 \/ 来源/);
  assert.equal(summary.coveragePercent, 18);
  assert.match(summary.generatedAt, /^2026-07-09T/);
  assert.equal(summary.generatedDate, '2026-07-09');
});

test('UG pending source readiness labels summarize index-only catalogue gaps', () => {
  assert.deepEqual(ugService.summarizePendingSourceReadiness([
    { codedCourseCount: 3, sourceStatus: 'course_codes_available' },
    { codedCourseCount: 0, sourceStatus: 'programme_summary_only', courseCount: 1 },
    { codedCourseCount: 0, officialUrl: 'https://example.test/programme' },
    { codedCourseCount: 0 }
  ]), {
    indexOnly: 2,
    noSource: 1
  });
  assert.equal(
    ugService.formatPendingSourceReadiness({ indexOnly: 2, noSource: 1 }),
    '2 个仅索引 / 来源 · 1 个缺来源'
  );
});

test('UG pending programme collection text is copy-ready for data sourcing', () => {
  const pending = ugService.listPendingProgrammes({ universityCode: 'POLYU', limit: 2 });
  const allPending = ugService.listPendingProgrammes({ universityCode: 'POLYU', limit: -1 });
  const text = ugService.buildPendingCollectionText({ universityCode: 'POLYU', limit: 2 });

  assert.equal(pending.length, 2);
  assert.equal(allPending.length, 35);
  assert.equal(pending[0].universityCode, 'POLYU');
  assert.equal(pending[0].sourceStatusLabel, '仅索引 / 来源');
  assert.match(pending[0].officialUrl, /^https:\/\//);
  assert.match(text, /【本科课程资料待补清单】/);
  assert.match(text, /范围：POLYU/);
  assert.match(text, /待补 Programme：35/);
  assert.match(text, /课程代码 \/ 课程名 \/ 学分 \/ Year \/ Semester \/ 课程类别 \/ 来源链接/);
  assert.match(text, /不要推测课程/);
});

test('UG pending programme collection can be filtered by source readiness', () => {
  const polyuIndexOnly = ugService.listPendingProgrammes({
    universityCode: 'POLYU',
    readiness: 'index-only',
    limit: 3
  });
  const polyuNoSource = ugService.listPendingProgrammes({
    universityCode: 'POLYU',
    readiness: 'no-source',
    limit: 2
  });
  const text = ugService.buildPendingCollectionText({
    universityCode: 'POLYU',
    readiness: 'no-source',
    limit: 2
  });

  assert.equal(ugService.normalizePendingReadinessFilter('index_only'), 'indexOnly');
  assert.equal(ugService.normalizePendingReadinessFilter('no-source'), 'noSource');
  assert.equal(ugService.normalizePendingReadinessFilter('all'), '');
  assert.throws(() => ugService.normalizePendingReadinessFilter('coded'), /Unknown pending readiness/);
  assert.equal(polyuIndexOnly.length, 3);
  assert(polyuIndexOnly.every((programme) => programme.sourceReadiness === 'indexOnly'));
  assert(polyuIndexOnly.every((programme) => programme.sourceStatusLabel === '仅索引 / 来源'));
  assert.equal(polyuNoSource.length, 0);
  assert.equal(ugService.getPendingSourceReadinessKey({}), 'noSource');
  assert.equal(ugService.getPendingSourceStatus({}), '缺来源');
  assert.match(text, /待补 Programme：35/);
  assert.match(text, /当前筛选：no-source · 0 个/);
  assert.match(text, /暂无待补 Programme/);
});

test('UG pending programme collection can prioritize launch batches', () => {
  const pending = ugService.listPendingProgrammes({ priority: 'launch', limit: 4 });
  const text = ugService.buildPendingCollectionText({ priority: 'launch', limit: 4 });

  assert.equal(ugService.normalizePendingPriorityMode('first_batch'), 'launch');
  assert.equal(ugService.normalizePendingPriorityMode('none'), '');
  assert.throws(() => ugService.normalizePendingPriorityMode('random'), /Unknown pending priority/);
  assert.equal(pending.length, 4);
  assert(pending.every((programme) => programme.universityCode === 'POLYU'));
  assert.equal(pending[0].code, 'JS3011');
  assert.equal(ugService.isUmbrellaSchemeProgramme({ name: 'Bachelor’s Degree Scheme in Interdisciplinary Studies' }), true);
  assert.equal(ugService.isUmbrellaSchemeProgramme({ name: 'Bachelor of Science (Honours) Scheme in Biotechnology and Chemical Technology' }), false);
  assert.match(text, /优先级：launch/);
  assert.match(text, /1\. POLYU · JS3011 · Bachelor of Science \(Honours\) Scheme in Biotechnology and Chemical Technology/);
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
    HKU: { programmeCount: 137, majorCount: 137, codedCourseCount: 1511 },
    CUHK: { programmeCount: 84, majorCount: 84, codedCourseCount: 131 },
    HKUST: { programmeCount: 50, majorCount: 64, codedCourseCount: 121 },
    POLYU: { programmeCount: 46, majorCount: 110, codedCourseCount: 1486 },
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
  assert.equal(hku.programmeWithCoursesCount, 21);
  assert.equal(hku.pendingProgrammeCount, 115);
  assert.equal(hku.coveragePercent, 15);
  assert.equal(hku.codedCourseCount, 1511);
  assert.equal(hku.generatedDate, '2026-07-09');
  assert.equal(hku.updatedLabel, '更新于 2026-07-09');
  assert.equal(hku.badge, 'COURSES');
  assert.equal(hku.sourceReadiness.indexOnly + hku.sourceReadiness.noSource, hku.pendingProgrammeCount);
  assert.match(hku.sourceReadinessLabel, /仅索引 \/ 来源/);
  const cuhk = coverage.find((school) => school.code === 'CUHK');
  assert.equal(cuhk.programmeWithCoursesCount, 3);
  assert(cuhk.pendingProgrammeCount > 0);
  assert(cuhk.coveragePercent > 0);
  assert.equal(cuhk.codedCourseCount, 131);
  assert.equal(cuhk.badge, 'COURSES');
  assert.equal(polyu.programmeWithCoursesCount, 11);
  assert.equal(polyu.pendingProgrammeCount, 35);
  assert.equal(polyu.coveragePercent, 24);
  assert.equal(polyu.codedCourseCount, 1486);
  assert.equal(polyu.badge, 'COURSES');
  assert.equal(polyu.sourceReadiness.indexOnly, polyu.pendingProgrammeCount);
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
  assert.deepEqual(lingnan.sourceReadiness, { indexOnly: 0, noSource: 0 });
  assert(polyu.coverageLabel.includes('课程代码'));
});

test('PolyU Physics with AIDA or IE exposes official secondary major courses', () => {
  const polyu = ugService.listUniversities().find((item) => item.code === 'POLYU');
  const programmes = ugService.listProgrammes({ universityId: polyu.id, degreeLevel: 'undergraduate' });
  const physics = programmes.find((programme) => programme.code === 'JS3030');
  const majors = ugService.listMajors(physics.id);
  const aida = majors.find((major) => major.nameEn.includes('Artificial Intelligence and Data Analytics'));
  const ie = majors.find((major) => major.nameEn.includes('Innovation and Entrepreneurship'));
  const aidaCourses = ugService.listMajorCourses(physics.id, aida.id);
  const ieCourses = ugService.listMajorCourses(physics.id, ie.id);

  assert.equal(physics.sourceStatus, 'course_codes_available');
  assert.equal(physics.codedCourseCount, 17);
  assert.equal(aida.codedCourseCount, 9);
  assert.equal(ie.codedCourseCount, 8);
  assert(aidaCourses.some((course) => course.courseCode === 'COMP4431' && course.titleEn === 'Artificial Intelligence'));
  assert(aidaCourses.some((course) => course.courseCode === 'AP40020' && course.courseType === 'capstone'));
  assert(ieCourses.some((course) => course.courseCode === 'MM3161' && course.titleEn === 'Creativity, Innovation and Entrepreneurship'));
  assert(ieCourses.some((course) => course.courseCode === 'AP40022' && course.credits === 6));
});

test('PolyU Fashion exposes official SFT subject cluster courses', () => {
  const polyu = ugService.listUniversities().find((item) => item.code === 'POLYU');
  const programmes = ugService.listProgrammes({ universityId: polyu.id, degreeLevel: 'undergraduate' });
  const fashion = programmes.find((programme) => programme.code === 'JS3050');
  const majors = ugService.listMajors(fashion.id);
  const fashionDesign = majors.find((major) => major.nameEn === 'Fashion Design');
  const fashionBusiness = majors.find((major) => major.nameEn === 'Fashion Business');
  const designCourses = ugService.listMajorCourses(fashion.id, fashionDesign.id);
  const businessCourses = ugService.listMajorCourses(fashion.id, fashionBusiness.id);

  assert.equal(fashion.sourceStatus, 'course_codes_available');
  assert.equal(fashion.codedCourseCount, 315);
  assert.equal(fashionDesign.codedCourseCount, 63);
  assert.equal(fashionBusiness.codedCourseCount, 63);
  assert(designCourses.some((course) => course.courseCode === 'SFT207DD' && course.titleEn === 'Digital Product Creation'));
  assert(designCourses.some((course) => course.courseCode === 'SFT415CP' && course.courseType === 'capstone'));
  assert(businessCourses.some((course) => course.courseCode === 'SFT413FB' && course.titleEn === 'Fashion Brand Management'));
  assert(ugService.listMajorCourses(fashion.id, fashionBusiness.id, { keyword: 'AI in Fashion' }).some((course) => course.courseCode === 'SFT303AF'));
});

test('PolyU Accounting and Finance Scheme exposes official AF programme requirement subjects', () => {
  const polyu = ugService.listUniversities().find((item) => item.code === 'POLYU');
  const programmes = ugService.listProgrammes({ universityId: polyu.id, degreeLevel: 'undergraduate' });
  const accountingScheme = programmes.find((programme) => programme.code === 'JS3060');
  const majors = ugService.listMajors(accountingScheme.id);
  const accountancy = majors.find((major) => major.nameEn === 'Accountancy');
  const accountingAndFinance = majors.find((major) => major.nameEn === 'Accounting and Finance');
  const digitalFinance = majors.find((major) => major.nameEn === 'Digital Finance and Investment');
  const accountancyCourses = ugService.listMajorCourses(accountingScheme.id, accountancy.id);
  const accountingAndFinanceCourses = ugService.listMajorCourses(accountingScheme.id, accountingAndFinance.id);
  const digitalFinanceCourses = ugService.listMajorCourses(accountingScheme.id, digitalFinance.id);

  assert.equal(accountingScheme.sourceStatus, 'course_codes_available');
  assert.equal(accountingScheme.codedCourseCount, 252);
  assert.equal(accountancy.codedCourseCount, 39);
  assert.equal(accountingAndFinance.codedCourseCount, 47);
  assert.equal(digitalFinance.codedCourseCount, 40);
  assert(accountancyCourses.some((course) => course.courseCode === 'AF3110' && course.titleEn === 'Intermediate Accounting 1'));
  assert(accountancyCourses.some((course) => course.courseCode === 'AF4912' && course.courseType === 'capstone'));
  assert(accountingAndFinanceCourses.some((course) => course.courseCode === 'AF4317' && course.titleEn === 'Derivative Securities'));
  assert(digitalFinanceCourses.some((course) => course.courseCode === 'AF4231' && course.titleEn === 'Machine Learning and Finance Analytics'));
  assert(ugService.listMajorCourses(accountingScheme.id, digitalFinance.id, { keyword: 'ESG Investing' }).some((course) => course.courseCode === 'AF4338'));
});

test('PolyU LMS scheme exposes official undergraduate subject syllabi course pool', () => {
  const polyu = ugService.listUniversities().find((item) => item.code === 'POLYU');
  const programmes = ugService.listProgrammes({ universityId: polyu.id, degreeLevel: 'undergraduate' });
  const lmsScheme = programmes.find((programme) => programme.code === 'JS3070');
  const major = ugService.listMajors(lmsScheme.id)[0];
  const profile = ugService.getMajorProfile(lmsScheme.id, major.id, '2026');
  const courses = ugService.listMajorCourses(lmsScheme.id, major.id);

  assert.equal(lmsScheme.sourceStatus, 'course_codes_available');
  assert.equal(lmsScheme.codedCourseCount, 71);
  assert.equal(profile.codedCourseCount, 71);
  assert.equal(courses.length, 71);
  assert(courses.some((course) => course.courseCode === 'LGT3007' && course.titleEn === 'Air Transport Logistics'));
  assert(courses.some((course) => course.courseCode === 'LGT4306' && course.titleEn === 'Supply Chain Analytics'));
  assert(courses.some((course) => course.courseCode === 'LGT4811' && course.courseType === 'capstone'));
  assert(ugService.listMajorCourses(lmsScheme.id, major.id, { keyword: 'digital procurement' }).some((course) => course.courseCode === 'LGT4310'));
});

test('PolyU Management and Marketing scheme exposes official undergraduate subject syllabi course pool', () => {
  const polyu = ugService.listUniversities().find((item) => item.code === 'POLYU');
  const programmes = ugService.listProgrammes({ universityId: polyu.id, degreeLevel: 'undergraduate' });
  const mmScheme = programmes.find((programme) => programme.code === 'JS3080');
  const majors = ugService.listMajors(mmScheme.id);
  const management = majors.find((major) => major.nameEn === 'Management');
  const marketing = majors.find((major) => major.nameEn === 'Marketing');
  const managementProfile = ugService.getMajorProfile(mmScheme.id, management.id, '2026');
  const marketingCourses = ugService.listMajorCourses(mmScheme.id, marketing.id);

  assert.equal(mmScheme.sourceStatus, 'course_codes_available');
  assert.equal(mmScheme.codedCourseCount, 118);
  assert.equal(management.codedCourseCount, 59);
  assert.equal(marketing.codedCourseCount, 59);
  assert.equal(managementProfile.codedCourseCount, 118);
  assert.equal(marketingCourses.length, 59);
  assert(marketingCourses.some((course) => course.courseCode === 'MM3842' && course.titleEn === 'Digital Marketing'));
  assert(marketingCourses.some((course) => course.courseCode === 'MM4942' && course.courseType === 'capstone'));
  assert(ugService.listMajorCourses(mmScheme.id, management.id, { keyword: 'Human Resource Management' }).some((course) => course.courseCode === 'MM3111'));
  assert(ugService.listMajorCourses(mmScheme.id, marketing.id, { keyword: 'Strategic Brand' }).some((course) => course.courseCode === 'MM4831'));
});

test('PolyU Spatial Data Science and Smart Cities scheme exposes official LSGS subject list courses', () => {
  const polyu = ugService.listUniversities().find((item) => item.code === 'POLYU');
  const programmes = ugService.listProgrammes({ universityId: polyu.id, degreeLevel: 'undergraduate' });
  const lsgsScheme = programmes.find((programme) => programme.code === 'JS3130');
  const majors = ugService.listMajors(lsgsScheme.id);
  const landSurveying = majors.find((major) => major.nameEn === 'Land Surveying and Geo-Informatics');
  const smartCities = majors.find((major) => major.nameEn === 'Urban Informatics and Smart Cities');
  const landProfile = ugService.getMajorProfile(lsgsScheme.id, landSurveying.id, '2026');
  const smartCityCourses = ugService.listMajorCourses(lsgsScheme.id, smartCities.id);

  assert.equal(lsgsScheme.sourceStatus, 'course_codes_available');
  assert.equal(lsgsScheme.codedCourseCount, 114);
  assert.equal(landSurveying.codedCourseCount, 57);
  assert.equal(smartCities.codedCourseCount, 57);
  assert.equal(landProfile.codedCourseCount, 114);
  assert.equal(smartCityCourses.length, 57);
  assert(smartCityCourses.some((course) => course.courseCode === 'LSGI3802' && course.titleEn === 'Spatial Data Science'));
  assert(smartCityCourses.some((course) => course.courseCode === 'LSGI4503' && course.courseType === 'capstone'));
  assert(ugService.listMajorCourses(lsgsScheme.id, landSurveying.id, { keyword: 'Survey Adjustment' }).some((course) => course.courseCode === 'LSGI2341A'));
  assert(ugService.listMajorCourses(lsgsScheme.id, smartCities.id, { keyword: 'Urban Big Data' }).some((course) => course.courseCode === 'LSGI3804'));
});

test('PolyU Aviation Engineering scheme exposes official AAE subject list courses', () => {
  const polyu = ugService.listUniversities().find((item) => item.code === 'POLYU');
  const programmes = ugService.listProgrammes({ universityId: polyu.id, degreeLevel: 'undergraduate' });
  const aviationScheme = programmes.find((programme) => programme.code === 'JS3140');
  const majors = ugService.listMajors(aviationScheme.id);
  const aeronautical = majors.find((major) => major.nameEn === 'Aeronautical Engineering');
  const airTransport = majors.find((major) => major.nameEn === 'Air Transport Engineering');
  const aeronauticalProfile = ugService.getMajorProfile(aviationScheme.id, aeronautical.id, '2026');
  const airTransportCourses = ugService.listMajorCourses(aviationScheme.id, airTransport.id);

  assert.equal(aviationScheme.sourceStatus, 'course_codes_available');
  assert.equal(aviationScheme.codedCourseCount, 88);
  assert.equal(aeronautical.codedCourseCount, 44);
  assert.equal(airTransport.codedCourseCount, 44);
  assert.equal(aeronauticalProfile.codedCourseCount, 88);
  assert.equal(airTransportCourses.length, 44);
  assert(airTransportCourses.some((course) => course.courseCode === 'AAE3001' && course.titleEn === 'Fundamentals of Aerodynamics'));
  assert(airTransportCourses.some((course) => course.courseCode === 'AAE4012' && course.courseType === 'capstone'));
  assert(ugService.listMajorCourses(aviationScheme.id, aeronautical.id, { keyword: 'Aircraft Propulsion' }).some((course) => course.courseCode === 'AAE3003'));
  assert(ugService.listMajorCourses(aviationScheme.id, airTransport.id, { keyword: 'Air Traffic Management' }).some((course) => course.courseCode === 'AAE3012'));
});

test('PolyU Biomedical Engineering exposes official BME subject list courses', () => {
  const polyu = ugService.listUniversities().find((item) => item.code === 'POLYU');
  const programmes = ugService.listProgrammes({ universityId: polyu.id, degreeLevel: 'undergraduate' });
  const bmeProgramme = programmes.find((programme) => programme.code === 'JS3150');
  const major = ugService.listMajors(bmeProgramme.id)[0];
  const profile = ugService.getMajorProfile(bmeProgramme.id, major.id, '2026');
  const courses = ugService.listMajorCourses(bmeProgramme.id, major.id);

  assert.equal(bmeProgramme.sourceStatus, 'course_codes_available');
  assert.equal(bmeProgramme.codedCourseCount, 58);
  assert.equal(major.codedCourseCount, 58);
  assert.equal(profile.codedCourseCount, 58);
  assert.equal(courses.length, 58);
  assert(courses.some((course) => course.courseCode === 'BME31125' && course.titleEn === 'Clinical Measurement and Instrumentation'));
  assert(courses.some((course) => course.courseCode === 'BME41118' && course.courseType === 'capstone'));
  assert(ugService.listMajorCourses(bmeProgramme.id, major.id, { keyword: 'Medical Robotics' }).some((course) => course.courseCode === 'BME41137'));
  assert(ugService.listMajorCourses(bmeProgramme.id, major.id, { keyword: 'Chinese Communication' }).some((course) => course.courseCode === 'CLC3241'));
});

test('PolyU Electrical Engineering scheme exposes official EEE undergraduate subject syllabi', () => {
  const polyu = ugService.listUniversities().find((item) => item.code === 'POLYU');
  const programmes = ugService.listProgrammes({ universityId: polyu.id, degreeLevel: 'undergraduate' });
  const eeScheme = programmes.find((programme) => programme.code === 'JS3170');
  const majors = ugService.listMajors(eeScheme.id);
  const electrical = majors.find((major) => major.nameEn === 'Electrical Engineering');
  const transportation = majors.find((major) => major.nameEn === 'Transportation Systems Engineering');
  const electricalProfile = ugService.getMajorProfile(eeScheme.id, electrical.id, '2026');
  const transportationCourses = ugService.listMajorCourses(eeScheme.id, transportation.id);

  assert.equal(eeScheme.sourceStatus, 'course_codes_available');
  assert.equal(eeScheme.codedCourseCount, 74);
  assert.equal(electrical.codedCourseCount, 37);
  assert.equal(transportation.codedCourseCount, 37);
  assert.equal(electricalProfile.codedCourseCount, 74);
  assert.equal(transportationCourses.length, 37);
  assert(transportationCourses.some((course) => course.courseCode === 'EE4019' && course.titleEn === 'Intelligent Transportation Systems (EE4019B variant)'));
  assert(transportationCourses.some((course) => course.courseCode === 'EE4006' && course.courseType === 'capstone'));
  assert(ugService.listMajorCourses(eeScheme.id, electrical.id, { keyword: 'Power Systems' }).some((course) => course.courseCode === 'EE4004'));
  assert(ugService.listMajorCourses(eeScheme.id, transportation.id, { keyword: 'Transportation Data Analytics' }).some((course) => course.courseCode === 'EE3013'));
});

test('PolyU Information and Artificial Intelligence Engineering scheme exposes official EIE undergraduate subject syllabi', () => {
  const polyu = ugService.listUniversities().find((item) => item.code === 'POLYU');
  const programmes = ugService.listProgrammes({ universityId: polyu.id, degreeLevel: 'undergraduate' });
  const eieScheme = programmes.find((programme) => programme.code === 'JS3180');
  const majors = ugService.listMajors(eieScheme.id);
  const iot = majors.find((major) => major.nameEn === 'Internet-of-Things');
  const ai = majors.find((major) => major.nameEn === 'Artificial Intelligence');
  const security = majors.find((major) => major.nameEn === 'Information Security');
  const iotProfile = ugService.getMajorProfile(eieScheme.id, iot.id, '2026');
  const securityCourses = ugService.listMajorCourses(eieScheme.id, security.id);

  assert.equal(eieScheme.sourceStatus, 'course_codes_available');
  assert.equal(eieScheme.codedCourseCount, 213);
  assert.equal(iot.codedCourseCount, 71);
  assert.equal(ai.codedCourseCount, 71);
  assert.equal(security.codedCourseCount, 71);
  assert.equal(iotProfile.codedCourseCount, 213);
  assert.equal(securityCourses.length, 71);
  assert(securityCourses.some((course) => course.courseCode === 'EIE4117' && course.courseType === 'capstone'));
  assert(securityCourses.some((course) => course.courseCode === 'EIE4122' && course.titleEn === 'Deep Learning and Deep Neural Networks'));
  assert(ugService.listMajorCourses(eieScheme.id, iot.id, { keyword: 'Internet of Things' }).some((course) => course.courseCode === 'EIE2113'));
  assert(ugService.listMajorCourses(eieScheme.id, ai.id, { keyword: 'Machine Learning' }).some((course) => course.courseCode === 'EIE4121'));
  assert(ugService.listMajorCourses(eieScheme.id, security.id, { keyword: 'Network Security' }).some((course) => course.courseCode === 'EIE3130'));
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
  const hkuArts = programmes.find((programme) => programme.code === '6066');
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

test('HKU History exposes official BA syllabus courses', () => {
  const hku = ugService.listUniversities().find((item) => item.code === 'HKU');
  const programmes = ugService.listProgrammes({ universityId: hku.id, degreeLevel: 'undergraduate' });
  const history = programmes.find((programme) => programme.code === '6054' && programme.nameEn === 'Bachelor of Arts (Major in History)');
  const major = ugService.listMajors(history.id).find((item) => item.nameEn === 'History');
  const profile = ugService.getMajorProfile(history.id, major.id, '2026');
  const courses = ugService.listMajorCourses(history.id, major.id);

  assert.equal(history.sourceStatus, 'course_codes_available');
  assert.equal(profile.codedCourseCount, 179);
  assert.equal(courses.length, 179);
  ['HIST1010', 'HIST2208', 'HIST3022', 'HIST4017', 'HIST4037'].forEach((courseCode) => {
    assert(courses.some((course) => course.courseCode === courseCode));
  });
  assert(courses.some((course) => course.courseCode === 'HIST4017' && course.credits === 12 && course.courseType === 'capstone'));
  assert(courses.some((course) => course.courseCode === 'HIST4037' && course.courseType === 'capstone'));
  assert(ugService.listMajorCourses(history.id, major.id, { keyword: 'Silk Roads' }).some((course) => course.courseCode === 'HIST2208'));
  assert(ugService.listMajorCourses(history.id, major.id, { keyword: 'Artificial Intelligence' }).some((course) => course.courseCode === 'HIST4037'));
  assert(ugService.listMajorCourses(history.id, major.id, { keyword: 'Hong Kong' }).some((course) => course.courseCode === 'HIST1017'));
});

test('HKU Hong Kong Studies exposes official BA syllabus courses', () => {
  const hku = ugService.listUniversities().find((item) => item.code === 'HKU');
  const programmes = ugService.listProgrammes({ universityId: hku.id, degreeLevel: 'undergraduate' });
  const hongKongStudies = programmes.find((programme) => programme.code === '6054' && programme.nameEn === 'Bachelor of Arts (Major in Hong Kong Studies)');
  const major = ugService.listMajors(hongKongStudies.id).find((item) => item.nameEn === 'Hong Kong Studies');
  const profile = ugService.getMajorProfile(hongKongStudies.id, major.id, '2026');
  const courses = ugService.listMajorCourses(hongKongStudies.id, major.id);

  assert.equal(hongKongStudies.sourceStatus, 'course_codes_available');
  assert.equal(profile.codedCourseCount, 60);
  assert.equal(courses.length, 60);
  ['HKGS1001', 'HKGS2001', 'HKGS3001', 'GCIN2019', 'POLI3020', 'SOCI2075'].forEach((courseCode) => {
    assert(courses.some((course) => course.courseCode === courseCode));
  });
  assert(courses.some((course) => course.courseCode === 'HKGS2001' && course.courseType === 'core'));
  assert(courses.some((course) => course.courseCode === 'HKGS3001' && course.courseType === 'capstone'));
  assert(ugService.listMajorCourses(hongKongStudies.id, major.id, { keyword: 'Cantopop' }).some((course) => course.courseCode === 'HKGS2008'));
  assert(ugService.listMajorCourses(hongKongStudies.id, major.id, { keyword: 'TV industry' }).some((course) => course.courseCode === 'GCIN2011'));
  assert(ugService.listMajorCourses(hongKongStudies.id, major.id, { keyword: 'environment' }).some((course) => course.courseCode === 'GEOG2138'));
});

test('HKU Japanese Studies exposes official BA syllabus courses', () => {
  const hku = ugService.listUniversities().find((item) => item.code === 'HKU');
  const programmes = ugService.listProgrammes({ universityId: hku.id, degreeLevel: 'undergraduate' });
  const japaneseStudies = programmes.find((programme) => programme.code === '6054' && programme.nameEn === 'Bachelor of Arts (Major in Japanese Studies)');
  const major = ugService.listMajors(japaneseStudies.id).find((item) => item.nameEn === 'Japanese Studies');
  const profile = ugService.getMajorProfile(japaneseStudies.id, major.id, '2026');
  const courses = ugService.listMajorCourses(japaneseStudies.id, major.id);

  assert.equal(japaneseStudies.sourceStatus, 'course_codes_available');
  assert.equal(profile.codedCourseCount, 75);
  assert.equal(courses.length, 75);
  ['JAPN1011', 'JAPN2088', 'JAPN3082', 'JAPN4101', 'JAPN2010', 'JAPN3067', 'JAPN4088', 'GCIN2013', 'POLI3126', 'SOCI2090'].forEach((courseCode) => {
    assert(courses.some((course) => course.courseCode === courseCode));
  });
  assert(courses.some((course) => course.courseCode === 'JAPN2088' && course.courseType === 'core'));
  assert(courses.some((course) => course.courseCode === 'JAPN4101' && course.courseType === 'capstone'));
  assert(ugService.listMajorCourses(japaneseStudies.id, major.id, { keyword: 'popular culture' }).some((course) => course.courseCode === 'JAPN2058'));
  assert(ugService.listMajorCourses(japaneseStudies.id, major.id, { keyword: 'manga' }).some((course) => course.courseCode === 'JAPN3062'));
  assert(ugService.listMajorCourses(japaneseStudies.id, major.id, { keyword: 'video game' }).some((course) => course.courseCode === 'GCIN2013'));
  assert(ugService.listMajorCourses(japaneseStudies.id, major.id, { keyword: 'World city Tokyo' }).some((course) => course.courseCode === 'SOCI2090'));
});

test('HKU Korean Studies exposes official BA syllabus courses', () => {
  const hku = ugService.listUniversities().find((item) => item.code === 'HKU');
  const programmes = ugService.listProgrammes({ universityId: hku.id, degreeLevel: 'undergraduate' });
  const koreanStudies = programmes.find((programme) => programme.code === '6054' && programme.nameEn === 'Bachelor of Arts (Major in Korean Studies)');
  const major = ugService.listMajors(koreanStudies.id).find((item) => item.nameEn === 'Korean Studies');
  const profile = ugService.getMajorProfile(koreanStudies.id, major.id, '2026');
  const courses = ugService.listMajorCourses(koreanStudies.id, major.id);

  assert.equal(koreanStudies.sourceStatus, 'course_codes_available');
  assert.equal(profile.codedCourseCount, 52);
  assert.equal(courses.length, 52);
  ['KORE1001', 'KORE2001', 'KORE3044', 'KORE4008', 'KORE2028', 'KORE2038', 'KORE3043', 'ARTH2097', 'GEOG2153', 'GEOG3403'].forEach((courseCode) => {
    assert(courses.some((course) => course.courseCode === courseCode));
  });
  assert(courses.some((course) => course.courseCode === 'KORE2001' && course.courseType === 'core'));
  assert(courses.some((course) => course.courseCode === 'KORE4008' && course.courseType === 'capstone'));
  assert(ugService.listMajorCourses(koreanStudies.id, major.id, { keyword: 'K-pop' }).some((course) => course.courseCode === 'GEOG2153'));
  assert(ugService.listMajorCourses(koreanStudies.id, major.id, { keyword: 'North Korea' }).some((course) => course.courseCode === 'KORE2028'));
  assert(ugService.listMajorCourses(koreanStudies.id, major.id, { keyword: 'Korean War' }).some((course) => course.courseCode === 'KORE2044'));
  assert(ugService.listMajorCourses(koreanStudies.id, major.id, { keyword: 'urban planning' }).some((course) => course.courseCode === 'GEOG3403'));
});

test('HKU Music exposes official BA syllabus courses', () => {
  const hku = ugService.listUniversities().find((item) => item.code === 'HKU');
  const programmes = ugService.listProgrammes({ universityId: hku.id, degreeLevel: 'undergraduate' });
  const music = programmes.find((programme) => programme.code === '6054' && programme.nameEn === 'Bachelor of Arts (Major in Music)');
  const major = ugService.listMajors(music.id).find((item) => item.nameEn === 'Music');
  const profile = ugService.getMajorProfile(music.id, major.id, '2026');
  const courses = ugService.listMajorCourses(music.id, major.id);

  assert.equal(music.sourceStatus, 'course_codes_available');
  assert.equal(profile.codedCourseCount, 55);
  assert.equal(courses.length, 55);
  ['MUSI1023', 'MUSI2010', 'MUSI2070', 'MUSI2081', 'MUSI3028', 'MUSI3039', 'MUSI3042', 'MUSI4002', 'MUSI4003', 'MUSI2088'].forEach((courseCode) => {
    assert(courses.some((course) => course.courseCode === courseCode));
  });
  assert(courses.some((course) => course.courseCode === 'MUSI1023' && course.courseType === 'core'));
  assert(courses.some((course) => course.courseCode === 'MUSI4003' && course.courseType === 'capstone'));
  assert(ugService.listMajorCourses(music.id, major.id, { keyword: 'AI' }).some((course) => course.courseCode === 'MUSI2088'));
  assert(ugService.listMajorCourses(music.id, major.id, { keyword: 'film music' }).some((course) => course.courseCode === 'MUSI2044'));
  assert(ugService.listMajorCourses(music.id, major.id, { keyword: 'gamelan' }).some((course) => course.courseCode === 'MUSI2068'));
  assert(ugService.listMajorCourses(music.id, major.id, { keyword: 'environment' }).some((course) => course.courseCode === 'MUSI3041'));
});

test('HKU Philosophy exposes official BA syllabus courses', () => {
  const hku = ugService.listUniversities().find((item) => item.code === 'HKU');
  const programmes = ugService.listProgrammes({ universityId: hku.id, degreeLevel: 'undergraduate' });
  const philosophy = programmes.find((programme) => programme.code === '6054' && programme.nameEn === 'Bachelor of Arts (Major in Philosophy)');
  const major = ugService.listMajors(philosophy.id).find((item) => item.nameEn === 'Philosophy');
  const profile = ugService.getMajorProfile(philosophy.id, major.id, '2026');
  const courses = ugService.listMajorCourses(philosophy.id, major.id);

  assert.equal(philosophy.sourceStatus, 'course_codes_available');
  assert.equal(profile.codedCourseCount, 94);
  assert.equal(courses.length, 94);
  ['PHIL1012', 'PHIL1034', 'PHIL2225', 'PHIL2369', 'PHIL2481', 'PHIL2800', 'PHIL3920', 'PHIL4810', 'PHIL4920'].forEach((courseCode) => {
    assert(courses.some((course) => course.courseCode === courseCode));
  });
  assert(courses.some((course) => course.courseCode === 'PHIL3920' && course.courseType === 'capstone'));
  assert(courses.some((course) => course.courseCode === 'PHIL4920' && course.courseType === 'capstone' && course.credits === 12));
  assert(ugService.listMajorCourses(philosophy.id, major.id, { keyword: 'artificial intelligence' }).some((course) => course.courseCode === 'PHIL2225'));
  assert(ugService.listMajorCourses(philosophy.id, major.id, { keyword: 'Environmental philosophy' }).some((course) => course.courseCode === 'PHIL2369'));
  assert(ugService.listMajorCourses(philosophy.id, major.id, { keyword: 'Buddhist philosophy' }).some((course) => course.courseCode === 'PHIL2800'));
  assert(ugService.listMajorCourses(philosophy.id, major.id, { keyword: 'Senior thesis' }).some((course) => course.courseCode === 'PHIL4920'));
});

test('HKU Translation exposes official BA syllabus courses', () => {
  const hku = ugService.listUniversities().find((item) => item.code === 'HKU');
  const programmes = ugService.listProgrammes({ universityId: hku.id, degreeLevel: 'undergraduate' });
  const translation = programmes.find((programme) => programme.code === '6054' && programme.nameEn === 'Bachelor of Arts (Major in Translation)');
  const major = ugService.listMajors(translation.id).find((item) => item.nameEn === 'Translation');
  const profile = ugService.getMajorProfile(translation.id, major.id, '2026');
  const courses = ugService.listMajorCourses(translation.id, major.id);

  assert.equal(translation.sourceStatus, 'course_codes_available');
  assert.equal(profile.codedCourseCount, 41);
  assert.equal(courses.length, 41);
  ['CHIN1311', 'CHIN2336', 'CHIN2369', 'CHIN2373', 'CHIN2320', 'CHIN2321'].forEach((courseCode) => {
    assert(courses.some((course) => course.courseCode === courseCode));
  });
  assert(courses.some((course) => course.courseCode === 'CHIN2320' && course.courseType === 'capstone'));
  assert(courses.some((course) => course.courseCode === 'CHIN2321' && course.courseType === 'capstone'));
  assert(ugService.listMajorCourses(translation.id, major.id, { keyword: 'translation technologies' }).some((course) => course.courseCode === 'CHIN2373'));
  assert(ugService.listMajorCourses(translation.id, major.id, { keyword: 'legal interpreting' }).some((course) => course.courseCode === 'CHIN2343'));
  assert(ugService.listMajorCourses(translation.id, major.id, { keyword: 'Journey to the West' }).some((course) => course.courseCode === 'CHIN2377'));
});
