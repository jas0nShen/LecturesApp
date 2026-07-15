const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const snapshotPath = path.join(ROOT, 'data', 'tpg-source-snapshots', 'polyu-2027.json');
const outputPath = path.join(ROOT, 'data', 'tpg-course-supplements', 'polyu-construction-management-2027.json');
const VERIFIED_AT = '2026-07-15';
const SHARED_PRD_URL = 'https://www.polyu.edu.hk/bre/docdrive/PRD_32111%20%26%2032113_BRE_AY25-26_r25.08.28.pdf';
const INTELLIGENT_CONSTRUCTION_PRD_URL = 'https://www.polyu.edu.hk/bre/docdrive/PRD_32114_BRE_AY25-26_r25.08.28.pdf';

const programmeSources = {
  'POLYU-TPG-033': 'https://www.polyu.edu.hk/study/pg/tpg/2027/32111-rfm-rpm',
  'POLYU-TPG-034': 'https://www.polyu.edu.hk/study/pg/tpg/2027/32113-pfm-ppm',
  'POLYU-TPG-035': 'https://www.polyu.edu.hk/study/pg/tpg/2027/32114-ifm-ipm'
};

function course([code, name, credits], sourceUrl, options = {}) {
  return {
    code,
    name,
    credits,
    appliesToTrackIds: [],
    sourceUrl,
    ...options
  };
}

function group(id, name, type, rows, sourceUrl, options = {}) {
  return {
    id,
    name,
    type,
    appliesToTrackIds: [],
    sourceUrl,
    courses: rows.map((row) => course(row, sourceUrl)),
    ...options
  };
}

const constructionAndRealEstateCore = [
  ['BRE506', 'Principles of Project Management', 3],
  ['BRE511', 'Information Management for Construction & Real Estate', 3],
  ['BRE527', 'Construction Practice in China', 3],
  ['BRE533', 'Value Management in Construction & Property', 3],
  ['BRE5751', 'Strategic Management', 3],
  ['BRE581', 'International Construction Projects', 3],
  ['BRE524', 'Urban Planning & Urban Design', 3],
  ['BRE530', 'Economics for Urban Studies', 3],
  ['BRE572', 'Real Estate Development', 3],
  ['BRE582', 'Development Finance & Investment', 3],
  ['BRE525', 'Property Management', 3],
  ['BRE532', 'Maintenance Management & Operation', 3],
  ['BRE565', 'Real Estate Asset Management', 3],
  ['BRE541', 'Property Law', 3],
  ['BRE587', 'Research Methods for Construction & Real Estate', 3]
];

const projectManagementCompulsory = [
  ['BRE572', 'Real Estate Development', 3],
  ['BRE5731', 'Managing People in Projects', 3],
  ['BRE574', 'Construction Process Management', 3],
  ['BRE5751', 'Strategic Management', 3],
  ['BRE587', 'Research Methods for Construction & Real Estate', 3]
];

const projectManagementAdditionalCore = [
  ['BRE506', 'Principles of Project Management', 3],
  ['BRE533', 'Value Management in Construction & Property', 3],
  ['BRE562', 'Project Appraisal', 3],
  ['BRE581', 'International Construction Projects', 3],
  ['BRE582', 'Development Finance & Investment', 3],
  ['BRE586', 'Construction Information Technology', 3]
];

const intelligentConstructionCommon = [
  ['BRE511', 'Information Management for Construction and Real Estate', 3],
  ['BRE586', 'Construction Information Technology', 3],
  ['BRE537', 'Machine Learning and Data Mining for Construction', 3],
  ['BRE536', 'Automation and Robotics in Construction', 3],
  ['BRE535', 'Advanced Visualisation and Interactive Technologies for Construction', 3],
  ['BRE538', '3D Printing in Construction: Principles and Applications', 3],
  ['BRE587', 'Research Methods for Construction and Real Estate', 3]
];

function constructionAndRealEstate() {
  const programmeId = 'POLYU-TPG-033';
  return {
    programmeId,
    status: 'verified',
    creditsRequired: 31,
    creditUnit: 'credits',
    sourceUrl: programmeSources[programmeId],
    ruleReviewStatus: 'manual_review_required',
    statusNote: 'The official 2027 Programme page publishes the complete 31-credit award paths and current subject-title pools. The official 2025/26 BRE Programme Requirement Document publishes exact matching codes and 3-credit values for the complete Core pool, BRE505 Professional Workshop and Project, the 9-credit BRE591 Dissertation and the 1-credit EEE5T03 AIE subject. Students complete either seven taught subjects with at least four Core Subjects plus BRE591, or ten taught subjects with at least seven Core Subjects including BRE505. The alternative paths and optional discipline advice require manual audit review and must not be combined.',
    courseGroups: [
      group('core-subjects', 'Core Subjects', 'core', constructionAndRealEstateCore, SHARED_PRD_URL, {
        ruleText: 'Complete at least four Core Subjects including BRE587 on the Dissertation path, or at least seven Core Subjects including BRE587 on the taught path. The three published disciplines are advisory selections, not required Tracks.'
      }),
      group('professional-workshop-option', 'Professional Workshop and Project', 'project', [
        ['BRE505', 'Professional Workshop & Project', 3]
      ], SHARED_PRD_URL, {
        coursesRequired: 1,
        ruleText: 'BRE505 is compulsory on the ten-taught-subject non-Dissertation path and is mutually exclusive with BRE591 for completion.',
        courses: [course(['BRE505', 'Professional Workshop & Project', 3], SHARED_PRD_URL, {
          courseKind: 'project',
          conditionalRequirement: true
        })]
      }),
      group('dissertation-option', 'Dissertation Option', 'dissertation', [
        ['BRE591', 'MSc Dissertation', 9]
      ], SHARED_PRD_URL, {
        coursesRequired: 1,
        ruleText: 'BRE591 is required on the seven-taught-subject Dissertation path and is mutually exclusive with BRE505 for completion.',
        courses: [course(['BRE591', 'MSc Dissertation', 9], SHARED_PRD_URL, {
          courseKind: 'dissertation',
          conditionalRequirement: true
        })]
      }),
      group('academic-integrity', 'Academic Integrity and Ethics', 'academic_integrity', [
        ['EEE5T03', 'Engineering Ethics and Academic Integrity', 1]
      ], SHARED_PRD_URL, {
        creditsRequired: 1,
        coursesRequired: 1,
        ruleText: 'Complete EEE5T03 for 1 credit in either award path.'
      })
    ]
  };
}

function projectManagement() {
  const programmeId = 'POLYU-TPG-034';
  return {
    programmeId,
    status: 'verified',
    creditsRequired: 31,
    creditUnit: 'credits',
    sourceUrl: programmeSources[programmeId],
    ruleReviewStatus: 'manual_review_required',
    statusNote: 'The official 2027 Programme page publishes the 31-credit Project Management paths and all eleven current Core titles. The official 2025/26 BRE Programme Requirement Document publishes exact matching codes and 3-credit values, identifies the 9-credit BRE591 Dissertation and the 1-credit EEE5T03 AIE subject, and confirms BRE550 and CSE565 as named background-dependent Elective recommendations. The broader Elective pool is explicitly dynamic across BRE and sister departments. The ten-subject and seven-subject-plus-Dissertation paths, the dynamic Elective pool and the maximum three-Elective rule require manual audit review.',
    courseGroups: [
      group('compulsory-core-subjects', 'Compulsory Core Subjects', 'core', projectManagementCompulsory, SHARED_PRD_URL, {
        creditsRequired: 15,
        coursesRequired: 5,
        ruleText: 'Complete all five Compulsory Core Subjects for 15 credits in either award path.'
      }),
      group('additional-core-subjects', 'Additional Core Subjects', 'core', projectManagementAdditionalCore, SHARED_PRD_URL, {
        ruleText: 'The ten-subject taught path requires at least two subjects from this Additional Core pool. The Dissertation path requires seven taught subjects in total including all five Compulsory Core Subjects.'
      }),
      group('named-recommended-electives', 'Named Recommended Elective Subjects', 'elective', [
        ['CSE565', 'Construction Technology', 3],
        ['BRE550', 'Statutory Framework for Construction Practice', 3]
      ], SHARED_PRD_URL, {
        ruleText: 'These are the two named recommendations for students without a construction background. The official Elective pool may include other subjects offered by BRE or sister departments and is not treated as a closed list.'
      }),
      group('dissertation-option', 'Dissertation Option', 'dissertation', [
        ['BRE591', 'MSc Dissertation', 9]
      ], SHARED_PRD_URL, {
        coursesRequired: 1,
        ruleText: 'BRE591 is required only on the seven-taught-subject Dissertation path and replaces three taught subjects.',
        courses: [course(['BRE591', 'MSc Dissertation', 9], SHARED_PRD_URL, {
          courseKind: 'dissertation',
          conditionalRequirement: true
        })]
      }),
      group('academic-integrity', 'Academic Integrity and Ethics', 'academic_integrity', [
        ['EEE5T03', 'Engineering Ethics and Academic Integrity', 1]
      ], SHARED_PRD_URL, {
        creditsRequired: 1,
        coursesRequired: 1,
        ruleText: 'Complete EEE5T03 for 1 credit in either award path.'
      })
    ]
  };
}

function intelligentConstruction() {
  const programmeId = 'POLYU-TPG-035';
  return {
    programmeId,
    status: 'verified',
    creditsRequired: 31,
    creditUnit: 'credits',
    sourceUrl: programmeSources[programmeId],
    ruleReviewStatus: 'manual_review_required',
    statusNote: 'The official 2027 Programme page and official 2025/26 BRE Programme Requirement Document publish matching 31-credit Intelligent Construction paths, exact codes, titles and credits for all compulsory subjects, the 9-credit BRE591 Dissertation, the 3-credit BRE534 Dissertation replacement, the named BRE506 Elective recommendation and the 1-credit EEE5T03 AIE subject. The non-Dissertation path may use another approved Elective from a dynamic University pool. The mutually exclusive completion paths and open Elective choice require manual audit review.',
    courseGroups: [
      group('common-compulsory-subjects', 'Common Compulsory Subjects', 'core', intelligentConstructionCommon, INTELLIGENT_CONSTRUCTION_PRD_URL, {
        creditsRequired: 21,
        coursesRequired: 7,
        ruleText: 'Complete all seven 3-credit Common Compulsory Subjects in either award path.'
      }),
      group('non-dissertation-compulsory-subjects', 'Non-Dissertation Compulsory Subjects', 'project', [
        ['BRE534', 'Integrated Project in Intelligent Construction', 3],
        ['BRE5751', 'Strategic Management', 3]
      ], INTELLIGENT_CONSTRUCTION_PRD_URL, {
        creditsRequired: 6,
        coursesRequired: 2,
        ruleText: 'Complete BRE534 and BRE5751 only on the non-Dissertation path.',
        courses: [
          course(['BRE534', 'Integrated Project in Intelligent Construction', 3], INTELLIGENT_CONSTRUCTION_PRD_URL, {
            courseKind: 'project',
            conditionalRequirement: true
          }),
          course(['BRE5751', 'Strategic Management', 3], INTELLIGENT_CONSTRUCTION_PRD_URL, {
            conditionalRequirement: true
          })
        ]
      }),
      group('named-recommended-elective', 'Named Recommended Elective Subject', 'elective', [
        ['BRE506', 'Principles of Project Management', 3]
      ], INTELLIGENT_CONSTRUCTION_PRD_URL, {
        ruleText: 'The non-Dissertation path requires one 3-credit Elective. BRE506 is the named recommendation, but another approved University subject may be selected; this is not a closed Elective pool.'
      }),
      group('dissertation-option', 'Dissertation Option', 'dissertation', [
        ['BRE591', 'Dissertation', 9]
      ], INTELLIGENT_CONSTRUCTION_PRD_URL, {
        coursesRequired: 1,
        ruleText: 'BRE591 is required only on the Dissertation path and is mutually exclusive with the non-Dissertation project and Elective requirements.',
        courses: [course(['BRE591', 'Dissertation', 9], INTELLIGENT_CONSTRUCTION_PRD_URL, {
          courseKind: 'dissertation',
          conditionalRequirement: true
        })]
      }),
      group('academic-integrity', 'Academic Integrity and Ethics', 'academic_integrity', [
        ['EEE5T03', 'Engineering Ethics and Academic Integrity', 1]
      ], INTELLIGENT_CONSTRUCTION_PRD_URL, {
        creditsRequired: 1,
        coursesRequired: 1,
        ruleText: 'Complete EEE5T03 for 1 credit in either award path.'
      })
    ]
  };
}

function buildSupplement() {
  const snapshot = JSON.parse(fs.readFileSync(snapshotPath, 'utf8'));
  const expectations = {
    'POLYU-TPG-033': [/7 subjects \(3 credits each\).*at least 4 Core Subjects/s, /Professional Workshop\s*&\s*Project/, /Academic Integrity and Ethics/],
    'POLYU-TPG-034': [/10 subjects \(including\s*5 Compulsory Core Subjects and at least\s*2 other Core Subjects\)/, /BRE587/, /Academic Integrity and Ethics/],
    'POLYU-TPG-035': [/Dissertation path: A Dissertation\s*\(9 credits\)/, /Integrated Project in Intelligent\s*Construction/, /BRE506/, /Academic Integrity and Ethics/]
  };
  Object.entries(expectations).forEach(([programmeId, patterns]) => {
    const row = snapshot.rows.find((item) => item.programmeId === programmeId);
    assert(row, `Missing official snapshot row ${programmeId}`);
    assert.equal(row.sourceUrl, programmeSources[programmeId]);
    assert.equal(row.creditText, '31');
    patterns.forEach((pattern) => assert.match(row.curriculumText, pattern));
  });

  const programmes = [
    constructionAndRealEstate(),
    projectManagement(),
    intelligentConstruction()
  ];
  const expectedCourseCounts = [18, 15, 12];
  programmes.forEach((programme, index) => {
    const codes = programme.courseGroups.flatMap((item) => item.courses.map((itemCourse) => itemCourse.code));
    assert.equal(codes.length, expectedCourseCounts[index]);
    assert.equal(new Set(codes).size, codes.length, `${programme.programmeId} has duplicate course codes`);
  });

  return {
    schemaVersion: 1,
    schoolCode: 'POLYU',
    academicYear: '2027-28',
    verifiedAt: VERIFIED_AT,
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
    courses: supplement.programmes.reduce(
      (total, programme) => total + programme.courseGroups.reduce((count, item) => count + item.courses.length, 0),
      0
    )
  }));
}

if (require.main === module) main();

module.exports = { buildSupplement };
