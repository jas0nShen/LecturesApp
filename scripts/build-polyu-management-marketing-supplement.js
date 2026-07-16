const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const SNAPSHOT_PATH = path.join(ROOT, 'data', 'tpg-source-snapshots', 'polyu-2027.json');
const OUTPUT_PATH = path.join(ROOT, 'data', 'tpg-course-supplements', 'polyu-management-marketing-2027.json');

const PROGRAMMES = {
  HRM: {
    id: 'POLYU-TPG-064',
    sourceUrl: 'https://www.polyu.edu.hk/study/pg/tpg/2027/23090-mhf-mhp',
    curriculumUrl: 'https://www.polyu.edu.hk/mm/study/tpg/hrm/programme/'
  },
  MARKETING: {
    id: 'POLYU-TPG-065',
    sourceUrl: 'https://www.polyu.edu.hk/study/pg/tpg/2027/23090-mkf-mkp',
    curriculumUrl: 'https://www.polyu.edu.hk/mm/study/tpg/mm/programme/'
  },
  IML: {
    id: 'POLYU-TPG-066',
    sourceUrl: 'https://www.polyu.edu.hk/study/pg/tpg/2027/23090-mif',
    curriculumUrl: 'https://www.polyu.edu.hk/mm/study/tpg/iml/programme/'
  }
};

const catalogue = {
  AF5618: ['Global Economic Environment for Management', 3],
  LGT5034: ['Global Sourcing and Supply', 3],
  LGT5429: ['Global Risk and Decision Analysis', 3],
  MM501: ['Research Methods', 3],
  MM5112: ['Organization and Management', 3],
  MM514: ['Human Resource Management', 3],
  MM515: ['Organizational Behaviour', 3],
  MM516: ['Management of Pay and Benefits', 3],
  MM517: ['Human Resource Development', 3],
  MM5191: ['Negotiation and Conflict Management', 3],
  MM5203: ['Decision Making for Leadership', 3],
  MM5221: ['Human Resource Management in China', 3],
  MM5222: ['HRM Seminars', 3],
  MM5231: ['Strategic Human Resource Management', 3],
  MM5241: ['Managing Volunteerism', 3],
  MM5251: ['Cross-Cultural Management', 3],
  MM5271: ['Wellbeing at Work', 3],
  MM5281: ['Mediation at Workplace', 3],
  MM531: ['Strategic Management', 3],
  MM534: ['Entrepreneurship', 3],
  MM5383: ['International Business Policy', 3],
  MM5384: ['Cross-sectoral Leadership for International Business', 3],
  MM539: ['International Management', 3],
  MM5425: ['Business Analytics', 3],
  MM5433: ['Decision Analytics by Machine Learning', 3],
  MM544: ['E-Commerce', 3],
  MM5451: ['Technology Innovation and Management', 3],
  MM5452: ['Seminars in Emerging Technology', 3],
  MM5684: ['Leading Global Sustainability', 3],
  MM5712: ['Marketing Management in China', 3],
  MM573: ['Marketing Strategy', 3],
  MM5751: ['Content Marketing and Storytelling', 3],
  MM576: ['Marketing Management', 3],
  MM578: ['Services Marketing', 3],
  MM5791: ['Global Marketing in Cross-Cultural Perspectives', 3],
  MM5803: ['Introduction to Customer Value', 3],
  MM5811: ['Marketing with Purpose: ESG and Sustainability', 3],
  MM582: ['Business to Business Marketing', 3],
  MM5831: ['Social Media Marketing', 3],
  MM584: ['Sales Management', 3],
  MM5851: ['Marketing Innovation and Industry Leadership', 3],
  MM5861: ['Advanced Marketing Research', 3],
  MM5862: ['Quantitative Methods for Marketing Intelligence', 3],
  MM587: ['Consumer Behaviour', 3],
  MM588: ['Brand Management', 3],
  MM589: ['Promotion and Advertising', 3],
  MM5913: ['Field Study for Business Management', 3],
  MM592: ['HRM Dissertation', 9],
  MM5921: ['Practice of Human Resource Management', 3],
  MM5935: ['Independent Projects', 3],
  MM597: ['Marketing Management Dissertation', 9],
  MM5971: ['Practice of Marketing Management', 3],
  MM5995: ['MM MSc Career Workshop', 0],
  MM5T21: ['Academic Integrity and Business Ethics', 1]
};

function course(code, curriculumUrl, options = {}) {
  const entry = catalogue[code];
  assert(entry, `Missing Management and Marketing catalogue entry ${code}`);
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
    faculty: 'Department of Management and Marketing (MM)',
    status: 'verified',
    creditsRequired: 31,
    creditUnit: 'credits',
    sourceUrl: programme.sourceUrl,
    ruleReviewStatus: 'manual_review_required',
    statusNote,
    courseGroups
  };
}

function buildHrm() {
  const p = PROGRAMMES.HRM;
  return baseProgramme(p,
    'The official 2027 Programme page and the current Department of Management and Marketing curriculum for the 2025/26 cohort onwards publish the complete 31-credit structure, exact codes and credits. The MSc has either four Compulsory Subjects, AIE and six Electives, or four Compulsory Subjects, AIE, two Electives, MM501 Research Methods and the 9-credit MM592 HRM Dissertation. MM501 is also an ordinary Elective in the non-Dissertation route and is represented once. MM5995 carries zero credits. The shared Elective quota and Dissertation path require manual audit review; the 22-credit PgD is an early-exit award and is not modelled as MSc completion.', [
      group(p, 'compulsory-subjects', 'Compulsory Subjects', 'core', ['MM514', 'MM515', 'MM517', 'MM5112'], {
        creditsRequired: 12, coursesRequired: 4,
        ruleText: 'Complete all four 3-credit Compulsory Subjects for 12 credits.'
      }),
      group(p, 'academic-integrity', 'Academic Integrity and Business Ethics', 'academic_integrity', ['MM5T21'], {
        creditsRequired: 1, coursesRequired: 1,
        ruleText: 'Complete MM5T21 Academic Integrity and Business Ethics for 1 credit.',
        courseOptions: { MM5T21: { courseKind: 'academic_integrity' } }
      }),
      group(p, 'elective-subjects', 'Elective Subjects', 'elective', ['MM501', 'MM516', 'MM5191', 'MM5203', 'MM5221', 'MM5222', 'MM5231', 'MM5241', 'MM5271', 'MM5281', 'MM531', 'MM534', 'MM539', 'MM5425', 'MM5433', 'MM5684', 'MM576', 'MM5913', 'MM5921', 'MM5995'], {
        creditsRequired: 18, coursesRequired: 6,
        ruleText: 'For the non-Dissertation route, complete any six 3-credit Elective Subjects for 18 credits. For the Dissertation route, complete any two ordinary Electives for 6 credits plus MM501 Research Methods for 3 credits. MM5995 carries 0 credits and cannot satisfy the credit minimum.',
        courseOptions: {
          MM501: { subjectGroups: ['elective', 'research-methods'] },
          MM5995: { subjectGroups: ['elective', 'career-workshop'] }
        }
      }),
      group(p, 'dissertation-option', 'Dissertation Option', 'dissertation', ['MM592'], {
        creditsRequired: 9, coursesRequired: 1,
        ruleText: 'The Dissertation route requires MM592 HRM Dissertation for 9 credits together with MM501 Research Methods and two ordinary Electives.',
        courseOptions: { MM592: { courseKind: 'dissertation', conditionalRequirement: true } }
      })
    ]);
}

function buildMarketing() {
  const p = PROGRAMMES.MARKETING;
  return baseProgramme(p,
    'The official 2027 Programme page and the current Department of Management and Marketing curriculum for the 2025/26 cohort onwards publish the complete 31-credit structure, exact codes and credits. The MSc has either four Compulsory Subjects, AIE and six Electives, or four Compulsory Subjects, AIE, two Electives, MM501 Research Methods and the 9-credit MM597 Marketing Management Dissertation. MM501 is also an ordinary Elective in the non-Dissertation route and is represented once. MM5995 carries zero credits. The shared Elective quota and Dissertation path require manual audit review; the 22-credit PgD is an early-exit award and is not modelled as MSc completion.', [
      group(p, 'compulsory-subjects', 'Compulsory Subjects', 'core', ['MM5112', 'MM576', 'MM5803', 'MM587'], {
        creditsRequired: 12, coursesRequired: 4,
        ruleText: 'Complete all four 3-credit Compulsory Subjects for 12 credits.'
      }),
      group(p, 'academic-integrity', 'Academic Integrity and Business Ethics', 'academic_integrity', ['MM5T21'], {
        creditsRequired: 1, coursesRequired: 1,
        ruleText: 'Complete MM5T21 Academic Integrity and Business Ethics for 1 credit.',
        courseOptions: { MM5T21: { courseKind: 'academic_integrity' } }
      }),
      group(p, 'elective-subjects', 'Elective Subjects', 'elective', ['MM501', 'MM5203', 'MM534', 'MM539', 'MM5425', 'MM5433', 'MM544', 'MM5451', 'MM5452', 'MM5712', 'MM573', 'MM5751', 'MM578', 'MM5791', 'MM5811', 'MM582', 'MM5831', 'MM584', 'MM5851', 'MM5861', 'MM5862', 'MM588', 'MM589', 'MM5913', 'MM5971', 'MM5995'], {
        creditsRequired: 18, coursesRequired: 6,
        ruleText: 'For the non-Dissertation route, complete any six 3-credit Elective Subjects for 18 credits. For the Dissertation route, complete any two ordinary Electives for 6 credits plus MM501 Research Methods for 3 credits. MM5995 carries 0 credits and cannot satisfy the credit minimum.',
        courseOptions: {
          MM501: { subjectGroups: ['elective', 'research-methods'] },
          MM5995: { subjectGroups: ['elective', 'career-workshop'] }
        }
      }),
      group(p, 'dissertation-option', 'Dissertation Option', 'dissertation', ['MM597'], {
        creditsRequired: 9, coursesRequired: 1,
        ruleText: 'The Dissertation route requires MM597 Marketing Management Dissertation for 9 credits together with MM501 Research Methods and two ordinary Electives.',
        courseOptions: { MM597: { courseKind: 'dissertation', conditionalRequirement: true } }
      })
    ]);
}

function buildIml() {
  const p = PROGRAMMES.IML;
  return baseProgramme(p,
    'The official 2027 Programme page and the current Department of Management and Marketing curriculum for the 2026/27 cohort onwards publish the complete 31-credit structure, exact codes and credits. Students complete three 3-credit Compulsory Subjects, the 1-credit MM5T21 AIE subject, any three of six 3-credit Core Subjects and four 3-credit Elective Subjects. MM5995 carries zero credits and cannot satisfy the 12-credit Elective requirement. The three-of-six Core and four-Elective choices require manual audit review; the 22-credit PgD is an early-exit award and is not modelled as MSc completion.', [
      group(p, 'compulsory-subjects', 'Compulsory Subjects', 'core', ['MM5112', 'MM5684', 'MM5383'], {
        creditsRequired: 9, coursesRequired: 3,
        ruleText: 'Complete all three 3-credit Compulsory Subjects for 9 credits.'
      }),
      group(p, 'academic-integrity', 'Academic Integrity and Ethics in Business', 'academic_integrity', ['MM5T21'], {
        creditsRequired: 1, coursesRequired: 1,
        ruleText: 'Complete MM5T21 Academic Integrity and Ethics in Business for 1 credit.',
        courseOptions: { MM5T21: { courseKind: 'academic_integrity' } }
      }),
      group(p, 'core-subjects', 'Core Subjects', 'core', ['MM5251', 'MM539', 'MM5791', 'MM5913', 'LGT5034', 'LGT5429'], {
        creditsRequired: 9, coursesRequired: 3,
        ruleText: 'Complete any three of the six 3-credit Core Subjects for 9 credits.'
      }),
      group(p, 'elective-subjects', 'Elective Subjects', 'elective', ['MM501', 'MM5191', 'MM5203', 'MM5221', 'MM5241', 'MM5281', 'MM531', 'MM534', 'MM5384', 'MM5433', 'MM5712', 'MM5811', 'MM5935', 'AF5618', 'MM5995'], {
        creditsRequired: 12, coursesRequired: 4,
        ruleText: 'Complete four 3-credit Elective Subjects for 12 credits. MM5995 carries 0 credits and cannot satisfy the credit minimum.',
        courseOptions: { MM5995: { subjectGroups: ['elective', 'career-workshop'] } }
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
  }
  assert.match(snapshot.rows.find((item) => item.programmeId === PROGRAMMES.HRM.id).curriculumText, /Research Methods \(3 credits\) and a Dissertation \(9 credits\)/);
  assert.match(snapshot.rows.find((item) => item.programmeId === PROGRAMMES.MARKETING.id).curriculumText, /6 Elective Subjects \(3 credits each\)/);
  assert.match(snapshot.rows.find((item) => item.programmeId === PROGRAMMES.IML.id).curriculumText, /3\s+Core Subjects/);

  const programmes = [buildHrm(), buildMarketing(), buildIml()];
  const expectedCounts = [26, 32, 25];
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
