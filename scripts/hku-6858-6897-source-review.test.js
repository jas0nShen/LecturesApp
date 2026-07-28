const assert = require('node:assert/strict');
const test = require('node:test');
const sourceReviews = require('../data/ug-source-reviews.json');
const ugService = require('../miniprogram/utils/ugService');

function getReview(programmeCode) {
  return sourceReviews.find((item) => (
    item.universityCode === 'HKU' && item.programmeCode === programmeCode
  ));
}

test('HKU 6858 remains index-only until a Programme-specific BSc and LLB structure is published', () => {
  const review = getReview('6858');

  assert(review);
  assert.equal(review.status, 'public_course_codes_partial');
  assert.equal(review.reviewedAt, '2026-07-27');
  assert.match(review.note, /twelve selectable catalogue entries/);
  assert.match(review.note, /standalone BSc and LLB syllabuses/);
  assert.match(review.note, /Do not copy the 6901 BSc Major lists or standalone LLB list/);

  const programmes = ugService.listProgrammes({
    universityCode: 'HKU',
    degreeLevel: 'undergraduate'
  }).filter((programme) => programme.code === '6858');

  assert.equal(programmes.length, 12);
  assert(programmes.every((programme) => programme.codedCourseCount === 0));
});

test('HKU 6897 is not silently treated as the approved 6987 curriculum', () => {
  const review = getReview('6897');

  assert(review);
  assert.equal(review.status, 'no_public_course_codes');
  assert.equal(review.reviewedAt, '2026-07-27');
  assert.match(review.note, /Subject to approval/);
  assert.match(review.note, /does not identify 6897 as the applicable admission code/);
  assert.match(review.note, /Do not copy the verified 6987 Major lists into 6897/);

  const programme = ugService.listProgrammes({
    universityCode: 'HKU',
    degreeLevel: 'undergraduate'
  }).find((item) => item.code === '6897');
  const majors = ugService.listMajors(programme.id);

  assert.equal(programme.codedCourseCount, 0);
  assert.equal(majors.length, 1);
  assert.equal(majors[0].codedCourseCount, 0);
});
