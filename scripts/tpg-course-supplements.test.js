const assert = require('node:assert/strict');
const { test } = require('node:test');

const { applySupplements, validateSupplement } = require('./import-tpg-course-supplements');
const { buildCoverageReport, inspectProgramme } = require('./report-tpg-course-coverage');

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

test('TPG course supplements reject unknown Tracks and missing official credits', () => {
  const badTrack = fixtureSupplement();
  badTrack.programmes[0].courseGroups[0].courses[0].appliesToTrackIds = ['OTHER'];
  assert.throws(() => validateSupplement(badTrack, fixtureCatalogue()), /unknown Track/);
  const badCredits = fixtureSupplement();
  delete badCredits.programmes[0].courseGroups[0].courses[0].credits;
  assert.throws(() => validateSupplement(badCredits, fixtureCatalogue()), /official credits/);
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
