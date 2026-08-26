const assert = require('node:assert/strict');
const test = require('node:test');
const sourceReviews = require('../data/ug-source-reviews.json');

test('CUHK cross-campus double-major brochures remain index-only without coded curricula', () => {
  const indan = sourceReviews.find((review) => (
    review.universityCode === 'CUHK' && review.programmeCode === 'JS4760'
  ));
  const asein = sourceReviews.find((review) => (
    review.universityCode === 'CUHK' && review.programmeCode === 'JS4750'
  ));

  assert(indan);
  assert.equal(indan.status, 'no_public_course_codes');
  assert.equal(indan.reviewedAt, '2026-08-24');
  assert.match(indan.note, /nine participating second-major choices/);
  assert.match(indan.note, /6a54f6e39c416bec3e1bd6d9250765d1a6744672a35c4d7d1e3c8f0e483c8ae7/);
  assert.match(indan.note, /no course codes/);
  assert.match(indan.note, /Do not copy courses/);

  assert(asein);
  assert.equal(asein.status, 'no_public_course_codes');
  assert.equal(asein.reviewedAt, '2026-08-24');
  assert.match(asein.note, /participating Major choices at both campuses/);
  assert.match(asein.note, /f014f531aaeb544d309b93ad40181aa5e8616f47804c2a4f6cce452bf32487ef/);
  assert.match(asein.note, /no course codes/);
  assert.match(asein.note, /Do not copy courses/);
});
