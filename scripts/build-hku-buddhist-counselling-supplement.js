const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const OUTPUT = path.join(ROOT, 'data', 'tpg-course-supplements', 'hku-buddhist-counselling-2025.json');
const REGULATIONS_SOURCE = 'https://sweb.hku.hk/tola/servlet/ApplicantDownloadForm/getForm?pREF_CODE=R337&pDOCUMENT_TYPE=REGULATIONSYLLABUS&pVIEW=Y';
const PROGRAMME_SOURCE = 'https://www.buddhism.hku.hk/ap/mbc/admission/';
const ADMISSIONS_SOURCE = 'https://portal.hku.hk/tpg-admissions/programme-details?programme=master-of-buddhist-counselling-arts&mode=full-time';

const coreRows = [
  ['BSTC7600', 'Theories and practice in Buddhist counselling I'],
  ['BSTC7601', 'Theories and practice in Buddhist counselling II'],
  ['BSTC7602', 'Spiritual formation through contemplative practices']
];

const electiveRows = [
  ['BSTC6055', 'Buddhist psychology I'],
  ['BSTC7112', 'Buddhist ethics'],
  ['BSTC7120', 'Buddhist psychology and mental cultivation'],
  ['BSTC7603', 'Dharma therapy'],
  ['BSTC7604', 'Awareness training program'],
  ['BSTC7605', 'Being with the elderly, sick and dying'],
  ['BSTC7606', 'Buddhist homiletics: The art of presenting Buddhist teachings'],
  ['BSTC7607', 'Buddhist liturgy and rituals'],
  ['BSTC7608', 'Buddhist mediation'],
  ['BSTC7609', 'Special topics in Buddhist counselling (1)'],
  ['BSTC7610', 'Special topics in Buddhist counselling (2)'],
  ['BSTC7611', 'Group work in Buddhist and traditional counselling']
];

function course([code, name], credits) {
  return { code, name, credits, appliesToTrackIds: [] };
}

function buildSupplement() {
  assert.equal(coreRows.length, 3);
  assert.equal(electiveRows.length, 12);
  assert.equal(new Set([...coreRows, ...electiveRows].map(([code]) => code)).size, 15);

  return {
    schemaVersion: 1,
    schoolCode: 'HKU',
    academicYear: '2023-24 and thereafter',
    verifiedAt: '2026-07-14',
    programmes: [{
      programmeId: 'HKU-TPG-020',
      status: 'verified',
      creditsRequired: 63,
      creditUnit: 'credits',
      sourceUrl: REGULATIONS_SOURCE,
      ruleReviewStatus: 'manual_review_required',
      statusNote: 'The official Regulations apply to the 2022-23 intake and thereafter, while the detailed Syllabuses and course table apply to the 2023-24 intake and thereafter and are versioned Apr 16, 2025. The 63-credit curriculum requires all three 9-credit Core Courses, four 6-credit Elective Courses and BSTC8998 Capstone Experience. The official PDF also permits approved electives from the Master of Social Sciences (Counselling) programme without publishing a fixed code list, permits Advanced Standing for at most one equivalent Core Course, and offers four Capstone formats. Those variable approval-dependent paths remain marked for manual review and no unlisted course is invented.',
      courseGroups: [
        {
          id: 'compulsory-core-courses',
          name: 'Compulsory Core Courses',
          type: 'core',
          creditsRequired: 27,
          coursesRequired: 3,
          ruleText: 'Complete all three 9-credit Core Courses for 27 credits. BSTC7601 has BSTC7600 as its official prerequisite. Advanced Standing may be granted for at most one equivalent Core Course completed within five years before admission, subject to Faculty approval; the substitution requires manual audit review.',
          appliesToTrackIds: [],
          sourceUrl: REGULATIONS_SOURCE,
          courses: coreRows.map((row) => course(row, 9))
        },
        {
          id: 'elective-courses',
          name: 'Elective Courses',
          type: 'elective',
          creditsRequired: 24,
          coursesRequired: 4,
          ruleText: 'Choose four 6-credit electives for 24 credits. Not every listed elective is necessarily offered each year. With approval from both Programme Directors/Chairmen, students may select electives from the Master of Social Sciences (Counselling) programme, but the official MBC Syllabuses do not publish a fixed cross-listed course-code pool; those external choices require manual review and are not invented here.',
          appliesToTrackIds: [],
          sourceUrl: REGULATIONS_SOURCE,
          courses: electiveRows.map((row) => course(row, 6))
        },
        {
          id: 'capstone-experience',
          name: 'Capstone Experience',
          type: 'project',
          creditsRequired: 12,
          coursesRequired: 1,
          ruleText: 'Complete BSTC8998 for 12 credits. The compulsory supervised project must use one of four official formats: contemplative and religious practices in Buddhism; a self-contemplative and reflective autobiography; Buddhist homiletics; or a Buddhist counselling case study. Topic approval, supervision and format-specific requirements require manual audit review.',
          appliesToTrackIds: [],
          sourceUrl: REGULATIONS_SOURCE,
          courses: [{
            code: 'BSTC8998',
            name: 'Capstone Experience',
            credits: 12,
            courseKind: 'project',
            appliesToTrackIds: []
          }]
        }
      ],
      additionalSources: [PROGRAMME_SOURCE, ADMISSIONS_SOURCE]
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
    courses: coreRows.length + electiveRows.length + 1
  }));
}

if (require.main === module) main();
module.exports = { buildSupplement, coreRows, electiveRows };
