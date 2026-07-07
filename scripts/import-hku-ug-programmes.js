const fs = require('node:fs');
const path = require('node:path');

const SOURCE_URL = 'https://admissions.hku.hk/programmes/undergraduate-programmes';

function decodeHtml(value) {
  return String(value || '')
    .replace(/&amp;/g, '&')
    .replace(/&nbsp;/g, ' ')
    .replace(/&hellip;/g, '…')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)));
}

function textContent(value) {
  return decodeHtml(String(value || '').replace(/<br\s*\/?>/gi, ' ').replace(/<[^>]+>/g, ' '))
    .replace(/\s+/g, ' ')
    .trim();
}

function absoluteUrl(href) {
  return href ? new URL(decodeHtml(href), SOURCE_URL).toString() : SOURCE_URL;
}

function matchContent(block, className) {
  const pattern = new RegExp(`<div[^>]*class="[^"]*\\b${className}\\b[^"]*"[^>]*>([\\s\\S]*?)<\\/div>`, 'i');
  const match = block.match(pattern);
  return match ? textContent(match[1]) : '';
}

function matchInfo(block, label, className) {
  const pattern = new RegExp(
    `<div[^>]*class="[^"]*\\bcontent-title\\b[^"]*"[^>]*>\\s*${label}\\s*<\\/div>\\s*<div[^>]*class="[^"]*\\bcontent\\b[^"]*\\b${className}\\b[^"]*"[^>]*>([\\s\\S]*?)<\\/div>`,
    'i'
  );
  const match = block.match(pattern);
  return match ? textContent(match[1]) : '';
}

function parseLastPage(html) {
  const pageNumbers = [...html.matchAll(/[?&]page=(\d+)/gi)].map((match) => Number(match[1]));
  return pageNumbers.length ? Math.max(...pageNumbers) : 0;
}

function parseProgrammeCards(html) {
  const blocks = String(html || '')
    .split(/<div[^>]*class="[^"]*\bprogram-list-item\b[^"]*"[^>]*>/i)
    .slice(1)
    .map((block) => block.split(/<div[^>]*class="[^"]*\bviews-row\b[^"]*"[^>]*>/i)[0]);

  return blocks
    .map((block) => {
      const hrefMatch = block.match(/<a[^>]+href="([^"]+)"[^>]*>\s*EXPLORE MORE\s*<\/a>/i);
      const title = matchContent(block, 'program-title');
      const code = matchInfo(block, 'CODE', 'code');
      const faculty = matchInfo(block, 'FACULTY', 'faculty') || matchContent(block, 'faculty');
      const studyPeriod = matchInfo(block, 'STUDY PERIOD', 'study-period');
      const type = matchInfo(block, 'TYPE', 'curriculum');
      const summaryMatch = block.match(/<div[^>]*class="[^"]*\bprogram-summary\b[^"]*"[^>]*>([\s\S]*?)<\/div>/i);
      const summary = summaryMatch ? textContent(summaryMatch[1]) : '';

      return {
        code,
        title,
        faculty,
        studyPeriod,
        type,
        summary,
        officialUrl: absoluteUrl(hrefMatch && hrefMatch[1])
      };
    })
    .filter((programme) => programme.title);
}

function dedupeProgrammes(programmes) {
  const seen = new Set();
  return programmes.filter((programme) => {
    const key = `${programme.code || programme.officialUrl}::${programme.title}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

async function fetchProgrammePages(fetchImpl = fetch) {
  const firstResponse = await fetchImpl(SOURCE_URL);
  if (!firstResponse.ok) throw new Error(`HKU source returned HTTP ${firstResponse.status}`);
  const firstHtml = await firstResponse.text();
  const lastPage = parseLastPage(firstHtml);
  const htmlPages = [firstHtml];

  for (let page = 1; page <= lastPage; page += 1) {
    const response = await fetchImpl(`${SOURCE_URL}?page=${page}`);
    if (!response.ok) throw new Error(`HKU source page ${page} returned HTTP ${response.status}`);
    htmlPages.push(await response.text());
  }

  return htmlPages;
}

function buildSnapshot(htmlPages, retrievedAt = new Date().toISOString()) {
  const programmes = dedupeProgrammes(htmlPages.flatMap(parseProgrammeCards)).sort((a, b) => {
    if (a.faculty !== b.faculty) return a.faculty.localeCompare(b.faculty);
    if (a.code !== b.code) return String(a.code || '').localeCompare(String(b.code || ''));
    return a.title.localeCompare(b.title);
  });

  return {
    universityCode: 'HKU',
    level: 'undergraduate',
    sourceUrl: SOURCE_URL,
    retrievedAt,
    programmes
  };
}

async function main() {
  const outIndex = process.argv.indexOf('--out');
  const outputPath =
    outIndex === -1
      ? path.join(__dirname, '..', 'data', 'hku-ug-programmes.json')
      : path.resolve(process.argv[outIndex + 1] || '');
  if (!outputPath) throw new Error('--out requires a JSON output path');

  const htmlPages = await fetchProgrammePages();
  const snapshot = buildSnapshot(htmlPages);
  if (snapshot.programmes.length < 100) {
    throw new Error(`Expected at least 100 HKU undergraduate programmes, received ${snapshot.programmes.length}`);
  }

  fs.writeFileSync(outputPath, `${JSON.stringify(snapshot, null, 2)}\n`);
  console.log(`Imported ${snapshot.programmes.length} HKU undergraduate programmes`);
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}

module.exports = {
  SOURCE_URL,
  buildSnapshot,
  parseLastPage,
  parseProgrammeCards
};
