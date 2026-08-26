const assert = require('node:assert/strict');
const test = require('node:test');
const sourceReviews = require('../data/ug-source-reviews.json');

test('CUHK DIPLN stays index-only without a public coded curriculum', () => {
  const diplomacy = sourceReviews.find((review) => (
    review.universityCode === 'CUHK' && review.programmeCode === 'JS4898'
  ));

  assert(diplomacy);
  assert.equal(diplomacy.status, 'no_public_course_codes');
  assert.equal(diplomacy.reviewedAt, '2026-08-24');
  assert.equal(
    diplomacy.officialUrl,
    'https://socsc.cuhk.edu.hk/diplomacy-and-international-studies/'
  );
  assert.match(diplomacy.note, /four-year Law and Social Science interdisciplinary scope/);
  assert.match(diplomacy.note, /China Foreign Affairs University/);
  assert.match(diplomacy.note, /do not publish a Programme-specific course-code, title and unit table/);
  assert.match(diplomacy.note, /Do not convert subject areas or experiential activities into courses/);
});
