const assert = require('node:assert/strict');
const test = require('node:test');

const supplementFile = require('../data/tpg-course-supplements/eduhk-applied-data-science-2026.json');
const { applySupplements, validateSupplement } = require('./import-tpg-course-supplements');

test('EdUHK MSc(ADS) closes the official four-core plus four-of-seven elective path', () => {
  const catalogue = {
    programmes: [{
      id: 'EDUHK-TPG-DIR-MSC-ADS',
      universityCode: 'EDUHK',
      name: 'Master of Science in Applied Data Science',
      tracks: [],
      dataLevel: 'programme',
      courseGroups: []
    }]
  };

  validateSupplement(supplementFile, catalogue, 'eduhk-applied-data-science-2026.json');
  const imported = applySupplements(catalogue, [{
    file: 'eduhk-applied-data-science-2026.json',
    value: supplementFile
  }]);
  const programme = imported.programmes[0];
  const [core, electives] = programme.courseGroups;
  const courses = programme.courseGroups.flatMap((group) => group.courses);
  const byCode = Object.fromEntries(courses.map((course) => [course.code, course]));

  assert.equal(programme.courseVerificationStatus, 'verified');
  assert.equal(programme.courseVerifiedAt, '2026-07-24');
  assert.equal(programme.ruleReviewStatus, 'verified');
  assert.equal(programme.creditsRequired, 24);
  assert.equal(programme.creditUnit, 'credit points');
  assert.equal(programme.dataLevel, 'structure');
  assert.deepEqual(
    [core, electives].map((group) => [group.creditsRequired, group.coursesRequired, group.courses.length]),
    [[12, 4, 4], [12, 4, 7]]
  );
  assert.equal(courses.length, 11);
  assert.equal(new Set(courses.map((course) => course.code)).size, 11);
  assert(courses.every((course) => course.credits === 3));
  assert.equal(byCode.INT6181.name, 'Applied Programming with Python');
  assert.match(byCode.INT6181.sourceUrl, /moodle\.eduhk\.hk/);
  assert.equal(byCode.MTH6200.name, 'Predictive Analytics');
  assert.match(supplementFile.programmes[0].statusNote, /complete current code-to-title table/);
});
