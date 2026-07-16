const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const SNAPSHOT_PATH = path.join(ROOT, 'data', 'tpg-source-snapshots', 'polyu-2027.json');
const OUTPUT_PATH = path.join(ROOT, 'data', 'tpg-course-supplements', 'polyu-business-analytics-2027.json');
const PROGRAMME_ID = 'POLYU-TPG-063';
const PROGRAMME_SOURCE_URL = 'https://www.polyu.edu.hk/study/pg/tpg/2027/23090-maf-map';
const CURRICULUM_URL = 'https://www.polyu.edu.hk/mm/study/tpg/ba/programme/';

const catalogue = {
  LGT5102: ['Models for Decision Making', 3],
  LGT5105: ['Managing Operations Systems', 3],
  LGT5113: ['Enterprise Resource Planning', 3],
  LGT5122: ['Applications of Decision Making Models', 3],
  MM501: ['Research Methods', 3],
  MM5112: ['Organization and Management', 3],
  MM5203: ['Decision Making for Leadership', 3],
  MM531: ['Strategic Management', 3],
  MM534: ['Entrepreneurship', 3],
  MM5412: ['Business Intelligence and Decisions', 3],
  MM5413: ['Business Forecasting', 3],
  MM5424: ['Management Information Systems', 3],
  MM5425: ['Business Analytics', 3],
  MM5426: ['Business Applications of Blockchain', 3],
  MM5427: ['Textual Analysis in Business', 3],
  MM5433: ['Decision Analytics by Machine Learning', 3],
  MM544: ['E-Commerce', 3],
  MM5451: ['Technology Innovation and Management', 3],
  MM5452: ['Seminars in Emerging Technology', 3],
  MM576: ['Marketing Management', 3],
  MM5831: ['Social Media Marketing', 3],
  MM5913: ['Field Study for Business Management', 3],
  MM594: ['Business Analytics Dissertation', 9],
  MM5995: ['MM MSc Career Workshop', 0],
  MM5T21: ['Academic Integrity and Business Ethics', 1]
};

function course(code, options = {}) {
  const entry = catalogue[code];
  assert(entry, `Missing Business Analytics catalogue entry ${code}`);
  return {
    code,
    name: entry[0],
    credits: entry[1],
    appliesToTrackIds: [],
    sourceUrl: CURRICULUM_URL,
    ...options
  };
}

function group(id, name, type, codes, options = {}) {
  const courseOptions = options.courseOptions || {};
  return {
    id,
    name,
    type,
    ...(options.creditsRequired !== undefined ? { creditsRequired: options.creditsRequired } : {}),
    ...(options.coursesRequired !== undefined ? { coursesRequired: options.coursesRequired } : {}),
    ruleText: options.ruleText,
    appliesToTrackIds: [],
    sourceUrl: CURRICULUM_URL,
    courses: codes.map((code) => course(code, courseOptions[code]))
  };
}

function buildSupplement() {
  const snapshot = JSON.parse(fs.readFileSync(SNAPSHOT_PATH, 'utf8'));
  const row = snapshot.rows.find((item) => item.programmeId === PROGRAMME_ID);
  assert(row, `Missing official snapshot row ${PROGRAMME_ID}`);
  assert.equal(row.sourceUrl, PROGRAMME_SOURCE_URL);
  assert.equal(row.creditText, '31');
  assert.match(row.curriculumText, /4 Compulsory Subjects \(3 credits each\)/);
  assert.match(row.curriculumText, /Research Methods \(3 credits\) and a Dissertation \(9 credits\)/);
  assert.match(row.curriculumText, /MM MSc Career Workshop \(0 credit\)/);

  const programme = {
    programmeId: PROGRAMME_ID,
    faculty: 'Department of Management and Marketing (MM)',
    status: 'verified',
    creditsRequired: 31,
    creditUnit: 'credits',
    sourceUrl: PROGRAMME_SOURCE_URL,
    ruleReviewStatus: 'manual_review_required',
    statusNote: 'The official 2027 Programme page and the current Department of Management and Marketing curriculum for the 2025/26 cohort onwards publish the complete 31-credit structure, exact codes and credits. The MSc has either four Compulsory Subjects, AIE and six Electives, or four Compulsory Subjects, AIE, two Electives, MM501 Research Methods and the 9-credit MM594 Dissertation. MM501 is also an ordinary Elective in the non-Dissertation route and is represented once. The Department curriculum titles MM5427 Textual Analysis in Business and MM5T21 Academic Integrity and Business Ethics, while the 2027 Programme page uses Textual Analytics in Business and Academic Integrity and Ethics in Business; the coded Department titles are retained and the cross-role/path rules require manual audit review. The 22-credit PgD is an early-exit award and is not modelled as MSc completion.',
    courseGroups: [
      group('compulsory-subjects', 'Compulsory Subjects', 'core', ['MM5112', 'MM5412', 'MM5424', 'MM5425'], {
        creditsRequired: 12,
        coursesRequired: 4,
        ruleText: 'Complete all four 3-credit Compulsory Subjects for 12 credits.'
      }),
      group('academic-integrity', 'Academic Integrity and Business Ethics', 'academic_integrity', ['MM5T21'], {
        creditsRequired: 1,
        coursesRequired: 1,
        ruleText: 'Complete MM5T21 Academic Integrity and Business Ethics for 1 credit.',
        courseOptions: { MM5T21: { courseKind: 'academic_integrity' } }
      }),
      group('elective-subjects', 'Elective Subjects', 'elective', ['MM501', 'MM5203', 'MM531', 'MM534', 'MM5413', 'MM5426', 'MM5427', 'MM5433', 'MM544', 'MM5451', 'MM5452', 'MM576', 'MM5831', 'LGT5102', 'LGT5105', 'LGT5113', 'LGT5122', 'MM5913', 'MM5995'], {
        creditsRequired: 18,
        coursesRequired: 6,
        ruleText: 'For the non-Dissertation route, complete any six Elective Subjects for 18 credits. For the Dissertation route, complete any two ordinary Electives for 6 credits plus MM501 Research Methods for 3 credits. MM5995 carries 0 credits and cannot by itself satisfy the credit minimum.',
        courseOptions: {
          MM501: { subjectGroups: ['elective', 'research-methods'] },
          MM5995: { subjectGroups: ['elective', 'career-workshop'] }
        }
      }),
      group('dissertation-option', 'Dissertation Option', 'dissertation', ['MM594'], {
        creditsRequired: 9,
        coursesRequired: 1,
        ruleText: 'The Dissertation route requires MM594 Business Analytics Dissertation for 9 credits together with MM501 Research Methods and two ordinary Electives. The non-Dissertation route does not require MM594.',
        courseOptions: { MM594: { courseKind: 'dissertation', conditionalRequirement: true } }
      })
    ]
  };

  const codes = programme.courseGroups.flatMap((item) => item.courses.map((item) => item.code));
  assert.equal(codes.length, 25);
  assert.equal(new Set(codes).size, codes.length);

  return {
    schemaVersion: 1,
    schoolCode: 'POLYU',
    academicYear: '2027-28',
    verifiedAt: '2026-07-16',
    programmes: [programme]
  };
}

function main() {
  const supplement = buildSupplement();
  fs.writeFileSync(OUTPUT_PATH, `${JSON.stringify(supplement, null, 2)}\n`);
  console.log(JSON.stringify({
    ok: true,
    output: path.relative(ROOT, OUTPUT_PATH),
    programmes: supplement.programmes.length,
    courses: supplement.programmes[0].courseGroups.flatMap((group) => group.courses).length
  }));
}

if (require.main === module) main();

module.exports = { buildSupplement };
