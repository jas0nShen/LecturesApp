const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const snapshotPath = path.join(ROOT, 'data', 'tpg-source-snapshots', 'polyu-2027.json');
const outputPath = path.join(ROOT, 'data', 'tpg-course-supplements', 'polyu-advanced-occupational-therapy-2027.json');
const PROGRAMME_ID = 'POLYU-TPG-072';
const PROGRAMME_NAME = 'Advanced Occupational Therapy';
const SOURCE_URL = 'https://www.polyu.edu.hk/study/pg/tpg/2027/51069-otf-otp-onf-onp-mhf-mhp-msf-msp';
const TRACKS = {
  NEUROLOGY: 'POLYU-TPG-072-NEUROLOGY',
  MENTAL_HEALTH: 'POLYU-TPG-072-MENTAL-HEALTH',
  MUSCULOSKELETAL: 'POLYU-TPG-072-MUSCULOSKELETAL'
};

const commonSubjects = [
  ['RS517', 'Research Methods and Data Analysis', 3],
  ['RS5200', 'Advanced Occupational Therapy Study', 3],
  ['HTI5T04', 'Academic Integrity and Ethics (Health and Social Sciences)', 1]
];

const projectSubjects = [
  ['RS567', 'Project Study', 6]
];

const specialismSubjects = [
  ['RS5201', 'Current Development in Neurological Rehabilitation', 3, [TRACKS.NEUROLOGY]],
  ['RS5202', 'OT Management for Upper Extremity Participation in Neurological Conditions', 3, [TRACKS.NEUROLOGY]],
  ['RS510', 'Neuro-psychological Rehabilitation', 3, [TRACKS.NEUROLOGY]],
  ['RS5228', 'Principles and Concepts in the Diagnostic Procedures of Mental Disorders', 3, [TRACKS.MENTAL_HEALTH]],
  ['RS607', 'Brain and Behaviour', 3, [TRACKS.MENTAL_HEALTH]],
  ['RS5216', 'Musculoskeletal Injury and Repair', 3, [TRACKS.MUSCULOSKELETAL]],
  ['RS5212', 'Advanced OT Practice in Hand Rehabilitation', 3, [TRACKS.MUSCULOSKELETAL]],
  ['RS520', 'Vocational Rehabilitation', 3, [TRACKS.MENTAL_HEALTH, TRACKS.MUSCULOSKELETAL]]
];

function buildSupplement() {
  const snapshot = JSON.parse(fs.readFileSync(snapshotPath, 'utf8'));
  const row = snapshot.rows.find((item) => item.programmeId === PROGRAMME_ID);
  assert(row, `Missing official snapshot row ${PROGRAMME_ID}`);
  assert.equal(row.sourceUrl, SOURCE_URL);
  assert.equal(row.officialSubjectArea, PROGRAMME_NAME);
  assert.equal(row.creditText, '31');
  assert.match(row.curriculumText, /required to complete 31 credits/);
  assert.match(row.curriculumText, /six\s+from all postgraduate subjects listed in the Department of Rehabilitation Sciences/);
  assert.match(row.curriculumText, /three\s+from all postgraduate subjects listed in the Department of Rehabilitation Sciences/);

  const officialCourseRows = [...commonSubjects, ...projectSubjects, ...specialismSubjects];
  assert.equal(new Set(officialCourseRows.map(([code]) => code)).size, 12);
  officialCourseRows.forEach(([code, name]) => {
    assert(row.curriculumText.includes(code), `Official snapshot is missing ${code}`);
    assert(row.curriculumText.includes(name), `Official snapshot is missing ${code} ${name}`);
  });

  const allTrackIds = Object.values(TRACKS);
  const course = ([code, name, credits], options = {}) => ({
    code,
    name,
    credits,
    appliesToTrackIds: [],
    sourceUrl: SOURCE_URL,
    ...options
  });
  const trackRequirements = Object.fromEntries(allTrackIds.map((trackId) => [trackId, 9]));
  const trackCourseRequirements = Object.fromEntries(allTrackIds.map((trackId) => [trackId, 3]));

  return {
    schemaVersion: 1,
    schoolCode: 'POLYU',
    academicYear: '2027-28',
    verifiedAt: '2026-07-15',
    programmes: [{
      programmeId: PROGRAMME_ID,
      programmeName: PROGRAMME_NAME,
      status: 'verified',
      creditsRequired: 31,
      creditUnit: 'credits',
      sourceUrl: SOURCE_URL,
      ruleReviewStatus: 'manual_review_required',
      statusNote: 'The official 31-credit structure publishes the fixed Compulsory, Project and three Specialism Core paths with codes and credits. Generic students choose six electives, while Specialism students choose three, from the Department of Rehabilitation Sciences postgraduate subject list available at registration. The examples on the official page do not form a fixed elective list and do not publish per-course credits, so the elective pool remains empty and requires manual audit review; no elective credit is inferred.',
      trackSelectionOptional: true,
      tracks: [
        { id: TRACKS.NEUROLOGY, code: 'ON', name: 'Neurology', type: 'Specialism', creditsRequired: 31, sourceUrl: SOURCE_URL },
        { id: TRACKS.MENTAL_HEALTH, code: 'MH', name: 'Mental Health', type: 'Specialism', creditsRequired: 31, sourceUrl: SOURCE_URL },
        { id: TRACKS.MUSCULOSKELETAL, code: 'MS', name: 'Musculoskeletal', type: 'Specialism', creditsRequired: 31, sourceUrl: SOURCE_URL }
      ],
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
          id: 'specialism-core-subjects',
          name: 'Core Subjects for the Three Specialisms',
          type: 'track_core',
          creditsRequiredByTrackIds: trackRequirements,
          coursesRequiredByTrackIds: trackCourseRequirements,
          ruleText: 'Each Specialism requires its three listed Core Subjects for 9 credits. RS520 Vocational Rehabilitation is shared by the Mental Health and Musculoskeletal Specialisms.',
          appliesToTrackIds: allTrackIds,
          sourceUrl: SOURCE_URL,
          courses: specialismSubjects.map((row) => course(row, { appliesToTrackIds: row[3] }))
        },
        {
          id: 'department-electives',
          name: 'Department of Rehabilitation Sciences Elective Subjects',
          type: 'elective',
          creditsRequired: 18,
          coursesRequired: 6,
          creditsRequiredByTrackIds: trackRequirements,
          coursesRequiredByTrackIds: trackCourseRequirements,
          ruleText: 'Generic students choose six eligible Department postgraduate subjects for 18 credits. Students in any Specialism choose three for 9 credits. The official page gives examples but does not publish a fixed coded elective list with per-course credits; confirm the list and prerequisites at registration.',
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

module.exports = { TRACKS, buildSupplement };
