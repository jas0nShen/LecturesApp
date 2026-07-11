const fs = require('node:fs');
const path = require('node:path');
const { fetchHtml, htmlToText } = require('./fetch-polyu-tpg-curricula');

const ROOT = path.join(__dirname, '..');
const outputPath = path.join(ROOT, 'data', 'tpg-source-snapshots', 'polyu-comp-2027.json');
const pages = [
  ['POLYU-TPG-089', 'https://www.polyu.edu.hk/comp/study/taught-postgraduate-programme/mscit/curriculum/?sc_lang=en'],
  ['POLYU-TPG-090', 'https://www.polyu.edu.hk/comp/study/taught-postgraduate-programme/msc-bt/curriculum/'],
  ['POLYU-TPG-091', 'https://www.polyu.edu.hk/comp/study/taught-postgraduate-programme/mscmt/curriculum/?sc_lang=en'],
  ['POLYU-TPG-092', 'https://www.polyu.edu.hk/comp/study/taught-postgraduate-programme/msccys/curriculum/?sc_lang=en'],
  ['POLYU-TPG-093', 'https://www.polyu.edu.hk/comp/study/taught-postgraduate-programme/mscas/curriculum/?sc_lang=en']
];

async function main() {
  const rows = [];
  for (const [programmeId, sourceUrl] of pages) {
    try {
      const html = await fetchHtml(sourceUrl);
      const text = htmlToText(html);
      const start = text.indexOf('Award Requirements');
      const end = text.indexOf('Privacy Policy Statement', start);
      rows.push({ programmeId, sourceUrl, curriculumText: text.slice(Math.max(0, start), end > start ? end : undefined).trim() });
    } catch (error) {
      rows.push({ programmeId, sourceUrl, error: error.message });
    }
  }
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, `${JSON.stringify({ schemaVersion: 1, academicYear: '2027-28', fetchedAt: new Date().toISOString(), rows }, null, 2)}\n`);
  console.log(JSON.stringify({ ok: true, programmes: rows.length, errors: rows.filter((row) => row.error).length, output: path.relative(ROOT, outputPath) }));
}

if (require.main === module) main().catch((error) => { console.error(error); process.exitCode = 1; });
