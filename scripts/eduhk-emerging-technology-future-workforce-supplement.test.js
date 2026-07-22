const assert = require('node:assert/strict');
const test = require('node:test');

const supplementFile = require('../data/tpg-course-supplements/eduhk-source-status-2026.json');
const { applySupplements, validateSupplement } = require('./import-tpg-course-supplements');

test('EdUHK MA(ETFW) closes the official 2026-27 four-core plus four-of-six elective path', () => {
  const programme = supplementFile.programmes.find((item) => item.programmeId === 'EDUHK-TPG-DIR-MA-ETFW');
  const supplement = {
    ...supplementFile,
    programmes: [programme]
  };
  const catalogue = {
    programmes: [{
      id: 'EDUHK-TPG-DIR-MA-ETFW',
      universityCode: 'EDUHK',
      name: 'Master of Arts in Emerging Technology for Future Workforce',
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
    [[12, 4, 4], [12, 4, 6]]
  );
  assert.equal(courses.length, 10);
  assert.equal(new Set(courses.map((course) => course.code)).size, 10);
  assert(courses.every((course) => course.credits === 3));
  assert(courses.every((course) => course.sourceUrl === `https://www.eduhk.hk/curriculum/module/${course.code}.html`));

  assert.equal(byCode.INT6140.name, 'Future of Work and Workforce Trends');
  assert.equal(byCode.INT6148.name, 'Futuristic Mindset and Leadership in the Digital Age');
  assert.equal(byCode.INT6136.name, 'Trends in Artificial Intelligence at Workplace and at Home');
  assert.equal(byCode.INT6146.name, 'Capstone Project');
  assert.equal(byCode.INT6146.courseKind, 'project');
  assert.match(electives.ruleText, /research-project or internship pathway/);
  assert.match(programme.statusNote, /same award requirements/);
});
