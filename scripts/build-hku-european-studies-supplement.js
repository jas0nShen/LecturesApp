const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const OUTPUT = path.join(ROOT, 'data', 'tpg-course-supplements', 'hku-european-studies-2026.json');
const REGULATIONS_SOURCE = 'https://sweb.hku.hk/tola/servlet/ApplicantDownloadForm/getForm?pREF_CODE=R422&pDOCUMENT_TYPE=REGULATIONSYLLABUS&pVIEW=Y';
const STRUCTURE_SOURCE = 'https://www.maeus.hku.hk/curriculumstructure';
const COURSES_SOURCE = 'https://www.maeus.hku.hk/curriculumstructure/courses';
const ADMISSIONS_SOURCE = 'https://portal.hku.hk/tpg-admissions/programme-details?programme=master-of-arts-in-the-field-of-european-studies-arts';

const coreRows = [
  ['GLAS7001', 'Advanced Research Skills', 9],
  ['GLAS7002', 'Area Studies: Europe', 9],
  ['GLAS7021', 'Perspectives on International Relations', 6],
  ['GLAS7041', 'Making the Nation: Media, Culture and Identity', 6]
];

const electiveRows = [
  ['GLAS7061', 'The Atlantic: Columbus to NATO', 'european-studies'],
  ['GLAS7077', 'The EU in a Changing World', 'european-studies'],
  ['GLAS7078', 'World War II and “European Values”', 'european-studies'],
  ['GLAS7079', 'From Postwar to War (and Back)? Central and Eastern Europe from 1945 to Today', 'european-studies'],
  ['GLAS7080', 'Contemporary European Art, Culture, and Society', 'european-studies'],
  ['GLAS7064', 'Language, Ethnicity, and Nationalism in East Asia', 'east-asian-studies'],
  ['GLAS7068', 'Understanding Korea in the Age of Globalization', 'east-asian-studies'],
  ['GLAS7069', 'Contemporary Korean Society and Globalization', 'east-asian-studies'],
  ['GLAS7070', 'Understanding Popular Culture in Japan', 'east-asian-studies'],
  ['GLAS7071', 'Contemporary Japanese Society and Culture', 'east-asian-studies'],
  ['GLAS7072', 'Contemporary Japanese Literature and the World', 'east-asian-studies'],
  ['GLAS7073', 'Critical Readings in Transnational Japanese Studies', 'east-asian-studies'],
  ['GLAS7074', 'Literature and Politics in Modern East Asia', 'east-asian-studies'],
  ['GLAS7062', 'Cultures and Politics in the Indian Ocean', 'global-studies'],
  ['GLAS7063', 'Creative, Criminal, and Clandestine: Illicit Global Economies of Art and Crime', 'global-studies'],
  ['GLAS7065', 'Asia Through the History and Literature of Travel', 'global-studies'],
  ['GLAS7066', 'Gender, Religion, and Empire', 'global-studies'],
  ['GLAS7067', 'Microhistory in a Global Age', 'global-studies'],
  ['GLAS7075', 'Great Power Relations', 'global-studies'],
  ['GLAS7076', 'Leadership in a Global Age', 'global-studies']
];

function coreCourse([code, name, credits]) {
  return { code, name, credits, appliesToTrackIds: [] };
}

function electiveCourse([code, name, subjectGroup]) {
  return { code, name, credits: 6, subjectGroups: [subjectGroup], appliesToTrackIds: [] };
}

function buildSupplement() {
  assert.equal(coreRows.reduce((total, row) => total + row[2], 0), 30);
  assert.equal(electiveRows.length, 20, 'HKU MAEUS elective-course pool changed');
  assert.equal(electiveRows.filter((row) => row[2] === 'european-studies').length, 5);
  assert.equal(electiveRows.filter((row) => row[2] === 'east-asian-studies').length, 8);
  assert.equal(electiveRows.filter((row) => row[2] === 'global-studies').length, 7);
  assert.equal(new Set([...coreRows, ...electiveRows].map(([code]) => code)).size, 24);

  return {
    schemaVersion: 1,
    schoolCode: 'HKU',
    academicYear: '2026-27 and thereafter',
    verifiedAt: '2026-07-14',
    programmes: [{
      programmeId: 'HKU-TPG-016',
      status: 'verified',
      creditsRequired: 60,
      creditUnit: 'credits',
      sourceUrl: REGULATIONS_SOURCE,
      ruleReviewStatus: 'manual_review_required',
      statusNote: 'The official 2026-27 Regulations and Syllabuses establish a 60-credit curriculum, correcting the older 30-credit directory value. The Regulations PDF and official Courses page identify Area Studies: Europe as GLAS7002; the Curriculum Structure webpage currently labels it GLAS7003, so the PDF code is used and the source discrepancy is retained for manual review. Students take at least 12 elective credits from European Studies and choose one of two 12-credit Capstone courses.',
      courseGroups: [
        {
          id: 'core-courses',
          name: 'Core Courses',
          type: 'core',
          creditsRequired: 30,
          coursesRequired: 4,
          ruleText: 'Complete all four Core Courses for 30 credits. Every student is assigned to French, German, Russian or Spanish, with language-specific tutorials in GLAS7021 and GLAS7041.',
          appliesToTrackIds: [],
          sourceUrl: REGULATIONS_SOURCE,
          courses: coreRows.map(coreCourse)
        },
        {
          id: 'elective-courses',
          name: 'Elective Courses',
          type: 'elective',
          creditsRequired: 18,
          coursesRequired: 3,
          ruleText: 'Complete three 6-credit electives from the published list, with at least two courses (12 credits) from European Studies. The remaining elective may be from European Studies, East Asian Studies or Global Studies. Not all listed electives are offered each year; the category minimum requires manual audit review.',
          appliesToTrackIds: [],
          sourceUrl: REGULATIONS_SOURCE,
          courses: electiveRows.map(electiveCourse)
        },
        {
          id: 'capstone-experience',
          name: 'Capstone Experience Courses',
          type: 'project',
          creditsRequired: 12,
          coursesRequired: 1,
          ruleText: 'Complete either GLAS7990 Capstone Individual Project or GLAS7998 Capstone Seminar: Europe for 12 credits. GLAS7990 is permission-based and is an impermissible combination with GLAS7998; the alternative requires manual audit review.',
          appliesToTrackIds: [],
          sourceUrl: REGULATIONS_SOURCE,
          courses: [
            { code: 'GLAS7990', name: 'Capstone Individual Project', credits: 12, courseKind: 'dissertation', appliesToTrackIds: [] },
            { code: 'GLAS7998', name: 'Capstone Seminar: Europe', credits: 12, courseKind: 'dissertation', appliesToTrackIds: [] }
          ]
        }
      ],
      additionalSources: [STRUCTURE_SOURCE, COURSES_SOURCE, ADMISSIONS_SOURCE]
    }]
  };
}

function main() {
  const supplement = buildSupplement();
  fs.writeFileSync(OUTPUT, `${JSON.stringify(supplement, null, 2)}\n`);
  console.log(JSON.stringify({
    ok: true,
    output: path.relative(ROOT, OUTPUT),
    programmes: 1,
    courses: coreRows.length + electiveRows.length + 2
  }));
}

if (require.main === module) main();
module.exports = { buildSupplement, coreRows, electiveRows };
