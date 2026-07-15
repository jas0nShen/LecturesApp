const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const snapshotPath = path.join(ROOT, 'data', 'tpg-source-snapshots', 'polyu-2027.json');
const outputPath = path.join(ROOT, 'data', 'tpg-course-supplements', 'polyu-biopharmaceutical-development-2027.json');
const STANDARD_ID = 'POLYU-TPG-014';
const GBA_ID = 'POLYU-TPG-015';
const STANDARD_URL = 'https://www.polyu.edu.hk/study/pg/tpg/2027/12062-mft-mpt';
const GBA_URL = 'https://www.polyu.edu.hk/study/pg/tpg/2027/12063';

const sharedCore = [
  ['ABCT5101', 'Modern Approaches in Biopharmaceutical Development', 3],
  ['ABCT5103', 'Intellectual Property Strategy for Biotech Entrepreneurship', 3],
  ['ABCT5104', 'Regulatory Science for Biotech Products', 3],
  ['ABCT5105', 'Ethics and Management in Life Sciences', 3],
  ['ABCT5106', 'Technology Platforms in Drug Discovery', 3],
  ['ABCT5107', 'Advanced Therapeutic Products', 3]
];
const financingEntrepreneurshipPool = [
  ['ABCT5108', 'Investment Financing and Risk Management in Biobusiness', 3],
  ['ABCT5109', 'Entrepreneurship- From Lab to Launch', 3]
];

function assertCourseRows(curriculumText, rows) {
  rows.forEach(([code, name]) => {
    assert(curriculumText.includes(code), `Official snapshot is missing ${code}`);
    assert(curriculumText.includes(name), `Official snapshot is missing ${code} ${name}`);
  });
}

function makeCourse(sourceUrl, [code, name, credits], options = {}) {
  return {
    code,
    name,
    credits,
    appliesToTrackIds: [],
    sourceUrl,
    ...options
  };
}

function buildStandardProgramme(row) {
  assert.equal(row.sourceUrl, STANDARD_URL);
  assert.equal(row.creditText, '31');
  assert.equal(row.officialSubjectArea, 'Biopharmaceutical Development and Commercialization');
  assert.match(row.curriculumText, /3 credits for each subject unless specified/);
  assert.match(row.curriculumText, /Choose one subject in each pool/);
  assert.match(row.curriculumText, /ABCT5110 Industrial Attachment \(6 credits\) OR[\s\S]*ABCT5113 Research Project \(6 credits\)/);

  const core = [
    sharedCore[0],
    ['ABCT5102', 'Pharmacology and Toxicology in Biotherapeutics', 3],
    ...sharedCore.slice(1)
  ];
  const completionPool = [
    ['ABCT5110', 'Industrial Attachment', 6, 'internship'],
    ['ABCT5113', 'Research Project', 6, 'research_project']
  ];
  assertCourseRows(row.curriculumText, [...core, ...financingEntrepreneurshipPool, ...completionPool]);

  return {
    programmeId: STANDARD_ID,
    status: 'verified',
    creditsRequired: 31,
    creditUnit: 'credits',
    sourceUrl: STANDARD_URL,
    ruleReviewStatus: 'manual_review_required',
    statusNote: 'The official 31-credit structure requires one subject from each of two mutually exclusive pools. The AIE course code is verified from the official GBA variant page for the same 2027-28 subject area. Pool completion must remain subject to manual audit review.',
    courseGroups: [
      {
        id: 'core-subjects',
        name: 'Core Subjects',
        type: 'core',
        creditsRequired: 21,
        coursesRequired: 7,
        ruleText: 'Complete all seven 3-credit Core Subjects.',
        appliesToTrackIds: [],
        sourceUrl: STANDARD_URL,
        courses: core.map((course) => makeCourse(STANDARD_URL, course))
      },
      {
        id: 'financing-or-entrepreneurship',
        name: 'Financing or Entrepreneurship Pool',
        type: 'elective',
        creditsRequired: 3,
        coursesRequired: 1,
        ruleText: 'Choose either ABCT5108 or ABCT5109.',
        appliesToTrackIds: [],
        sourceUrl: STANDARD_URL,
        courses: financingEntrepreneurshipPool.map((course) => makeCourse(STANDARD_URL, course, { conditionalRequirement: true }))
      },
      {
        id: 'attachment-or-research-project',
        name: 'Industrial Attachment or Research Project Pool',
        type: 'project',
        creditsRequired: 6,
        coursesRequired: 1,
        ruleText: 'Choose either ABCT5110 Industrial Attachment or ABCT5113 Research Project.',
        appliesToTrackIds: [],
        sourceUrl: STANDARD_URL,
        courses: completionPool.map((course) => makeCourse(STANDARD_URL, course, {
          courseKind: course[3],
          conditionalRequirement: true
        }))
      },
      {
        id: 'academic-integrity',
        name: 'Academic Integrity and Ethics',
        type: 'academic_integrity',
        creditsRequired: 1,
        coursesRequired: 1,
        ruleText: 'Complete ABCT5T01 Academic Integrity and Ethics in Science. The standard page names the subject without its code; the code and credit are published on the official GBA variant page.',
        appliesToTrackIds: [],
        sourceUrl: STANDARD_URL,
        courses: [makeCourse(GBA_URL, ['ABCT5T01', 'Academic Integrity and Ethics in Science', 1])]
      }
    ]
  };
}

function buildGbaProgramme(row) {
  assert.equal(row.sourceUrl, GBA_URL);
  assert.equal(row.creditText, '31');
  assert.equal(row.officialSubjectArea, 'Biopharmaceutical Development and Commercialization (internship in Greater Bay Area via PolyU-Zhongshan Technology and Innovation Research Institute)');
  assert.match(row.curriculumText, /PolyU Hong Kong campus \(22 credits\)/);
  assert.match(row.curriculumText, /PolyU-Zhongshan Technology and Innovation Research Institute.*\(9 credits\)/);

  const zhongshanSubjects = [
    ['ABCT5115P', 'Industrial Attachment (GBA)', 6, 'internship'],
    ['ABCT5102P', 'Pharmacology and Toxicology in Biotherapeutics', 3]
  ];
  assertCourseRows(row.curriculumText, [...sharedCore, ...financingEntrepreneurshipPool, ['ABCT5T01', 'Academic Integrity and Ethics in Science', 1], ...zhongshanSubjects]);

  return {
    programmeId: GBA_ID,
    status: 'verified',
    creditsRequired: 31,
    creditUnit: 'credits',
    sourceUrl: GBA_URL,
    ruleReviewStatus: 'manual_review_required',
    statusNote: 'The official page separates 22 credits completed at the PolyU Hong Kong campus from 9 credits completed at PolyU-ZSRI. ABCT5108 and ABCT5109 form a one-subject choice and must remain subject to manual audit review.',
    courseGroups: [
      {
        id: 'hong-kong-core-subjects',
        name: 'Hong Kong Campus Core Subjects',
        type: 'core',
        creditsRequired: 18,
        coursesRequired: 6,
        ruleText: 'Complete the six listed 3-credit Core Subjects at the PolyU Hong Kong campus.',
        appliesToTrackIds: [],
        sourceUrl: GBA_URL,
        courses: sharedCore.map((course) => makeCourse(GBA_URL, course))
      },
      {
        id: 'financing-or-entrepreneurship',
        name: 'Financing or Entrepreneurship Pool',
        type: 'elective',
        creditsRequired: 3,
        coursesRequired: 1,
        ruleText: 'Choose either ABCT5108 or ABCT5109 at the PolyU Hong Kong campus.',
        appliesToTrackIds: [],
        sourceUrl: GBA_URL,
        courses: financingEntrepreneurshipPool.map((course) => makeCourse(GBA_URL, course, { conditionalRequirement: true }))
      },
      {
        id: 'academic-integrity',
        name: 'Academic Integrity and Ethics',
        type: 'academic_integrity',
        creditsRequired: 1,
        coursesRequired: 1,
        ruleText: 'Complete ABCT5T01 Academic Integrity and Ethics in Science.',
        appliesToTrackIds: [],
        sourceUrl: GBA_URL,
        courses: [makeCourse(GBA_URL, ['ABCT5T01', 'Academic Integrity and Ethics in Science', 1])]
      },
      {
        id: 'polyu-zsri-subjects',
        name: 'PolyU-ZSRI Subjects',
        type: 'core',
        creditsRequired: 9,
        coursesRequired: 2,
        ruleText: 'Complete ABCT5115P and ABCT5102P at PolyU-ZSRI; the official page states that these subjects are taught in Putonghua.',
        appliesToTrackIds: [],
        sourceUrl: GBA_URL,
        courses: zhongshanSubjects.map((course) => makeCourse(GBA_URL, course, course[3] ? { courseKind: course[3] } : {}))
      }
    ]
  };
}

function buildSupplement() {
  const snapshot = JSON.parse(fs.readFileSync(snapshotPath, 'utf8'));
  const byId = new Map(snapshot.rows.map((row) => [row.programmeId, row]));
  const programmes = [
    buildStandardProgramme(byId.get(STANDARD_ID)),
    buildGbaProgramme(byId.get(GBA_ID))
  ];
  return {
    schemaVersion: 1,
    schoolCode: 'POLYU',
    academicYear: '2027-28',
    verifiedAt: '2026-07-15',
    programmes
  };
}

function main() {
  const supplement = buildSupplement();
  fs.writeFileSync(outputPath, `${JSON.stringify(supplement, null, 2)}\n`);
  console.log(JSON.stringify({
    ok: true,
    output: path.relative(ROOT, outputPath),
    programmes: supplement.programmes.length,
    courses: supplement.programmes.reduce((count, programme) => count + programme.courseGroups.reduce((sum, group) => sum + group.courses.length, 0), 0)
  }));
}

if (require.main === module) main();

module.exports = { buildSupplement };
