const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const OUTPUT = path.join(ROOT, 'data', 'tpg-course-supplements', 'hku-community-dentistry-source-status-2026.json');
const PROGRAMME_SOURCE = 'https://facdent.hku.hk/learning/tpg/tpg-msc-community.php';

function buildSupplement() {
  return {
    schemaVersion: 1,
    schoolCode: 'HKU',
    academicYear: '2017-18 and thereafter',
    verifiedAt: '2026-07-16',
    programmes: [{
      programmeId: 'HKU-TPG-028',
      status: 'blocked',
      creditsRequired: 69,
      creditUnit: 'credits',
      sourceUrl: PROGRAMME_SOURCE,
      statusNote: 'The current HKU Faculty of Dentistry Programme page for 2026 admissions links the official Syllabuses applying to candidates admitted in 2017-18 and thereafter and confirms a 69-credit curriculum: 9 Faculty Core, 15 General Public Health, 24 Community Dentistry, 12 Practicum and 9 Capstone credits. The 15-credit General Public Health component requires five 3-credit courses assigned by the Programme Director from an annually changing School of Public Health offering, but the official source publishes no course codes or complete course titles for that required component. The current R351 admissions Regulations and Syllabuses endpoint also states that the document is not available. The Programme remains blocked rather than exposing only the other 54 credits as an incomplete curriculum or inventing the five Public Health courses.'
    }]
  };
}

function main() {
  const supplement = buildSupplement();
  fs.writeFileSync(OUTPUT, `${JSON.stringify(supplement, null, 2)}\n`);
  console.log(JSON.stringify({
    ok: true,
    output: path.relative(ROOT, OUTPUT),
    programmes: 1,
    blocked: 1
  }));
}

if (require.main === module) main();
module.exports = { buildSupplement };
