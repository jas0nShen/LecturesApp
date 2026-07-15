const assert = require('node:assert/strict');
const { test } = require('node:test');

const { applySupplements, validateSupplement } = require('./import-tpg-course-supplements');
const { buildCoverageReport, inspectProgramme } = require('./report-tpg-course-coverage');
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
const { buildSupplement: buildPolyuHospitalityTourismManagementSupplement } = require('./build-polyu-hospitality-tourism-management-supplement');
const { buildSupplement: buildPolyuSustainableTechnologyCarbonNeutralitySupplement } = require('./build-polyu-sustainable-technology-carbon-neutrality-supplement');
const { buildSupplement: buildPolyuBiopharmaceuticalDevelopmentSupplement } = require('./build-polyu-biopharmaceutical-development-supplements');
const { TRACKS: POLYU_OT_TRACKS, buildSupplement: buildPolyuAdvancedOccupationalTherapySupplement } = require('./build-polyu-advanced-occupational-therapy-supplement');
const { SPECIALISM_ID: POLYU_REHAB_SPECIALISM_ID, buildSupplement: buildPolyuAdvancedRehabilitationSciencesSupplement } = require('./build-polyu-advanced-rehabilitation-sciences-supplement');
const { IT_TRACKS, buildInformationTechnology } = require('./build-polyu-comp-supplements');

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

test('TPG course supplements can correct an official Programme name without changing its stable ID', () => {
  const catalogue = fixtureCatalogue();
  catalogue.programmes[0].name = 'Broken directory label';
  const supplement = fixtureSupplement();
  supplement.programmes[0].programmeName = 'Official Programme Name';

  validateSupplement(supplement, catalogue, 'fixture.json');
  const imported = applySupplements(catalogue, [{ file: 'fixture.json', value: supplement }]);
  assert.equal(imported.programmes[0].id, 'TEST-TPG-001');
  assert.equal(imported.programmes[0].name, 'Official Programme Name');

  supplement.programmes[0].programmeName = '   ';
  assert.throws(() => validateSupplement(supplement, catalogue, 'fixture.json'), /invalid programmeName/);
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
  assert.deepEqual(row.issues, ['manual-rule-review']);
  const report = buildCoverageReport(imported.programmes);
  assert.equal(report.complete, 1);
  assert.equal(report.schools[0].courses, 1);
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
