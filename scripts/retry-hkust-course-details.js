const fs = require('node:fs');
const path = require('node:path');
const { fetchHtml } = require('./fetch-polyu-tpg-curricula');
const { parseCourseInfo } = require('./fetch-hkust-tpg-curricula');

const sourcePath = path.join(__dirname, '..', 'data', 'tpg-source-snapshots', 'hkust-2026.json');
const baseUrl = 'https://prog-crs.hkust.edu.hk';

async function fetchWithRetry(url, attempts = 5) {
  let lastError;
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try { return await fetchHtml(url); } catch (error) { lastError = error; }
  }
  throw lastError;
}

async function main() {
  const source = JSON.parse(fs.readFileSync(sourcePath, 'utf8'));
  const refs = new Map(source.rows.flatMap((row) => row.courseRefs || []).map((ref) => [`${ref.prefix} ${ref.number}`, ref]));
  let repaired = 0;
  for (const [index, course] of source.courses.entries()) {
    if (!course.error) continue;
    const ref = refs.get(course.code);
    if (!ref) continue;
    const query = new URLSearchParams({ crse_prefix: ref.prefix, crse_log_num: ref.number, crse_code: ref.code, acad_year: ref.academicYear, idx: ref.idx });
    try {
      const next = parseCourseInfo(await fetchWithRetry(`${baseUrl}/program/ajax/courseInfo.php?${query}`), ref);
      if (!next.error) { source.courses[index] = next; repaired += 1; }
    } catch (error) {}
  }
  if (repaired) {
    source.fetchedAt = new Date().toISOString();
    fs.writeFileSync(sourcePath, `${JSON.stringify(source, null, 2)}\n`);
  }
  console.log(JSON.stringify({ ok: true, repaired, remaining: source.courses.filter((course) => course.error).length }));
}

if (require.main === module) main().catch((error) => { console.error(error); process.exitCode = 1; });
