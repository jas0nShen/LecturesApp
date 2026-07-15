const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const source = require('../data/tpg-source-snapshots/polyu-2027.json');
const outputPath = path.join(ROOT, 'data', 'tpg-course-supplements', 'polyu-source-status-2027.json');
const verifiedIds = new Set([
  'POLYU-TPG-013',
  'POLYU-TPG-014',
  'POLYU-TPG-015',
  'POLYU-TPG-072',
  'POLYU-TPG-073',
  'POLYU-TPG-089',
  'POLYU-TPG-090',
  'POLYU-TPG-092',
  'POLYU-TPG-093',
  'POLYU-TPG-102',
  'POLYU-TPG-105'
]);
const statusOverrides = {
  'POLYU-TPG-074': {
    verifiedAt: '2026-07-15',
    sourceUrl: 'https://www.polyu.edu.hk/rs/study/taught-postgraduate-studies/msc-programme-2026-or-after/msc-in-advanced-physiotherapy/curriculum/',
    statusNote: 'The official 2027 Programme page, the current Department of Rehabilitation Sciences Curriculum page, and the July 2026 v14 Programme leaflet publish the 31-credit paths, three Specialisms, fixed Core and Clinical Practice subject codes, and per-course credits. All three sources label the compulsory 6-credit component only as Project Study and do not publish its subject code. RS567 must not be inferred from another Rehabilitation Sciences Programme.'
  },
  'POLYU-TPG-104': {
    verifiedAt: '2026-07-15',
    sourceUrl: 'https://www.polyu.edu.hk/sn/study/postgraduate-programmes/master-of-science-in-nursing/programme-structure/',
    statusNote: 'The official 2027 Programme page, School of Nursing programme pamphlet and 2025-intake Subject Offering Pattern publish the 31-credit completion paths, eight specialisms, and coded Core, Dissertation, Practicum, specialty and general elective subjects. They do not publish the AIE subject code or explicit per-course credits for the taught subjects. Those fields must not be inferred from another FHSS Programme or from the aggregate group totals.'
  }
};

function main() {
  const programmes = source.rows.filter((row) => !verifiedIds.has(row.programmeId)).map((row) => {
    const override = statusOverrides[row.programmeId] || {};
    return {
      programmeId: row.programmeId,
      status: 'blocked',
      sourceUrl: override.sourceUrl || row.sourceUrl,
      statusNote: override.statusNote || (row.error
        ? `The official Programme page could not be fetched during the 2026-07-11 verification: ${row.error}`
        : row.courseCodes && row.courseCodes.length
          ? 'The official Programme page contains only a partial coded course list or lacks explicit per-course credits; a departmental curriculum or handbook is still required.'
          : 'The official Programme page does not publish a complete coded course list; a departmental curriculum or handbook is still required.'),
      ...(override.verifiedAt ? { verifiedAt: override.verifiedAt } : {})
    };
  });
  const value = { schemaVersion: 1, schoolCode: 'POLYU', academicYear: '2027-28', verifiedAt: '2026-07-11', programmes };
  fs.writeFileSync(outputPath, `${JSON.stringify(value, null, 2)}\n`);
  console.log(JSON.stringify({ ok: true, programmes: programmes.length, output: path.relative(ROOT, outputPath) }));
}

if (require.main === module) main();
