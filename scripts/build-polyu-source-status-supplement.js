const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const source = require('../data/tpg-source-snapshots/polyu-2027.json');
const outputPath = path.join(ROOT, 'data', 'tpg-course-supplements', 'polyu-source-status-2027.json');
const verifiedIds = new Set(['POLYU-TPG-090', 'POLYU-TPG-092', 'POLYU-TPG-093', 'POLYU-TPG-105']);

function main() {
  const programmes = source.rows.filter((row) => !verifiedIds.has(row.programmeId)).map((row) => ({
    programmeId: row.programmeId,
    status: 'blocked',
    sourceUrl: row.sourceUrl,
    statusNote: row.error
      ? `The official Programme page could not be fetched during the 2026-07-11 verification: ${row.error}`
      : row.courseCodes && row.courseCodes.length
        ? 'The official Programme page contains only a partial coded course list or lacks explicit per-course credits; a departmental curriculum or handbook is still required.'
        : 'The official Programme page does not publish a complete coded course list; a departmental curriculum or handbook is still required.'
  }));
  const value = { schemaVersion: 1, schoolCode: 'POLYU', academicYear: '2027-28', verifiedAt: '2026-07-11', programmes };
  fs.writeFileSync(outputPath, `${JSON.stringify(value, null, 2)}\n`);
  console.log(JSON.stringify({ ok: true, programmes: programmes.length, output: path.relative(ROOT, outputPath) }));
}

if (require.main === module) main();
