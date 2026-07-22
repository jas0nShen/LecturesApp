const assert = require('node:assert/strict');
const test = require('node:test');

const supplementFile = require('../data/tpg-course-supplements/eduhk-source-status-2026.json');
const { applySupplements, validateSupplement } = require('./import-tpg-course-supplements');

test('EdUHK MSc(ESGSD) closes the official 2026-27 five-core plus three-of-four elective path', () => {
  const programme = supplementFile.programmes.find((item) => item.programmeId === 'EDUHK-TPG-DIR-MSC-ESGSD');
  const supplement = {
    ...supplementFile,
    programmes: [programme]
  };
  const catalogue = {
    programmes: [{
      id: 'EDUHK-TPG-DIR-MSC-ESGSD',
      universityCode: 'EDUHK',
      name: 'Master of Science in Environmental, Social and Governance for Sustainable Development',
      tracks: [],
      dataLevel: 'programme',
      courseGroups: []
    }]
  };

  validateSupplement(supplement, catalogue, 'eduhk-source-status-2026.json');
  const imported = applySupplements(catalogue, [{
    file: 'eduhk-source-status-2026.json',
    value: supplement
  }]);
  const importedProgramme = imported.programmes[0];
  const [core, electives] = importedProgramme.courseGroups;
  const courses = importedProgramme.courseGroups.flatMap((group) => group.courses);
  const byCode = Object.fromEntries(courses.map((course) => [course.code, course]));

  assert.equal(programme.status, 'verified');
  assert.equal(programme.ruleReviewStatus, 'verified');
  assert.equal(importedProgramme.courseVerificationStatus, 'verified');
  assert.equal(importedProgramme.courseVerifiedAt, '2026-07-22');
  assert.equal(importedProgramme.creditsRequired, 24);
  assert.equal(importedProgramme.creditUnit, 'credit points');
  assert.equal(importedProgramme.dataLevel, 'structure');

  assert.deepEqual(
    [core, electives].map((group) => [group.creditsRequired, group.coursesRequired, group.courses.length]),
    [[15, 5, 5], [9, 3, 4]]
  );
  assert.equal(courses.length, 9);
  assert.equal(new Set(courses.map((course) => course.code)).size, 9);
  assert(courses.every((course) => course.credits === 3));
  assert(courses.every((course) => course.sourceUrl === `https://www.eduhk.hk/curriculum/module/${course.code}.html`));

  assert.equal(byCode.ESG6001.name, 'Theoretical Perspectives on ESG');
  assert.equal(byCode.ESG6004.name, 'Ethics and Compliance for ESG');
  assert.equal(byCode.ESG6005.name, 'Sustainability Assessment and ESG Reporting');
  assert.equal(byCode.ESG6008.name, 'ESG Project Management');
  assert.equal(byCode.PUA6027.name, 'Technology and Innovation Policies: Development and Trend');
  assert.match(core.ruleText, /all five Core Courses/);
  assert.match(electives.ruleText, /three of the four Elective Courses/);
  assert.match(programme.statusNote, /complete current code-to-title mapping/);
});
