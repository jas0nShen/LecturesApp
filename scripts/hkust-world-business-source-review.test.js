const assert = require('node:assert/strict');
const test = require('node:test');
const sourceReviews = require('../data/ug-source-reviews.json');
const { summarizeSources, summarizeGeneratedCatalogue } = require('./report-ug-source-coverage');

test('HKUST World Bachelor in Business is reviewed by official name when no Programme code exists', () => {
  const review = sourceReviews.find((item) => (
    item.universityCode === 'HKUST' && item.programmeName === 'World Bachelor in Business'
  ));
  assert(review);
  assert.equal(review.status, 'no_public_course_codes');
  assert.equal(review.reviewedAt, '2026-08-25');
  assert.match(review.note, /University of Southern California and Bocconi University/);
  assert.match(review.note, /no stable course codes/);
  assert.match(review.note, /Do not infer HKUST codes/);

  const sourceSummary = summarizeSources('/Users/shenjingsong/Documents/Codex/2026-07-06/pdf/outputs', { school: 'HKUST' });
  const summary = summarizeGeneratedCatalogue({
    school: 'HKUST',
    missingLimit: 100,
    sourceSummary,
    sourceReviews
  });
  const programme = summary.schools[0].missingProgrammes.find((item) => item.name === 'World Bachelor in Business');
  assert(programme);
  assert.equal(programme.sourceStatus, 'source_index_only');
  assert.equal(programme.sourceReviewStatus, 'no_public_course_codes');
});
