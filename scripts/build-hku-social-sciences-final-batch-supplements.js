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
  mpaCurrentProgramme: 'https://ppa.hku.hk/taught-postgraduate/master-of-public-administration-mpa/'
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
      status: 'blocked',
      creditsRequired: 60,
      creditUnit: 'credits',
      sourceUrl: SOURCES.mpaCourseDescriptions,
      statusNote: 'The official MPA structure page requires eight taught courses and either a capstone project or dissertation: four compulsory courses, four electives, and one 12-credit capstone/dissertation. The official course list and descriptions publish codes and credits for the compulsory courses, both capstone choices and almost every elective. However, POLI8032 Selected Topics in Public Administration appears in the official elective list and in the 2025-26 timetable, while its official course description omits a credit value. Because a complete published elective pool requires an official credit value for every listed course, POLI8032 cannot safely be assigned the 6 credits used by the other electives and no partial course structure is published.',
      additionalSources: [
        SOURCES.mpaStructure,
        SOURCES.mpaCourseList,
        SOURCES.mpaCurrentProgramme
      ]
    }
  ];

  assert.deepEqual(programmes.map((entry) => entry.programmeId), [
    'HKU-TPG-053',
    'HKU-TPG-054',
    'HKU-TPG-055'
  ]);
  assert(programmes.every((entry) => entry.status === 'blocked'));
  assert(programmes.every((entry) => !entry.courseGroups));
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
    courses: 0
  }));
}

if (require.main === module) main();
module.exports = {
  SOURCES,
  buildSupplement,
  buildProgrammes
};
