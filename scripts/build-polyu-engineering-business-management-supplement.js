const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const SNAPSHOT_PATH = path.join(ROOT, 'data', 'tpg-source-snapshots', 'polyu-2027.json');
const OUTPUT_PATH = path.join(ROOT, 'data', 'tpg-course-supplements', 'polyu-engineering-business-management-2027.json');
const VERIFIED_AT = '2026-07-16';
const PROGRAMME_ID = 'POLYU-TPG-052';
const PROGRAMME_URL = 'https://www.polyu.edu.hk/study/pg/tpg/2027/45080-efm-efd-eqm-eqp';
const IGDS_URL = 'https://www.polyu.edu.hk/igds/programme-mscebm.html';

const rows = [
  ['ISE5756', 'Big Data and Analytics for Industry', 3, 'ISE5756_BDA.pdf'],
  ['ISE5773', 'Interdisciplinary Research Methods', 3, 'ISE5773_IRM.pdf'],
  ['ISE5757', 'Logistics and Operations Management', 3, 'ISE5757_LOM.pdf'],
  ['ISE5758', 'Managing Design and Manufacturing Technology', 3, 'ISE5758_MDMT.pdf'],
  ['ISE5759', 'Project Planning Management and Control', 3, 'ISE5759_PPMC.pdf'],
  ['ISE5760', 'Quality, Reliability and Maintenance', 3, 'ISE5760_QRM.pdf'],
  ['ISE5761', 'Strategy and Finance for Engineering Organisations', 3, 'ISE5761_SFEO.pdf'],
  ['ISE5767', 'Leading Change', 3, 'ISE5767_LC.pdf'],
  ['ISE5768', 'Organisations, People and Performance', 3, 'ISE5768_OPP.pdf'],
  ['ISE5771', 'IGDS Dissertation', 12, 'ISE5771_Dissertation.pdf']
];

function course(code, options = {}) {
  const row = rows.find((item) => item[0] === code);
  assert(row, `Missing EBM course ${code}`);
  return {
    code: row[0],
    name: row[1],
    credits: row[2],
    appliesToTrackIds: [],
    sourceUrl: `https://www.polyu.edu.hk/igds/pdf_file/${row[3]}`,
    ...options
  };
}

function group(id, name, type, codes, options = {}) {
  return {
    id,
    name,
    type,
    ...(options.creditsRequired !== undefined ? { creditsRequired: options.creditsRequired } : {}),
    ...(options.coursesRequired !== undefined ? { coursesRequired: options.coursesRequired } : {}),
    ruleText: options.ruleText,
    appliesToTrackIds: [],
    sourceUrl: IGDS_URL,
    courses: codes.map((code) => course(code, (options.courseOptions || {})[code]))
  };
}

function buildSupplement() {
  const snapshot = JSON.parse(fs.readFileSync(SNAPSHOT_PATH, 'utf8'));
  const row = snapshot.rows.find((item) => item.programmeId === PROGRAMME_ID);
  assert(row, `Missing official snapshot row ${PROGRAMME_ID}`);
  assert.equal(row.sourceUrl, PROGRAMME_URL);
  assert.match(row.curriculumText, /7 Core Modules/);
  assert.match(row.curriculumText, /at least\s+1[^\n]*Elective Module/);
  assert.match(row.curriculumText, /Project \(Dissertation\)/);
  assert.match(row.curriculumText, /EEE5T03/);

  const programme = {
    programmeId: PROGRAMME_ID,
    programmeName: 'Engineering Business Management',
    faculty: 'Department of Industrial and Systems Engineering (ISE)',
    status: 'verified',
    creditsRequired: 37,
    creditUnit: 'credits',
    sourceUrl: PROGRAMME_URL,
    ruleReviewStatus: 'manual_review_required',
    statusNote: 'The official 2027 Programme page corrects the corrupted directory label to Engineering Business Management and publishes the MSc rule of seven Core Modules, at least one Elective Module, a Project (Dissertation), and EEE5T03. The current official Integrated Graduate Development Scheme page publishes exact ISE codes, and each linked Module Outline publishes both the PolyU credit value and the corresponding Warwick credit value. The MSc therefore requires 21 PolyU Core credits, 3 Elective credits, the 12-credit ISE5771 IGDS Dissertation and the 1-credit EEE5T03 subject, for 37 PolyU credits. The PgD alternatives and Warwick credit values are not modelled as MSc completion paths and require manual review.',
    courseGroups: [
      group('core-modules', 'Core Modules', 'core', ['ISE5756', 'ISE5773', 'ISE5757', 'ISE5758', 'ISE5759', 'ISE5760', 'ISE5761'], {
        creditsRequired: 21,
        coursesRequired: 7,
        ruleText: 'Complete all seven Core Modules for 21 PolyU credits.'
      }),
      group('elective-modules', 'Elective Modules', 'elective', ['ISE5767', 'ISE5768'], {
        creditsRequired: 3,
        coursesRequired: 1,
        ruleText: 'Complete at least one of the two published Elective Modules for 3 PolyU credits.'
      }),
      group('project-dissertation', 'Project (Dissertation)', 'dissertation', ['ISE5771'], {
        creditsRequired: 12,
        coursesRequired: 1,
        ruleText: 'Complete ISE5771 IGDS Dissertation for 12 PolyU credits. The linked Warwick value is 60 credits and is not added to the PolyU total.',
        courseOptions: { ISE5771: { courseKind: 'dissertation' } }
      }),
      {
        id: 'academic-integrity',
        name: 'Engineering Ethics and Academic Integrity',
        type: 'academic_integrity',
        creditsRequired: 1,
        coursesRequired: 1,
        ruleText: 'Complete EEE5T03 Engineering Ethics and Academic Integrity for 1 credit.',
        appliesToTrackIds: [],
        sourceUrl: PROGRAMME_URL,
        courses: [{
          code: 'EEE5T03',
          name: 'Engineering Ethics and Academic Integrity',
          credits: 1,
          courseKind: 'academic_integrity',
          appliesToTrackIds: [],
          sourceUrl: PROGRAMME_URL
        }]
      }
    ]
  };

  const courses = programme.courseGroups.flatMap((item) => item.courses);
  assert.equal(courses.length, 11);
  assert.equal(new Set(courses.map((item) => item.code)).size, courses.length);
  assert.equal(21 + 3 + 12 + 1, programme.creditsRequired);

  return {
    schemaVersion: 1,
    schoolCode: 'POLYU',
    academicYear: '2027-28',
    verifiedAt: VERIFIED_AT,
    programmes: [programme]
  };
}

function main() {
  const supplement = buildSupplement();
  fs.writeFileSync(OUTPUT_PATH, `${JSON.stringify(supplement, null, 2)}\n`);
  console.log(JSON.stringify({ ok: true, output: path.relative(ROOT, OUTPUT_PATH), programmes: 1, courses: 11 }));
}

if (require.main === module) main();

module.exports = { buildSupplement };
