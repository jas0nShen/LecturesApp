const assert = require('node:assert/strict');
const test = require('node:test');
const sourceReviews = require('../data/ug-source-reviews.json');

test('CUHK Nursing and Chinese Medicine stay index-only without public course codes', () => {
  const nursing = sourceReviews.find((review) => (
    review.universityCode === 'CUHK' && review.programmeCode === 'JS4513'
  ));
  const chineseMedicine = sourceReviews.find((review) => (
    review.universityCode === 'CUHK' && review.programmeCode === 'JS4542'
  ));

  assert(nursing);
  assert.equal(nursing.status, 'no_public_course_codes');
  assert.equal(nursing.reviewedAt, '2026-08-24');
  assert.match(nursing.officialUrl, /^https:\/\/www\.nur\.cuhk\.edu\.hk\//);
  assert.match(nursing.note, /112-unit Major/);
  assert.match(nursing.note, /d4aa1ebcacb2e373176991857a6c05f6247e11191dce47fe016420e864724638/);
  assert.match(nursing.note, /Neither source publishes course codes/);

  assert(chineseMedicine);
  assert.equal(chineseMedicine.status, 'no_public_course_codes');
  assert.equal(chineseMedicine.reviewedAt, '2026-08-24');
  assert.match(chineseMedicine.officialUrl, /^https:\/\/scm\.cuhk\.edu\.hk\//);
  assert.match(chineseMedicine.note, /157 Major units/);
  assert.match(chineseMedicine.note, /145-unit required-course title table/);
  assert.match(chineseMedicine.note, /1713c18ded9d07c3ebdbc06da5fad1e1302226b6a8d8879c41362c70eecb685b/);
  assert.match(chineseMedicine.note, /Neither source publishes course codes/);
});

test('CUHK MBChB and GPS stay index-only without public Programme-specific course codes', () => {
  const mbchb = sourceReviews.find((review) => (
    review.universityCode === 'CUHK' && review.programmeCode === 'JS4501'
  ));
  const gps = sourceReviews.find((review) => (
    review.universityCode === 'CUHK' && review.programmeCode === 'JS4502'
  ));

  assert(mbchb);
  assert.equal(mbchb.status, 'no_public_course_codes');
  assert.equal(mbchb.reviewedAt, '2026-08-24');
  assert.equal(mbchb.officialUrl, 'https://admission.cuhk.edu.hk/programme/medun/');
  assert.match(mbchb.note, /six-year SMART curriculum/);
  assert.match(mbchb.note, /25,314,286-byte PDF/);
  assert.match(mbchb.note, /7eefd29eaacc9282ee6f17a48b000ff7b8aacf7d47c63cb1fd5af98d2d910a0a/);
  assert.match(mbchb.note, /do not publish stable Programme-specific course codes/);
  assert.match(mbchb.note, /Do not treat GET preparatory modules/);

  assert(gps);
  assert.equal(gps.status, 'no_public_course_codes');
  assert.equal(gps.reviewedAt, '2026-08-24');
  assert.equal(gps.officialUrl, 'https://admission.cuhk.edu.hk/programme/medun-gps/');
  assert.match(gps.note, /shared six-year MBChB curriculum/);
  assert.match(gps.note, /Global Physician-Leadership Stream/);
  assert.match(gps.note, /7eefd29eaacc9282ee6f17a48b000ff7b8aacf7d47c63cb1fd5af98d2d910a0a/);
  assert.match(gps.note, /Do not turn GPS activities/);
});
