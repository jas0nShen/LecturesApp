const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const OUTPUT = path.join(ROOT, 'data', 'tpg-course-supplements', 'hku-computer-science-streams-2026.json');
const COURSE_SOURCE = 'https://master.cds.hku.hk/msccs/msc-in-computer-science-discipline-courses/';

const programmes = [
  {
    programmeId: 'HKU-TPG-057',
    streamTag: 'cyber',
    streamName: 'Cyber Security',
    sourceUrl: 'https://master.cds.hku.hk/msccs/msc-in-computer-science-cyber-security-stream/'
  },
  {
    programmeId: 'HKU-TPG-058',
    streamTag: 'finance',
    streamName: 'Financial Computing',
    sourceUrl: 'https://master.cds.hku.hk/msccs/msc-in-computer-science-stream-financial-computing/'
  },
  {
    programmeId: 'HKU-TPG-059',
    streamTag: '',
    streamName: 'General',
    sourceUrl: 'https://master.cds.hku.hk/msccs/msc-in-computer-science-stream-general-stream/'
  },
  {
    programmeId: 'HKU-TPG-060',
    streamTag: 'multimedia',
    streamName: 'Multimedia Computing',
    sourceUrl: 'https://master.cds.hku.hk/msccs/msc-in-computer-science-multimedia-computing-stream/'
  }
];

function parseCourses(html) {
  const pattern = /\{ c: "([^"]+)", t: "([^"]+)", s: \[([^\]]*)\], cr: (\d+)/g;
  const courses = [];
  let match;
  while ((match = pattern.exec(html))) {
    courses.push({
      code: match[1],
      name: match[2],
      subjectGroups: [...match[3].matchAll(/"([^"]+)"/g)].map((item) => item[1]),
      credits: Number(match[4])
    });
  }
  assert.equal(courses.length, 55, 'HKU MSc(CompSc) official course page shape changed');
  assert.equal(new Set(courses.map((course) => course.code)).size, courses.length, 'HKU MSc(CompSc) course codes are not unique');
  assert.deepEqual(courses.filter((course) => course.subjectGroups.includes('capstone')).map((course) => course.code), ['COMP7705', 'COMP7706']);
  assert(courses.every((course) => course.credits === 6 || course.credits === 12), 'HKU MSc(CompSc) contains an unexpected credit value');
  return courses;
}

function buildProgramme(config, courses) {
  const disciplineCourses = courses.filter((course) => !course.subjectGroups.includes('capstone'));
  const capstoneCourses = courses.filter((course) => course.subjectGroups.includes('capstone'));
  const focusRule = config.streamTag
    ? `Complete 60 discipline-course credits, including at least 24 credits (four 6-credit courses) tagged for the ${config.streamName} Stream. Up to 12 credits may instead come from approved postgraduate courses offered by departments in the Faculty of Engineering or the School of Computing and Data Science; those external approvals require manual audit review.`
    : 'Complete 60 discipline-course credits from any official subject group. Up to 12 credits may instead come from approved postgraduate courses offered by departments in the Faculty of Engineering or the School of Computing and Data Science; those external approvals require manual audit review.';
  const capstoneRule = config.streamTag
    ? `Complete either COMP7705 Project or COMP7706 Computing technology practicum (12 credits), related to the ${config.streamName} Stream. The stream relationship and mutually exclusive choice require manual audit review.`
    : 'Complete either COMP7705 Project in any computer science area or COMP7706 Computing technology practicum (12 credits). The mutually exclusive choice requires manual audit review.';

  return {
    programmeId: config.programmeId,
    status: 'verified',
    creditsRequired: 72,
    creditUnit: 'credits',
    sourceUrl: config.sourceUrl,
    ruleReviewStatus: 'manual_review_required',
    courseGroups: [
      {
        id: 'discipline-courses',
        name: 'Discipline Courses',
        type: 'discipline',
        creditsRequired: 60,
        coursesRequired: 10,
        ruleText: focusRule,
        appliesToTrackIds: [],
        sourceUrl: COURSE_SOURCE,
        courses: disciplineCourses.map((course) => ({
          code: course.code,
          name: course.name,
          credits: course.credits,
          subjectGroups: course.subjectGroups,
          ...(config.streamTag ? { streamSpecific: course.subjectGroups.includes(config.streamTag) } : {}),
          appliesToTrackIds: []
        }))
      },
      {
        id: 'capstone-experience',
        name: 'Capstone Experience',
        type: 'project_or_practicum',
        creditsRequired: 12,
        coursesRequired: 1,
        ruleText: capstoneRule,
        appliesToTrackIds: [],
        sourceUrl: COURSE_SOURCE,
        courses: capstoneCourses.map((course) => ({
          code: course.code,
          name: course.name,
          credits: course.credits,
          courseKind: course.code === 'COMP7705' ? 'project' : 'practicum',
          subjectGroups: course.subjectGroups,
          appliesToTrackIds: []
        }))
      }
    ]
  };
}

async function readHtml() {
  const inputArg = process.argv.find((arg) => arg.startsWith('--input='));
  if (inputArg) return fs.readFileSync(inputArg.slice('--input='.length), 'utf8');
  const response = await fetch(COURSE_SOURCE, { headers: { 'user-agent': 'lecturesApp TPG curriculum verifier' } });
  assert.equal(response.ok, true, `Failed to fetch ${COURSE_SOURCE}: ${response.status}`);
  return response.text();
}

async function main() {
  const courses = parseCourses(await readHtml());
  const supplement = {
    schemaVersion: 1,
    schoolCode: 'HKU',
    academicYear: '2025-26',
    verifiedAt: '2026-07-14',
    programmes: programmes.map((programme) => buildProgramme(programme, courses))
  };
  fs.writeFileSync(OUTPUT, `${JSON.stringify(supplement, null, 2)}\n`);
  console.log(JSON.stringify({ ok: true, output: path.relative(ROOT, OUTPUT), programmes: supplement.programmes.length, coursesPerProgramme: courses.length }));
}

if (require.main === module) main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

module.exports = { buildProgramme, parseCourses };
