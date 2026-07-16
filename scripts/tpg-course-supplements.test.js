const assert = require('node:assert/strict');
const { test } = require('node:test');

const { applySupplements, validateSupplement } = require('./import-tpg-course-supplements');
const { buildCoverageReport, inspectProgramme } = require('./report-tpg-course-coverage');
const { parseCourseRefs: parseHkustCourseRefs } = require('./fetch-hkust-tpg-curricula');
const { buildSupplement: buildHkuEngineeringSupplement } = require('./build-hku-engineering-supplement');
const { buildSupplement: buildHkuEcicSupplement } = require('./build-hku-ecic-supplement');
const { buildSupplement: buildHkuGovernancePolicySupplement } = require('./build-hku-governance-policy-supplement');
const { buildSupplements: buildHkuArchitectureSecondBatchSupplements } = require('./build-hku-architecture-second-batch-supplements');
const { buildSupplement: buildHkuArchitectureFirstBatchSupplement } = require('./build-hku-architecture-first-batch-supplements');
const { buildSupplement: buildHkuAppliedLinguisticsSupplement } = require('./build-hku-applied-linguistics-supplement');
const { buildSupplement: buildHkuChineseLanguageLiteratureSupplement } = require('./build-hku-chinese-language-literature-supplement');
const { buildSupplement: buildHkuCreativeCommunicationsSupplement } = require('./build-hku-creative-communications-supplement');
const { buildSupplement: buildHkuEastAsianStudiesSupplement } = require('./build-hku-east-asian-studies-supplement');
const { buildSupplement: buildHkuEnglishStudiesSupplement } = require('./build-hku-english-studies-supplement');
const { buildSupplement: buildHkuEuropeanStudiesSupplement } = require('./build-hku-european-studies-supplement');
const { buildSupplement: buildHkuHongKongCulturalStudiesSupplement } = require('./build-hku-hong-kong-cultural-studies-supplement');
const { buildSupplement: buildHkuLiteraryCulturalStudiesSupplement } = require('./build-hku-literary-cultural-studies-supplement');
const { buildSupplement: buildHkuTranslationSupplement } = require('./build-hku-translation-supplement');
const { buildSupplement: buildHkuBuddhistCounsellingSupplement } = require('./build-hku-buddhist-counselling-supplement');
const { buildSupplement: buildHkuBuddhistStudiesSupplement } = require('./build-hku-buddhist-studies-supplement');
const { buildSupplement: buildHkuCreativeWritingMfaSupplement } = require('./build-hku-creative-writing-mfa-supplement');
const { buildSupplement: buildHkuEndodonticsSupplement } = require('./build-hku-endodontics-supplement');
const { buildSupplement: buildHkuOrthodonticsSupplement } = require('./build-hku-orthodontics-supplement');
const { buildSupplement: buildHkuPaediatricDentistrySupplement } = require('./build-hku-paediatric-dentistry-supplement');
const { buildSupplement: buildHkuPeriodontologySupplement } = require('./build-hku-periodontology-supplement');
const { buildSupplement: buildHkuProsthodonticsSourceStatusSupplement } = require('./build-hku-prosthodontics-source-status-supplement');
const { buildSupplement: buildHkuCommunityDentistrySourceStatusSupplement } = require('./build-hku-community-dentistry-source-status-supplement');
const { buildSupplement: buildHkuDentalMaterialsScienceSupplement } = require('./build-hku-dental-materials-science-supplement');
const { buildSupplement: buildHkuMatesolSupplement } = require('./build-hku-matesol-supplement');
const { buildSupplement: buildHkuMedSupplement, TRACKS: HKU_MED_TRACKS } = require('./build-hku-med-supplement');
const { TRACK_ID: HKBU_COMMUNICATION_TRACK_ID, buildSupplement: buildHkbuCommunicationSupplement } = require('./build-hkbu-communication-supplement');
const { TRACKS: HKBU_MAIJS_TRACKS, buildSupplement: buildHkbuInternationalJournalismSupplement } = require('./build-hkbu-international-journalism-supplement');
const { buildSupplement: buildHkbuMediaManagementSupplement } = require('./build-hkbu-media-management-supplement');
const { buildSupplement: buildHkbuMbaMainlandSupplement } = require('./build-hkbu-mba-mainland-supplement');
const { MCM_TRACKS: HKBU_MCM_TRACKS, buildSupplements: buildHkbuChineseMedicineSupplements } = require('./build-hkbu-chinese-medicine-supplements');
const { MFA_TRACKS: HKBU_MFA_TRACKS, VISUAL_ARTS_TRACKS: HKBU_VISUAL_ARTS_TRACKS, buildSupplements: buildHkbuCreativeArtsSupplements } = require('./build-hkbu-creative-arts-supplements');
const { buildSupplement: buildPolyuHospitalityTourismManagementSupplement } = require('./build-polyu-hospitality-tourism-management-supplement');
const { buildSupplement: buildPolyuSustainableTechnologyCarbonNeutralitySupplement } = require('./build-polyu-sustainable-technology-carbon-neutrality-supplement');
const { buildSupplement: buildPolyuBiopharmaceuticalDevelopmentSupplement } = require('./build-polyu-biopharmaceutical-development-supplements');
const { TRACKS: POLYU_OT_TRACKS, buildSupplement: buildPolyuAdvancedOccupationalTherapySupplement } = require('./build-polyu-advanced-occupational-therapy-supplement');
const { SPECIALISM_ID: POLYU_REHAB_SPECIALISM_ID, buildSupplement: buildPolyuAdvancedRehabilitationSciencesSupplement } = require('./build-polyu-advanced-rehabilitation-sciences-supplement');
const { buildSupplement: buildPolyuActuarialInvestmentScienceSupplement } = require('./build-polyu-actuarial-investment-science-supplement');
const { buildSupplement: buildPolyuOperationalResearchRiskAnalysisSupplement } = require('./build-polyu-operational-research-risk-analysis-supplement');
const { buildSupplement: buildPolyuAmaFinanceAiSupplement } = require('./build-polyu-ama-finance-ai-supplements');
const { buildSupplement: buildPolyuHealthInformaticsSupplement } = require('./build-polyu-health-informatics-supplement');
const { buildSupplement: buildPolyuChineseCultureSupplement } = require('./build-polyu-chinese-culture-supplement');
const { TRACKS: POLYU_DESIGN_TRACKS, buildSupplement: buildPolyuDesignSupplement } = require('./build-polyu-design-supplement');
const { IT_TRACKS, buildInformationTechnology } = require('./build-polyu-comp-supplements');
const { buildSupplement: buildPolyuFoodScienceNutritionSupplement } = require('./build-polyu-food-science-nutrition-supplement');
const { buildSupplement: buildPolyuEngineeringBusinessManagementSupplement } = require('./build-polyu-engineering-business-management-supplement');
const { buildSupplement: buildPolyuIndustrialSystemsEngineeringSupplement } = require('./build-polyu-industrial-systems-engineering-supplement');
const { OM_TRACKS: POLYU_OM_TRACKS, buildSupplement: buildPolyuLogisticsManagementSupplement } = require('./build-polyu-logistics-management-supplement');
const { buildSupplement: buildPolyuBusinessAnalyticsSupplement } = require('./build-polyu-business-analytics-supplement');
const { buildSupplement: buildPolyuManagementMarketingSupplement } = require('./build-polyu-management-marketing-supplement');
const { buildSupplement: buildPolyuDsaiSupplement } = require('./build-polyu-dsai-supplement');
const { TRACKS: POLYU_ME_TRACKS, buildSupplement: buildPolyuMechanicalEngineeringSupplement } = require('./build-polyu-mechanical-engineering-supplement');

function fixtureCatalogue() {
  return {
    programmes: [{
      id: 'TEST-TPG-001',
      universityCode: 'TEST',
      name: 'Test Programme',
      tracks: [{ id: 'TEST-TRACK-A', name: 'A' }],
      dataLevel: 'programme',
      courseGroups: []
    }]
  };
}

function fixtureSupplement() {
  return {
    schemaVersion: 1,
    schoolCode: 'TEST',
    academicYear: '2026-27',
    verifiedAt: '2026-07-11',
    programmes: [{
      programmeId: 'TEST-TPG-001',
      status: 'verified',
      creditsRequired: 6,
      creditUnit: 'credits',
      sourceUrl: 'https://example.edu/programme',
      ruleReviewStatus: 'manual_review_required',
      courseGroups: [{
        id: 'core',
        name: 'Core',
        type: 'core',
        creditsRequired: 3,
        appliesToTrackIds: [],
        sourceUrl: 'https://example.edu/curriculum',
        courses: [{ code: 'TST5001', name: 'Test', credits: 3, appliesToTrackIds: ['TEST-TRACK-A'], sourceUrl: 'https://example.edu/course' }]
      }]
    }]
  };
}

test('HKUST course reference parsing trims official attribute whitespace', () => {
  const [course] = parseHkustCourseRefs('<button data-crse-idx=" 108001 " data-acad-year="2026-27 " data-crse-code="OCES6111 " data-crse-prefix="OCES " data-crse-log-num="6111 ">Course</button>');

  assert.deepEqual(course, {
    idx: '108001',
    academicYear: '2026-27',
    code: 'OCES6111',
    prefix: 'OCES',
    number: '6111'
  });
});

test('TPG course supplement import is deterministic and preserves Programme IDs', () => {
  const catalogue = fixtureCatalogue();
  const supplement = fixtureSupplement();
  validateSupplement(supplement, catalogue, 'fixture.json');
  const imported = applySupplements(catalogue, [{ file: 'fixture.json', value: supplement }]);
  assert.equal(imported.programmes[0].id, 'TEST-TPG-001');
  assert.equal(imported.programmes[0].courseVerificationStatus, 'verified');
  assert.equal(imported.programmes[0].courseGroups[0].courses[0].credits, 3);
  assert.deepEqual(applySupplements(imported, [{ file: 'fixture.json', value: supplement }]), imported);
});

test('TPG course supplements preserve a newer Programme-level verification date', () => {
  const supplement = fixtureSupplement();
  supplement.verifiedAt = '2026-07-11';
  supplement.programmes[0].verifiedAt = '2026-07-15';
  validateSupplement(supplement, fixtureCatalogue(), 'fixture.json');

  const imported = applySupplements(fixtureCatalogue(), [{ file: 'fixture.json', value: supplement }]);
  assert.equal(imported.programmes[0].courseVerifiedAt, '2026-07-15');

  supplement.programmes[0].verifiedAt = '15 July 2026';
  assert.throws(() => validateSupplement(supplement, fixtureCatalogue(), 'fixture.json'), /invalid verifiedAt date/);
});

test('TPG course supplement import materializes inherited official source URLs', () => {
  const supplement = fixtureSupplement();
  delete supplement.programmes[0].courseGroups[0].sourceUrl;
  delete supplement.programmes[0].courseGroups[0].courses[0].sourceUrl;
  validateSupplement(supplement, fixtureCatalogue(), 'fixture.json');
  const imported = applySupplements(fixtureCatalogue(), [{ file: 'fixture.json', value: supplement }]);
  assert.equal(imported.programmes[0].courseGroups[0].sourceUrl, 'https://example.edu/programme');
  assert.equal(imported.programmes[0].courseGroups[0].courses[0].sourceUrl, 'https://example.edu/programme');
});

test('TPG course supplements can add official Tracks before validating course ownership', () => {
  const catalogue = fixtureCatalogue();
  catalogue.programmes[0].tracks = [];
  const supplement = fixtureSupplement();
  supplement.programmes[0].tracks = [{
    id: 'TEST-TRACK-A',
    name: 'A',
    type: 'Stream',
    sourceUrl: 'https://example.edu/programme'
  }];
  validateSupplement(supplement, catalogue, 'fixture.json');
  const imported = applySupplements(catalogue, [{ file: 'fixture.json', value: supplement }]);
  assert.deepEqual(imported.programmes[0].tracks, supplement.programmes[0].tracks);
});

test('TPG course supplements preserve directory metadata while enriching stable Tracks', () => {
  const catalogue = fixtureCatalogue();
  catalogue.programmes[0].tracks[0] = {
    id: 'TEST-TRACK-A',
    code: 'A-001',
    name: 'A',
    type: 'Stream',
    sourceUrl: 'https://example.edu/directory',
    lastVerifiedAt: '2026-07-10'
  };
  const supplement = fixtureSupplement();
  supplement.programmes[0].tracks = [{
    id: 'TEST-TRACK-A',
    name: 'Current A',
    type: 'Stream',
    academicYear: '2026-27',
    sourceStatus: 'verified',
    sourceUrl: 'https://example.edu/programme'
  }];

  validateSupplement(supplement, catalogue, 'fixture.json');
  const imported = applySupplements(catalogue, [{ file: 'fixture.json', value: supplement }]);
  assert.equal(imported.programmes[0].tracks[0].code, 'A-001');
  assert.equal(imported.programmes[0].tracks[0].lastVerifiedAt, '2026-07-10');
  assert.equal(imported.programmes[0].tracks[0].name, 'Current A');
  assert.equal(imported.programmes[0].tracks[0].sourceStatus, 'verified');
  assert.deepEqual(applySupplements(imported, [{ file: 'fixture.json', value: supplement }]), imported);
});

test('blocked TPG supplements can correct official totals and Award Paths without publishing courses', () => {
  const catalogue = fixtureCatalogue();
  catalogue.programmes[0].creditsRequired = 9;
  catalogue.programmes[0].tracks = [];
  const supplement = fixtureSupplement();
  supplement.programmes[0] = {
    programmeId: 'TEST-TPG-001',
    status: 'blocked',
    creditsRequired: 31,
    creditUnit: 'credits',
    trackSelectionOptional: false,
    sourceUrl: 'https://example.edu/programme',
    statusNote: 'Official course codes are not public.',
    tracks: [{
      id: 'TEST-TPG-001-PATH',
      name: 'Official Award Path',
      type: 'Award Path',
      creditsRequired: 31,
      sourceUrl: 'https://example.edu/programme/path'
    }]
  };

  validateSupplement(supplement, catalogue, 'blocked.json');
  const imported = applySupplements(catalogue, [{ file: 'blocked.json', value: supplement }]);
  const programme = imported.programmes[0];
  assert.equal(programme.courseVerificationStatus, 'blocked');
  assert.equal(programme.creditsRequired, 31);
  assert.equal(programme.creditUnit, 'credits');
  assert.equal(programme.trackSelectionOptional, false);
  assert.deepEqual(programme.tracks, supplement.programmes[0].tracks);
  assert.deepEqual(programme.courseGroups, []);
  assert.equal(programme.dataLevel, 'programme');
});

test('TPG course supplements can correct official Programme metadata without changing its stable ID', () => {
  const catalogue = fixtureCatalogue();
  catalogue.programmes[0].name = 'Broken directory label';
  catalogue.programmes[0].faculty = 'Broken faculty label';
  const supplement = fixtureSupplement();
  supplement.programmes[0].programmeName = 'Official Programme Name';
  supplement.programmes[0].faculty = 'Official Faculty';

  validateSupplement(supplement, catalogue, 'fixture.json');
  const imported = applySupplements(catalogue, [{ file: 'fixture.json', value: supplement }]);
  assert.equal(imported.programmes[0].id, 'TEST-TPG-001');
  assert.equal(imported.programmes[0].name, 'Official Programme Name');
  assert.equal(imported.programmes[0].faculty, 'Official Faculty');

  supplement.programmes[0].programmeName = '   ';
  assert.throws(() => validateSupplement(supplement, catalogue, 'fixture.json'), /invalid programmeName/);
  supplement.programmes[0].programmeName = 'Official Programme Name';
  supplement.programmes[0].faculty = '   ';
  assert.throws(() => validateSupplement(supplement, catalogue, 'fixture.json'), /invalid faculty/);
});

test('TPG course supplements reject unknown Tracks and missing official credits', () => {
  const badTrack = fixtureSupplement();
  badTrack.programmes[0].courseGroups[0].courses[0].appliesToTrackIds = ['OTHER'];
  assert.throws(() => validateSupplement(badTrack, fixtureCatalogue()), /unknown Track/);
  const badCredits = fixtureSupplement();
  delete badCredits.programmes[0].courseGroups[0].courses[0].credits;
  assert.throws(() => validateSupplement(badCredits, fixtureCatalogue()), /official credits/);
});

test('TPG course supplements preserve an official academic year stated as and thereafter', () => {
  const supplement = fixtureSupplement();
  supplement.academicYear = '2024-25 and thereafter';
  validateSupplement(supplement, fixtureCatalogue(), 'fixture.json');
  const imported = applySupplements(fixtureCatalogue(), [{ file: 'fixture.json', value: supplement }]);
  assert.equal(imported.programmes[0].academicYear, '2024-25 and thereafter');
});

test('TPG course supplements validate Track exclusions and per-Track group requirements', () => {
  const supplement = fixtureSupplement();
  const group = supplement.programmes[0].courseGroups[0];
  group.excludesTrackIds = [];
  group.creditsRequiredByTrackIds = { 'TEST-TRACK-A': 6 };
  group.coursesRequiredByTrackIds = { 'TEST-TRACK-A': 2 };
  group.typeByTrackIds = { 'TEST-TRACK-A': 'project' };
  group.courses[0].nameByTrackIds = { 'TEST-TRACK-A': 'Track-specific Test' };
  validateSupplement(supplement, fixtureCatalogue(), 'fixture.json');

  group.excludesTrackIds = ['OTHER'];
  assert.throws(() => validateSupplement(supplement, fixtureCatalogue()), /excludes unknown Track OTHER/);
  group.excludesTrackIds = [];
  group.creditsRequiredByTrackIds = { OTHER: 6 };
  assert.throws(() => validateSupplement(supplement, fixtureCatalogue()), /creditsRequiredByTrackIds references unknown Track OTHER/);
  group.creditsRequiredByTrackIds = { 'TEST-TRACK-A': 6 };
  group.typeByTrackIds = { OTHER: 'project' };
  assert.throws(() => validateSupplement(supplement, fixtureCatalogue()), /typeByTrackIds references unknown Track OTHER/);
  group.typeByTrackIds = { 'TEST-TRACK-A': 'project' };
  group.courses[0].nameByTrackIds = { OTHER: 'Other Name' };
  assert.throws(() => validateSupplement(supplement, fixtureCatalogue()), /nameByTrackIds references unknown Track OTHER/);
});

test('TPG course supplements preserve Track-specific official course names without duplicate codes', () => {
  const supplement = fixtureSupplement();
  supplement.programmes[0].courseGroups[0].courses[0].nameByTrackIds = {
    'TEST-TRACK-A': 'Track-specific Test'
  };
  validateSupplement(supplement, fixtureCatalogue(), 'fixture.json');
  const imported = applySupplements(fixtureCatalogue(), [{ file: 'fixture.json', value: supplement }]);
  assert.deepEqual(
    imported.programmes[0].courseGroups[0].courses[0].nameByTrackIds,
    { 'TEST-TRACK-A': 'Track-specific Test' }
  );
});

test('TPG course supplements reject a Programme repeated across source files', () => {
  const supplement = fixtureSupplement();
  assert.throws(() => applySupplements(fixtureCatalogue(), [
    { file: 'a.json', value: supplement },
    { file: 'b.json', value: supplement }
  ]), /repeat TEST-TPG-001 across files/);
});

test('TPG coverage distinguishes complete structures from manual-rule review', () => {
  const imported = applySupplements(fixtureCatalogue(), [{ file: 'fixture.json', value: fixtureSupplement() }]);
  const row = inspectProgramme(imported.programmes[0], new Date('2026-07-11'));
  assert.equal(row.verificationStatus, 'verified');
  assert.deepEqual(row.issues, ['manual-rule-review']);
  const report = buildCoverageReport(imported.programmes);
  assert.equal(report.complete, 1);
  assert.equal(report.sourceReviewed, 1);
  assert.equal(report.sourceCoveragePercent, 100);
  assert.equal(report.schools[0].courses, 1);
});

test('TPG coverage separates source-blocked and archived Programmes from unreviewed work', () => {
  const catalogue = fixtureCatalogue();
  const blocked = { ...catalogue.programmes[0], id: 'TEST-TPG-002', courseVerificationStatus: 'blocked' };
  const archived = { ...catalogue.programmes[0], id: 'TEST-TPG-003', courseVerificationStatus: 'archived' };
  const report = buildCoverageReport([...catalogue.programmes, blocked, archived]);
  const school = report.schools[0];

  assert.deepEqual(report.rows.map((row) => row.verificationStatus), ['unreviewed', 'blocked', 'archived']);
  assert.equal(report.sourceReviewed, 2);
  assert.equal(report.sourceCoveragePercent, 66.7);
  assert.equal(report.blocked, 1);
  assert.equal(report.archived, 1);
  assert.equal(report.unreviewed, 1);
  assert.equal(school.sourceReviewed, 2);
  assert.equal(school.sourceCoveragePercent, 66.7);
  assert.equal(school.verified, 0);
  assert.equal(school.blocked, 1);
  assert.equal(school.archived, 1);
  assert.equal(school.unreviewed, 1);
  assert.equal(school.complete, 0);
});

test('TPG coverage keeps and-thereafter curricula current while flagging a fixed old academic year', () => {
  const supplement = fixtureSupplement();
  supplement.academicYear = '2023-24 and thereafter';
  const imported = applySupplements(fixtureCatalogue(), [{ file: 'fixture.json', value: supplement }]);

  assert.deepEqual(
    inspectProgramme(imported.programmes[0], new Date('2026-07-11')).issues,
    ['manual-rule-review']
  );

  imported.programmes[0].academicYear = '2023-24';
  assert.deepEqual(
    inspectProgramme(imported.programmes[0], new Date('2026-07-11')).issues,
    ['stale-academic-year', 'manual-rule-review']
  );
});

test('TPG coverage reports courses pending official approval separately', () => {
  const imported = applySupplements(fixtureCatalogue(), [{ file: 'fixture.json', value: fixtureSupplement() }]);
  imported.programmes[0].courseGroups[0].courses[0].approvalStatus = 'pending_university_approval';
  const row = inspectProgramme(imported.programmes[0], new Date('2026-07-11'));
  assert.deepEqual(row.issues, ['course:TST5001:pending-approval', 'manual-rule-review']);
  assert.equal(buildCoverageReport(imported.programmes).complete, 0);
});

test('HKBU Communication supplement preserves the optional Concentration and all official course pools', () => {
  const supplement = buildHkbuCommunicationSupplement();
  const catalogue = require('../data/tpg-programmes.json');
  validateSupplement(supplement, catalogue, 'hkbu-communication-2025.json');
  const programme = supplement.programmes[0];
  const codes = programme.courseGroups.flatMap((group) => group.courses.map((course) => course.code));
  const concentration = programme.courseGroups.find((group) => group.id === 'interactive-media-concentration-required');
  const requirement = programme.courseGroups.find((group) => group.id === 'elective-requirement');
  const programmePool = programme.courseGroups.find((group) => group.id === 'programme-elective-pool');
  const externalPool = programme.courseGroups.find((group) => group.id === 'approved-external-elective-pool');
  const optional = programme.courseGroups.find((group) => group.id === 'optional-zero-unit-courses');

  assert.equal(programme.programmeId, 'HKBU-TPG-041');
  assert.equal(programme.creditsRequired, 27);
  assert.equal(programme.trackSelectionOptional, true);
  assert.deepEqual(programme.tracks.map((track) => [track.id, track.name]), [[HKBU_COMMUNICATION_TRACK_ID, 'Interactive Media']]);
  assert.deepEqual([codes.length, new Set(codes).size], [98, 98]);
  assert.deepEqual([concentration.creditsRequired, concentration.coursesRequired, concentration.courses.length], [9, 3, 3]);
  assert.deepEqual(requirement.creditsRequiredByTrackIds, { [HKBU_COMMUNICATION_TRACK_ID]: 12 });
  assert.deepEqual(requirement.coursesRequiredByTrackIds, { [HKBU_COMMUNICATION_TRACK_ID]: 4 });
  assert.equal(programmePool.courses.filter((course) => course.appliesToTrackIds.includes(HKBU_COMMUNICATION_TRACK_ID)).length, 7);
  assert.deepEqual([externalPool.creditsMax, externalPool.coursesMax, externalPool.courses.length], [6, 2, 31]);
  assert.deepEqual(optional.courses.map((course) => course.credits), [0, 0, 0]);
});

test('HKBU International Journalism preserves both Concentrations and cross-role course rules', () => {
  const supplement = buildHkbuInternationalJournalismSupplement();
  const catalogue = require('../data/tpg-programmes.json');
  validateSupplement(supplement, catalogue, 'hkbu-international-journalism-2025.json');
  const programme = supplement.programmes[0];
  const codes = programme.courseGroups.flatMap((group) => group.courses.map((course) => course.code));
  const requirement = programme.courseGroups.find((group) => group.id === 'concentration-required-requirement');
  const crossRole = programme.courseGroups.find((group) => group.id === 'required-elective-cross-role-courses');
  const electives = programme.courseGroups.find((group) => group.id === 'elective-requirement');
  const programmePool = programme.courseGroups.find((group) => group.id === 'programme-elective-pool');
  const externalPool = programme.courseGroups.find((group) => group.id === 'approved-external-elective-pool');

  assert.equal(programme.programmeId, 'HKBU-TPG-042');
  assert.equal(programme.creditsRequired, 27);
  assert.equal(programme.trackSelectionOptional, false);
  assert.deepEqual(programme.tracks.map((track) => track.id), Object.values(HKBU_MAIJS_TRACKS));
  assert.deepEqual([codes.length, new Set(codes).size], [61, 61]);
  assert.deepEqual(requirement.creditsRequiredByTrackIds, { [HKBU_MAIJS_TRACKS.IJ]: 15, [HKBU_MAIJS_TRACKS.BFJ]: 15 });
  assert.deepEqual(electives.coursesRequiredByTrackIds, { [HKBU_MAIJS_TRACKS.IJ]: 4, [HKBU_MAIJS_TRACKS.BFJ]: 4 });
  assert.equal(crossRole.courses.find((course) => course.code === 'JOUR7010').conditionalRequirement, true);
  assert.deepEqual(crossRole.courses.find((course) => course.code === 'JOUR7150').requiredForTrackIds, [HKBU_MAIJS_TRACKS.BFJ]);
  assert.deepEqual(programmePool.courses.find((course) => course.code === 'JOUR7120').appliesToTrackIds, [HKBU_MAIJS_TRACKS.IJ]);
  assert.equal(programmePool.courses.find((course) => course.code === 'JOUR7130').courseKind, 'project_or_dissertation');
  assert.deepEqual([externalPool.creditsMax, externalPool.coursesMax, externalPool.courses.length], [3, 1, 26]);
});

test('HKBU Media Management preserves the optional Project path and bounded external Electives', () => {
  const supplement = buildHkbuMediaManagementSupplement();
  const catalogue = require('../data/tpg-programmes.json');
  validateSupplement(supplement, catalogue, 'hkbu-media-management-2025.json');
  const programme = supplement.programmes[0];
  const codes = programme.courseGroups.flatMap((group) => group.courses.map((course) => course.code));
  const required = programme.courseGroups.find((group) => group.id === 'required-courses');
  const electives = programme.courseGroups.find((group) => group.id === 'elective-requirement');
  const business = programme.courseGroups.find((group) => group.id === 'business-electives');
  const communication = programme.courseGroups.find((group) => group.id === 'communication-electives');
  const external = programme.courseGroups.find((group) => group.id === 'other-programme-electives');
  const project = programme.courseGroups.find((group) => group.id === 'project-or-additional-elective');

  assert.equal(programme.programmeId, 'HKBU-TPG-043');
  assert.equal(programme.creditsRequired, 27);
  assert.deepEqual([codes.length, new Set(codes).size], [83, 83]);
  assert.deepEqual([required.creditsRequired, required.coursesRequired, required.courses.length], [12, 4, 4]);
  assert.deepEqual([electives.creditsRequired, electives.coursesRequired, electives.courses.length], [12, 4, 0]);
  assert.deepEqual([business.courses.length, communication.courses.length], [9, 47]);
  assert.deepEqual([external.creditsMax, external.coursesMax, external.courses.length], [6, 2, 22]);
  assert.deepEqual([project.creditsRequired, project.coursesRequired, project.courses[0].code, project.courses[0].courseKind], [3, 1, 'COMM7290', 'project']);
});

test('HKBU Mainland MBA preserves its eleven Core, segmented Capstone and current Advanced Elective pool', () => {
  const supplement = buildHkbuMbaMainlandSupplement();
  const catalogue = require('../data/tpg-programmes.json');
  validateSupplement(supplement, catalogue, 'hkbu-mba-mainland-2025.json');
  const programme = supplement.programmes[0];
  const codes = programme.courseGroups.flatMap((group) => group.courses.map((course) => course.code));
  const core = programme.courseGroups.find((group) => group.id === 'core-courses');
  const required = programme.courseGroups.find((group) => group.id === 'required-courses');
  const electives = programme.courseGroups.find((group) => group.id === 'advanced-electives');

  assert.equal(programme.programmeId, 'HKBU-TPG-027');
  assert.equal(programme.creditsRequired, 45);
  assert.equal(programme.creditUnit, 'units');
  assert.deepEqual([codes.length, new Set(codes).size], [29, 29]);
  assert.deepEqual([core.creditsRequired, core.coursesRequired, core.courses.length], [33, 11, 11]);
  assert.deepEqual([required.creditsRequired, required.coursesRequired, required.courses.length], [6, 5, 5]);
  assert.deepEqual(required.courses.map((course) => course.credits), [1, 1, 1, 0, 3]);
  assert.equal(required.courses.filter((course) => course.courseKind === 'project').length, 3);
  assert.deepEqual([electives.creditsRequired, electives.coursesRequired, electives.courses.length], [6, 2, 13]);
  assert.match(electives.ruleText, /Recommended non-MBA Electives/);
});

test('HKBU Chinese Medicine supplements preserve official completion alternatives and MCM Concentrations', () => {
  const supplements = buildHkbuChineseMedicineSupplements();
  const catalogue = require('../data/tpg-programmes.json');
  supplements.forEach(({ filename, value }) => validateSupplement(value, catalogue, filename));
  const programmes = supplements.flatMap(({ value }) => value.programmes);
  const byId = Object.fromEntries(programmes.map((programme) => [programme.programmeId, programme]));
  const counts = programmes.map((programme) => {
    const codes = programme.courseGroups.flatMap((group) => group.courses.map((course) => course.code));
    return [programme.programmeId, codes.length, new Set(codes).size];
  });

  assert.deepEqual(counts, [
    ['HKBU-TPG-037', 14, 14],
    ['HKBU-TPG-038', 13, 13],
    ['HKBU-TPG-039', 15, 15],
    ['HKBU-TPG-040', 22, 22]
  ]);
  assert.deepEqual(byId['HKBU-TPG-037'].courseGroups.map((group) => group.creditsRequired || null), [27, 3, null]);
  assert.deepEqual(
    byId['HKBU-TPG-038'].courseGroups[0].courses.slice(-2).map((course) => [course.code, course.credits]),
    [['MDD7130', 1.5], ['MDD7140', 1.5]]
  );
  assert.deepEqual(byId['HKBU-TPG-039'].courseGroups[1].courses.map((course) => course.linkedSequenceId), [
    'MPS708-DISSERTATION',
    'MPS708-DISSERTATION',
    'MPS-TAUGHT-ALTERNATIVE',
    'MPS-TAUGHT-ALTERNATIVE'
  ]);
  assert.deepEqual(byId['HKBU-TPG-040'].tracks.map((track) => track.id), Object.values(HKBU_MCM_TRACKS));
  assert.equal(byId['HKBU-TPG-040'].trackSelectionOptional, false);
  assert.deepEqual(
    byId['HKBU-TPG-040'].courseGroups.find((group) => group.id === 'concentration-courses').courses.find((course) => course.code === 'MCM7080').appliesToTrackIds,
    [HKBU_MCM_TRACKS.ACU, HKBU_MCM_TRACKS.OT]
  );
});

test('HKBU Creative Arts supplements preserve the current MFA, Producing, Music and Visual Arts rules', () => {
  const supplements = buildHkbuCreativeArtsSupplements();
  const catalogue = require('../data/tpg-programmes.json');
  supplements.forEach(({ filename, value }) => validateSupplement(value, catalogue, filename));
  const programmes = supplements.flatMap(({ value }) => value.programmes);
  const byId = Object.fromEntries(programmes.map((programme) => [programme.programmeId, programme]));
  const counts = programmes.map((programme) => {
    const codes = programme.courseGroups.flatMap((group) => group.courses.map((course) => course.code));
    return [programme.programmeId, codes.length, new Set(codes).size];
  });

  assert.deepEqual(counts, [
    ['HKBU-TPG-045', 50, 50],
    ['HKBU-TPG-046', 36, 36],
    ['HKBU-TPG-047', 45, 45],
    ['HKBU-TPG-048', 12, 12]
  ]);
  assert.equal(byId['HKBU-TPG-045'].creditsRequired, 48);
  assert.deepEqual(byId['HKBU-TPG-045'].tracks.map((track) => track.id), Object.values(HKBU_MFA_TRACKS));
  assert.deepEqual(
    byId['HKBU-TPG-045'].courseGroups.find((group) => group.id === 'core-courses').courses.slice(-2).map((course) => [course.code, course.credits]),
    [['CTV7501', 3], ['CTV7502', 6]]
  );
  assert.deepEqual(
    byId['HKBU-TPG-045'].courseGroups.find((group) => group.id === 'creativity-production-electives').courses.find((course) => course.code === 'CTV7413').requiredForTrackIds,
    [HKBU_MFA_TRACKS.DOCUMENTARY]
  );
  assert.deepEqual([byId['HKBU-TPG-046'].courseGroups[3].creditsMax, byId['HKBU-TPG-046'].courseGroups[3].coursesMax], [6, 2]);
  assert.deepEqual([byId['HKBU-TPG-047'].courseGroups[1].creditsRequired, byId['HKBU-TPG-047'].courseGroups[1].coursesRequired], [24, 8]);
  assert.equal(byId['HKBU-TPG-047'].ruleReviewStatus, 'verified');
  assert.deepEqual(byId['HKBU-TPG-048'].tracks.map((track) => track.id), Object.values(HKBU_VISUAL_ARTS_TRACKS));
  assert.deepEqual(byId['HKBU-TPG-048'].courseGroups[1].courses.map((course) => course.credits), Array(8).fill(4.5));
});

test('PolyU Sustainable Technology for Carbon Neutrality preserves both official project paths', () => {
  const supplement = buildPolyuSustainableTechnologyCarbonNeutralitySupplement();
  const catalogue = require('../data/tpg-programmes.json');
  validateSupplement(supplement, catalogue, 'polyu-sustainable-technology-carbon-neutrality-2027.json');
  const programme = supplement.programmes[0];
  const [compulsory, projects, electives] = programme.courseGroups;

  assert.equal(programme.programmeId, 'POLYU-TPG-013');
  assert.equal(programme.creditsRequired, 31);
  assert.equal(programme.ruleReviewStatus, 'manual_review_required');
  assert.deepEqual([compulsory.creditsRequired, compulsory.coursesRequired, compulsory.courses.length], [22, 7, 7]);
  assert.deepEqual(projects.courses.map((course) => [course.code, course.credits, course.courseKind]), [
    ['ABCT5039', 3, 'project'],
    ['ABCT5040', 6, 'research_project']
  ]);
  assert.equal(electives.courses.length, 7);
  assert.equal(new Set(programme.courseGroups.flatMap((group) => group.courses).map((course) => course.code)).size, 16);
  assert.match(projects.ruleText, /ABCT5039.*at least 6 credits.*ABCT5040.*at least 3 credits/);
  assert.match(programme.statusNote, /must not infer completion/);
});

test('PolyU Biopharmaceutical Development variants preserve official campus and completion choices', () => {
  const supplement = buildPolyuBiopharmaceuticalDevelopmentSupplement();
  const catalogue = require('../data/tpg-programmes.json');
  validateSupplement(supplement, catalogue, 'polyu-biopharmaceutical-development-2027.json');
  const byId = Object.fromEntries(supplement.programmes.map((programme) => [programme.programmeId, programme]));

  const standard = byId['POLYU-TPG-014'];
  assert.equal(standard.creditsRequired, 31);
  assert.deepEqual(standard.courseGroups.map((group) => [group.creditsRequired, group.coursesRequired, group.courses.length]), [
    [21, 7, 7], [3, 1, 2], [6, 1, 2], [1, 1, 1]
  ]);
  assert.deepEqual(standard.courseGroups[2].courses.map((course) => [course.code, course.credits, course.courseKind]), [
    ['ABCT5110', 6, 'internship'], ['ABCT5113', 6, 'research_project']
  ]);
  assert.equal(new Set(standard.courseGroups.flatMap((group) => group.courses).map((course) => course.code)).size, 12);

  const gba = byId['POLYU-TPG-015'];
  assert.equal(gba.creditsRequired, 31);
  assert.deepEqual(gba.courseGroups.map((group) => [group.creditsRequired, group.coursesRequired, group.courses.length]), [
    [18, 6, 6], [3, 1, 2], [1, 1, 1], [9, 2, 2]
  ]);
  assert.equal(new Set(gba.courseGroups.flatMap((group) => group.courses).map((course) => course.code)).size, 11);
  assert.equal(gba.courseGroups[3].courses.find((course) => course.code === 'ABCT5115P').courseKind, 'internship');
});

test('PolyU Advanced Occupational Therapy preserves three Specialism paths and corrects its directory label', () => {
  const supplement = buildPolyuAdvancedOccupationalTherapySupplement();
  const catalogue = require('../data/tpg-programmes.json');
  validateSupplement(supplement, catalogue, 'polyu-advanced-occupational-therapy-2027.json');
  const programme = supplement.programmes[0];
  const [compulsory, project, specialism, electives] = programme.courseGroups;

  assert.equal(programme.programmeId, 'POLYU-TPG-072');
  assert.equal(programme.programmeName, 'Advanced Occupational Therapy');
  assert.equal(programme.creditsRequired, 31);
  assert.equal(programme.trackSelectionOptional, true);
  assert.deepEqual(programme.tracks.map((track) => [track.id, track.name]), [
    [POLYU_OT_TRACKS.NEUROLOGY, 'Neurology'],
    [POLYU_OT_TRACKS.MENTAL_HEALTH, 'Mental Health'],
    [POLYU_OT_TRACKS.MUSCULOSKELETAL, 'Musculoskeletal']
  ]);
  assert.deepEqual([compulsory.creditsRequired, project.creditsRequired], [7, 6]);
  assert.deepEqual([compulsory.courses.length, project.courses.length, specialism.courses.length], [3, 1, 8]);
  assert.deepEqual(specialism.creditsRequiredByTrackIds, {
    [POLYU_OT_TRACKS.NEUROLOGY]: 9,
    [POLYU_OT_TRACKS.MENTAL_HEALTH]: 9,
    [POLYU_OT_TRACKS.MUSCULOSKELETAL]: 9
  });
  assert.deepEqual(specialism.courses.find((course) => course.code === 'RS520').appliesToTrackIds.sort(), [
    POLYU_OT_TRACKS.MENTAL_HEALTH,
    POLYU_OT_TRACKS.MUSCULOSKELETAL
  ].sort());
  assert.equal(electives.creditsRequired, 18);
  assert.equal(electives.creditsRequiredByTrackIds[POLYU_OT_TRACKS.NEUROLOGY], 9);
  assert.equal(electives.courses.length, 0);
  assert.equal(new Set(programme.courseGroups.flatMap((group) => group.courses).map((course) => course.code)).size, 12);
  assert.match(programme.statusNote, /no elective credit is inferred/);
});

test('PolyU Advanced Rehabilitation Sciences preserves generic and Specialism credit paths without inventing electives', () => {
  const supplement = buildPolyuAdvancedRehabilitationSciencesSupplement();
  const catalogue = require('../data/tpg-programmes.json');
  validateSupplement(supplement, catalogue, 'polyu-advanced-rehabilitation-sciences-2027.json');
  const programme = supplement.programmes[0];
  const [compulsory, project, specialism, electives] = programme.courseGroups;

  assert.equal(programme.programmeId, 'POLYU-TPG-073');
  assert.equal(programme.creditsRequired, 31);
  assert.equal(programme.trackSelectionOptional, true);
  assert.deepEqual(programme.tracks.map((track) => [track.id, track.name, track.type]), [[
    POLYU_REHAB_SPECIALISM_ID,
    'Rehabilitation of People with Developmental Disabilities',
    'Specialism'
  ]]);
  assert.deepEqual([compulsory.creditsRequired, project.creditsRequired, specialism.creditsRequired], [7, 6, 9]);
  assert.deepEqual([compulsory.courses.length, project.courses.length, specialism.courses.length], [3, 1, 3]);
  assert.deepEqual(electives.creditsRequiredByTrackIds, { [POLYU_REHAB_SPECIALISM_ID]: 9 });
  assert.deepEqual(electives.coursesRequiredByTrackIds, { [POLYU_REHAB_SPECIALISM_ID]: 3 });
  assert.equal(electives.creditsRequired, 18);
  assert.equal(electives.coursesRequired, 6);
  assert.equal(electives.courses.length, 0);
  assert.equal(new Set(programme.courseGroups.flatMap((group) => group.courses).map((course) => course.code)).size, 7);
  assert.match(programme.statusNote, /no elective is invented/);
});

test('PolyU Actuarial and Investment Science preserves taught and Dissertation paths', () => {
  const supplement = buildPolyuActuarialInvestmentScienceSupplement();
  const catalogue = require('../data/tpg-programmes.json');
  validateSupplement(supplement, catalogue, 'polyu-actuarial-investment-science-2027.json');
  const programme = supplement.programmes[0];
  const [compulsory, additionalCore, dissertation, academicIntegrity] = programme.courseGroups;
  const courses = programme.courseGroups.flatMap((group) => group.courses);

  assert.equal(programme.programmeId, 'POLYU-TPG-075');
  assert.equal(programme.creditsRequired, 31);
  assert.equal(programme.ruleReviewStatus, 'manual_review_required');
  assert.deepEqual([compulsory.creditsRequired, compulsory.coursesRequired, compulsory.courses.length], [18, 6, 6]);
  assert.equal(additionalCore.courses.length, 11);
  assert.match(additionalCore.ruleText, /four Additional Core Subjects.*one Additional Core Subject.*AMA592 Dissertation/);
  assert.deepEqual(dissertation.courses.map((course) => [course.code, course.credits, course.courseKind, course.conditionalRequirement]), [
    ['AMA592', 9, 'dissertation', true]
  ]);
  assert.deepEqual([academicIntegrity.creditsRequired, academicIntegrity.coursesRequired], [1, 1]);
  assert.equal(academicIntegrity.courses[0].code, 'DSAI5T09');
  assert.equal(new Set(courses.map((course) => course.code)).size, 19);
  assert.match(programme.statusNote, /must not be combined/);
});

test('PolyU Operational Research and Risk Analysis resolves the 2027 InsurTech elective without retaining AMA570', () => {
  const supplement = buildPolyuOperationalResearchRiskAnalysisSupplement();
  const catalogue = require('../data/tpg-programmes.json');
  validateSupplement(supplement, catalogue, 'polyu-operational-research-risk-analysis-2027.json');
  const programme = supplement.programmes[0];
  const [compulsory, electives, dissertation, academicIntegrity] = programme.courseGroups;
  const courses = programme.courseGroups.flatMap((group) => group.courses);

  assert.equal(programme.programmeId, 'POLYU-TPG-076');
  assert.equal(programme.creditsRequired, 31);
  assert.equal(programme.ruleReviewStatus, 'manual_review_required');
  assert.deepEqual([compulsory.creditsRequired, compulsory.coursesRequired, compulsory.courses.length], [21, 7, 7]);
  assert.deepEqual([electives.creditsRequired, electives.coursesRequired, electives.courses.length], [9, 3, 15]);
  assert.equal(electives.courses.find((course) => course.code === 'AMA580').name, 'Advanced Topics in InsurTech');
  assert.equal(electives.courses.find((course) => course.code === 'AMA580').sourceUrl, 'https://www.polyu.edu.hk/ama/study/pg/msc-actuarial-and-investment-science/curriculum/');
  assert.equal(electives.courses.some((course) => course.code === 'AMA570'), false);
  assert.equal(electives.courses.find((course) => course.name === 'Statistical Data Mining').code, 'DSAI5101');
  assert.deepEqual(dissertation.courses.map((course) => [course.code, course.credits, course.courseKind, course.conditionalRequirement]), [
    ['AMA592', 9, 'dissertation', true]
  ]);
  assert.equal(academicIntegrity.courses[0].code, 'DSAI5T09');
  assert.equal(new Set(courses.map((course) => course.code)).size, 24);
  assert.match(programme.statusNote, /AMA570 Current Topics in Actuarial Science entry.*not included/);
  assert.match(programme.statusNote, /mutually exclusive/);
});

test('PolyU AMA Finance and AI programmes preserve current coded completion paths', () => {
  const supplement = buildPolyuAmaFinanceAiSupplement();
  const catalogue = require('../data/tpg-programmes.json');
  validateSupplement(supplement, catalogue, 'polyu-ama-finance-ai-2027.json');
  const byId = Object.fromEntries(supplement.programmes.map((programme) => [programme.programmeId, programme]));

  const quantitativeFinance = byId['POLYU-TPG-077'];
  const [financeCompulsory, financeElectives, financeDissertation, financeAie] = quantitativeFinance.courseGroups;
  assert.deepEqual([financeCompulsory.creditsRequired, financeCompulsory.coursesRequired, financeCompulsory.courses.length], [18, 6, 6]);
  assert.equal(financeElectives.courses.length, 9);
  assert.deepEqual(financeDissertation.courses.map((course) => [course.code, course.credits, course.conditionalRequirement]), [
    ['AMA592', 9, true]
  ]);
  assert.equal(financeAie.courses[0].code, 'DSAI5T09');
  assert.equal(new Set(quantitativeFinance.courseGroups.flatMap((group) => group.courses).map((course) => course.code)).size, 17);

  const mathematicsAi = byId['POLYU-TPG-078'];
  const [aiCompulsory, aiElectives, aiDissertations, aiAie] = mathematicsAi.courseGroups;
  assert.deepEqual([aiCompulsory.creditsRequired, aiCompulsory.coursesRequired, aiCompulsory.courses.length], [21, 7, 7]);
  assert.equal(aiElectives.courses.length, 19);
  assert.equal(aiElectives.courses.some((course) => course.code === 'AMA528'), false);
  assert.deepEqual(aiDissertations.courses.map((course) => [course.code, course.credits]), [
    ['AMA592', 9], ['DSAI5901', 9]
  ]);
  assert.equal(aiAie.courses[0].code, 'DSAI5T09');
  assert.equal(new Set(mathematicsAi.courseGroups.flatMap((group) => group.courses).map((course) => course.code)).size, 29);
  assert.match(mathematicsAi.statusNote, /must not be double counted/);
});

test('PolyU Health Informatics preserves the Dissertation and taught completion paths', () => {
  const supplement = buildPolyuHealthInformaticsSupplement();
  const catalogue = require('../data/tpg-programmes.json');
  validateSupplement(supplement, catalogue, 'polyu-health-informatics-2027.json');
  const programme = supplement.programmes[0];
  const [compulsory, core, electives, dissertation, academicIntegrity] = programme.courseGroups;
  const courses = programme.courseGroups.flatMap((group) => group.courses);

  assert.equal(programme.programmeId, 'POLYU-TPG-079');
  assert.equal(programme.creditsRequired, 31);
  assert.equal(programme.ruleReviewStatus, 'manual_review_required');
  assert.deepEqual([compulsory.creditsRequired, compulsory.coursesRequired, compulsory.courses.length], [9, 3, 3]);
  assert.deepEqual([core.creditsRequired, core.coursesRequired, core.courses.length], [6, 2, 13]);
  assert.deepEqual([electives.creditsRequired, electives.coursesRequired, electives.courses.length], [6, 2, 20]);
  assert.deepEqual(dissertation.courses.map((course) => [course.code, course.credits, course.courseKind, course.conditionalRequirement]), [
    ['HSS5903', 9, 'dissertation', true]
  ]);
  assert.equal(academicIntegrity.courses[0].code, 'HTI5T04');
  assert.equal(new Set(courses.map((course) => course.code)).size, 38);
  assert.match(core.courses.find((course) => course.code === 'COMP5511').sourceUrl, /comp5511\.pdf$/);
  assert.match(electives.courses.find((course) => course.code === 'BME5133').sourceUrl, /bme5133\.pdf$/);
  assert.match(programme.statusNote, /mutually exclusive/);
});

test('PolyU Chinese Culture preserves cross-area electives and mode-specific Dissertation codes', () => {
  const supplement = buildPolyuChineseCultureSupplement();
  const catalogue = require('../data/tpg-programmes.json');
  validateSupplement(supplement, catalogue, 'polyu-chinese-culture-2027.json');
  const programme = supplement.programmes[0];
  const [compulsory, area1, area2, area3, freeElectives, dissertation, academicIntegrity] = programme.courseGroups;
  const courses = programme.courseGroups.flatMap((group) => group.courses);

  assert.equal(programme.programmeId, 'POLYU-TPG-086');
  assert.equal(programme.creditsRequired, 31);
  assert.equal(programme.ruleReviewStatus, 'manual_review_required');
  assert.deepEqual([compulsory.creditsRequired, compulsory.coursesRequired, compulsory.courses.length], [6, 2, 2]);
  assert.deepEqual([area1.creditsRequired, area1.coursesRequired, area1.courses.length], [3, 1, 11]);
  assert.deepEqual([area2.creditsRequired, area2.coursesRequired, area2.courses.length], [3, 1, 9]);
  assert.deepEqual([area3.creditsRequired, area3.coursesRequired, area3.courses.length], [3, 1, 9]);
  assert.equal(freeElectives.courses.length, 5);
  assert.match(freeElectives.ruleText, /shared with additional subjects from Core Areas 1, 2 and 3/);
  assert.deepEqual(dissertation.courses.map((course) => [course.code, course.name, course.credits, course.courseKind, course.conditionalRequirement]), [
    ['CHC5503', 'MA Dissertation (For full-time students)', 9, 'dissertation', true],
    ['CHC5504', 'MA Dissertation (For part-time students)', 9, 'dissertation', true]
  ]);
  assert.equal(academicIntegrity.courses[0].code, 'CHC5T06');
  assert.equal(courses.length, 39);
  assert.equal(new Set(courses.map((course) => course.code)).size, 39);
  assert.match(area3.courses.find((course) => course.code === 'CHC5301').name, /^Expressions and Applications/);
  assert.match(programme.statusNote, /PgD exit award is not modelled/);
  assert.match(programme.statusNote, /must not be combined/);
});

test('PolyU Design preserves four required Specialisms without duplicating cross-role course codes', () => {
  const supplement = buildPolyuDesignSupplement();
  const catalogue = require('../data/tpg-programmes.json');
  validateSupplement(supplement, catalogue, 'polyu-design-2027.json');
  const programme = supplement.programmes[0];
  const courses = programme.courseGroups.flatMap((group) => group.courses);
  const common = programme.courseGroups.find((group) => group.id === 'compulsory-common-subjects');
  const projects = programme.courseGroups.find((group) => group.id === 'specialism-studio-and-project-subjects');
  const crossRole = programme.courseGroups.find((group) => group.id === 'specialism-core-and-elective-cross-role-subjects');

  assert.equal(programme.programmeId, 'POLYU-TPG-096');
  assert.equal(programme.creditsRequired, 37);
  assert.equal(programme.trackSelectionOptional, false);
  assert.deepEqual(programme.tracks.map((track) => track.id), Object.values(POLYU_DESIGN_TRACKS).map((track) => track.id));
  assert.deepEqual([common.creditsRequired, common.coursesRequired, common.courses.length], [6, 2, 2]);
  assert.equal(projects.courses.length, 8);
  assert.equal(crossRole.courses.length, 25);
  Object.values(POLYU_DESIGN_TRACKS).forEach((track) => {
    assert.equal(projects.creditsRequiredByTrackIds[track.id], 9);
    assert.equal(crossRole.creditsRequiredByTrackIds[track.id], 21);
    assert.equal(crossRole.coursesRequiredByTrackIds[track.id], 7);
  });
  assert.equal(courses.length, 36);
  assert.equal(new Set(courses.map((course) => course.code)).size, 36);
  assert.match(crossRole.ruleText, /must not be counted again/);
  assert.match(programme.statusNote, /one-of Specialism Major choice/);
});

test('PolyU Information Technology preserves optional Streams and all three completion paths', () => {
  const programme = buildInformationTechnology();
  const supplement = {
    schemaVersion: 1,
    schoolCode: 'POLYU',
    academicYear: '2027-28',
    verifiedAt: '2026-07-11',
    programmes: [programme]
  };
  const catalogue = require('../data/tpg-programmes.json');
  validateSupplement(supplement, catalogue, 'polyu-computing-2027.json');

  const courses = programme.courseGroups.flatMap((group) => group.courses);
  const byCode = Object.fromEntries(courses.map((course) => [course.code, course]));
  const streamCore = programme.courseGroups.find((group) => group.id === 'stream-core-shared-electives');

  assert.equal(programme.trackSelectionOptional, true);
  assert.deepEqual(programme.tracks.map((track) => [track.id, track.name]), [
    [IT_TRACKS.NLP, 'Natural Language Processing'],
    [IT_TRACKS.VC, 'Visual Computing']
  ]);
  assert.equal(courses.length, 35);
  assert.equal(new Set(courses.map((course) => course.code)).size, 35);
  assert.deepEqual(streamCore.creditsRequiredByTrackIds, { [IT_TRACKS.NLP]: 12, [IT_TRACKS.VC]: 12 });
  assert.deepEqual(byCode.COMP5511.countsTowardTrackIds.sort(), [IT_TRACKS.NLP, IT_TRACKS.VC].sort());
  assert.equal(byCode.COMP5422.conditionalRequirement, true);
  assert.equal(byCode.COMP5425.conditionalRequirement, true);
  assert.equal(byCode.COMP5933.credits, 6);
  assert.equal(byCode.COMP5940.credits, 9);
  assert.equal(byCode.DSAI5T09.credits, 1);
  assert.match(programme.statusNote, /Up to 6 credits of approved non-COMP electives/);
});

test('HKU Engineering supplement preserves official programme pools and path-dependent rules', () => {
  const supplement = buildHkuEngineeringSupplement();
  const catalogue = require('../data/tpg-programmes.json');
  validateSupplement(supplement, catalogue, 'hku-engineering-2025-2026.json');

  assert.deepEqual(supplement.programmes.map((programme) => programme.programmeId), [
    'HKU-TPG-032',
    'HKU-TPG-033',
    'HKU-TPG-034',
    'HKU-TPG-035',
    'HKU-TPG-036',
    'HKU-TPG-037',
    'HKU-TPG-038',
    'HKU-TPG-039'
  ]);
  assert.equal(supplement.programmes.every((programme) => programme.creditsRequired === 72), true);
  assert.equal(supplement.programmes.every((programme) => programme.ruleReviewStatus === 'manual_review_required'), true);

  const bse = supplement.programmes.find((programme) => programme.programmeId === 'HKU-TPG-032');
  assert.deepEqual(bse.courseGroups.map((group) => group.courses.length), [23, 1]);
  assert.equal(bse.courseGroups[0].courses.filter((course) => course.subjectGroups.includes('list-a')).length, 6);
  assert.match(bse.courseGroups[0].ruleText, /at least three courses \(18 credits\) from List A/);

  const civil = supplement.programmes.filter((programme) => /^HKU-TPG-03[3-6]$/.test(programme.programmeId));
  assert.equal(civil.every((programme) => programme.courseGroups[0].courses.length === 58), true);
  assert.equal(civil.every((programme) => new Set(programme.courseGroups[0].courses.map((course) => course.code)).size === 58), true);
  assert.deepEqual(
    civil[0].courseGroups[0].courses.find((course) => course.code === 'CIVL6025').subjectGroups,
    ['environmental', 'geotechnical', 'structural']
  );

  const communications = supplement.programmes.find((programme) => programme.programmeId === 'HKU-TPG-037');
  const general = supplement.programmes.find((programme) => programme.programmeId === 'HKU-TPG-038');
  const power = supplement.programmes.find((programme) => programme.programmeId === 'HKU-TPG-039');
  assert.deepEqual([communications.courseGroups[0].courses.length, general.courseGroups[0].courses.length, power.courseGroups[0].courses.length], [12, 61, 21]);
  assert.deepEqual(general.courseGroups[1].courses.map((course) => [course.code, course.credits]), [
    ['ELEC7021', 24],
    ['ELEC7022', 12],
    ['ELEC7023', 0]
  ]);
  assert.match(general.courseGroups[1].ruleText, /either ELEC7022 Project.*or ELEC7021 Dissertation/);
  assert.match(general.courseGroups[1].ruleText, /ELEC7023 Capstone Workshop \(0 credits\) is also compulsory/);
  assert.equal(general.courseGroups[2].courses[0].code, 'ELEC7900');
});

test('HKU Electronic Commerce and Internet Computing preserves both official Capstone paths', () => {
  const supplement = buildHkuEcicSupplement();
  const catalogue = require('../data/tpg-programmes.json');
  validateSupplement(supplement, catalogue, 'hku-electronic-commerce-internet-computing-2025.json');
  const programme = supplement.programmes[0];
  const discipline = programme.courseGroups[0];
  const capstone = programme.courseGroups[1];

  assert.equal(programme.programmeId, 'HKU-TPG-061');
  assert.equal(programme.creditsRequired, 72);
  assert.equal(programme.ruleReviewStatus, 'manual_review_required');
  assert.equal(discipline.courses.length, 32);
  assert.equal(discipline.courses.filter((course) => course.fundamental).length, 8);
  assert.equal(new Set(discipline.courses.map((course) => course.code)).size, 32);
  assert.match(discipline.ruleText, /Case Study Project path.*48 discipline-course credits/);
  assert.match(discipline.ruleText, /Dissertation path.*36 discipline-course credits/);
  assert.match(discipline.ruleText, /at least 24 credits \(four courses\).*Fundamental Courses/);
  assert.deepEqual(capstone.courses.map((course) => [course.code, course.credits]), [
    ['ECOM7000', 24],
    ['ECOM7001', 12]
  ]);
});

test('HKU Governance and Policy preserves the official 36-plus-18-plus-12 structure', () => {
  const supplement = buildHkuGovernancePolicySupplement();
  const catalogue = require('../data/tpg-programmes.json');
  validateSupplement(supplement, catalogue, 'hku-governance-policy-2026.json');
  const programme = supplement.programmes[0];
  const [compulsory, electives, capstone] = programme.courseGroups;

  assert.equal(programme.programmeId, 'HKU-TPG-062');
  assert.equal(programme.creditsRequired, 66);
  assert.equal(programme.ruleReviewStatus, 'manual_review_required');
  assert.deepEqual(programme.courseGroups.map((group) => group.creditsRequired), [36, 18, 12]);
  assert.deepEqual(programme.courseGroups.map((group) => group.coursesRequired), [6, 3, 1]);
  assert.equal(compulsory.courses.length, 6);
  assert.equal(electives.courses.length, 14);
  assert.equal(electives.courses.filter((course) => course.subjectGroups.includes('method-and-data-analysis')).length, 3);
  assert.match(electives.ruleText, /including at least one course from Method and Data Analysis/);
  assert.deepEqual(capstone.courses.map((course) => [course.code, course.credits, course.courseKind]), [
    ['MGAP8001', 12, 'project']
  ]);
  assert.equal(new Set(programme.courseGroups.flatMap((group) => group.courses).map((course) => course.code)).size, 21);
});

test('HKU Architecture second batch preserves six official curricula without inventing annual electives', () => {
  const supplements = buildHkuArchitectureSecondBatchSupplements();
  const catalogue = require('../data/tpg-programmes.json');
  supplements.forEach(({ file, value }) => validateSupplement(value, catalogue, file));
  const programmes = supplements.flatMap(({ value }) => value.programmes);
  const byId = Object.fromEntries(programmes.map((programme) => [programme.programmeId, programme]));

  assert.deepEqual(programmes.map((programme) => programme.programmeId).sort(), [
    'HKU-TPG-004', 'HKU-TPG-006', 'HKU-TPG-007', 'HKU-TPG-008', 'HKU-TPG-009', 'HKU-TPG-010'
  ]);

  const mdum = byId['HKU-TPG-004'];
  assert.equal(mdum.creditsRequired, 69);
  assert.deepEqual(mdum.courseGroups.map((group) => group.creditsRequired), [36, 18, 15]);
  assert.equal(mdum.courseGroups[1].courses.length, 18);
  assert.equal(mdum.courseGroups[1].courses.filter((course) => course.subjectGroups.includes('urban-policy-and-management')).length, 9);
  assert.deepEqual(mdum.courseGroups[2].courses.map((course) => [course.code, course.credits]), [['MDUM8010', 15], ['MDUM8020', 15]]);

  const aad = byId['HKU-TPG-006'];
  assert.equal(aad.ruleReviewStatus, 'verified');
  assert.deepEqual(aad.courseGroups.map((group) => [group.creditsRequired, group.courses.length]), [[54, 6], [18, 9]]);
  assert.equal(aad.courseGroups[0].courses.find((course) => course.code === 'MAAD6103').courseKind, 'project');

  ['HKU-TPG-007', 'HKU-TPG-008'].forEach((programmeId) => {
    const programme = byId[programmeId];
    assert.equal(programme.creditsRequired, 72);
    assert.deepEqual(programme.courseGroups.map((group) => group.creditsRequired), [30, 18, 12, 12]);
    assert.equal(new Set(programme.courseGroups.flatMap((group) => group.courses).map((course) => course.code)).size, 11);
  });
  assert.deepEqual(byId['HKU-TPG-007'].courseGroups[1].courses.map((course) => course.code), ['CONS8220', 'CONS8222']);
  assert.deepEqual(byId['HKU-TPG-008'].courseGroups[1].courses.map((course) => course.code), ['CONS8221', 'CONS8223']);

  const cpm = byId['HKU-TPG-009'];
  assert.deepEqual(cpm.courseGroups[0].courses.map((course) => course.code), [
    'RECO6004', 'RECO6018', 'RECO6028', 'RECO6042', 'RECO6060', 'RECO7074', 'RECO7079', 'RECO7098'
  ]);
  assert.deepEqual(cpm.courseGroups[1].courses.map((course) => [course.code, course.credits]), [['RECO6058', 6], ['RECO6020', 18]]);
  assert.equal(cpm.courseGroups[2].courses.length, 0);
  assert.match(cpm.courseGroups[2].ruleText, /does not publish a fixed designated list/);

  const dmba = byId['HKU-TPG-010'];
  assert.equal(dmba.creditsRequired, 72);
  assert.deepEqual(dmba.courseGroups.map((group) => [group.creditsRequired, group.courses.length]), [[60, 10], [12, 2]]);
  assert.equal(dmba.courseGroups[0].courses.find((course) => course.code === 'RECO7617').courseKind, 'project');
});

test('HKU Architecture first batch preserves official shared pools and source conflicts', () => {
  const supplement = buildHkuArchitectureFirstBatchSupplement();
  const byId = Object.fromEntries(supplement.programmes.map((programme) => [programme.programmeId, programme]));
  assert.deepEqual(Object.keys(byId), ['HKU-TPG-001', 'HKU-TPG-002', 'HKU-TPG-003', 'HKU-TPG-005']);

  const design = byId['HKU-TPG-001'];
  assert.equal(design.creditsRequired, 204);
  assert.equal(design.ruleReviewStatus, 'manual_review_required');
  assert.match(design.statusNote, /156 Core credits/);
  assert.deepEqual(design.courseGroups.map((group) => [group.creditsRequired, group.coursesRequired, group.courses.length]), [[168, 18, 18], [36, 6, 87]]);
  assert.equal(design.courseGroups[1].courses.some((course) => course.code === 'ARCH7465'), false);
  assert.equal(design.courseGroups[1].courses.find((course) => course.code === 'ARCH7332').conditionalRequirement, true);

  for (const programmeId of ['HKU-TPG-002', 'HKU-TPG-003']) {
    const programme = byId[programmeId];
    assert.equal(programme.creditsRequired, 144);
    assert.deepEqual(programme.courseGroups.map((group) => [group.creditsRequired, group.coursesRequired, group.courses.length]), [[120, 12, 12], [24, 4, 93]]);
    assert.equal(programme.courseGroups[1].courses.find((course) => course.code === 'ARCH7465').conditionalRequirement, true);
    assert.match(programme.courseGroups[1].ruleText, /must not be added automatically to the 144-credit base total/);
  }

  const landscape = byId['HKU-TPG-005'];
  assert.equal(landscape.creditsRequired, 120);
  assert.deepEqual(landscape.courseGroups.map((group) => [group.creditsRequired, group.coursesRequired, group.courses.length]), [[60, 8, 8], [42, 5, 5], [18, 3, 20]]);
  assert.deepEqual(landscape.courseGroups[1].courses.filter((course) => course.courseKind === 'project').map((course) => course.code), ['LAND7291', 'LAND7299']);
  assert.equal(new Set(landscape.courseGroups.flatMap((group) => group.courses).map((course) => course.code)).size, 33);
});

test('HKU Applied Linguistics preserves both official 69-credit Capstone paths', () => {
  const supplement = buildHkuAppliedLinguisticsSupplement();
  const programme = supplement.programmes[0];
  const [core, electives, capstone] = programme.courseGroups;

  assert.equal(programme.programmeId, 'HKU-TPG-011');
  assert.equal(programme.creditsRequired, 69);
  assert.equal(programme.ruleReviewStatus, 'manual_review_required');
  assert.deepEqual([core.creditsRequired, core.coursesRequired, core.courses.length], [30, 5, 5]);
  assert.deepEqual([electives.creditsRequired, electives.coursesRequired, electives.courses.length], [24, 4, 14]);
  assert.deepEqual([capstone.creditsRequired, capstone.coursesRequired, capstone.courses.length], [15, 1, 2]);
  assert.equal(electives.courses.find((course) => course.code === 'MAAL6037').credits, 6);
  assert.deepEqual(capstone.courses.map((course) => [course.code, course.credits]), [['MAAL8999', 15], ['MAAL8998', 15]]);
  assert.match(electives.ruleText, /Dissertation path requires MAAL6037/);
  assert.match(programme.statusNote, /MAAL6017 Phonology and MAAL6036/);
});

test('HKU Chinese Language and Literature preserves the official eight-elective plus Capstone rule', () => {
  const supplement = buildHkuChineseLanguageLiteratureSupplement();
  const programme = supplement.programmes[0];
  const [electives, capstone] = programme.courseGroups;

  assert.equal(programme.programmeId, 'HKU-TPG-012');
  assert.equal(supplement.academicYear, '2024-25 and thereafter');
  assert.equal(programme.creditsRequired, 60);
  assert.equal(programme.ruleReviewStatus, 'manual_review_required');
  assert.deepEqual([electives.creditsRequired, electives.coursesRequired, electives.courses.length], [48, 8, 23]);
  assert.deepEqual([capstone.creditsRequired, capstone.coursesRequired, capstone.courses.length], [12, 1, 1]);
  assert.deepEqual(capstone.courses.map((course) => [course.code, course.credits]), [['CHIN7995', 12]]);
  assert.deepEqual(
    electives.courses.reduce((counts, course) => {
      counts[course.subjectGroups[0]] = (counts[course.subjectGroups[0]] || 0) + 1;
      return counts;
    }, {}),
    { 'chinese-language': 6, 'chinese-literature': 10, 'chinese-culture': 6, seminar: 1 }
  );
  assert.match(electives.ruleText, /does not imply that every course runs in every semester/);
});

test('HKU Creative Communications preserves the official 18-plus-30-plus-12 structure', () => {
  const supplement = buildHkuCreativeCommunicationsSupplement();
  const programme = supplement.programmes[0];
  const [compulsory, electives, capstone] = programme.courseGroups;

  assert.equal(programme.programmeId, 'HKU-TPG-013');
  assert.equal(supplement.academicYear, '2026-27');
  assert.equal(programme.creditsRequired, 60);
  assert.equal(programme.ruleReviewStatus, 'verified');
  assert.deepEqual([compulsory.creditsRequired, compulsory.coursesRequired, compulsory.courses.length], [18, 2, 2]);
  assert.deepEqual([electives.creditsRequired, electives.coursesRequired, electives.courses.length], [30, 5, 20]);
  assert.deepEqual([capstone.creditsRequired, capstone.coursesRequired, capstone.courses.length], [12, 1, 1]);
  assert.equal(compulsory.courses.every((course) => course.credits === 9), true);
  assert.deepEqual(capstone.courses.map((course) => [course.code, course.credits]), [['ENGL7995', 12]]);
  assert.match(electives.ruleText, /not all listed electives will be offered every year/);
});

test('HKU East Asian Studies corrects the total and preserves category and Capstone choices', () => {
  const supplement = buildHkuEastAsianStudiesSupplement();
  const programme = supplement.programmes[0];
  const [core, electives, capstone] = programme.courseGroups;

  assert.equal(programme.programmeId, 'HKU-TPG-014');
  assert.equal(programme.creditsRequired, 60);
  assert.equal(programme.ruleReviewStatus, 'manual_review_required');
  assert.deepEqual([core.creditsRequired, core.coursesRequired, core.courses.length], [30, 4, 4]);
  assert.deepEqual([electives.creditsRequired, electives.coursesRequired, electives.courses.length], [18, 3, 20]);
  assert.deepEqual([capstone.creditsRequired, capstone.coursesRequired, capstone.courses.length], [12, 1, 2]);
  assert.equal(electives.courses.filter((course) => course.subjectGroups.includes('east-asian-studies')).length, 8);
  assert.deepEqual(capstone.courses.map((course) => [course.code, course.credits]), [['GLAS7990', 12], ['GLAS7999', 12]]);
  assert.match(electives.ruleText, /two 6-credit electives from the East Asian Studies list/);
  assert.match(programme.statusNote, /correcting the older 30-credit directory value/);
});

test('HKU English Studies preserves the current seminar pool and optional specialisation rule', () => {
  const supplement = buildHkuEnglishStudiesSupplement();
  const programme = supplement.programmes[0];
  const [core, seminars, capstone] = programme.courseGroups;

  assert.equal(programme.programmeId, 'HKU-TPG-015');
  assert.equal(programme.creditsRequired, 60);
  assert.equal(programme.ruleReviewStatus, 'manual_review_required');
  assert.deepEqual([core.creditsRequired, core.coursesRequired, core.courses.length], [21, 3, 3]);
  assert.deepEqual([seminars.creditsRequired, seminars.coursesRequired, seminars.courses.length], [24, 4, 10]);
  assert.deepEqual([capstone.creditsRequired, capstone.coursesRequired, capstone.courses.length], [15, 1, 1]);
  assert.equal(seminars.courses.filter((course) => course.subjectGroups.includes('linguistics')).length, 5);
  assert.equal(seminars.courses.filter((course) => course.subjectGroups.includes('literature')).length, 5);
  assert.deepEqual(capstone.courses.map((course) => [course.code, course.credits]), [['ENGL7994', 15]]);
  assert.match(seminars.ruleText, /at least three Seminar Courses and the Capstone in the same area/);
  assert.match(programme.statusNote, /broader catalogue/);
});

test('HKU European Studies corrects the total and preserves category and Capstone choices', () => {
  const supplement = buildHkuEuropeanStudiesSupplement();
  const programme = supplement.programmes[0];
  const [core, electives, capstone] = programme.courseGroups;

  assert.equal(programme.programmeId, 'HKU-TPG-016');
  assert.equal(supplement.academicYear, '2026-27 and thereafter');
  assert.equal(programme.creditsRequired, 60);
  assert.equal(programme.ruleReviewStatus, 'manual_review_required');
  assert.deepEqual([core.creditsRequired, core.coursesRequired, core.courses.length], [30, 4, 4]);
  assert.deepEqual([electives.creditsRequired, electives.coursesRequired, electives.courses.length], [18, 3, 20]);
  assert.deepEqual([capstone.creditsRequired, capstone.coursesRequired, capstone.courses.length], [12, 1, 2]);
  assert.equal(core.courses.find((course) => course.name === 'Area Studies: Europe').code, 'GLAS7002');
  assert.equal(electives.courses.filter((course) => course.subjectGroups.includes('european-studies')).length, 5);
  assert.equal(electives.courses.filter((course) => course.subjectGroups.includes('east-asian-studies')).length, 8);
  assert.equal(electives.courses.filter((course) => course.subjectGroups.includes('global-studies')).length, 7);
  assert.deepEqual(capstone.courses.map((course) => [course.code, course.credits]), [['GLAS7990', 12], ['GLAS7998', 12]]);
  assert.match(electives.ruleText, /at least two courses \(12 credits\) from European Studies/);
  assert.match(programme.statusNote, /GLAS7003/);
  assert.match(programme.statusNote, /correcting the older 30-credit directory value/);
});

test('HKU Hong Kong Cultural Studies preserves the official Core, Elective and Capstone rules', () => {
  const supplement = buildHkuHongKongCulturalStudiesSupplement();
  const programme = supplement.programmes[0];
  const [core, electives, capstone] = programme.courseGroups;

  assert.equal(programme.programmeId, 'HKU-TPG-017');
  assert.equal(supplement.academicYear, '2026-27 and thereafter');
  assert.equal(programme.creditsRequired, 60);
  assert.equal(programme.ruleReviewStatus, 'manual_review_required');
  assert.deepEqual([core.creditsRequired, core.coursesRequired, core.courses.length], [12, 2, 2]);
  assert.deepEqual([electives.creditsRequired, electives.coursesRequired, electives.courses.length], [36, 6, 13]);
  assert.deepEqual([capstone.creditsRequired, capstone.coursesRequired, capstone.courses.length], [12, 1, 1]);
  assert.equal(electives.courses.filter((course) => course.subjectGroups.includes('programme-elective')).length, 10);
  assert.equal(electives.courses.filter((course) => course.subjectGroups.includes('cross-listed')).length, 3);
  assert.deepEqual(capstone.courses.map((course) => [course.code, course.credits, course.courseKind]), [
    ['HKGS7991', 12, 'project']
  ]);
  assert.match(electives.ruleText, /maximum of two cross-listed CHIN electives \(12 credits\)/);
  assert.match(capstone.ruleText, /academic paper of at least 7,000 English words/);
  assert.match(capstone.ruleText, /8-10 minute media production/);
});

test('HKU Literary and Cultural Studies preserves optional Streams and the two Capstone paths', () => {
  const supplement = buildHkuLiteraryCulturalStudiesSupplement();
  const catalogue = require('../data/tpg-programmes.json');
  validateSupplement(supplement, catalogue, 'hku-literary-cultural-studies-2025.json');
  const programme = supplement.programmes[0];
  const [core, electives, capstone, experiential] = programme.courseGroups;

  assert.equal(programme.programmeId, 'HKU-TPG-018');
  assert.equal(programme.creditsRequired, 60);
  assert.equal(programme.trackSelectionOptional, true);
  assert.equal(programme.ruleReviewStatus, 'manual_review_required');
  assert.deepEqual(programme.tracks.map((track) => track.name), [
    'Literary and Cultural Studies',
    'Film and Media Studies'
  ]);
  assert.deepEqual(programme.courseGroups.map((group) => group.creditsRequired), [9, 36, 15, 0]);
  assert.deepEqual([core.courses.length, electives.courses.length, capstone.courses.length, experiential.courses.length], [1, 24, 2, 4]);
  assert.equal(new Set(programme.courseGroups.flatMap((group) => group.courses).map((course) => course.code)).size, 31);
  assert.equal(electives.courses.find((course) => course.code === 'CLIT7012').conditionalRequirement, true);
  assert.equal(electives.courses.find((course) => course.code === 'CLIT7032').credits, 6);
  assert.equal(electives.courses.some((course) => course.code === 'CLIT7025'), false);
  assert.deepEqual(capstone.courses.map((course) => [course.code, course.credits, course.courseKind]), [
    ['CLIT7997', 15, 'dissertation'],
    ['CLIT7996', 15, 'project']
  ]);
  assert.match(capstone.ruleText, /CLIT7012 Dissertation Seminar/);
  assert.match(experiential.ruleText, /do not count toward the base 60-credit completion total/);
});

test('HKU Translation preserves the current three-plus-six-plus-Capstone structure', () => {
  const supplement = buildHkuTranslationSupplement();
  const catalogue = require('../data/tpg-programmes.json');
  validateSupplement(supplement, catalogue, 'hku-translation-2025.json');
  const programme = supplement.programmes[0];
  const [core, electives, capstone] = programme.courseGroups;

  assert.equal(programme.programmeId, 'HKU-TPG-019');
  assert.equal(programme.creditsRequired, 66);
  assert.equal(programme.ruleReviewStatus, 'manual_review_required');
  assert.deepEqual(programme.courseGroups.map((group) => group.creditsRequired), [18, 36, 12]);
  assert.deepEqual(programme.courseGroups.map((group) => group.coursesRequired), [3, 6, 1]);
  assert.equal(core.courses.length, 3);
  assert.equal(core.courses.filter((course) => course.subjectGroups.includes('interpreting')).length, 1);
  assert.equal(electives.courses.length, 19);
  assert.equal(electives.courses.filter((course) => course.subjectGroups.includes('translation')).length, 17);
  assert.deepEqual(
    electives.courses.filter((course) => course.subjectGroups.includes('interpreting')).map((course) => course.code),
    ['CHIN7209', 'CHIN7210']
  );
  assert.deepEqual(capstone.courses.map((course) => [course.code, course.credits, course.courseKind]), [
    ['CHIN7996', 12, 'project']
  ]);
  assert.equal(new Set(programme.courseGroups.flatMap((group) => group.courses).map((course) => course.code)).size, 23);
  assert.match(electives.ruleText, /choose six 6-credit electives/i);
  assert.match(electives.ruleText, /older 14-elective count/);
  assert.match(capstone.ruleText, /long translation/);
  assert.match(capstone.ruleText, /Interpreting project/);
});

test('HKU Buddhist Counselling preserves the official three-plus-four-plus-Capstone structure', () => {
  const supplement = buildHkuBuddhistCounsellingSupplement();
  const catalogue = require('../data/tpg-programmes.json');
  validateSupplement(supplement, catalogue, 'hku-buddhist-counselling-2025.json');
  const programme = supplement.programmes[0];
  const [core, electives, capstone] = programme.courseGroups;

  assert.equal(programme.programmeId, 'HKU-TPG-020');
  assert.equal(supplement.academicYear, '2023-24 and thereafter');
  assert.equal(programme.creditsRequired, 63);
  assert.equal(programme.ruleReviewStatus, 'manual_review_required');
  assert.deepEqual(programme.courseGroups.map((group) => group.creditsRequired), [27, 24, 12]);
  assert.deepEqual(programme.courseGroups.map((group) => group.coursesRequired), [3, 4, 1]);
  assert.deepEqual([core.courses.length, electives.courses.length, capstone.courses.length], [3, 12, 1]);
  assert.equal(core.courses.every((course) => course.credits === 9), true);
  assert.equal(electives.courses.every((course) => course.credits === 6), true);
  assert.equal(new Set(programme.courseGroups.flatMap((group) => group.courses).map((course) => course.code)).size, 16);
  assert.deepEqual(capstone.courses.map((course) => [course.code, course.credits, course.courseKind]), [
    ['BSTC8998', 12, 'project']
  ]);
  assert.match(core.ruleText, /at most one equivalent Core Course/);
  assert.match(electives.ruleText, /Master of Social Sciences \(Counselling\)/);
  assert.match(electives.ruleText, /not invented here/);
  assert.match(capstone.ruleText, /four official formats/);
});

test('HKU Buddhist Studies preserves all four elective categories and both Capstone models', () => {
  const supplement = buildHkuBuddhistStudiesSupplement();
  const catalogue = require('../data/tpg-programmes.json');
  validateSupplement(supplement, catalogue, 'hku-buddhist-studies-2025.json');
  const programme = supplement.programmes[0];
  const [foundation, electives, capstone] = programme.courseGroups;

  assert.equal(programme.programmeId, 'HKU-TPG-021');
  assert.equal(supplement.academicYear, '2025-26 and thereafter');
  assert.equal(programme.creditsRequired, 60);
  assert.equal(programme.ruleReviewStatus, 'manual_review_required');
  assert.deepEqual(programme.courseGroups.map((group) => group.creditsRequired), [18, 30, 12]);
  assert.deepEqual(programme.courseGroups.map((group) => group.coursesRequired), [2, 5, 1]);
  assert.deepEqual([foundation.courses.length, electives.courses.length, capstone.courses.length], [2, 46, 34]);
  assert.equal(foundation.courses.every((course) => course.credits === 9), true);
  assert.equal(electives.courses.every((course) => course.credits === 6), true);
  assert.equal(capstone.courses.every((course) => course.credits === 12), true);
  assert.deepEqual(
    electives.courses.reduce((counts, course) => ({ ...counts, [course.subjectGroups[0]]: (counts[course.subjectGroups[0]] || 0) + 1 }), {}),
    { 'buddhist-languages': 12, 'texts-thought-culture': 21, 'applied-buddhism': 8, 'other-courses': 5 }
  );
  assert.equal(capstone.courses.filter((course) => course.courseKind === 'dissertation').length, 1);
  assert.equal(capstone.courses.filter((course) => course.courseKind === 'project').length, 33);
  assert.equal(new Set(programme.courseGroups.flatMap((group) => group.courses).map((course) => course.code)).size, 82);
  assert.match(capstone.ruleText, /additional elective for 6 credits plus a 10,000-12,000-word portfolio/);
});

test('HKU Creative Writing MFA preserves the official compulsory, elective and Capstone structure', () => {
  const supplement = buildHkuCreativeWritingMfaSupplement();
  const catalogue = require('../data/tpg-programmes.json');
  validateSupplement(supplement, catalogue, 'hku-creative-writing-mfa-2025.json');
  const programme = supplement.programmes[0];
  const [compulsory, electives, capstone] = programme.courseGroups;

  assert.equal(programme.programmeId, 'HKU-TPG-022');
  assert.equal(supplement.academicYear, '2025-26 and thereafter');
  assert.equal(programme.creditsRequired, 60);
  assert.equal(programme.ruleReviewStatus, 'verified');
  assert.deepEqual(programme.courseGroups.map((group) => group.creditsRequired), [30, 18, 12]);
  assert.deepEqual(programme.courseGroups.map((group) => group.coursesRequired), [4, 3, 1]);
  assert.deepEqual([compulsory.courses.length, electives.courses.length, capstone.courses.length], [4, 7, 1]);
  assert.deepEqual(compulsory.courses.map((course) => course.credits), [9, 6, 6, 9]);
  assert.equal(electives.courses.every((course) => course.credits === 6), true);
  assert.equal(new Set(programme.courseGroups.flatMap((group) => group.courses).map((course) => course.code)).size, 12);
  assert.deepEqual(capstone.courses.map((course) => [course.code, course.credits, course.courseKind]), [
    ['ENGL7993', 12, 'dissertation']
  ]);
  assert.match(electives.ruleText, /seven courses published in the official Syllabuses/);
});

test('HKU Endodontics preserves all five compulsory components and corrects the directory subtotal', () => {
  const supplement = buildHkuEndodonticsSupplement();
  const catalogue = require('../data/tpg-programmes.json');
  validateSupplement(supplement, catalogue, 'hku-endodontics-2023.json');
  const programme = supplement.programmes[0];
  const [facultyCore, discipline, clinical, research, capstone] = programme.courseGroups;

  assert.equal(programme.programmeId, 'HKU-TPG-023');
  assert.equal(supplement.academicYear, '2023-24 and thereafter');
  assert.equal(programme.creditsRequired, 270);
  assert.equal(programme.ruleReviewStatus, 'manual_review_required');
  assert.deepEqual(programme.courseGroups.map((group) => group.creditsRequired), [21, 72, 99, 63, 15]);
  assert.deepEqual(programme.courseGroups.map((group) => group.coursesRequired), [8, 13, 6, 4, 3]);
  assert.deepEqual(programme.courseGroups.map((group) => group.courses.length), [8, 13, 6, 4, 3]);
  assert.equal(new Set(programme.courseGroups.flatMap((group) => group.courses).map((course) => course.code)).size, 34);
  assert.equal(facultyCore.courses.find((course) => course.code === 'DENT7030').credits, 0);
  assert.equal(discipline.courses.reduce((sum, course) => sum + course.credits, 0), 72);
  assert.equal(clinical.courses.reduce((sum, course) => sum + course.credits, 0), 99);
  assert.equal(research.courses.reduce((sum, course) => sum + course.credits, 0), 63);
  assert.equal(capstone.courses.reduce((sum, course) => sum + course.credits, 0), 15);
  assert.equal(research.courses.find((course) => course.code === 'DENT7114').courseKind, 'dissertation');
  assert.equal(capstone.courses.every((course) => course.courseKind === 'project'), true);
  assert.match(programme.statusNote, /corrects the 72-credit directory value/);
});

test('HKU Orthodontics preserves all compulsory components and corrects the directory subtotal', () => {
  const supplement = buildHkuOrthodonticsSupplement();
  const catalogue = require('../data/tpg-programmes.json');
  validateSupplement(supplement, catalogue, 'hku-orthodontics-2023.json');
  const programme = supplement.programmes[0];
  const [facultyCore, discipline, clinical, research] = programme.courseGroups;

  assert.equal(programme.programmeId, 'HKU-TPG-024');
  assert.equal(supplement.academicYear, '2023-24 and thereafter');
  assert.equal(programme.creditsRequired, 270);
  assert.equal(programme.ruleReviewStatus, 'verified');
  assert.deepEqual(programme.courseGroups.map((group) => group.creditsRequired), [15, 72, 153, 30]);
  assert.deepEqual(programme.courseGroups.map((group) => group.coursesRequired), [6, 3, 4, 2]);
  assert.deepEqual(programme.courseGroups.map((group) => group.courses.length), [6, 3, 4, 2]);
  assert.equal(new Set(programme.courseGroups.flatMap((group) => group.courses).map((course) => course.code)).size, 15);
  assert.equal(facultyCore.courses.find((course) => course.code === 'DENT7030').credits, 0);
  assert.equal(discipline.courses.reduce((sum, course) => sum + course.credits, 0), 72);
  assert.equal(clinical.courses.reduce((sum, course) => sum + course.credits, 0), 153);
  assert.equal(research.courses.reduce((sum, course) => sum + course.credits, 0), 30);
  assert.equal(clinical.courses.find((course) => course.code === 'DENT7250').courseKind, 'project');
  assert.equal(research.courses.every((course) => course.courseKind === 'research_project'), true);
  assert.match(programme.statusNote, /corrects the 72-credit directory value/);
});

test('HKU Paediatric Dentistry preserves all compulsory components and corrects the directory subtotal', () => {
  const supplement = buildHkuPaediatricDentistrySupplement();
  const catalogue = require('../data/tpg-programmes.json');
  validateSupplement(supplement, catalogue, 'hku-paediatric-dentistry-2023.json');
  const programme = supplement.programmes[0];
  const [facultyCore, discipline, clinical, research] = programme.courseGroups;

  assert.equal(programme.programmeId, 'HKU-TPG-025');
  assert.equal(supplement.academicYear, '2023-24 and thereafter');
  assert.equal(programme.creditsRequired, 270);
  assert.equal(programme.ruleReviewStatus, 'verified');
  assert.deepEqual(programme.courseGroups.map((group) => group.creditsRequired), [21, 66, 129, 54]);
  assert.deepEqual(programme.courseGroups.map((group) => group.coursesRequired), [8, 1, 2, 1]);
  assert.deepEqual(programme.courseGroups.map((group) => group.courses.length), [8, 1, 2, 1]);
  assert.equal(new Set(programme.courseGroups.flatMap((group) => group.courses).map((course) => course.code)).size, 12);
  assert.equal(facultyCore.courses.find((course) => course.code === 'DENT7030').credits, 0);
  assert.equal(discipline.courses.reduce((sum, course) => sum + course.credits, 0), 66);
  assert.equal(clinical.courses.reduce((sum, course) => sum + course.credits, 0), 129);
  assert.equal(research.courses.reduce((sum, course) => sum + course.credits, 0), 54);
  assert.equal(clinical.courses.find((course) => course.code === 'DENT7300').courseKind, 'project');
  assert.equal(research.courses[0].courseKind, 'research_project');
  assert.match(programme.statusNote, /corrects the 66-credit directory value/);
});

test('HKU Periodontology preserves all five compulsory components and corrects the directory subtotal', () => {
  const supplement = buildHkuPeriodontologySupplement();
  const catalogue = require('../data/tpg-programmes.json');
  validateSupplement(supplement, catalogue, 'hku-periodontology-2023.json');
  const programme = supplement.programmes[0];
  const [facultyCore, discipline, clinical, research, capstone] = programme.courseGroups;

  assert.equal(programme.programmeId, 'HKU-TPG-026');
  assert.equal(supplement.academicYear, '2023-24 and thereafter');
  assert.equal(programme.creditsRequired, 270);
  assert.equal(programme.ruleReviewStatus, 'verified');
  assert.deepEqual(programme.courseGroups.map((group) => group.creditsRequired), [18, 66, 126, 54, 6]);
  assert.deepEqual(programme.courseGroups.map((group) => group.coursesRequired), [7, 13, 1, 1, 1]);
  assert.deepEqual(programme.courseGroups.map((group) => group.courses.length), [7, 13, 1, 1, 1]);
  assert.equal(new Set(programme.courseGroups.flatMap((group) => group.courses).map((course) => course.code)).size, 23);
  assert.equal(facultyCore.courses.find((course) => course.code === 'DENT7030').credits, 0);
  assert.equal(discipline.courses.reduce((sum, course) => sum + course.credits, 0), 66);
  assert.equal(clinical.courses.reduce((sum, course) => sum + course.credits, 0), 126);
  assert.equal(research.courses.reduce((sum, course) => sum + course.credits, 0), 54);
  assert.equal(capstone.courses.reduce((sum, course) => sum + course.credits, 0), 6);
  assert.equal(research.courses[0].courseKind, 'research_project');
  assert.equal(capstone.courses[0].courseKind, 'project');
  assert.match(programme.statusNote, /no longer carries the older Subject to official approval notice/);
  assert.match(programme.statusNote, /corrects the 66-credit directory value/);
});

test('HKU Prosthodontics remains blocked while current official approval evidence is unavailable', () => {
  const supplement = buildHkuProsthodonticsSourceStatusSupplement();
  const catalogue = require('../data/tpg-programmes.json');
  validateSupplement(supplement, catalogue, 'hku-prosthodontics-source-status-2026.json');
  const programme = supplement.programmes[0];

  assert.equal(programme.programmeId, 'HKU-TPG-027');
  assert.equal(supplement.academicYear, '2023-24 and thereafter');
  assert.equal(programme.status, 'blocked');
  assert.equal(programme.creditsRequired, 270);
  assert.equal(programme.creditUnit, 'credits');
  assert.equal(programme.courseGroups, undefined);
  assert.match(programme.sourceUrl, /tpg-mds-prosthodontics\.php$/);
  assert.match(programme.statusNote, /Subject to official approval/);
  assert.match(programme.statusNote, /R350/);
  assert.match(programme.statusNote, /120-credit directory value matches only the Clinical subtotal/);
  assert.match(programme.statusNote, /no course groups are exposed/);
});

test('HKU Community Dentistry remains blocked without its required Public Health course identities', () => {
  const supplement = buildHkuCommunityDentistrySourceStatusSupplement();
  const catalogue = require('../data/tpg-programmes.json');
  validateSupplement(supplement, catalogue, 'hku-community-dentistry-source-status-2026.json');
  const programme = supplement.programmes[0];

  assert.equal(programme.programmeId, 'HKU-TPG-028');
  assert.equal(supplement.academicYear, '2017-18 and thereafter');
  assert.equal(programme.status, 'blocked');
  assert.equal(programme.creditsRequired, 69);
  assert.equal(programme.creditUnit, 'credits');
  assert.equal(programme.courseGroups, undefined);
  assert.match(programme.sourceUrl, /tpg-msc-community\.php$/);
  assert.match(programme.statusNote, /five 3-credit courses assigned by the Programme Director/);
  assert.match(programme.statusNote, /no course codes or complete course titles/);
  assert.match(programme.statusNote, /R351/);
  assert.match(programme.statusNote, /other 54 credits as an incomplete curriculum/);
});

test('HKU Dental Materials Science preserves the complete compulsory 72-credit curriculum', () => {
  const supplement = buildHkuDentalMaterialsScienceSupplement();
  const catalogue = require('../data/tpg-programmes.json');
  validateSupplement(supplement, catalogue, 'hku-dental-materials-science-2017.json');
  const programme = supplement.programmes[0];
  const [facultyCore, discipline, research] = programme.courseGroups;

  assert.equal(programme.programmeId, 'HKU-TPG-029');
  assert.equal(supplement.academicYear, '2017-18 and thereafter');
  assert.equal(programme.creditsRequired, 72);
  assert.equal(programme.ruleReviewStatus, 'verified');
  assert.deepEqual(programme.courseGroups.map((group) => group.creditsRequired), [9, 27, 36]);
  assert.deepEqual(programme.courseGroups.map((group) => group.coursesRequired), [4, 5, 2]);
  assert.deepEqual(programme.courseGroups.map((group) => group.courses.length), [4, 5, 2]);
  assert.equal(new Set(programme.courseGroups.flatMap((group) => group.courses).map((course) => course.code)).size, 11);
  assert.equal(facultyCore.courses.find((course) => course.code === 'DENT7030').credits, 0);
  assert.equal(discipline.courses.reduce((sum, course) => sum + course.credits, 0), 27);
  assert.equal(research.courses.reduce((sum, course) => sum + course.credits, 0), 36);
  assert.equal(research.courses.find((course) => course.code === 'DENT7504').courseKind, 'research_project');
  assert.equal(research.courses.find((course) => course.code === 'DENT7500').courseKind, 'dissertation');
  assert.match(programme.sourceUrl, /pREF_CODE=R233/);
  assert.match(programme.statusNote, /Sep 27, 2019/);
});

test('HKU MA(TESOL) preserves the complete 72-credit curriculum and its alternative Core course', () => {
  const supplement = buildHkuMatesolSupplement();
  const catalogue = require('../data/tpg-programmes.json');
  validateSupplement(supplement, catalogue, 'hku-matesol-2025.json');
  const programme = supplement.programmes[0];
  const [core, capstone, electives] = programme.courseGroups;

  assert.equal(programme.programmeId, 'HKU-TPG-030');
  assert.equal(supplement.academicYear, '2025-26 and thereafter');
  assert.equal(programme.creditsRequired, 72);
  assert.equal(programme.ruleReviewStatus, 'manual_review_required');
  assert.deepEqual(programme.courseGroups.map((group) => group.creditsRequired), [36, 12, 24]);
  assert.deepEqual(programme.courseGroups.map((group) => group.coursesRequired), [6, 1, 4]);
  assert.deepEqual(programme.courseGroups.map((group) => group.courses.length), [7, 1, 13]);
  assert.equal(new Set(programme.courseGroups.flatMap((group) => group.courses).map((course) => course.code)).size, 21);
  assert.deepEqual(core.courses.slice(0, 2).map((course) => course.code), ['MAES7001', 'MAES7008']);
  assert.equal(capstone.courses[0].code, 'MAES7200');
  assert.equal(capstone.courses[0].courseKind, 'project');
  assert.equal(electives.courses.every((course) => course.credits === 6), true);
  assert.match(core.ruleText, /exactly one of MAES7001 or MAES7008/);
  assert.match(programme.sourceUrl, /pgdr2025-26\/Education\/MA\(TESOL\)\.pdf$/);
});

test('HKU MEd preserves all 19 paths and the complete 2025-26 course pool', () => {
  const supplement = buildHkuMedSupplement();
  const catalogue = require('../data/tpg-programmes.json');
  validateSupplement(supplement, catalogue, 'hku-med-2025.json');
  const programme = supplement.programmes[0];
  const [core, specialistRequirement, generalistElectives, specialistElectives, coursePool, capstone] = programme.courseGroups;

  assert.equal(programme.programmeId, 'HKU-TPG-031');
  assert.equal(supplement.academicYear, '2025-26 and thereafter');
  assert.equal(programme.creditsRequired, 60);
  assert.equal(programme.ruleReviewStatus, 'manual_review_required');
  assert.equal(programme.trackSelectionOptional, false);
  assert.equal(programme.tracks.length, 19);
  assert.equal(core.courses[0].code, 'MEDD8001');
  assert.equal(specialistRequirement.creditsRequiredByTrackIds[HKU_MED_TRACKS.GIFTED], 30);
  assert.equal(specialistRequirement.creditsRequiredByTrackIds[HKU_MED_TRACKS.CHINESE_INTERNATIONAL], 42);
  assert.equal(generalistElectives.appliesToTrackIds[0], HKU_MED_TRACKS.GENERALIST);
  assert.equal(generalistElectives.creditsRequired, 42);
  assert.equal(specialistElectives.creditsRequiredByTrackIds[HKU_MED_TRACKS.GUIDANCE], 12);
  assert.equal(specialistElectives.appliesToTrackIds.includes(HKU_MED_TRACKS.CHINESE_INTERNATIONAL), false);
  assert.equal(coursePool.courses.length, 131);
  assert.equal(new Set(coursePool.courses.map((course) => course.code)).size, 131);
  assert.equal(coursePool.courses.filter((course) => (course.subjectGroups || []).includes('General Elective')).length, 62);
  assert.equal(coursePool.courses.filter((course) => (course.subjectGroups || []).includes('Advanced Research Methods')).length, 22);
  assert.deepEqual(coursePool.courses.find((course) => course.code === 'MEDD6381').requiredForTrackIds.sort(), [
    HKU_MED_TRACKS.MATHEMATICS_INTERNATIONAL,
    HKU_MED_TRACKS.SCIENCE_INTERNATIONAL
  ].sort());
  assert.equal(capstone.courses.length, 2);
  assert.deepEqual(capstone.courses.find((course) => course.code === 'MEDD8008').excludesTrackIds, [HKU_MED_TRACKS.CHINESE_INTERNATIONAL]);
  assert.deepEqual(coursePool.courses.find((course) => course.code === 'MEDD8602').prerequisiteCodes, ['MEDD6248', 'MEDD8678']);
  assert.deepEqual(coursePool.courses.find((course) => course.code === 'MEDD8874').impermissibleWithCodes, ['MEDD6128', 'MEDD6131', 'MEDD8819', 'MEDD8820']);
  assert.deepEqual(coursePool.courses.find((course) => course.code === 'MEDD8889').excludesTrackIds, [HKU_MED_TRACKS.ADMINISTRATION]);
});

test('PolyU Hospitality and Tourism Management preserves six award paths and both project components', () => {
  const supplement = buildPolyuHospitalityTourismManagementSupplement();
  const catalogue = require('../data/tpg-programmes.json');
  validateSupplement(supplement, catalogue, 'polyu-hospitality-tourism-management-2027.json');
  const programme = supplement.programmes[0];
  const [foundation, compulsory, specialisation, crossListed, projects, electives, optional] = programme.courseGroups;

  assert.equal(programme.programmeId, 'POLYU-TPG-102');
  assert.equal(supplement.academicYear, '2027-28');
  assert.equal(programme.creditsRequired, 32);
  assert.equal(programme.ruleReviewStatus, 'manual_review_required');
  assert.equal(programme.trackSelectionOptional, false);
  assert.equal(programme.tracks.length, 6);
  assert.equal(programme.tracks.every((track) => track.type === 'Award Path' && track.creditsRequired === 32), true);
  assert.deepEqual([foundation.courses.length, compulsory.courses.length, specialisation.courses.length, crossListed.courses.length, projects.courses.length, electives.courses.length, optional.courses.length], [2, 4, 20, 3, 2, 10, 1]);
  assert.equal(new Set(programme.courseGroups.flatMap((group) => group.courses).map((course) => course.code)).size, 42);
  assert.deepEqual(projects.courses.map((course) => [course.code, course.credits, course.courseKind]), [
    ['HTM598', 3, 'project'],
    ['HTM599', 6, 'research_project']
  ]);
  assert.equal(optional.courses[0].code, 'HTM5003');
  assert.equal(optional.courses[0].credits, 0);
  assert.equal(crossListed.courses.find((course) => course.code === 'HTM541').countsTowardTrackIds.length, 1);
  assert.match(projects.ruleText, /Non-Research Component/);
  assert.match(electives.ruleText, /IWM/);
  assert.match(programme.statusNote, /must not infer completion/);
});

test('PolyU Food Science and Nutrition supplements preserve exact required credits and the Dietetics subtotal conflict', () => {
  const supplement = buildPolyuFoodScienceNutritionSupplement();
  const catalogue = require('../data/tpg-programmes.json');
  validateSupplement(supplement, catalogue, 'polyu-food-science-nutrition-2027.json');
  const byId = Object.fromEntries(supplement.programmes.map((programme) => [programme.programmeId, programme]));

  assert.deepEqual(supplement.programmes.map((programme) => programme.programmeId), [
    'POLYU-TPG-048',
    'POLYU-TPG-049',
    'POLYU-TPG-050',
    'POLYU-TPG-051'
  ]);
  assert.deepEqual(supplement.programmes.map((programme) => programme.creditsRequired), [31, 31, 31, 64]);
  assert.deepEqual(
    supplement.programmes.map((programme) => programme.courseGroups.flatMap((group) => group.courses).length),
    [8, 11, 11, 18]
  );
  assert.equal(byId['POLYU-TPG-048'].ruleReviewStatus, 'verified');
  assert.equal(byId['POLYU-TPG-048'].courseGroups.find((group) => group.id === 'capstone-project').courses[0].credits, 6);
  assert.equal(byId['POLYU-TPG-049'].courseGroups.flatMap((group) => group.courses).filter((course) => course.code === 'FSN5026').length, 1);
  assert.equal(byId['POLYU-TPG-050'].courseGroups.flatMap((group) => group.courses).filter((course) => course.code === 'FSN5027').length, 1);
  assert.deepEqual(
    byId['POLYU-TPG-051'].courseGroups.find((group) => group.id === 'dietetic-placements').courses.map((course) => [course.code, course.credits]),
    [['FSN5038', 3], ['FSN5039', 8], ['FSN5040', 7]]
  );
  assert.equal(byId['POLYU-TPG-051'].ruleReviewStatus, 'manual_review_required');
  assert.match(byId['POLYU-TPG-051'].statusNote, /lists 16 credits.*prints a 15-credit subtotal/);
  assert.match(byId['POLYU-TPG-051'].statusNote, /official 64-credit Programme total/);
});

test('PolyU Engineering Business Management preserves the corrected name and 37 PolyU-credit MSc path', () => {
  const supplement = buildPolyuEngineeringBusinessManagementSupplement();
  const catalogue = require('../data/tpg-programmes.json');
  validateSupplement(supplement, catalogue, 'polyu-engineering-business-management-2027.json');
  const programme = supplement.programmes[0];
  const [core, electives, dissertation, integrity] = programme.courseGroups;

  assert.equal(programme.programmeId, 'POLYU-TPG-052');
  assert.equal(programme.programmeName, 'Engineering Business Management');
  assert.equal(programme.creditsRequired, 37);
  assert.equal(programme.ruleReviewStatus, 'manual_review_required');
  assert.deepEqual(programme.courseGroups.map((group) => group.creditsRequired), [21, 3, 12, 1]);
  assert.deepEqual([core.courses.length, electives.courses.length, dissertation.courses.length, integrity.courses.length], [7, 2, 1, 1]);
  assert.equal(new Set(programme.courseGroups.flatMap((group) => group.courses).map((course) => course.code)).size, 11);
  assert.deepEqual(dissertation.courses.map((course) => [course.code, course.credits, course.courseKind]), [
    ['ISE5771', 12, 'dissertation']
  ]);
  assert.equal(integrity.courses[0].code, 'EEE5T03');
  assert.match(programme.statusNote, /Warwick credit values are not modelled as MSc completion paths/);
});

test('PolyU ISE supplements preserve both completion paths and official Dissertation codes', () => {
  const supplement = buildPolyuIndustrialSystemsEngineeringSupplement();
  const catalogue = require('../data/tpg-programmes.json');
  validateSupplement(supplement, catalogue, 'polyu-industrial-systems-engineering-2027.json');
  const byId = Object.fromEntries(supplement.programmes.map((programme) => [programme.programmeId, programme]));

  assert.deepEqual(supplement.programmes.map((programme) => programme.programmeId), [
    'POLYU-TPG-053',
    'POLYU-TPG-054',
    'POLYU-TPG-055'
  ]);
  assert.deepEqual(
    supplement.programmes.map((programme) => programme.courseGroups.flatMap((group) => group.courses).length),
    [23, 25, 16]
  );
  assert.equal(supplement.programmes.every((programme) => programme.creditsRequired === 31), true);
  assert.equal(supplement.programmes.every((programme) => programme.ruleReviewStatus === 'manual_review_required'), true);
  assert.deepEqual(
    supplement.programmes.map((programme) => {
      const course = programme.courseGroups.find((group) => group.id === 'dissertation-option').courses[0];
      return [course.code, course.credits, course.courseKind];
    }),
    [['ISE529', 9, 'dissertation'], ['ISE5003', 9, 'dissertation'], ['ISE5699', 9, 'dissertation']]
  );
  supplement.programmes.forEach((programme) => {
    assert.equal(programme.courseGroups.find((group) => group.id === 'compulsory-subjects').creditsRequired, 12);
    assert.equal(programme.courseGroups.find((group) => group.id === 'academic-integrity').courses[0].code, 'EEE5T03');
    assert.match(programme.statusNote, /seven taught subjects plus Dissertation or ten taught subjects/);
  });
  const smartManufacturingCourses = byId['POLYU-TPG-055'].courseGroups.flatMap((group) => group.courses);
  assert.equal(smartManufacturingCourses.find((course) => course.code === 'ISE5334').name, 'Industrial Prompt Engineering for Generative Artificial Intelligence');
  assert.equal(smartManufacturingCourses.find((course) => course.code === 'ISE538').name, 'Process and Performance Measurement');
  assert.match(byId['POLYU-TPG-055'].statusNote, /Subject Syllabus is titled Process and Performance Management/);
});

test('PolyU LMS supplements preserve current codes, Stream ownership and Project paths', () => {
  const supplement = buildPolyuLogisticsManagementSupplement();
  const catalogue = require('../data/tpg-programmes.json');
  validateSupplement(supplement, catalogue, 'polyu-logistics-management-2027.json');
  const byId = Object.fromEntries(supplement.programmes.map((programme) => [programme.programmeId, programme]));

  assert.deepEqual(supplement.programmes.map((programme) => programme.programmeId), [
    'POLYU-TPG-058',
    'POLYU-TPG-059',
    'POLYU-TPG-060',
    'POLYU-TPG-061',
    'POLYU-TPG-062'
  ]);
  assert.deepEqual(supplement.programmes.map((programme) => programme.creditsRequired), [34, 46, 31, 31, 31]);
  assert.deepEqual(
    supplement.programmes.map((programme) => programme.courseGroups.flatMap((group) => group.courses).length),
    [39, 41, 30, 32, 38]
  );
  assert.equal(supplement.programmes.every((programme) => programme.ruleReviewStatus === 'manual_review_required'), true);

  const mixedMode = byId['POLYU-TPG-058'];
  assert.equal(mixedMode.courseGroups.flatMap((group) => group.courses).find((course) => course.code === 'LGT5165').name, 'AI and Digitalisation in the Global Shipping Industry');
  assert.equal(mixedMode.courseGroups.find((group) => group.id === 'free-electives-and-project').courses.find((course) => course.code === 'LGT5202').credits, 6);
  assert.match(mixedMode.statusNote, /LGT5315/);

  const fullTime = byId['POLYU-TPG-059'];
  assert.deepEqual(fullTime.courseGroups.find((group) => group.id === 'maritime-industry-internship').courses.map((course) => [course.code, course.credits, course.courseKind]), [
    ['LGT5222', 6, 'internship']
  ]);
  assert.match(fullTime.statusNote, /40-academic-credit plus 6-training-credit/);

  const supplyChain = byId['POLYU-TPG-060'];
  assert.equal(supplyChain.courseGroups.find((group) => group.id === 'restricted-electives').courses.length, 6);
  assert.equal(supplyChain.courseGroups.find((group) => group.id === 'free-electives-and-project').courses.length, 20);

  const operations = byId['POLYU-TPG-061'];
  assert.equal(operations.trackSelectionOptional, false);
  assert.deepEqual(operations.tracks.map((track) => track.id), Object.values(POLYU_OM_TRACKS));
  assert.equal(operations.courseGroups.find((group) => group.id === 'specialised-subjects').courses.length, 12);
  assert.deepEqual(
    operations.courseGroups.find((group) => group.id === 'specialised-subjects').courses.find((course) => course.code === 'LGT5150').appliesToTrackIds,
    [POLYU_OM_TRACKS.QUALITY]
  );
  assert.deepEqual(
    operations.courseGroups.find((group) => group.id === 'specialised-subjects').courses.find((course) => course.code === 'LGT5425').subjectGroups,
    ['specialised', 'free-elective']
  );

  const decisionAnalysis = byId['POLYU-TPG-062'];
  assert.equal(decisionAnalysis.courseGroups.flatMap((group) => group.courses).find((course) => course.code === 'AF5627').name, 'Managerial Economics with an Application to China Business');
  assert.deepEqual(
    decisionAnalysis.courseGroups.find((group) => group.id === 'free-electives-and-projects').courses.filter((course) => course.courseKind).map((course) => [course.code, course.credits, course.courseKind]),
    [['LGT5415', 3, 'research_project'], ['LGT5202', 6, 'project']]
  );
  assert.match(decisionAnalysis.statusNote, /would leave the published 31-credit total short/);
});

test('PolyU Business Analytics preserves both official 31-credit completion routes without duplicating MM501', () => {
  const supplement = buildPolyuBusinessAnalyticsSupplement();
  const catalogue = require('../data/tpg-programmes.json');
  validateSupplement(supplement, catalogue, 'polyu-business-analytics-2027.json');
  const programme = supplement.programmes[0];
  const [compulsory, integrity, electives, dissertation] = programme.courseGroups;

  assert.equal(programme.programmeId, 'POLYU-TPG-063');
  assert.equal(programme.creditsRequired, 31);
  assert.equal(programme.ruleReviewStatus, 'manual_review_required');
  assert.deepEqual([compulsory.courses.length, integrity.courses.length, electives.courses.length, dissertation.courses.length], [4, 1, 19, 1]);
  assert.equal(new Set(programme.courseGroups.flatMap((group) => group.courses).map((course) => course.code)).size, 25);
  assert.equal(electives.courses.filter((course) => course.code === 'MM501').length, 1);
  assert.deepEqual(electives.courses.find((course) => course.code === 'MM501').subjectGroups, ['elective', 'research-methods']);
  assert.deepEqual(electives.courses.find((course) => course.code === 'MM5995').credits, 0);
  assert.deepEqual(dissertation.courses.map((course) => [course.code, course.credits, course.courseKind]), [
    ['MM594', 9, 'dissertation']
  ]);
  assert.equal(integrity.courses[0].code, 'MM5T21');
  assert.match(programme.statusNote, /Textual Analysis in Business/);
  assert.match(programme.statusNote, /Textual Analytics in Business/);
});

test('PolyU Management and Marketing curricula preserve current coded paths and zero-credit workshops', () => {
  const supplement = buildPolyuManagementMarketingSupplement();
  const catalogue = require('../data/tpg-programmes.json');
  validateSupplement(supplement, catalogue, 'polyu-management-marketing-2027.json');
  const byId = Object.fromEntries(supplement.programmes.map((programme) => [programme.programmeId, programme]));

  assert.deepEqual(supplement.programmes.map((programme) => programme.programmeId), [
    'POLYU-TPG-064', 'POLYU-TPG-065', 'POLYU-TPG-066'
  ]);
  assert.deepEqual(
    supplement.programmes.map((programme) => programme.courseGroups.flatMap((group) => group.courses).length),
    [26, 32, 25]
  );

  const hrm = byId['POLYU-TPG-064'];
  assert.equal(hrm.courseGroups.find((group) => group.id === 'elective-subjects').courses.filter((course) => course.code === 'MM501').length, 1);
  assert.equal(hrm.courseGroups.find((group) => group.id === 'dissertation-option').courses[0].code, 'MM592');
  assert.equal(hrm.courseGroups.flatMap((group) => group.courses).find((course) => course.code === 'MM5995').credits, 0);

  const marketing = byId['POLYU-TPG-065'];
  assert.equal(marketing.courseGroups.find((group) => group.id === 'elective-subjects').courses.length, 26);
  assert.equal(marketing.courseGroups.find((group) => group.id === 'dissertation-option').courses[0].code, 'MM597');

  const iml = byId['POLYU-TPG-066'];
  assert.equal(iml.courseGroups.find((group) => group.id === 'core-subjects').courses.length, 6);
  assert.equal(iml.courseGroups.find((group) => group.id === 'elective-subjects').courses.find((course) => course.code === 'AF5618').credits, 3);
  assert.equal(iml.courseGroups.find((group) => group.id === 'academic-integrity').courses[0].code, 'MM5T21');
});

test('PolyU DSAI curricula preserve the official taught and Dissertation routes', () => {
  const supplement = buildPolyuDsaiSupplement();
  const catalogue = require('../data/tpg-programmes.json');
  validateSupplement(supplement, catalogue, 'polyu-dsai-2027.json');
  const [dsa, aibd] = supplement.programmes;

  assert.deepEqual(supplement.programmes.map((programme) => programme.programmeId), ['POLYU-TPG-067', 'POLYU-TPG-068']);
  assert.deepEqual(
    supplement.programmes.map((programme) => programme.courseGroups.flatMap((group) => group.courses).length),
    [26, 22]
  );
  assert.deepEqual(dsa.courseGroups.find((group) => group.id === 'compulsory-subjects').courses.map((course) => course.code), [
    'COMP5434', 'DSAI5101', 'DSAI5102', 'DSAI5104', 'DSAI5204', 'DSAI5207'
  ]);
  assert.deepEqual(dsa.courseGroups.find((group) => group.id === 'dissertation-option').courses.map((course) => [course.code, course.credits]), [['DSAI5901', 9]]);
  assert.deepEqual(aibd.courseGroups.find((group) => group.id === 'dissertation-option').courses.map((course) => [course.code, course.credits]), [['DSAI5902', 9]]);
  assert.equal(aibd.courseGroups.find((group) => group.id === 'academic-integrity').courses[0].code, 'DSAI5T09');
});

test('PolyU Mechanical Engineering preserves current optional Specialisms and ME591 route', () => {
  const supplement = buildPolyuMechanicalEngineeringSupplement();
  const catalogue = require('../data/tpg-programmes.json');
  validateSupplement(supplement, catalogue, 'polyu-mechanical-engineering-2027.json');
  const programme = supplement.programmes[0];
  const core = programme.courseGroups.find((group) => group.id === 'core-subjects');

  assert.equal(programme.programmeId, 'POLYU-TPG-069');
  assert.equal(programme.trackSelectionOptional, true);
  assert.deepEqual(programme.tracks.map((track) => track.id), Object.values(POLYU_ME_TRACKS));
  assert.equal(core.courses.length, 20);
  assert.deepEqual(core.courses.find((course) => course.code === 'ME5510').countsTowardTrackIds, Object.values(POLYU_ME_TRACKS));
  assert.deepEqual(core.courses.find((course) => course.code === 'ME576').subjectGroups, ['core', 'aerospace-compulsory']);
  assert.deepEqual(programme.courseGroups.find((group) => group.id === 'dissertation-option').courses.map((course) => [course.code, course.credits]), [['ME591', 9]]);
  assert.equal(programme.courseGroups.find((group) => group.id === 'academic-integrity').courses[0].code, 'EEE5T03');
  assert.match(programme.statusNote, /former Green Energy Specialism/);
});
