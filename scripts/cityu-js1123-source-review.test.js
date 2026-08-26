const assert = require('node:assert/strict');
const test = require('node:test');
const sourceReviews = require('../data/ug-source-reviews.json');
const { summarizeSources, summarizeGeneratedCatalogue } = require('./report-ug-source-coverage');

test('CityU JS1123 remains index-only when the integrated double degree has no public course codes', () => {
  const review = sourceReviews.find((item) => (
    item.universityCode === 'CITYU' && item.programmeCode === 'JS1123'
  ));
  assert(review);
  assert.equal(review.status, 'no_public_course_codes');
  assert.equal(review.reviewedAt, '2026-08-25');
  assert.match(review.note, /151-credit structure/);
  assert.match(review.note, /no Programme-specific course codes/);
  assert.match(review.note, /Do not copy either standalone list/);

  const sourceSummary = summarizeSources('/Users/shenjingsong/Documents/Codex/2026-07-06/pdf/outputs', { school: 'CITYU' });
  const summary = summarizeGeneratedCatalogue({
    school: 'CITYU',
    missingLimit: 100,
    sourceSummary,
    sourceReviews
  });
  const programme = summary.schools[0].missingProgrammes.find((item) => item.code === 'JS1123');
  assert(programme);
  assert.equal(programme.sourceStatus, 'source_index_only');
  assert.equal(programme.sourceReviewStatus, 'no_public_course_codes');
});
