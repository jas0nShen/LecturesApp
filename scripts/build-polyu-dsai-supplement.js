const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const SNAPSHOT_PATH = path.join(ROOT, 'data', 'tpg-source-snapshots', 'polyu-2027.json');
const OUTPUT_PATH = path.join(ROOT, 'data', 'tpg-course-supplements', 'polyu-dsai-2027.json');

const PROGRAMMES = {
  DSA: {
    id: 'POLYU-TPG-067',
    sourceUrl: 'https://www.polyu.edu.hk/study/pg/tpg/2027/62027-dfm-dpm',
    curriculumUrl: 'https://www.polyu.edu.hk/dsai/study/tpg/mscdsa/curriculum/'
  },
  AIBD: {
    id: 'POLYU-TPG-068',
    sourceUrl: 'https://www.polyu.edu.hk/study/pg/tpg/2027/62037-fai-pai',
    curriculumUrl: 'https://www.polyu.edu.hk/dsai/study/tpg/mscaibd/curriculum/'
  }
};

const catalogue = {
  AMA502: ['Operations Research Methods', 3],
  AMA514A: ['Applied Linear Models', 3],
  AMA515A: ['Forecasting and Applied Time Series Analysis', 3],
  AMA524: ['Scientific Computing', 3],
  AMA528: ['Probability and Stochastic Models', 3],
  AMA532: ['Investment Science', 3],
  AMA568: ['Advanced Topics in Quantitative Finance', 3],
  COMP5111: ['Database Systems and Management', 3],
  COMP5152: ['Advanced Data Analytics', 3],
  COMP5221: ['Software Project Management', 3],
  COMP5355: ['Cyber and Internet Security', 3],
  COMP5423: ['Natural Language Processing', 3],
  COMP5434: ['Big Data Computing', 3],
  DSAI5101: ['Statistical Data Mining', 3],
  DSAI5102: ['Principles of Data Science', 3],
  DSAI5103: ['Advanced High Dimensional Data Analysis', 3],
  DSAI5104: ['Optimization for Machine Learning', 3],
  DSAI5105: ['Hands-on AI for Science and Technology', 3],
  DSAI5201: ['Artificial Intelligence and Big Data Computing in Practice', 3],
  DSAI5203: ['Brain-inspired Computing', 3],
  DSAI5204: ['Efficient Data Processing', 3],
  DSAI5205: ['Introduction to Artificial Intelligence', 3],
  DSAI5206: ['Machine Vision and Intelligence', 3],
  DSAI5207: ['Modern Deep Learning', 3],
  DSAI5208: ['Trustworthy AI Systems and Technologies', 3],
  DSAI5209: ['Visual Data Representation and Processing', 3],
  DSAI5210: ['AI Security', 3],
  DSAI5901: ['Dissertation', 9],
  DSAI5902: ['Dissertation for Artificial Intelligence & Big Data Computing', 9],
  DSAI5T09: ['Academic Integrity and Ethics in Computer and Mathematical Sciences', 1]
};

function course(code, curriculumUrl, options = {}) {
  const entry = catalogue[code];
  assert(entry, `Missing DSAI catalogue entry ${code}`);
  return {
    code,
    name: entry[0],
    credits: entry[1],
    appliesToTrackIds: [],
    sourceUrl: curriculumUrl,
    ...options
  };
}

function group(programme, id, name, type, codes, options = {}) {
  const courseOptions = options.courseOptions || {};
  return {
    id,
    name,
    type,
    ...(options.creditsRequired !== undefined ? { creditsRequired: options.creditsRequired } : {}),
    ...(options.coursesRequired !== undefined ? { coursesRequired: options.coursesRequired } : {}),
    ruleText: options.ruleText,
    appliesToTrackIds: [],
    sourceUrl: programme.curriculumUrl,
    courses: codes.map((code) => course(code, programme.curriculumUrl, courseOptions[code]))
  };
}

function baseProgramme(programme, statusNote, courseGroups) {
  return {
    programmeId: programme.id,
    faculty: 'Department of Data Science and Artificial Intelligence (DSAI)',
    status: 'verified',
    creditsRequired: 31,
    creditUnit: 'credits',
    sourceUrl: programme.sourceUrl,
    ruleReviewStatus: 'manual_review_required',
    statusNote,
    courseGroups
  };
}

function buildDsa() {
  const p = PROGRAMMES.DSA;
  return baseProgramme(p,
    'The official 2027 Programme page and the current DSAI curriculum for cohorts admitted in or after 2026/27 publish the complete 31-credit structure, exact codes and credits. Students complete six Compulsory Subjects, DSAI5T09 AIE, and either four Electives or one Elective plus the 9-credit DSAI5901 Dissertation. Dissertation admission normally requires completion of all six Compulsory Subjects and AIE with a GPA of 3.0 or above at the end of Semester Two. The mutually exclusive paths and GPA eligibility require manual audit review.', [
      group(p, 'compulsory-subjects', 'Compulsory Subjects', 'core', ['COMP5434', 'DSAI5101', 'DSAI5102', 'DSAI5104', 'DSAI5204', 'DSAI5207'], {
        creditsRequired: 18, coursesRequired: 6,
        ruleText: 'Complete all six 3-credit Compulsory Subjects for 18 credits.'
      }),
      group(p, 'elective-subjects', 'Elective Subjects', 'elective', ['AMA502', 'AMA514A', 'AMA515A', 'AMA524', 'AMA528', 'AMA532', 'AMA568', 'COMP5152', 'COMP5423', 'DSAI5103', 'DSAI5105', 'DSAI5201', 'DSAI5203', 'DSAI5205', 'DSAI5206', 'DSAI5208', 'DSAI5209', 'DSAI5210'], {
        creditsRequired: 12, coursesRequired: 4,
        ruleText: 'For the taught route, complete any four Elective Subjects for 12 credits. For the Dissertation route, complete any one Elective Subject for 3 credits.'
      }),
      group(p, 'dissertation-option', 'Dissertation Option', 'dissertation', ['DSAI5901'], {
        creditsRequired: 9, coursesRequired: 1,
        ruleText: 'The Dissertation route requires DSAI5901 Dissertation for 9 credits and one Elective. Eligibility normally requires the six Compulsory Subjects and AIE with a GPA of 3.0 or above at the end of Semester Two.',
        courseOptions: { DSAI5901: { courseKind: 'dissertation', conditionalRequirement: true } }
      }),
      group(p, 'academic-integrity', 'Academic Integrity and Ethics', 'academic_integrity', ['DSAI5T09'], {
        creditsRequired: 1, coursesRequired: 1,
        ruleText: 'Complete DSAI5T09 for 1 credit in either route.',
        courseOptions: { DSAI5T09: { courseKind: 'academic_integrity' } }
      })
    ]);
}

function buildAibd() {
  const p = PROGRAMMES.AIBD;
  return baseProgramme(p,
    'The official 2027 Programme page and the current DSAI curriculum for cohorts admitted in or after 2026/27 publish the complete 31-credit structure, exact codes and credits. Students complete five Compulsory Subjects, DSAI5T09 AIE, and either five Electives or two Electives plus the 9-credit DSAI5902 Dissertation. Dissertation admission normally requires completion of 12 credits and AIE with a GPA of 3.0 or above at the end of Semester One. The mutually exclusive paths and GPA eligibility require manual audit review.', [
      group(p, 'compulsory-subjects', 'Compulsory Subjects', 'core', ['COMP5434', 'DSAI5201', 'DSAI5204', 'DSAI5205', 'DSAI5207'], {
        creditsRequired: 15, coursesRequired: 5,
        ruleText: 'Complete all five 3-credit Compulsory Subjects for 15 credits.'
      }),
      group(p, 'elective-subjects', 'Elective Subjects', 'elective', ['AMA524', 'COMP5111', 'COMP5221', 'COMP5355', 'COMP5423', 'DSAI5101', 'DSAI5102', 'DSAI5103', 'DSAI5104', 'DSAI5105', 'DSAI5203', 'DSAI5206', 'DSAI5208', 'DSAI5209', 'DSAI5210'], {
        creditsRequired: 15, coursesRequired: 5,
        ruleText: 'For the taught route, complete any five Elective Subjects for 15 credits. For the Dissertation route, complete any two Elective Subjects for 6 credits.'
      }),
      group(p, 'dissertation-option', 'Dissertation Option', 'dissertation', ['DSAI5902'], {
        creditsRequired: 9, coursesRequired: 1,
        ruleText: 'The Dissertation route requires DSAI5902 Dissertation for 9 credits and two Electives. Eligibility normally requires 12 credits and AIE with a GPA of 3.0 or above at the end of Semester One.',
        courseOptions: { DSAI5902: { courseKind: 'dissertation', conditionalRequirement: true } }
      }),
      group(p, 'academic-integrity', 'Academic Integrity and Ethics', 'academic_integrity', ['DSAI5T09'], {
        creditsRequired: 1, coursesRequired: 1,
        ruleText: 'Complete DSAI5T09 for 1 credit in either route.',
        courseOptions: { DSAI5T09: { courseKind: 'academic_integrity' } }
      })
    ]);
}

function buildSupplement() {
  const snapshot = JSON.parse(fs.readFileSync(SNAPSHOT_PATH, 'utf8'));
  for (const programme of Object.values(PROGRAMMES)) {
    const row = snapshot.rows.find((item) => item.programmeId === programme.id);
    assert(row, `Missing official snapshot row ${programme.id}`);
    assert.equal(row.sourceUrl, programme.sourceUrl);
    assert.equal(row.creditText, '31');
    assert.match(row.curriculumText, /Dissertation \(9 credits\)/);
    assert.match(row.curriculumText, /Academic Integrity and Ethics in Computer and Mathematical Sciences/);
  }

  const programmes = [buildDsa(), buildAibd()];
  const expectedCounts = [26, 22];
  programmes.forEach((programme, index) => {
    const codes = programme.courseGroups.flatMap((item) => item.courses.map((item) => item.code));
    assert.equal(codes.length, expectedCounts[index]);
    assert.equal(new Set(codes).size, codes.length);
  });

  return {
    schemaVersion: 1,
    schoolCode: 'POLYU',
    academicYear: '2027-28',
    verifiedAt: '2026-07-16',
    programmes
  };
}

function main() {
  const supplement = buildSupplement();
  fs.writeFileSync(OUTPUT_PATH, `${JSON.stringify(supplement, null, 2)}\n`);
  console.log(JSON.stringify({
    ok: true,
    output: path.relative(ROOT, OUTPUT_PATH),
    programmes: supplement.programmes.length,
    courses: supplement.programmes.reduce((sum, programme) => sum + programme.courseGroups.flatMap((group) => group.courses).length, 0)
  }));
}

if (require.main === module) main();

module.exports = { buildSupplement };
