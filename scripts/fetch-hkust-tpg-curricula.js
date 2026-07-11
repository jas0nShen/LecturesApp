const fs = require('node:fs');
const path = require('node:path');
const { fetchHtml, htmlToText } = require('./fetch-polyu-tpg-curricula');

const ROOT = path.join(__dirname, '..');
const catalogue = require('../data/tpg-programmes.json');
const outputPath = path.join(ROOT, 'data', 'tpg-source-snapshots', 'hkust-2026.json');
const baseUrl = 'https://prog-crs.hkust.edu.hk';

async function fetchWithRetry(url, attempts = 4) {
  let lastError;
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      return await fetchHtml(url);
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError;
}

function decodeEntities(value = '') {
  return value.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'");
}

function normalizeName(value = '') {
  return value.toLowerCase()
    .replace(/postgraduate diploma and /g, '')
    .replace(/master of science and master of engineering /g, '')
    .replace(/master of (science|arts|business administration|public management|public policy) /g, '')
    .replace(/programs?|in |\(.*?\)|hkust|executive|part-time|bi-weekly/g, '')
    .replace(/[^a-z0-9]/g, '');
}

function parseDirectoryLinks(html) {
  return [...html.matchAll(/<a href="([^"]+)" title="([^"]+)">/g)].map((match) => ({
    href: match[1],
    title: decodeEntities(match[2])
  }));
}

function parseCourseRefs(html) {
  return [...html.matchAll(/data-crse-idx="([^"]+)" data-acad-year="([^"]+)"\s+data-crse-code="([^"]+)" data-crse-prefix="([^"]+)" data-crse-log-num="([^"]+)"/g)].map((match) => ({
    idx: match[1], academicYear: match[2], code: match[3], prefix: match[4], number: match[5]
  }));
}

function parseCourseInfo(html, ref) {
  const text = htmlToText(html);
  const codePattern = new RegExp(`${ref.prefix}\\s*${ref.number.replace('-', '\\s*-\\s*')}`);
  const codeMatch = text.match(codePattern);
  if (!codeMatch) return { code: `${ref.prefix} ${ref.number}`, error: 'Official course detail could not be parsed' };
  const remainder = text.slice(codeMatch.index + codeMatch[0].length);
  const match = remainder.match(/^\s*\*?\s*(.+?)\s+(\d+(?:\.\d+)?(?:-\d+(?:\.\d+)?)?)\s+(Credit\(s\)|ECTS)(?:\s|$)/i);
  if (!match) return { code: `${ref.prefix} ${ref.number}`, error: 'Official course detail could not be parsed' };
  const creditParts = match[2].split('-').map(Number);
  const course = { code: `${ref.prefix} ${ref.number}`, name: match[1].trim(), creditUnit: /^ECTS$/i.test(match[3]) ? 'ECTS' : 'credits', description: remainder.slice(match[0].length).replace(/^\s*Description\s*/, '').trim() };
  if (creditParts.length === 1) course.credits = creditParts[0];
  else {
    course.creditsMin = creditParts[0];
    course.creditsMax = creditParts[1];
  }
  return course;
}

async function mapConcurrent(items, limit, mapper) {
  const results = new Array(items.length);
  let cursor = 0;
  async function worker() {
    while (cursor < items.length) {
      const index = cursor++;
      results[index] = await mapper(items[index], index);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}

function matchProgramme(programme, links) {
  const overrides = {
    'HKUST-TPG-001': null,
    'HKUST-TPG-003': 'HKUST Executive Master of Business Administration (HKUST EMBA)',
    'HKUST-TPG-005': 'Kellogg-HKUST Executive Master of Business Administration (KH EMBA)',
    'HKUST-TPG-012': 'Global Finance (joint program with NYU Stern)',
    'HKUST-TPG-013': 'Master of Business Administration (MBA)',
    'HKUST-TPG-015': 'Public Management',
    'HKUST-TPG-017': 'Public Policy',
    'HKUST-TPG-033': 'Biotechnology',
    'HKUST-TPG-046': 'Part-time MBA (Bi-weekly)',
    'HKUST-TPG-049': 'Entrepreneurial Leadership in Biotechnology'
  };
  if (Object.hasOwn(overrides, programme.id)) {
    return overrides[programme.id] ? links.find((item) => item.title === overrides[programme.id]) || null : null;
  }
  const normalized = normalizeName(programme.name);
  const matches = links.filter((item) => normalizeName(item.title) === normalized);
  return matches.length === 1 ? matches[0] : null;
}

async function fetchDirectoryLinks() {
  const index = await fetchWithRetry(`${baseUrl}/pgprog/2026-27/`);
  const token = (index.match(/name=token_post[^>]+value="([^"]+)"/) || [])[1];
  if (!token) throw new Error('HKUST directory token not found');
  const query = new URLSearchParams({ token_post: token, is_s: 'Y', keyword: '', year: '2026-27' });
  ['SSCI', 'SENG', 'SBM', 'SHSS', 'IPO'].forEach((value) => query.append('school[]', value));
  ['MSC', 'MA', 'MBA', 'MENG', 'MPM', 'MPP', 'PGD'].forEach((value) => query.append('degree[]', value));
  return parseDirectoryLinks(await fetchWithRetry(`${baseUrl}/pgprog/print_result.php?${query}`));
}

async function main() {
  const links = await fetchDirectoryLinks();
  const programmes = catalogue.programmes.filter((item) => item.universityCode === 'HKUST');
  const rows = [];
  for (const [index, programme] of programmes.entries()) {
    const link = matchProgramme(programme, links);
    if (!link) {
      rows.push({ programmeId: programme.id, catalogueName: programme.name, error: 'No unique current 2026/27 official directory match' });
      continue;
    }
    const sourceUrl = new URL(link.href, baseUrl).toString();
    try {
      const html = await fetchWithRetry(sourceUrl);
      const text = htmlToText(html);
      const start = text.indexOf('GENERAL INFORMATION');
      const end = text.indexOf('ADMISSION REQUIREMENTS', start);
      rows.push({ programmeId: programme.id, catalogueName: programme.name, officialName: link.title, sourceUrl, curriculumText: text.slice(Math.max(0, start), end > start ? end : undefined).trim(), courseRefs: parseCourseRefs(html) });
      process.stderr.write(`\rHKUST ${index + 1}/${programmes.length}`);
    } catch (error) {
      rows.push({ programmeId: programme.id, catalogueName: programme.name, officialName: link.title, sourceUrl, error: error.message });
    }
  }
  const uniqueRefs = [...new Map(rows.flatMap((row) => row.courseRefs || []).map((ref) => [ref.code, ref])).values()];
  const courseRows = await mapConcurrent(uniqueRefs, 8, async (ref, index) => {
    const query = new URLSearchParams({ crse_prefix: ref.prefix, crse_log_num: ref.number, crse_code: ref.code, acad_year: ref.academicYear, idx: ref.idx });
    try {
      const course = parseCourseInfo(await fetchWithRetry(`${baseUrl}/program/ajax/courseInfo.php?${query}`), ref);
      process.stderr.write(`\rHKUST courses ${index + 1}/${uniqueRefs.length}`);
      return course;
    } catch (error) {
      return { code: `${ref.prefix} ${ref.number}`, error: error.message };
    }
  });
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, `${JSON.stringify({ schemaVersion: 1, academicYear: '2026-27', fetchedAt: new Date().toISOString(), directorySourceUrl: `${baseUrl}/pgprog/2026-27/`, rows, courses: courseRows }, null, 2)}\n`);
  process.stderr.write('\n');
  console.log(JSON.stringify({ ok: true, directoryLinks: links.length, programmes: rows.length, errors: rows.filter((row) => row.error).length, courses: courseRows.length, courseErrors: courseRows.filter((row) => row.error).length, output: path.relative(ROOT, outputPath) }));
}

if (require.main === module) main().catch((error) => { console.error(error); process.exitCode = 1; });
module.exports = { matchProgramme, normalizeName, parseCourseInfo, parseCourseRefs, parseDirectoryLinks };
