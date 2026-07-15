const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const snapshotPath = path.join(ROOT, 'data', 'tpg-source-snapshots', 'polyu-2027.json');
const outputPath = path.join(ROOT, 'data', 'tpg-course-supplements', 'polyu-advanced-rehabilitation-sciences-2027.json');
const PROGRAMME_ID = 'POLYU-TPG-073';
const SPECIALISM_ID = 'POLYU-TPG-073-DD';
const SOURCE_URL = 'https://www.polyu.edu.hk/study/pg/tpg/2027/51069-rsf-rsp-ddf-ddp';

const commonSubjects = [
  ['RS517', 'Research Methods and Data Analysis', 3],
  ['RS5224', 'Research Seminar in Rehabilitation Sciences', 3],
  ['HTI5T04', 'Academic Integrity and Ethics (Health and Social Sciences)', 1]
];

const projectSubjects = [
  ['RS567', 'Project Study', 6]
];

const specialismSubjects = [
  ['RS594', 'Recent Advances in Rehabilitation for People with Developmental Disabilities', 3],
  ['RS593', 'Sensory and Motor Intervention for People with Developmental Disabilities', 3],
  ['RS537', 'Psychosocial Rehabilitation for People with Developmental Disabilities', 3]
];

function buildSupplement() {
  const snapshot = JSON.parse(fs.readFileSync(snapshotPath, 'utf8'));
  const row = snapshot.rows.find((item) => item.programmeId === PROGRAMME_ID);
  assert(row, `Missing official snapshot row ${PROGRAMME_ID}`);
  assert.equal(row.sourceUrl, SOURCE_URL);
  assert.equal(row.creditText, '31');
  assert.match(row.curriculumText, /required to complete 31 credits/);
  assert.match(row.curriculumText, /six from all postgraduate subjects listed in the Department of Rehabilitation Sciences/);
  assert.match(row.curriculumText, /three from all postgraduate subjects listed in the Department of Rehabilitation Sciences/);

  const officialCourseRows = [...commonSubjects, ...projectSubjects, ...specialismSubjects];
  assert.equal(new Set(officialCourseRows.map(([code]) => code)).size, 7);
  officialCourseRows.forEach(([code, name]) => {
    assert(row.curriculumText.includes(code), `Official snapshot is missing ${code}`);
    assert(row.curriculumText.includes(name), `Official snapshot is missing ${code} ${name}`);
  });

  const course = ([code, name, credits], options = {}) => ({
    code,
    name,
    credits,
    appliesToTrackIds: [],
    sourceUrl: SOURCE_URL,
    ...options
  });

  return {
    schemaVersion: 1,
    schoolCode: 'POLYU',
    academicYear: '2027-28',
    verifiedAt: '2026-07-15',
    programmes: [{
      programmeId: PROGRAMME_ID,
      status: 'verified',
      creditsRequired: 31,
      creditUnit: 'credits',
      sourceUrl: SOURCE_URL,
      ruleReviewStatus: 'manual_review_required',
      statusNote: 'The official 31-credit structure publishes the fixed Common, Project and Developmental Disabilities Specialism subjects with codes and credits. Generic students choose six electives, while Specialism students choose three, from the Department of Rehabilitation Sciences postgraduate subject list available at registration. Because the official Programme page does not publish a fixed coded elective list, the elective pool remains empty and requires manual audit review; no elective is invented.',
      trackSelectionOptional: true,
      tracks: [{
        id: SPECIALISM_ID,
        code: 'DD',
        name: 'Rehabilitation of People with Developmental Disabilities',
        type: 'Specialism',
        creditsRequired: 31,
        sourceUrl: SOURCE_URL
      }],
      courseGroups: [
        {
          id: 'compulsory-subjects',
          name: 'Compulsory Subjects',
          type: 'core',
          creditsRequired: 7,
          coursesRequired: 3,
          ruleText: 'Complete all three Compulsory Subjects for 7 credits.',
          appliesToTrackIds: [],
          sourceUrl: SOURCE_URL,
          courses: commonSubjects.map((row) => course(row))
        },
        {
          id: 'project-study',
          name: 'Project Study',
          type: 'project',
          creditsRequired: 6,
          coursesRequired: 1,
          ruleText: 'Complete RS567 Project Study for 6 credits.',
          appliesToTrackIds: [],
          sourceUrl: SOURCE_URL,
          courses: projectSubjects.map((row) => course(row, { courseKind: 'project' }))
        },
        {
          id: 'developmental-disabilities-core',
          name: 'Core Subjects for the Developmental Disabilities Specialism',
          type: 'track_core',
          creditsRequired: 9,
          coursesRequired: 3,
          ruleText: 'Students in the Developmental Disabilities Specialism complete all three Core Subjects for 9 credits.',
          appliesToTrackIds: [SPECIALISM_ID],
          sourceUrl: SOURCE_URL,
          courses: specialismSubjects.map((row) => course(row, { appliesToTrackIds: [SPECIALISM_ID] }))
        },
        {
          id: 'department-electives',
          name: 'Department of Rehabilitation Sciences Elective Subjects',
          type: 'elective',
          creditsRequired: 18,
          coursesRequired: 6,
          creditsRequiredByTrackIds: { [SPECIALISM_ID]: 9 },
          coursesRequiredByTrackIds: { [SPECIALISM_ID]: 3 },
          ruleText: 'Generic students choose six eligible Department postgraduate subjects for 18 credits. Developmental Disabilities Specialism students choose three for 9 credits. The official page does not publish a fixed coded elective list; confirm the list and prerequisites at registration.',
          appliesToTrackIds: [],
          sourceUrl: SOURCE_URL,
          courses: []
        }
      ]
    }]
  };
}

function main() {
  const supplement = buildSupplement();
  fs.writeFileSync(outputPath, `${JSON.stringify(supplement, null, 2)}\n`);
  console.log(JSON.stringify({
    ok: true,
    output: path.relative(ROOT, outputPath),
    programmes: supplement.programmes.length,
    courses: supplement.programmes[0].courseGroups.reduce((count, group) => count + group.courses.length, 0)
  }));
}

if (require.main === module) main();

module.exports = { SPECIALISM_ID, buildSupplement };
