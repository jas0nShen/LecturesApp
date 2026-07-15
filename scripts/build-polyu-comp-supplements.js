const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const catalogue = require('../data/tpg-programmes.json');
const snapshots = require('../data/tpg-source-snapshots/polyu-comp-2027.json');
const outputPath = path.join(ROOT, 'data', 'tpg-course-supplements', 'polyu-computing-2027.json');
const CODE_RE = /\b[A-Z]{2,8}\d[A-Z0-9]{2,6}\b/;
const IT_TRACKS = {
  NLP: 'POLYU-TPG-089-NLP',
  VC: 'POLYU-TPG-089-VC'
};

function cleanCourseName(line, code) {
  return line
    .replace(code, '')
    .replace(/\((?:\d+(?:\.\d+)?)\s*credits?(?:;[^)]*)?\)/ig, '')
    .replace(/\*+/g, '')
    .replace(/^[\s–—:;.-]+|[\s–—:;.-]+$/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function parseSection(text, startLabel, endLabel, sourceUrl) {
  const start = text.indexOf(startLabel);
  const end = text.indexOf(endLabel, start + startLabel.length);
  if (start < 0 || end < 0) throw new Error(`Cannot find ${startLabel} -> ${endLabel}`);
  const lines = text.slice(start + startLabel.length, end).split('\n').map((line) => line.trim()).filter(Boolean);
  const courses = [];
  lines.forEach((line) => {
    const match = line.match(CODE_RE);
    if (!match) return;
    const code = match[0];
    const explicit = line.match(/(\d+(?:\.\d+)?)\s*credits?/i);
    courses.push({
      code,
      name: cleanCourseName(line, code),
      credits: explicit ? Number(explicit[1]) : 3,
      appliesToTrackIds: [],
      sourceUrl
    });
  });
  return courses;
}

function legacyGroup(programme, name, id, type, sourceUrl, ruleText) {
  const group = programme.courseGroups.find((item) => item.name === name);
  if (!group) throw new Error(`${programme.id} is missing ${name}`);
  return {
    id,
    name,
    type,
    creditsRequired: group.creditsRequired,
    ruleText,
    appliesToTrackIds: [],
    sourceUrl,
    courses: group.courses.map((course) => ({
      ...course,
      credits: course.code === 'DSAI5T09' ? 1 : /Dissertation/i.test(course.name) ? 9 : /(^|\s)Project$/i.test(course.name) || /Systems Project/i.test(course.name) ? 6 : 3,
      appliesToTrackIds: [],
      sourceUrl
    }))
  };
}

function buildLegacyComputing(programmeId, sourceUrl) {
  const programme = catalogue.programmes.find((item) => item.id === programmeId);
  const isBlockchain = programmeId === 'POLYU-TPG-090';
  const groups = isBlockchain
    ? [
        legacyGroup(programme, 'Core Subjects', 'core', 'core', sourceUrl, 'Choose any six of the eight Core Subjects.'),
        legacyGroup(programme, 'Elective / Project / Dissertation Options', 'elective-options', 'elective', sourceUrl, 'Complete the dissertation, project, or taught-subject path stated in the official award requirements.'),
        legacyGroup(programme, 'Academic Integrity and Ethics', 'academic-integrity', 'academic_integrity', sourceUrl, 'Complete the compulsory AIE subject.')
      ]
    : [
        legacyGroup(programme, 'Core Subjects', 'core', 'core', sourceUrl, 'Choose three Core Subjects.'),
        legacyGroup(programme, 'Disciplinary-specific Electives', 'disciplinary-elective', 'disciplinary_elective', sourceUrl, 'Choose three Disciplinary-specific Electives.'),
        legacyGroup(programme, 'Elective / Project / Dissertation Options', 'elective-options', 'elective', sourceUrl, 'Complete the dissertation, project, or taught-subject path stated in the official award requirements.'),
        legacyGroup(programme, 'Academic Integrity and Ethics', 'academic-integrity', 'academic_integrity', sourceUrl, 'Complete the compulsory AIE subject.')
      ];
  return {
    programmeId,
    status: 'verified',
    creditsRequired: 31,
    creditUnit: 'credits',
    sourceUrl,
    ruleReviewStatus: 'manual_review_required',
    courseGroups: groups
  };
}

function buildInformationTechnology() {
  const row = snapshots.rows.find((item) => item.programmeId === 'POLYU-TPG-089');
  const sourceUrl = row.sourceUrl;
  const makeCourse = (code, name, credits = 3, extra = {}) => {
    if (!row.curriculumText.includes(code) || !row.curriculumText.includes(name)) {
      throw new Error(`POLYU-TPG-089 official source is missing ${code} ${name}`);
    }
    return {
      code,
      name,
      credits,
      appliesToTrackIds: [],
      sourceUrl,
      ...extra
    };
  };
  const commonElectiveMetadata = { subjectGroups: ['stream_core', 'elective'] };
  const nlpCore = (code, name) => makeCourse(code, name, 3, {
    ...commonElectiveMetadata,
    countsTowardTrackIds: [IT_TRACKS.NLP]
  });
  const visualCore = (code, name, extra = {}) => makeCourse(code, name, 3, {
    ...commonElectiveMetadata,
    countsTowardTrackIds: [IT_TRACKS.VC],
    ...extra
  });

  if (!/All subjects are three-credit based unless otherwise stated/i.test(row.curriculumText)) {
    throw new Error('POLYU-TPG-089 official source is missing the default three-credit rule');
  }
  if (!/For 2024\/25 intake and onwards/i.test(row.curriculumText)) {
    throw new Error('POLYU-TPG-089 official source is missing the intake applicability rule');
  }

  return {
    programmeId: row.programmeId,
    status: 'verified',
    verifiedAt: '2026-07-15',
    creditsRequired: 31,
    creditUnit: 'credits',
    sourceUrl,
    ruleReviewStatus: 'manual_review_required',
    statusNote: 'The official curriculum publishes optional Natural Language Processing and Visual Computing Streams plus Dissertation, Project and taught-subject completion paths. The Visual Computing Stream requires one of COMP5422 or COMP5425. Up to 6 credits of approved non-COMP electives may be used without a fixed code list. These mutually exclusive and approval-dependent paths require manual audit review, and no unlisted course is invented.',
    trackSelectionOptional: true,
    tracks: [
      { id: IT_TRACKS.NLP, code: 'NLP', name: 'Natural Language Processing', type: 'Stream', creditsRequired: 31, sourceUrl },
      { id: IT_TRACKS.VC, code: 'VC', name: 'Visual Computing', type: 'Stream', creditsRequired: 31, sourceUrl }
    ],
    courseGroups: [
      {
        id: 'programme-core',
        name: 'Programme Core Subjects',
        type: 'core',
        creditsRequired: 9,
        coursesRequired: 3,
        ruleText: 'Complete all three Programme Core Subjects.',
        appliesToTrackIds: [],
        sourceUrl,
        courses: [
          makeCourse('COMP5112', 'Data Structures and Database Systems'),
          makeCourse('COMP5241', 'Software Engineering and Development'),
          makeCourse('COMP5311', 'Internet Infrastructure and Protocols')
        ]
      },
      {
        id: 'stream-core-shared-electives',
        name: 'Stream Core / Shared Elective Subjects',
        type: 'track_core',
        creditsRequiredByTrackIds: { [IT_TRACKS.NLP]: 12, [IT_TRACKS.VC]: 12 },
        coursesRequiredByTrackIds: { [IT_TRACKS.NLP]: 4, [IT_TRACKS.VC]: 4 },
        ruleText: 'Natural Language Processing requires COMP5511, COMP5152, COMP5423 and COMP5517. Visual Computing requires COMP5511, COMP5523, COMP5541 and one of COMP5422 or COMP5425. Without a Stream, these subjects remain part of the published elective pool.',
        appliesToTrackIds: [],
        sourceUrl,
        courses: [
          makeCourse('COMP5511', 'Artificial Intelligence Concepts', 3, { ...commonElectiveMetadata, countsTowardTrackIds: [IT_TRACKS.NLP, IT_TRACKS.VC] }),
          nlpCore('COMP5152', 'Advanced Data Analytics'),
          nlpCore('COMP5423', 'Natural Language Processing'),
          nlpCore('COMP5517', 'Human Computer Interaction'),
          visualCore('COMP5422', 'Multimedia Computing, Systems and Applications', { conditionalRequirement: true }),
          visualCore('COMP5425', 'Multimedia Coding and Networking', { conditionalRequirement: true }),
          visualCore('COMP5523', 'Computer Vision and Image Processing'),
          visualCore('COMP5541', 'Machine Learning and Data Analytics')
        ]
      },
      {
        id: 'elective-subjects',
        name: 'Elective Subjects',
        type: 'elective',
        ruleText: 'Without a Stream, complete four electives with Dissertation, five with Project, or seven on the taught-subject path. With a Stream, complete no additional elective with Dissertation, one with Project, or three on the taught-subject path. Up to 6 credits of approved non-COMP electives may replace listed electives and require manual review.',
        appliesToTrackIds: [],
        sourceUrl,
        courses: [
          ['COMP5513', 'Financial Computing'],
          ['COMP5355', 'Cyber and Internet Security'],
          ['COMP5521', 'Distributed Ledger Technology, Cryptocurrency and E-Payment'],
          ['COMP5532', 'Digital Twins & Virtual Human'],
          ['COMP5533', 'Game Engine and Programming'],
          ['COMP5434', 'Big Data Computing'],
          ['COMP5542', 'Optimization and Applications'],
          ['COMP5327', 'Wireless Networking and Mobile Computing'],
          ['COMP5221', 'Software Project Management'],
          ['COMP5424', 'Extended Reality'],
          ['COMP5322', 'Internet Computing and Applications'],
          ['COMP5573', 'Theory and Practice of Video Game Design'],
          ['COMP5574', 'Computational Economics and Algorithms'],
          ['COMP5575', 'Advanced Techniques for High-Dimensional Data Management and Analytics'],
          ['COMP5576', 'Modern Cryptography'],
          ['COMP5577', 'AI Security'],
          ['COMP5581', 'Algorithmic Graph Theory'],
          ['COMP5582', 'Artificial Intelligence of Things'],
          ['COMP5584', 'Large Language Models for Agents'],
          ['COMP5923', 'Independent Study'],
          ['COMP5924', 'IT Startup: From Idea to Business Plan']
        ].map(([code, name]) => makeCourse(code, name))
      },
      {
        id: 'project-option',
        name: 'Project Option',
        type: 'project',
        ruleText: 'COMP5933 Project is a 6-credit alternative to the Dissertation and taught-subject-only paths.',
        appliesToTrackIds: [],
        sourceUrl,
        courses: [makeCourse('COMP5933', 'Project', 6, { courseKind: 'project', conditionalRequirement: true })]
      },
      {
        id: 'dissertation-option',
        name: 'Dissertation Option',
        type: 'dissertation',
        ruleText: 'COMP5940 Dissertation is a 9-credit alternative to the Project and taught-subject-only paths.',
        appliesToTrackIds: [],
        sourceUrl,
        courses: [makeCourse('COMP5940', 'Dissertation', 9, { courseKind: 'dissertation', conditionalRequirement: true })]
      },
      {
        id: 'academic-integrity',
        name: 'Academic Integrity and Ethics',
        type: 'academic_integrity',
        creditsRequired: 1,
        coursesRequired: 1,
        ruleText: 'For the 2026/27 intake onwards, complete DSAI5T09.',
        appliesToTrackIds: [],
        sourceUrl,
        courses: [makeCourse('DSAI5T09', 'Academic Integrity and Ethics in Computer and Mathematical Sciences', 1)]
      }
    ]
  };
}

function buildCybersecurity() {
  const row = snapshots.rows.find((item) => item.programmeId === 'POLYU-TPG-092');
  const sourceUrl = row.sourceUrl;
  return {
    programmeId: row.programmeId,
    status: 'verified',
    creditsRequired: 31,
    creditUnit: 'credits',
    sourceUrl,
    ruleReviewStatus: 'manual_review_required',
    courseGroups: [
      { id: 'core', name: 'Core Subjects', type: 'core', creditsRequired: 12, coursesRequired: 4, ruleText: 'Complete four Core Subjects.', appliesToTrackIds: [], sourceUrl, courses: parseSection(row.curriculumText, 'Core Subjects (12 credits required)', 'Disciplinary-specific Electives', sourceUrl) },
      { id: 'disciplinary-elective', name: 'Disciplinary-specific Electives', type: 'disciplinary_elective', creditsRequired: 9, coursesRequired: 3, ruleText: 'Complete three Disciplinary-specific Electives.', appliesToTrackIds: [], sourceUrl, courses: parseSection(row.curriculumText, 'Disciplinary-specific Electives (9 credits required)', 'Elective Subjects', sourceUrl) },
      { id: 'elective-options', name: 'Elective / Project / Dissertation Options', type: 'elective', creditsRequired: 9, ruleText: 'Complete the dissertation, project, or taught-subject path stated in the official award requirements.', appliesToTrackIds: [], sourceUrl, courses: parseSection(row.curriculumText, 'Elective Subjects ( 9 credits required)', 'AIE Subject', sourceUrl) },
      { id: 'academic-integrity', name: 'Academic Integrity and Ethics', type: 'academic_integrity', creditsRequired: 1, coursesRequired: 1, ruleText: 'Complete the compulsory AIE subject.', appliesToTrackIds: [], sourceUrl, courses: parseSection(row.curriculumText, 'AIE Subject (1 credit required)', 'All subjects are offered', sourceUrl) }
    ]
  };
}

function main() {
  const byId = new Map(snapshots.rows.map((row) => [row.programmeId, row]));
  const programmes = [
    buildInformationTechnology(),
    buildLegacyComputing('POLYU-TPG-090', byId.get('POLYU-TPG-090').sourceUrl),
    buildCybersecurity(),
    buildLegacyComputing('POLYU-TPG-093', byId.get('POLYU-TPG-093').sourceUrl)
  ];
  const value = { schemaVersion: 1, schoolCode: 'POLYU', academicYear: '2027-28', verifiedAt: '2026-07-11', programmes };
  fs.writeFileSync(outputPath, `${JSON.stringify(value, null, 2)}\n`);
  console.log(JSON.stringify({ ok: true, programmes: programmes.length, courses: programmes.reduce((n, item) => n + item.courseGroups.reduce((m, group) => m + group.courses.length, 0), 0), output: path.relative(ROOT, outputPath) }));
}

if (require.main === module) main();
module.exports = { IT_TRACKS, buildInformationTechnology, cleanCourseName, parseSection };
