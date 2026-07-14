const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const OUTPUT = path.join(ROOT, 'data', 'tpg-course-supplements', 'hku-literary-cultural-studies-2025.json');
const REGULATIONS_SOURCE = 'https://sweb.hku.hk/tola/servlet/ApplicantDownloadForm/getForm?pREF_CODE=R302&pDOCUMENT_TYPE=REGULATIONSYLLABUS&pVIEW=Y';
const COURSEWORK_SOURCE = 'https://complit.hku.hk/malcs/coursework.html';
const CLIT7032_SOURCE = 'https://complit.hku.hk/malcs/courses/clit7032.html';
const PROGRAMME_SOURCE = 'https://complit.hku.hk/malcs';
const ADMISSIONS_SOURCE = 'https://portal.hku.hk/tpg-admissions/programme-details?programme=master-of-arts-in-the-field-of-literary-and-cultural-studies-arts';

const LITERARY_TRACK_ID = 'HKU-TPG-018-LITERARY-CULTURAL-STUDIES';
const FILM_TRACK_ID = 'HKU-TPG-018-FILM-MEDIA-STUDIES';

const literaryTrackCodes = new Set([
  'CLIT7006', 'CLIT7007', 'CLIT7008', 'CLIT7009', 'CLIT7010', 'CLIT7011',
  'CLIT7013', 'CLIT7016', 'CLIT7018', 'CLIT7020', 'CLIT7023', 'CLIT7024',
  'CLIT7027', 'CLIT7028', 'CLIT7029', 'CLIT7030'
]);

const filmTrackCodes = new Set([
  'CLIT7007', 'CLIT7014', 'CLIT7016', 'CLIT7019', 'CLIT7020', 'CLIT7021',
  'CLIT7022', 'CLIT7023', 'CLIT7027', 'CLIT7028', 'CLIT7029', 'CLIT7030'
]);

const electiveRows = [
  ['CLIT7006', 'Fabrications of Identity'],
  ['CLIT7007', 'The Art and Politics of Narrative'],
  ['CLIT7008', 'From Colonialism to Globalization'],
  ['CLIT7009', 'Modernity and its Paths'],
  ['CLIT7010', 'Questioning Sexual Difference'],
  ['CLIT7011', 'Hong Kong and Beyond'],
  ['CLIT7012', 'Dissertation Seminar'],
  ['CLIT7013', 'Postmodernism'],
  ['CLIT7014', 'Film and Popular Culture'],
  ['CLIT7016', 'Topics in Contemporary Chinese Literature and Culture'],
  ['CLIT7018', 'Realism/Surrealism'],
  ['CLIT7019', 'World Cinema'],
  ['CLIT7020', 'Introduction to Research Methods'],
  ['CLIT7021', 'Approaches to Cinematic Arts'],
  ['CLIT7022', 'Screen Documentaries'],
  ['CLIT7023', 'Ecological Imaginations in Literary and Visual Narratives'],
  ['CLIT7024', 'Advanced Cultural Studies: Context, Culture, Critique'],
  ['CLIT7026', 'Special Topics in Eco-criticism (COIL)'],
  ['CLIT7027', 'Participatory Media and Cultural Studies'],
  ['CLIT7028', 'Adaptation and Remakes Across Cultures'],
  ['CLIT7029', 'Special Topics in Creative Writing'],
  ['CLIT7030', 'Critique and Criticism'],
  ['CLIT7031', 'Topics in Eileen Chang Studies'],
  ['CLIT7032', 'Reading the City: Mapping, Narrative, and Urban Space']
];

const experientialRows = [
  ['CLIT7801', 'Creative Cinematic Practice: Experiential Learning in Museum and Film Festival'],
  ['CLIT7802', 'Creative Cultural Practice: Experiential Learning in Museum and Literary Festival'],
  ['CLIT7803', 'Experiential Learning: Internship'],
  ['CLIT7804', 'Creative Practice: Intensive Summer Course']
];

function countsTowardTrackIds(code) {
  const ids = [];
  if (literaryTrackCodes.has(code)) ids.push(LITERARY_TRACK_ID);
  if (filmTrackCodes.has(code)) ids.push(FILM_TRACK_ID);
  return ids;
}

function electiveCourse([code, name]) {
  return {
    code,
    name,
    credits: 6,
    appliesToTrackIds: [],
    countsTowardTrackIds: countsTowardTrackIds(code),
    ...(code === 'CLIT7012' ? { conditionalRequirement: true } : {}),
    ...(code === 'CLIT7032' ? { sourceUrl: CLIT7032_SOURCE } : {})
  };
}

function buildSupplement() {
  assert.equal(electiveRows.length, 24, 'HKU MALCS elective-course pool changed');
  assert.equal(literaryTrackCodes.size, 16);
  assert.equal(filmTrackCodes.size, 12);
  assert.equal(electiveRows.filter(([code]) => literaryTrackCodes.has(code)).length, 16);
  assert.equal(electiveRows.filter(([code]) => filmTrackCodes.has(code)).length, 12);
  assert.equal(new Set(electiveRows.map(([code]) => code)).size, 24);
  assert.equal(new Set(experientialRows.map(([code]) => code)).size, 4);

  return {
    schemaVersion: 1,
    schoolCode: 'HKU',
    academicYear: '2025-26 and thereafter',
    verifiedAt: '2026-07-14',
    programmes: [{
      programmeId: 'HKU-TPG-018',
      status: 'verified',
      creditsRequired: 60,
      creditUnit: 'credits',
      sourceUrl: REGULATIONS_SOURCE,
      ruleReviewStatus: 'manual_review_required',
      trackSelectionOptional: true,
      tracks: [
        { id: LITERARY_TRACK_ID, name: 'Literary and Cultural Studies', type: 'Stream', sourceUrl: REGULATIONS_SOURCE },
        { id: FILM_TRACK_ID, name: 'Film and Media Studies', type: 'Stream', sourceUrl: REGULATIONS_SOURCE }
      ],
      statusNote: 'The official 2025-26 Regulations and Syllabuses establish a 60-credit curriculum with optional Literary and Cultural Studies and Film and Media Studies Streams. A Stream is shown on the transcript only after at least three courses and the Capstone are completed in that Stream. The current official Programme course table adds CLIT7032 Reading the City: Mapping, Narrative, and Urban Space as an Elective; it is included as 6 credits under the Programme\'s published 6-credit elective structure. The Programme Stream guidance mentions CLIT7025, but no current course row or syllabus entry was found, so CLIT7025 is not included. The mutually exclusive Capstone paths, Stream recognition, and optional extra experiential-course limits require manual audit review.',
      courseGroups: [
        {
          id: 'core-course',
          name: 'Core Course',
          type: 'core',
          creditsRequired: 9,
          coursesRequired: 1,
          ruleText: 'Complete CLIT7005 for 9 credits.',
          appliesToTrackIds: [],
          sourceUrl: REGULATIONS_SOURCE,
          courses: [{ code: 'CLIT7005', name: 'Approaches to Literary and Cultural Studies', credits: 9, appliesToTrackIds: [] }]
        },
        {
          id: 'elective-courses',
          name: 'Elective Courses',
          type: 'elective',
          creditsRequired: 36,
          coursesRequired: 6,
          ruleText: 'Complete six 6-credit electives for 36 credits. Students may declare no Stream. For transcript recognition, complete at least three courses and the Capstone in the same Stream; countsTowardTrackIds records the two official Stream course lists without restricting general elective visibility. CLIT7012 Dissertation Seminar is required for the Dissertation path, while the Portfolio/Individual Project path takes another elective in its place. CLIT7032 appears on the current official Programme course table but not in the 2025-26 PDF, while CLIT7025 is mentioned only in current Stream guidance and is excluded pending a current course row or syllabus. These conditions require manual audit review.',
          appliesToTrackIds: [],
          sourceUrl: REGULATIONS_SOURCE,
          courses: electiveRows.map(electiveCourse)
        },
        {
          id: 'capstone-experience',
          name: 'Capstone Experience',
          type: 'project_or_dissertation',
          creditsRequired: 15,
          coursesRequired: 1,
          ruleText: 'Complete either CLIT7997 Dissertation or CLIT7996 Portfolio/Individual Project for 15 credits. Dissertation requires a B+ or above in at least four courses, Programme Chairperson approval, and CLIT7012 Dissertation Seminar. Portfolio/Individual Project students take another elective instead of CLIT7012. The mutually exclusive paths and Stream assignment of the Capstone require manual audit review.',
          appliesToTrackIds: [],
          sourceUrl: REGULATIONS_SOURCE,
          courses: [
            { code: 'CLIT7997', name: 'Capstone Experience: Dissertation', credits: 15, courseKind: 'dissertation', conditionalRequirement: true, appliesToTrackIds: [], countsTowardTrackIds: [LITERARY_TRACK_ID, FILM_TRACK_ID] },
            { code: 'CLIT7996', name: 'Capstone Experience: Portfolio/Individual Project', credits: 15, courseKind: 'project', appliesToTrackIds: [], countsTowardTrackIds: [LITERARY_TRACK_ID, FILM_TRACK_ID] }
          ]
        },
        {
          id: 'optional-experiential-courses',
          name: 'Optional Creative Practices and Experiential Learning Courses',
          type: 'elective',
          creditsRequired: 0,
          coursesRequired: 0,
          ruleText: 'These optional 3-credit courses are taken on top of the regular 60-credit study load with prior approval. Students may take a maximum of two: one from CLIT7801/CLIT7802 and one from CLIT7803/CLIT7804. They do not count toward the base 60-credit completion total.',
          appliesToTrackIds: [],
          sourceUrl: REGULATIONS_SOURCE,
          courses: experientialRows.map(([code, name]) => ({ code, name, credits: 3, conditionalRequirement: true, appliesToTrackIds: [] }))
        }
      ],
      additionalSources: [COURSEWORK_SOURCE, CLIT7032_SOURCE, PROGRAMME_SOURCE, ADMISSIONS_SOURCE]
    }]
  };
}

function main() {
  const supplement = buildSupplement();
  fs.writeFileSync(OUTPUT, `${JSON.stringify(supplement, null, 2)}\n`);
  console.log(JSON.stringify({ ok: true, output: path.relative(ROOT, OUTPUT), programmes: 1, courses: 1 + electiveRows.length + 2 + experientialRows.length }));
}

if (require.main === module) main();
module.exports = { buildSupplement, electiveRows, experientialRows, LITERARY_TRACK_ID, FILM_TRACK_ID };
