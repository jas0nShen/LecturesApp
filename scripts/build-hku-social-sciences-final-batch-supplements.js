const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const OUTPUT = path.join(ROOT, 'data', 'tpg-course-supplements', 'hku-social-sciences-final-batch-2025.json');
const SOURCES = {
  journalismProgramme: 'https://jmsc.hku.hk/mjprogramme/',
  journalismAdmissions: 'https://jmsc.hku.hk/mjadmissions/',
  journalismInformationSession: 'https://jmsc.hku.hk/2024/11/master-of-journalism-25-26-information-session/',
  documentary: 'https://jmsc.hku.hk/dfsadmission/',
  documentaryLaunch: 'https://jmsc.hku.hk/2024/02/jmsc-launches-asias-first-journalism-masters-degree-in-documentary-filmmaking/',
  mpaStructure: 'https://ppa.hku.hk/mpa/Programme_Structure.html',
  mpaCourseList: 'https://ppa.hku.hk/mpa/Course_List.html',
  mpaCourseDescriptions: 'https://ppa.hku.hk/mpa/Course_Desc.html',
  mpaCurrentProgramme: 'https://ppa.hku.hk/taught-postgraduate/master-of-public-administration-mpa/',
  mpaCurrentCourseDescriptions: 'https://ppa.hku.hk/taught-postgraduate/master-of-public-administration-mpa/mpa-course-descriptions/',
  mpaRegulations: 'https://sweb.hku.hk/tola/servlet/ApplicantDownloadForm/getForm?pREF_CODE=R58&pDOCUMENT_TYPE=REGULATIONSYLLABUS&pVIEW=Y',
  mipaRegulations: 'https://sweb.hku.hk/tola/servlet/ApplicantDownloadForm/getForm?pREF_CODE=R144&pDOCUMENT_TYPE=REGULATIONSYLLABUS&pVIEW=Y'
};

function buildProgrammes() {
  const programmes = [
    {
      programmeId: 'HKU-TPG-053',
      status: 'blocked',
      creditsRequired: 72,
      creditUnit: 'credits',
      sourceUrl: SOURCES.journalismProgramme,
      statusNote: 'The public official evidence does not support a complete 2025-26 curriculum. The current JMSC programme page is for 2026-27 and states a 60-credit programme, while the 2025-26 catalogue entry records 72 credits. The current page describes broad core skills and elective areas but publishes neither a complete coded course list nor the required grouping and completion path. The official 2025-26 information-session page does not resolve the credit conflict or publish the missing coded syllabus. Because the applicable credit total, course codes and completion rules cannot be verified without inference, no partial course structure is published.',
      additionalSources: [
        SOURCES.journalismAdmissions,
        SOURCES.journalismInformationSession
      ]
    },
    {
      programmeId: 'HKU-TPG-054',
      status: 'blocked',
      creditsRequired: 72,
      creditUnit: 'credits',
      sourceUrl: SOURCES.documentary,
      statusNote: 'The current official Documentary Filmmaking Specialisation page states a 72-credit curriculum comprising six core courses, three electives and a capstone, and publishes six core codes, five elective codes and the JMSC6200 capstone code. However, it is a 2026-27 admissions page and does not publish the credit value of any individual course or an academic-year-specific 2025-26 Regulations and Syllabuses document. The earlier official launch page confirms the programme but does not supply those missing credits or completion rules. Course credits cannot be derived by arithmetic from the 72-credit total, so no partial course structure is published.',
      additionalSources: [SOURCES.documentaryLaunch]
    },
    {
      programmeId: 'HKU-TPG-055',
      status: 'verified',
      creditsRequired: 60,
      creditUnit: 'credits',
      sourceUrl: SOURCES.mpaRegulations,
      ruleReviewStatus: 'manual_review_required',
      statusNote: 'The official 2025-26 Regulations and Syllabuses, applicable to the 2025-26 intake and thereafter, confirm a 60-credit award comprising four 6-credit compulsory courses, four 6-credit electives and either the 12-credit POLI8012 Dissertation or POLI8028 Capstone Project. The same Regulations and the dedicated 2025-26 Course Descriptions confirm POLI8032 Selected Topics in Public Administration at 6 credits, resolving the omission in the older general Course_Desc.html page. With Department approval, up to 6 elective credits may instead come from the MIPA Core or Elective lists; that cross-Programme substitution and annual course availability require manual review.',
      courseGroups: [
        {
          id: 'compulsory-courses',
          name: 'Compulsory Courses',
          type: 'core',
          creditsRequired: 24,
          coursesRequired: 4,
          ruleText: 'Complete all four compulsory courses for 24 credits.',
          appliesToTrackIds: [],
          sourceUrl: SOURCES.mpaRegulations,
          courses: [
            ['POLI7002', 'Public administration: scope and issues'],
            ['POLI8017', 'Workshop in public affairs'],
            ['POLI8026', 'Workshop in managerial skills'],
            ['POLI8027', 'Public administration in Hong Kong']
          ].map(([code, name]) => ({ code, name, credits: 6, appliesToTrackIds: [] }))
        },
        {
          id: 'elective-courses',
          name: 'Elective Courses',
          type: 'elective',
          creditsRequired: 24,
          coursesRequired: 4,
          ruleText: 'Complete four 6-credit MPA electives, or complete three MPA electives and use up to 6 credits of approved MIPA Core or Elective courses. The cross-Programme substitution and annual offerings require manual review.',
          appliesToTrackIds: [],
          sourceUrl: SOURCES.mpaRegulations,
          courses: [
            ['POLI7001', 'Human resource management'],
            ['POLI7003', 'Public policy: issues and approaches'],
            ['POLI7004', 'Public management reform'],
            ['POLI7005', 'Comparative public policy'],
            ['POLI7006', 'Politics and public administration in the era of climate change'],
            ['POLI7007', 'The art and science of policy-making in Hong Kong'],
            ['POLI7008', 'The governance of China and past experience'],
            ['POLI7009', 'Governance and policy in international organizations'],
            ['POLI8002', 'Ethics and public affairs'],
            ['POLI8003', 'Financial management'],
            ['POLI8004', 'Government and law'],
            ['POLI8008', 'Public administration in China'],
            ['POLI8009', 'Policy design and analysis'],
            ['POLI8011', 'Selected topics in public policy'],
            ['POLI8014', 'NGOs and governance'],
            ['POLI8019', 'Comparative public administration reform'],
            ['POLI8021', 'Public organization and management'],
            ['POLI8023', 'Selected topics in public management'],
            ['POLI8029', 'Non-profit management'],
            ['POLI8030', 'Institutional analysis for public policy and management'],
            ['POLI8031', 'Collaborative governance'],
            ['POLI8032', 'Selected topics in public administration'],
            ['POLI8033', 'Program evaluation'],
            ['POLI8034', 'Digital society and governance']
          ].map(([code, name]) => ({ code, name, credits: 6, appliesToTrackIds: [] }))
        },
        {
          id: 'capstone-experience',
          name: 'Capstone Experience',
          type: 'project',
          creditsRequired: 12,
          coursesRequired: 1,
          ruleText: 'Complete either POLI8012 Dissertation or POLI8028 Capstone Project for 12 credits.',
          appliesToTrackIds: [],
          sourceUrl: SOURCES.mpaRegulations,
          courses: [
            { code: 'POLI8012', name: 'Dissertation', credits: 12, courseKind: 'dissertation', appliesToTrackIds: [] },
            { code: 'POLI8028', name: 'Capstone project', credits: 12, courseKind: 'project', appliesToTrackIds: [] }
          ]
        }
      ],
      additionalSources: [
        SOURCES.mpaStructure,
        SOURCES.mpaCourseList,
        SOURCES.mpaCurrentProgramme,
        SOURCES.mpaCurrentCourseDescriptions,
        SOURCES.mpaCourseDescriptions,
        SOURCES.mipaRegulations
      ]
    }
  ];

  assert.deepEqual(programmes.map((entry) => entry.programmeId), [
    'HKU-TPG-053',
    'HKU-TPG-054',
    'HKU-TPG-055'
  ]);
  assert.deepEqual(programmes.map((entry) => entry.status), ['blocked', 'blocked', 'verified']);
  assert(programmes.slice(0, 2).every((entry) => !entry.courseGroups));
  assert.equal(programmes[2].courseGroups.flatMap((group) => group.courses).length, 30);
  assert.equal(new Set(programmes.map((entry) => entry.sourceUrl)).size, programmes.length);
  return programmes;
}

function buildSupplement() {
  return {
    schemaVersion: 1,
    schoolCode: 'HKU',
    academicYear: '2025-26',
    verifiedAt: '2026-07-16',
    programmes: buildProgrammes()
  };
}

function main() {
  const supplement = buildSupplement();
  fs.writeFileSync(OUTPUT, `${JSON.stringify(supplement, null, 2)}\n`);
  console.log(JSON.stringify({
    ok: true,
    output: path.relative(ROOT, OUTPUT),
    programmes: supplement.programmes.length,
    verified: supplement.programmes.filter((entry) => entry.status === 'verified').length,
    blocked: supplement.programmes.filter((entry) => entry.status === 'blocked').length,
    courses: supplement.programmes.flatMap((programme) => programme.courseGroups || []).flatMap((group) => group.courses || []).length
  }));
}

if (require.main === module) main();
module.exports = {
  SOURCES,
  buildSupplement,
  buildProgrammes
};
