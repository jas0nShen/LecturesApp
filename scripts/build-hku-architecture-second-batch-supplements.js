const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const OUTPUT_DIR = path.join(ROOT, 'data', 'tpg-course-supplements');
const source = (ref) => `https://sweb.hku.hk/tola/servlet/ApplicantDownloadForm/getForm?pREF_CODE=${ref}&pDOCUMENT_TYPE=REGULATIONSYLLABUS&pVIEW=Y`;

const mdumCoreRows = [
  ['MDUM1010', 'Management of Urban Systems'],
  ['MDUM1020', 'Urban Economics'],
  ['MDUM1030', 'Municipal Finance for Urban Practitioners'],
  ['MDUM2010', 'Urban Sustainability and ESG'],
  ['MDUM2020', 'Digital Technologies and Smart Cities'],
  ['MDUM2030', 'Urban Governance and Policymaking in the Digital Age']
];

const mdumElectiveRows = [
  ['URBP6002', 'Urban Development Theories', 'urban-policy-and-management'],
  ['URBP6003', 'Planning Practice, Law and Ethics in Hong Kong', 'urban-policy-and-management'],
  ['URBP6006', 'Planning, Managing and Financing the Development Process', 'urban-policy-and-management'],
  ['URBP6131', 'Transport Policy and Planning', 'urban-policy-and-management'],
  ['URBP6157', 'Transport Economics', 'urban-policy-and-management'],
  ['URBP8002', 'International Planning Policy and Practice', 'urban-policy-and-management'],
  ['URBP7005', 'Planning Future Cities and Regions', 'urban-policy-and-management'],
  ['MHCD7002', 'Principles of Healthy Cities', 'urban-policy-and-management'],
  ['MHMP8013', 'Smart and Sustainable Cities', 'urban-policy-and-management'],
  ['URBA6002', 'Urban Big Data Analytics', 'urban-technology-and-analytics'],
  ['URBA6004', 'Spatial Mobilities Analytics', 'urban-technology-and-analytics'],
  ['URBA6006', 'Science of Cities', 'urban-technology-and-analytics'],
  ['URBA6007', 'Geographical Information System (GIS) for Urban and Regional Planning Development', 'urban-technology-and-analytics'],
  ['URBA6008', 'Spatial Planning Analytics', 'urban-technology-and-analytics'],
  ['URBA6009', 'Artificial Intelligence for Future Cities', 'urban-technology-and-analytics'],
  ['URBA6011', 'Programming and Foundations in Urban Data Analysis', 'urban-technology-and-analytics'],
  ['MUDT5010', 'Transport Network Analysis and Modelling', 'urban-technology-and-analytics'],
  ['MHCD7003', 'Health Impact Assessment of Urban Development Projects', 'urban-technology-and-analytics']
];

const aadCoreRows = [
  ['MAAD6101', 'Design Research Studio I', 12],
  ['MAAD6102', 'Design Research Studio II', 12],
  ['MAAD6103', 'Design Research Studio III - Capstone Experience', 12],
  ['MAAD6201', 'Research-based Design: Case Studies', 6],
  ['MAAD6202', 'Topics in Fabrication: Techniques and Technologies', 6],
  ['MAAD6203', 'Topics in Contemporary Sustainability', 6]
];

const aadElectiveRows = [
  ['MAAD6301', 'Fabrication Techniques I (Traditional)'],
  ['MAAD6302', 'New Materials'],
  ['MAAD6303', 'Experiments in Making'],
  ['MAAD6304', 'New Technologies in Design (AR/VR/AI)'],
  ['MAAD6305', 'Fabrication Techniques II (Robotic and Digital)'],
  ['MAAD6306', 'Sustainable Construction'],
  ['MAAD6307', 'Topics in Urbanization'],
  ['MAAD6308', 'Creative Practice 1'],
  ['MAAD6309', 'Creative Practice 2']
];

const conservationCoreRows = [
  ['CONS8120', 'Built Heritage and Its Significance'],
  ['CONS8103', 'Charters and Legislation of Conservation'],
  ['CONS8124', 'Conservation and Assessment Techniques'],
  ['CONS8117', 'Methods of Heritage Research and Interpretation'],
  ['CONS8216', 'Critical Issues in Heritage Conservation']
];

const dmbaCoreRows = [
  ['RECO7601', 'Innovation and Processes'],
  ['RECO7615', 'International Construction Procurement'],
  ['RECO7603', 'Management Theory and Collaborative Project Management'],
  ['RECO7616', 'BIM Execution Planning'],
  ['RECO7605', 'Information Management'],
  ['RECO7609', 'Technologies and Innovation'],
  ['RECO7610', 'Virtual Facilities Management'],
  ['RECO7617', 'Capstone: Understanding Digital Management of Built Assets'],
  ['RECO7613', 'Information Technology in Design and Construction'],
  ['RECO7618', 'Built Assets of the Metaverse: Gaming and VDC']
];

const cpmCommonRows = [
  ['RECO6004', 'Construction Economics'],
  ['RECO6018', 'Modern Developments in the Law of Construction Contracts'],
  ['RECO6028', 'Procurement Systems'],
  ['RECO6042', 'Law for the Real Estate and Construction Industry'],
  ['RECO6060', 'Development Case Studies (QS)'],
  ['RECO7074', 'Management Theory and Projects'],
  ['RECO7079', 'Occupational Health, Safety and Well-being in Construction'],
  ['RECO7098', 'Project Risk Management']
];

function course(code, name, credits = 6, extra = {}) {
  return { code, name, credits, appliesToTrackIds: [], ...extra };
}

function buildMdum() {
  const sourceUrl = source('R404');
  return {
    programmeId: 'HKU-TPG-004',
    status: 'verified',
    creditsRequired: 69,
    creditUnit: 'credits',
    sourceUrl,
    ruleReviewStatus: 'manual_review_required',
    courseGroups: [
      {
        id: 'core-courses', name: 'Core Courses', type: 'core', creditsRequired: 36, coursesRequired: 6,
        ruleText: 'Complete all six Core Courses for 36 credits.', appliesToTrackIds: [], sourceUrl,
        courses: mdumCoreRows.map(([code, name]) => course(code, name))
      },
      {
        id: 'elective-courses', name: 'Elective Courses', type: 'elective', creditsRequired: 18, coursesRequired: 3,
        ruleText: 'Complete three elective courses for 18 credits. Taking all three from one official category forms the corresponding optional Specialism on the transcript; candidates may also choose no Specialism. Course approval and the optional Specialism rule require manual audit review.',
        appliesToTrackIds: [], sourceUrl,
        courses: mdumElectiveRows.map(([code, name, subjectGroup]) => course(code, name, 6, { subjectGroups: [subjectGroup] }))
      },
      {
        id: 'capstone-experience', name: 'Capstone Experience', type: 'dissertation_or_project', creditsRequired: 15, coursesRequired: 1,
        ruleText: 'Complete either MDUM8010 Dissertation or MDUM8020 Capstone Project, each worth 15 credits. The mutually exclusive choice requires manual audit review.',
        appliesToTrackIds: [], sourceUrl,
        courses: [
          course('MDUM8010', 'Dissertation', 15, { courseKind: 'dissertation' }),
          course('MDUM8020', 'Capstone Project', 15, { courseKind: 'project' })
        ]
      }
    ]
  };
}

function buildCpm() {
  const sourceUrl = source('R378');
  return {
    programmeId: 'HKU-TPG-009',
    status: 'verified',
    creditsRequired: 72,
    creditUnit: 'credits',
    sourceUrl,
    ruleReviewStatus: 'manual_review_required',
    courseGroups: [
      {
        id: 'common-prescribed-courses', name: 'Common Prescribed Courses', type: 'core', creditsRequired: 48, coursesRequired: 8,
        ruleText: 'Complete the eight prescribed courses common to both completion paths for 48 credits.', appliesToTrackIds: [], sourceUrl,
        courses: cpmCommonRows.map(([code, name]) => course(code, name))
      },
      {
        id: 'capstone-path', name: 'Project Workshop or Dissertation Path', type: 'project_or_dissertation',
        ruleText: 'Project Workshop path: complete RECO6058 Project Workshop (6 credits) plus 18 elective credits. Dissertation path: complete RECO6020 Dissertation (18 credits) in lieu of RECO6058 and two elective courses, leaving 6 elective credits. The path choice and annual designated elective pool require manual audit review.',
        appliesToTrackIds: [], sourceUrl,
        courses: [
          course('RECO6058', 'Project Workshop (CPM)', 6, { courseKind: 'project' }),
          course('RECO6020', 'Dissertation', 18, { courseKind: 'dissertation' })
        ]
      },
      {
        id: 'designated-electives', name: 'Designated Electives', type: 'elective',
        ruleText: 'Complete 18 elective credits on the Project Workshop path or 6 elective credits on the Dissertation path from the designated pool announced by the Programme Director at the beginning of the year. The current syllabus does not publish a fixed designated list.',
        appliesToTrackIds: [], sourceUrl, courses: []
      }
    ]
  };
}

function buildAad() {
  const sourceUrl = source('R393');
  return {
    programmeId: 'HKU-TPG-006',
    status: 'verified',
    creditsRequired: 72,
    creditUnit: 'credits',
    sourceUrl,
    ruleReviewStatus: 'verified',
    courseGroups: [
      {
        id: 'core-courses', name: 'Core Courses', type: 'core', creditsRequired: 54, coursesRequired: 6,
        ruleText: 'Complete all six Core Courses for 54 credits.', appliesToTrackIds: [], sourceUrl,
        courses: aadCoreRows.map(([code, name, credits]) => course(code, name, credits, code === 'MAAD6103' ? { courseKind: 'project' } : {}))
      },
      {
        id: 'elective-courses', name: 'Elective Courses', type: 'elective', creditsRequired: 18, coursesRequired: 3,
        ruleText: 'Complete three elective courses for 18 credits from the official list. Not all electives are offered every year and selection requires Programme Director approval.',
        appliesToTrackIds: [], sourceUrl,
        courses: aadElectiveRows.map(([code, name]) => course(code, name))
      }
    ]
  };
}

function buildDmba() {
  const sourceUrl = source('R374');
  return {
    programmeId: 'HKU-TPG-010',
    status: 'verified',
    creditsRequired: 72,
    creditUnit: 'credits',
    sourceUrl,
    ruleReviewStatus: 'manual_review_required',
    courseGroups: [
      {
        id: 'core-courses', name: 'Core Courses', type: 'core', creditsRequired: 60, coursesRequired: 10,
        ruleText: 'Complete all ten Core Courses for 60 credits.', appliesToTrackIds: [], sourceUrl,
        courses: dmbaCoreRows.map(([code, name]) => course(code, name, 6, code === 'RECO7617' ? { courseKind: 'project' } : {}))
      },
      {
        id: 'elective-courses', name: 'Elective Courses', type: 'elective', creditsRequired: 12, coursesRequired: 2,
        ruleText: 'Complete two 6-credit electives from MSc(DMBA) or other designated MSc programmes, subject to Programme Director approval. The syllabus names RECO7607 and RECO7608; additional designated courses are announced at the beginning of the year and require manual audit review.',
        appliesToTrackIds: [], sourceUrl,
        courses: [
          course('RECO7607', 'Understanding Industry Practice'),
          course('RECO7608', 'Future Industry Directions')
        ]
      }
    ]
  };
}

function buildConservation(programmeId, stream) {
  const sourceUrl = source('R54');
  const planning = stream === 'planning';
  const streamCourses = planning
    ? [course('CONS8220', 'Conservation Planning and Management Studio', 12), course('CONS8222', 'Heritage Economics and Sustainable Development')]
    : [course('CONS8221', 'Design for Conservation Studio', 12), course('CONS8223', 'Materials and Technologies in Conservation')];
  const crossStreamElective = planning
    ? course('CONS8223', 'Materials and Technologies in Conservation')
    : course('CONS8222', 'Heritage Economics and Sustainable Development');
  return {
    programmeId,
    status: 'verified',
    creditsRequired: 72,
    creditUnit: 'credits',
    sourceUrl,
    ruleReviewStatus: 'manual_review_required',
    courseGroups: [
      {
        id: 'common-core-courses', name: 'Common Core Courses', type: 'core', creditsRequired: 30, coursesRequired: 5,
        ruleText: 'Complete all five common Core Courses for 30 credits.', appliesToTrackIds: [], sourceUrl,
        courses: conservationCoreRows.map(([code, name]) => course(code, name))
      },
      {
        id: 'stream-courses', name: planning ? 'Conservation Planning and Management Stream Courses' : 'Design for Conservation Stream Courses',
        type: 'stream_core', creditsRequired: 18, coursesRequired: 2,
        ruleText: 'Complete both prescribed Stream courses for 18 credits.', appliesToTrackIds: [], sourceUrl, courses: streamCourses
      },
      {
        id: 'elective-courses', name: 'Elective Courses', type: 'elective', creditsRequired: 12, coursesRequired: 2,
        ruleText: 'Complete two 6-credit electives from cross-listed Faculty of Architecture courses with Programme Director approval. The syllabus lists the following suggested electives; the approval-dependent pool requires manual audit review.',
        appliesToTrackIds: [], sourceUrl,
        courses: [course('CONS8109', 'Cultural Landscapes'), course('CONS8224', 'Digital Heritage: Theory and Application'), crossStreamElective]
      },
      {
        id: 'capstone-experience', name: 'Capstone Experience', type: 'dissertation', creditsRequired: 12, coursesRequired: 1,
        ruleText: 'Complete CONS8215 Conservation Thesis as the 12-credit Capstone experience.', appliesToTrackIds: [], sourceUrl,
        courses: [course('CONS8215', 'Conservation Thesis', 12, { courseKind: 'dissertation' })]
      }
    ]
  };
}

function buildSupplements() {
  assert.equal(mdumCoreRows.length, 6);
  assert.equal(mdumElectiveRows.length, 18);
  assert.equal(aadCoreRows.length, 6);
  assert.equal(aadElectiveRows.length, 9);
  assert.equal(conservationCoreRows.length, 5);
  assert.equal(dmbaCoreRows.length, 10);
  assert.equal(cpmCommonRows.length, 8);

  return [
    {
      file: 'hku-architecture-2025-2026.json',
      value: { schemaVersion: 1, schoolCode: 'HKU', academicYear: '2025-26', verifiedAt: '2026-07-14', programmes: [buildMdum(), buildCpm()] }
    },
    {
      file: 'hku-architecture-2024-2025.json',
      value: { schemaVersion: 1, schoolCode: 'HKU', academicYear: '2024-25', verifiedAt: '2026-07-14', programmes: [buildAad(), buildDmba()] }
    },
    {
      file: 'hku-conservation-2022-2023.json',
      value: {
        schemaVersion: 1,
        schoolCode: 'HKU',
        academicYear: '2022-23',
        verifiedAt: '2026-07-14',
        programmes: [buildConservation('HKU-TPG-007', 'planning'), buildConservation('HKU-TPG-008', 'design')]
      }
    }
  ];
}

function main() {
  const supplements = buildSupplements();
  supplements.forEach(({ file, value }) => fs.writeFileSync(path.join(OUTPUT_DIR, file), `${JSON.stringify(value, null, 2)}\n`));
  console.log(JSON.stringify({ ok: true, files: supplements.map((item) => item.file), programmes: 6 }));
}

if (require.main === module) main();
module.exports = { buildSupplements, mdumCoreRows, mdumElectiveRows, aadCoreRows, aadElectiveRows };
