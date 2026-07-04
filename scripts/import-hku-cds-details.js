const { execFile } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const { promisify } = require('node:util');

const execFileAsync = promisify(execFile);
const dataPath = path.join(__dirname, '..', 'data', 'hku-cds-offerings-2025.json');

function decodeHtml(value) {
  return value
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'");
}

function textContent(value) {
  return decodeHtml(value.replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, ' '))
    .replace(/[ \t]+/g, ' ')
    .replace(/\s*\n\s*/g, '\n')
    .trim();
}

function extractLabelValue(html, label) {
  const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pattern = new RegExp(`<td[^>]*>\\s*${escaped}\\s*<\\/td>\\s*<td[^>]*>([\\s\\S]*?)<\\/td>`, 'i');
  const match = html.match(pattern);
  return match ? textContent(match[1]) || 'None' : 'None';
}

function parseCourseDetail(html) {
  const creditMatch = html.match(/No\. of credit\(s\):<\/td>\s*<td[^>]*>([\s\S]*?)<\/td>/i);
  const descriptionMatch = html.match(/<u>Calendar Entry:<\/u>\s*<br\s*\/?>([\s\S]*?)<\/p>/i);

  return {
    credits: creditMatch ? Number(textContent(creditMatch[1])) : null,
    prerequisites: extractLabelValue(html, 'Pre-requisite(s):'),
    corequisites: extractLabelValue(html, 'Co-requisite(s):'),
    exclusions: extractLabelValue(html, 'Mutually exclusive with:'),
    description: descriptionMatch ? textContent(descriptionMatch[1]) : ''
  };
}

async function download(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.text();
  } catch (fetchError) {
    const { stdout } = await execFileAsync('curl', [
      '-L',
      '--fail',
      '--silent',
      '--show-error',
      url
    ], { maxBuffer: 2 * 1024 * 1024 });
    return stdout;
  }
}

async function runPool(items, concurrency, worker) {
  let cursor = 0;
  async function next() {
    while (cursor < items.length) {
      const index = cursor;
      cursor += 1;
      await worker(items[index], index);
    }
  }
  await Promise.all(Array.from({ length: concurrency }, () => next()));
}

async function main() {
  const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
  let completed = 0;

  await runPool(data.courses, 4, async (course) => {
    const html = await download(course.officialUrl);
    course.details = parseCourseDetail(html);
    completed += 1;
    if (completed % 10 === 0 || completed === data.courses.length) {
      console.log(`Imported details ${completed}/${data.courses.length}`);
    }
  });

  data.detailsRetrievedAt = new Date().toISOString();
  fs.writeFileSync(dataPath, `${JSON.stringify(data, null, 2)}\n`);
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}

module.exports = {
  parseCourseDetail
};
