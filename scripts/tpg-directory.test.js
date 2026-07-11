const assert = require('node:assert/strict');
const { test } = require('node:test');

const { audit, duplicateValues } = require('./audit-programme-directory');
const { applyDirectorySupplements, buildId } = require('./import-tpg-directory-supplements');

test('TPG directory supplement import is deterministic and preserves unrelated programmes', () => {
  const source = {
    universities: [
      { code: 'HKU', academicYear: '2026-27', sourceUrl: 'https://hku.example', programmeCount: 1 },
      { code: 'EDUHK', academicYear: 'pending', sourceUrl: '', programmeCount: 0 }
    ],
    programmes: [
      { id: 'HKU-1', universityCode: 'HKU', name: 'Existing', sourceUrl: 'https://hku.example/p' },
      { id: 'OLD', universityCode: 'EDUHK', name: 'Old', directorySupplement: true }
    ]
  };
  const supplement = {
    lastVerifiedAt: '2026-07-11',
    universities: [{
      code: 'EDUHK',
      academicYear: '2026-27',
      sourceUrl: 'https://www.eduhk.hk/programmes',
      sourceLabel: 'Official',
      programmes: [['TEST', 'Master of Testing', '2027-28']]
    }]
  };
  const imported = applyDirectorySupplements(source, supplement);
  const importedAgain = applyDirectorySupplements(imported, supplement);
  assert.deepEqual(importedAgain, imported);
  assert.equal(source.programmes.some((item) => item.id === 'OLD'), true);
  assert.equal(imported.programmes.some((item) => item.id === 'HKU-1'), true);
  assert.equal(imported.programmes.some((item) => item.id === 'OLD'), false);
  assert.equal(imported.programmes.find((item) => item.universityCode === 'EDUHK').id, buildId('EDUHK', 'TEST', 'Master of Testing', 0));
  assert.equal(imported.programmes.find((item) => item.universityCode === 'EDUHK').academicYear, '2027-28');
});

test('field-label directory entries use name-independent stable IDs', () => {
  const source = {
    universities: [{ code: 'LINGNAN', academicYear: '2026-27', sourceUrl: 'https://ln.edu.hk' }],
    programmes: []
  };
  const makeSupplement = (name) => ({
    lastVerifiedAt: '2026-07-11',
    universities: [{
      code: 'LINGNAN', academicYear: '2026-27', sourceUrl: 'https://ln.edu.hk',
      sourceLabel: 'Official field index', nameKind: 'official_field_label', programmes: [['', name]]
    }]
  });
  const first = applyDirectorySupplements(source, makeSupplement('Data Science'));
  const renamed = applyDirectorySupplements(first, makeSupplement('Master of Science in Data Science'));
  assert.equal(first.programmes[0].id, 'LINGNAN-TPG-DIR-001');
  assert.equal(renamed.programmes[0].id, first.programmes[0].id);
});

test('directory audit separates blocking integrity failures from missing public codes', () => {
  const report = audit({
    ugCatalogue: {
      programmes: [{ id: 'UG-1', officialUrl: 'https://ug.example' }],
      majors: [{ id: 'MAJOR-1', programmeId: 'UG-1', officialUrl: 'https://ug.example/major' }]
    },
    tpgCatalogue: {
      universities: [{ code: 'TPG', academicYear: '2026-27', sourceUrl: 'https://tpg.example' }],
      programmes: [{ id: 'TPG-1', universityCode: 'TPG', name: 'Programme', programmeCode: '', tracks: [] }]
    }
  });
  assert.deepEqual(report.blockingErrors, []);
  assert.deepEqual(report.undergraduate.missingOfficialCodeIds, ['UG-1']);
  assert.deepEqual(report.taughtPostgraduate.missingOfficialCodeIds, ['TPG-1']);
});

test('directory audit blocks duplicate IDs, orphan Majors, empty schools and missing sources', () => {
  const report = audit({
    ugCatalogue: {
      programmes: [
        { id: 'UG-1', officialUrl: '' },
        { id: 'UG-1', officialUrl: '' }
      ],
      majors: [{ id: 'MAJOR-1', programmeId: 'MISSING', officialUrl: '' }]
    },
    tpgCatalogue: {
      universities: [{ code: 'TPG', academicYear: 'pending', sourceUrl: '' }],
      programmes: []
    }
  });
  assert(report.blockingErrors.includes('UG-1'));
  assert(report.blockingErrors.includes('MAJOR-1'));
  assert(report.blockingErrors.includes('TPG'));
  assert.deepEqual(duplicateValues([{ id: 'A' }, { id: 'A' }], (item) => item.id), ['A']);
});
