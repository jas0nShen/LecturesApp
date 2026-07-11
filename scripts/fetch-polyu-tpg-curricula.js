const fs = require('node:fs');
const https = require('node:https');
const path = require('node:path');
const zlib = require('node:zlib');

const ROOT = path.join(__dirname, '..');
const catalogue = require('../data/tpg-programmes.json');
const outputPath = path.join(ROOT, 'data', 'tpg-source-snapshots', 'polyu-2027.json');

function decodeEntities(value = '') {
  return value
    .replace(/&nbsp;|&#160;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)));
}

function htmlToText(value = '') {
  return decodeEntities(value)
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>|<\/li>|<\/tr>|<\/h\d>/gi, '\n')
    .replace(/<\/td>/gi, '\t')
    .replace(/<[^>]+>/g, ' ')
    .replace(/[ \t]+/g, ' ')
    .replace(/ *\n */g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function extractField(html, machineName) {
  const marker = `field--field-prog-${machineName}`;
  const start = html.indexOf(marker);
  if (start < 0) return '';
  const itemStart = html.indexOf('<div class="field__item">', start);
  if (itemStart < 0) return '';
  const nextField = html.indexOf('<div class="field field--', itemStart + 1);
  return html.slice(itemStart, nextField < 0 ? html.length : nextField);
}

function fetchHtml(url) {
  return new Promise((resolve, reject) => {
    const request = https.get(url, {
      headers: { 'Accept-Encoding': 'gzip, deflate', 'User-Agent': 'Mozilla/5.0 lecturesApp curriculum verifier' }
    }, (response) => {
      if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
        response.resume();
        resolve(fetchHtml(new URL(response.headers.location, url).toString()));
        return;
      }
      if (response.statusCode !== 200) {
        response.resume();
        reject(new Error(`${response.statusCode} ${url}`));
        return;
      }
      const chunks = [];
      response.on('data', (chunk) => chunks.push(chunk));
      response.on('end', () => {
        const body = Buffer.concat(chunks);
        const encoding = response.headers['content-encoding'];
        try {
          resolve((encoding === 'gzip' ? zlib.gunzipSync(body) : encoding === 'deflate' ? zlib.inflateSync(body) : body).toString('utf8'));
        } catch (error) {
          reject(error);
        }
      });
    });
    request.setTimeout(30000, () => request.destroy(new Error(`Timeout ${url}`)));
    request.on('error', reject);
  });
}

function parseProgramme(programme, html) {
  const curriculumHtml = extractField(html, 'curriculum');
  const curriculumText = htmlToText(curriculumHtml);
  const creditText = htmlToText(extractField(html, 'credit-req'));
  const subjectArea = htmlToText(extractField(html, 'subj-area'));
  const courseCodes = [...new Set((curriculumText.match(/\b[A-Z]{2,8}\d[A-Z0-9]{2,6}\b/g) || []))];
  return {
    programmeId: programme.id,
    programmeCode: programme.programmeCode,
    catalogueName: programme.name,
    officialSubjectArea: subjectArea,
    sourceUrl: programme.sourceUrl,
    creditText,
    curriculumText,
    courseCodes
  };
}

async function main() {
  const programmes = catalogue.programmes.filter((item) => item.universityCode === 'POLYU' && item.sourceUrl);
  const rows = [];
  for (const [index, programme] of programmes.entries()) {
    try {
      const html = await fetchHtml(programme.sourceUrl);
      rows.push(parseProgramme(programme, html));
      process.stderr.write(`\rPolyU ${index + 1}/${programmes.length}`);
    } catch (error) {
      rows.push({ programmeId: programme.id, sourceUrl: programme.sourceUrl, error: error.message });
    }
  }
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, `${JSON.stringify({ schemaVersion: 1, academicYear: '2027-28', fetchedAt: new Date().toISOString(), rows }, null, 2)}\n`);
  process.stderr.write('\n');
  console.log(JSON.stringify({ ok: true, programmes: rows.length, errors: rows.filter((row) => row.error).length, withCourseCodes: rows.filter((row) => row.courseCodes && row.courseCodes.length).length, output: path.relative(ROOT, outputPath) }));
}

if (require.main === module) main().catch((error) => { console.error(error); process.exitCode = 1; });

module.exports = { extractField, fetchHtml, htmlToText, parseProgramme };
