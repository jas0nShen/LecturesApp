const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const OUTPUT = path.join(ROOT, 'data', 'tpg-course-supplements', 'hku-social-sciences-final-batch-2025.json');
const SOURCES = {
  journalismRegulations: 'https://jmsc.hku.hk/wp-content/uploads/2024/09/MJ_RS_2024-25.pdf',
  journalismProgramme: 'https://jmsc.hku.hk/postgraduate/',
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

function sixCreditCourses(rows) {
  return rows.map(([code, name]) => ({ code, name, credits: 6, appliesToTrackIds: [] }));
}

function buildProgrammes() {
  const programmes = [
    {
      programmeId: 'HKU-TPG-053',
      status: 'verified',
      creditsRequired: 60,
      creditUnit: 'credits',
      sourceUrl: SOURCES.journalismRegulations,
      ruleReviewStatus: 'manual_review_required',
      statusNote: 'The official 2024-25 Regulations and Syllabuses apply to candidates admitted in 2024-25 and thereafter and verify the complete 2025-26 Master of Journalism structure. Candidates complete four compulsory courses, the 6-credit JMSC6044 capstone and five to seven 6-credit courses from the published 31-course pool, for 60 to 72 credits. With approval, up to 12 elective credits may come from designated HKU postgraduate courses; Summer Institute study may exempt up to 6 credits; professional-experience waivers require equal-credit replacements; and courses are not offered every year. These exceptions and the variable 60-to-72-credit award require manual review. The current 2026-27 website shows curriculum changes but does not provide a year-labelled complete coded syllabus, so those changes are not merged into this 2025-26 structure.',
      additionalSources: [
        SOURCES.journalismProgramme,
        SOURCES.journalismInformationSession
      ],
      courseGroups: [
        {
          id: 'compulsory-courses',
          name: 'Compulsory Courses',
          type: 'core',
          creditsRequired: 24,
          coursesRequired: 4,
          ruleText: 'Complete all four compulsory courses for 24 credits. A professional-experience waiver must be replaced by another course carrying the same number of credits and requires manual approval.',
          appliesToTrackIds: [],
          sourceUrl: SOURCES.journalismRegulations,
          courses: sixCreditCourses([
            ['JMSC6001', 'Reporting and writing'],
            ['JMSC6093', 'Video news production'],
            ['JMSC6109', 'Media law and ethics'],
            ['JMSC6140', 'A.I. and media innovation']
          ])
        },
        {
          id: 'core-elective-pool',
          name: 'Core and Elective Course Pool',
          type: 'elective',
          creditsRequired: 30,
          coursesRequired: 5,
          ruleText: 'Complete five to seven 6-credit courses from this pool for 30 to 42 credits. With approval, up to two designated HKU postgraduate courses may replace up to 12 credits; annual offerings vary. The minimum award is 60 credits and the maximum is 72 credits.',
          appliesToTrackIds: [],
          sourceUrl: SOURCES.journalismRegulations,
          courses: sixCreditCourses([
            ['JMSC6014', 'Advanced reporting and writing (English)'],
            ['JMSC6027', 'Covering China'],
            ['JMSC6041', 'Special topics in journalism II'],
            ['JMSC6103', 'Reporting global affairs'],
            ['JMSC6111', 'Long form and feature writing'],
            ['JMSC6126', 'Covering climate change'],
            ['JMSC6127', 'Gender and the journalist'],
            ['JMSC7001', 'Entertainment, arts and culture journalism'],
            ['JMSC7007', 'Interpreting and using business journalism in a global era'],
            ['JMSC7008', 'Global financial journalism'],
            ['JMSC6045', 'Special topics in journalism III'],
            ['JMSC6085', 'Documentary film appreciation'],
            ['JMSC6118', 'Advanced video and multimedia production'],
            ['JMSC6119', 'Writing and producing for TV news'],
            ['JMSC6120', 'Podcasting and audio news'],
            ['JMSC6123', 'Motion graphics for journalists'],
            ['JMSC6125', 'Generative A.I. in media applications'],
            ['JMSC6131', 'Advanced video production'],
            ['JMSC6132', 'Multimedia production'],
            ['JMSC6046', 'Special topics in journalism IV'],
            ['JMSC6055', 'Research methods for media studies'],
            ['JMSC6113', 'Data journalism'],
            ['JMSC6116', 'Media data analysis'],
            ['JMSC6117', 'Digital media entrepreneurship'],
            ['JMSC6124', 'Data skills'],
            ['JMSC6130', 'News literacy and digital factchecking'],
            ['JMSC6040', 'Special topics in journalism I'],
            ['JMSC6104', 'Readings in China media and society'],
            ['JMSC6115', 'Journalism internship'],
            ['JMSC6121', 'Independent study project'],
            ['JMSC6128', 'Public communication, campaigns and engagements']
          ])
        },
        {
          id: 'capstone-project',
          name: "Master's Project",
          type: 'capstone',
          creditsRequired: 6,
          coursesRequired: 1,
          ruleText: 'Complete JMSC6044 for 6 credits. The official Option A and Option B are alternative project formats within the same course.',
          appliesToTrackIds: [],
          sourceUrl: SOURCES.journalismRegulations,
          courses: [{ code: 'JMSC6044', name: "Master's project", credits: 6, appliesToTrackIds: [] }]
        }
      ]
    },
    {
      programmeId: 'HKU-TPG-054',
      status: 'verified',
      creditsRequired: 72,
      creditUnit: 'credits',
      sourceUrl: SOURCES.journalismRegulations,
      ruleReviewStatus: 'manual_review_required',
      statusNote: 'The official 2024-25 Regulations and Syllabuses apply to candidates admitted in 2024-25 and thereafter and verify the complete 2025-26 Documentary Filmmaking specialisation under the Master of Journalism award. Candidates complete five compulsory courses for 36 credits, the 18-credit JMSC6200 capstone and three of nine 6-credit electives for a 72-credit award. Approved external postgraduate electives, equal-credit core replacements and annual availability require manual review. The current 2026-27 page publishes a materially changed code list but omits per-course credits, so that later structure remains blocked and is not merged into this cohort.',
      additionalSources: [SOURCES.documentary, SOURCES.documentaryLaunch],
      courseGroups: [
        {
          id: 'compulsory-documentary-courses',
          name: 'Compulsory Documentary Filmmaking Courses',
          type: 'core',
          creditsRequired: 36,
          coursesRequired: 5,
          ruleText: 'Complete all five compulsory Documentary Filmmaking courses for 36 credits. Any approved core waiver must be replaced by a course carrying the same number of credits.',
          appliesToTrackIds: [],
          sourceUrl: SOURCES.journalismRegulations,
          courses: [
            { code: 'JMSC6085', name: 'Documentary film appreciation', credits: 6, appliesToTrackIds: [] },
            { code: 'JMSC6100', name: 'Documentary film production', credits: 12, appliesToTrackIds: [] },
            { code: 'JMSC6201', name: 'The art of non-fictional camerawork', credits: 6, appliesToTrackIds: [] },
            { code: 'JMSC6202', name: 'Audience design in documentary', credits: 6, appliesToTrackIds: [] },
            { code: 'JMSC6203', name: 'Post-production in documentary', credits: 6, appliesToTrackIds: [] }
          ]
        },
        {
          id: 'documentary-electives',
          name: 'Documentary Filmmaking Electives',
          type: 'elective',
          creditsRequired: 18,
          coursesRequired: 3,
          ruleText: 'Complete three 6-credit electives from the nine-course pool. With approval, up to two designated HKU postgraduate courses may replace up to 12 credits; annual offerings vary.',
          appliesToTrackIds: [],
          sourceUrl: SOURCES.journalismRegulations,
          courses: sixCreditCourses([
            ['JMSC6040', 'Special topics in journalism I'],
            ['JMSC6041', 'Special topics in journalism II'],
            ['JMSC6046', 'Special topics in journalism IV'],
            ['JMSC6104', 'Readings in China media and society'],
            ['JMSC6111', 'Long form and feature writing'],
            ['JMSC6125', 'Generative A.I. in media applications'],
            ['JMSC6130', 'News literacy and digital fact-checking'],
            ['JMSC6132', 'Multimedia production'],
            ['JMSC6140', 'A.I. and media innovation']
          ])
        },
        {
          id: 'documentary-capstone',
          name: 'Documentary Filmmaking Capstone',
          type: 'capstone',
          creditsRequired: 18,
          coursesRequired: 1,
          ruleText: 'Complete JMSC6200 for 18 credits.',
          appliesToTrackIds: [],
          sourceUrl: SOURCES.journalismRegulations,
          courses: [{ code: 'JMSC6200', name: 'Documentary filmmaking capstone', credits: 18, appliesToTrackIds: [] }]
        }
      ]
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
  assert.deepEqual(programmes.map((entry) => entry.status), ['verified', 'verified', 'verified']);
  assert.deepEqual(programmes.map((entry) => entry.courseGroups.flatMap((group) => group.courses).length), [36, 15, 30]);
  programmes.forEach((entry) => {
    const codes = entry.courseGroups.flatMap((group) => group.courses).map((course) => course.code);
    assert.equal(new Set(codes).size, codes.length, `${entry.programmeId} repeats a course code`);
  });
  assert.equal(programmes[0].sourceUrl, programmes[1].sourceUrl);
  assert.notEqual(programmes[0].sourceUrl, programmes[2].sourceUrl);
  return programmes;
}

function buildSupplement() {
  return {
    schemaVersion: 1,
    schoolCode: 'HKU',
    academicYear: '2025-26',
    verifiedAt: '2026-07-22',
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
