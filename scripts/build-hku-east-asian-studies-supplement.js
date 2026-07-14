const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const OUTPUT = path.join(ROOT, 'data', 'tpg-course-supplements', 'hku-east-asian-studies-2026.json');
const STRUCTURE_SOURCE = 'https://www.maeas.hku.hk/curriculumstructure';
const COURSES_SOURCE = 'https://www.maeas.hku.hk/curriculumstructure/courses';
const ADMISSIONS_SOURCE = 'https://portal.hku.hk/tpg-admissions/programme-details?programme=master-of-arts-in-the-field-of-east-asian-studies-arts';

const coreRows = [
  ['GLAS7001', 'Advanced Research Skills', 9],
  ['GLAS7003', 'Area Studies: East Asia', 9],
  ['GLAS7021', 'Perspectives on International Relations', 6],
  ['GLAS7041', 'Making the Nation: Media, Culture and Identity', 6]
];

const electiveRows = [
  ['GLAS7064', 'Language, Ethnicity, and Nationalism in East Asia', 'east-asian-studies'],
  ['GLAS7068', 'Understanding Korea in the Age of Globalization', 'east-asian-studies'],
  ['GLAS7069', 'Contemporary Korean Society and Globalization', 'east-asian-studies'],
  ['GLAS7070', 'Understanding Popular Culture in Japan', 'east-asian-studies'],
  ['GLAS7071', 'Contemporary Japanese Society and Culture', 'east-asian-studies'],
  ['GLAS7072', 'Contemporary Japanese Literature and the World', 'east-asian-studies'],
  ['GLAS7073', 'Critical Readings in Transnational Japanese Studies', 'east-asian-studies'],
  ['GLAS7074', 'Literature and Politics in Modern East Asia', 'east-asian-studies'],
  ['GLAS7061', 'The Atlantic: Columbus to NATO', 'european-studies'],
  ['GLAS7077', 'The EU in a Changing World', 'european-studies'],
  ['GLAS7078', 'World War II and “European Values”', 'european-studies'],
  ['GLAS7079', 'From Postwar to War (and Back)? Central and Eastern Europe from 1945 to Today', 'european-studies'],
  ['GLAS7080', 'Contemporary European Art, Culture, and Society', 'european-studies'],
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
  assert.equal(electiveRows.length, 20, 'HKU MAEAS elective-course pool changed');
  assert.equal(electiveRows.filter((row) => row[2] === 'east-asian-studies').length, 8);
  assert.equal(new Set([...coreRows, ...electiveRows].map(([code]) => code)).size, 24);

  return {
    schemaVersion: 1,
    schoolCode: 'HKU',
    academicYear: '2026-27',
    verifiedAt: '2026-07-14',
    programmes: [{
      programmeId: 'HKU-TPG-014',
      status: 'verified',
      creditsRequired: 60,
      creditUnit: 'credits',
      sourceUrl: STRUCTURE_SOURCE,
      ruleReviewStatus: 'manual_review_required',
      statusNote: 'The official curriculum totals 60 credits, correcting the older 30-credit directory value. Students take two East Asian Studies electives plus one additional elective from the East Asian Studies, European Studies or Global Studies lists, and choose one of two 12-credit Capstone courses. These nested and alternative rules require manual audit review. The official admissions page lists September 2026 as the expected start date.',
      courseGroups: [
        {
          id: 'compulsory-courses',
          name: 'Compulsory Courses',
          type: 'core',
          creditsRequired: 30,
          coursesRequired: 4,
          ruleText: 'Complete all four Compulsory Courses for 30 credits. GLAS7021 and GLAS7041 include language-specific tutorials in the assigned East Asian target language.',
          appliesToTrackIds: [],
          sourceUrl: STRUCTURE_SOURCE,
          courses: coreRows.map(coreCourse)
        },
        {
          id: 'elective-courses',
          name: 'Elective Courses',
          type: 'elective',
          creditsRequired: 18,
          coursesRequired: 3,
          ruleText: 'Complete two 6-credit electives from the East Asian Studies list and one additional 6-credit elective from the East Asian Studies, European Studies or Global Studies lists. Not all listed electives are offered each year. The category minimum requires manual audit review.',
          appliesToTrackIds: [],
          sourceUrl: STRUCTURE_SOURCE,
          courses: electiveRows.map(electiveCourse)
        },
        {
          id: 'capstone-experience',
          name: 'Capstone Experience',
          type: 'project',
          creditsRequired: 12,
          coursesRequired: 1,
          ruleText: 'Complete either GLAS7990 Capstone Individual Project or GLAS7999 Capstone Seminar: East Asia for 12 credits. GLAS7990 is permission-based and intended for relevant cross-studies interests; the alternative requires manual audit review.',
          appliesToTrackIds: [],
          sourceUrl: COURSES_SOURCE,
          courses: [
            { code: 'GLAS7990', name: 'Capstone Individual Project', credits: 12, courseKind: 'dissertation', appliesToTrackIds: [] },
            { code: 'GLAS7999', name: 'Capstone Seminar: East Asia', credits: 12, courseKind: 'dissertation', appliesToTrackIds: [] }
          ]
        }
      ],
      additionalSources: [ADMISSIONS_SOURCE, COURSES_SOURCE]
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
