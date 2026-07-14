const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const OUTPUT = path.join(ROOT, 'data', 'tpg-course-supplements', 'hku-creative-communications-2026.json');
const PROGRAMME_SOURCE = 'https://english.hku.hk/Postgraduate/MACC/MACC_2026-27_Full-time';

const compulsoryRows = [
  ['ENGL7507', 'Creative Foundations: Macro Structure and History'],
  ['ENGL7512', 'Constructing and Staging Creative Perspective']
];

const electiveRows = [
  ['ENGL7509', 'Creative Life Stories: Narrating the Life Story of a Project, Person or Dream'],
  ['ENGL7510', 'Workshopping Your Creative Vision'],
  ['ENGL7514', 'Internship: The History of Practice'],
  ['ENGL7518', 'Corporate Storytelling'],
  ['ENGL7519', 'Building Characters Across Media'],
  ['ENGL7601', 'Imagining Heritage in New Media Art'],
  ['ENGL7602', 'Exhibition Design'],
  ['ENGL7603', 'Ludic Stories: Writing for Digital Narratives'],
  ['ENGL7604', '[Playing with] Digital Media: Navigating the Metaverse'],
  ['ENGL7605', 'Playful Creation: Meaningful Game Design'],
  ['ENGL7606', 'Interdisciplinary Multimedia Narratives'],
  ['ENGL7607', 'Roleplaying Games: Performance and Practice'],
  ['ENGL7608', 'The Ethics of Communication and (Mis)Representation'],
  ['ENGL7609', 'Creative Adaptation'],
  ['ENGL7610', 'Theatre and Performance'],
  ['ENGL7611', 'Artistic Creativity and Narrative in Music Design'],
  ['ENGL7612', 'Short Film Production'],
  ['ENGL7613', 'Integrated Marketing Communications'],
  ['ENGL7614', 'Documentary Filmmaking'],
  ['ENGL7615', 'Content Marketing: Strategy, Creation, and Social Media Management']
];

function course([code, name], credits = 6, extra = {}) {
  return { code, name, credits, appliesToTrackIds: [], ...extra };
}

function buildSupplement() {
  assert.equal(compulsoryRows.length, 2, 'HKU MACC compulsory-course list changed');
  assert.equal(electiveRows.length, 20, 'HKU MACC elective-course pool changed');
  assert.equal(new Set([...compulsoryRows, ...electiveRows].map(([code]) => code)).size, 22);

  return {
    schemaVersion: 1,
    schoolCode: 'HKU',
    academicYear: '2026-27',
    verifiedAt: '2026-07-14',
    programmes: [{
      programmeId: 'HKU-TPG-013',
      status: 'verified',
      creditsRequired: 60,
      creditUnit: 'credits',
      sourceUrl: PROGRAMME_SOURCE,
      ruleReviewStatus: 'verified',
      statusNote: 'The official 2026-27 Programme page publishes the complete 60-credit structure and notes that not all listed electives will be offered every year.',
      courseGroups: [
        {
          id: 'compulsory-courses',
          name: 'Compulsory Courses',
          type: 'core',
          creditsRequired: 18,
          coursesRequired: 2,
          ruleText: 'Complete both 9-credit Compulsory Courses for 18 credits.',
          appliesToTrackIds: [],
          sourceUrl: PROGRAMME_SOURCE,
          courses: compulsoryRows.map((row) => course(row, 9))
        },
        {
          id: 'elective-courses',
          name: 'Elective Courses',
          type: 'elective',
          creditsRequired: 30,
          coursesRequired: 5,
          ruleText: 'Complete five 6-credit Elective Courses for 30 credits. The official Programme page states that not all listed electives will be offered every year.',
          appliesToTrackIds: [],
          sourceUrl: PROGRAMME_SOURCE,
          courses: electiveRows.map((row) => course(row))
        },
        {
          id: 'capstone-experience',
          name: 'Compulsory Capstone Experience',
          type: 'project',
          creditsRequired: 12,
          coursesRequired: 1,
          ruleText: 'Complete ENGL7995 Capstone Experience: The Happiness Project for 12 credits.',
          appliesToTrackIds: [],
          sourceUrl: PROGRAMME_SOURCE,
          courses: [course(['ENGL7995', 'Capstone Experience: The Happiness Project'], 12, { courseKind: 'project' })]
        }
      ]
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
    courses: compulsoryRows.length + electiveRows.length + 1
  }));
}

if (require.main === module) main();
module.exports = { buildSupplement, compulsoryRows, electiveRows };
