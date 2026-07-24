const assert = require('node:assert/strict');
const test = require('node:test');

const supplementFile = require('../data/tpg-course-supplements/eduhk-mindfulness-life-education-2026.json');
const { applySupplements, validateSupplement } = require('./import-tpg-course-supplements');

test('EdUHK MA(MLE) closes the official five-core plus nine-credit elective path', () => {
  const catalogue = {
    programmes: [{
      id: 'EDUHK-TPG-DIR-MA-MLE',
      universityCode: 'EDUHK',
      name: 'Master of Arts in Mindfulness and Life Education',
      tracks: [],
      dataLevel: 'programme',
      courseGroups: []
    }]
  };

  validateSupplement(supplementFile, catalogue, 'eduhk-mindfulness-life-education-2026.json');
  const imported = applySupplements(catalogue, [{
    file: 'eduhk-mindfulness-life-education-2026.json',
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
    [[15, 5, 5], [9, undefined, 10]]
  );
  assert.equal(courses.length, 15);
  assert.equal(new Set(courses.map((course) => course.code)).size, 15);
  assert(core.courses.every((course) => course.credits === 3));
  assert.equal(byCode.PSY6103.credits, 6);
  assert.equal(byCode.PSY6103.courseKind, 'project');
  assert.equal(byCode.PSY6099.name, 'Mindfulness Practice');
  assert.match(electives.ruleText, /PSY6103 Research Project plus one 3-credit/);
  assert.match(supplementFile.programmes[0].statusNote, /complete code-to-title mapping/);
});
