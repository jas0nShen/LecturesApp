const assert = require('node:assert/strict');
const seed = require('../data/seed.json');
const mock = require('../miniprogram/utils/mockData');

function assertUniqueIds(items, label) {
  const ids = items.map((item) => item.id);
  assert.equal(new Set(ids).size, ids.length, `${label} contains duplicate IDs`);
}

function assertReferences(items, foreignKey, validIds, label) {
  items.forEach((item) => {
    assert(
      validIds.has(item[foreignKey]),
      `${label} ${item.id} references missing ${foreignKey} ${item[foreignKey]}`
    );
  });
}

assert.deepEqual(mock, seed, 'API seed and mini-program fallback data have drifted');

Object.entries(seed).forEach(([label, items]) => assertUniqueIds(items, label));

const universityIds = new Set(seed.universities.map((item) => item.id));
const facultyIds = new Set(seed.faculties.map((item) => item.id));
const programmeIds = new Set(seed.programmes.map((item) => item.id));
const majorIds = new Set(seed.majors.map((item) => item.id));
const courseIds = new Set(seed.courses.map((item) => item.id));

assertReferences(seed.faculties, 'universityId', universityIds, 'Faculty');
assertReferences(seed.programmes, 'universityId', universityIds, 'Programme');
assertReferences(seed.programmes, 'facultyId', facultyIds, 'Programme');
assertReferences(seed.majors, 'programmeId', programmeIds, 'Major');
assertReferences(seed.courses, 'universityId', universityIds, 'Course');
assertReferences(seed.courses, 'programmeId', programmeIds, 'Course');
assertReferences(seed.courses, 'majorId', majorIds, 'Course');
assertReferences(seed.requirements, 'programmeId', programmeIds, 'Requirement');
assertReferences(seed.requirements, 'majorId', majorIds, 'Requirement');

seed.courses.forEach((course) => {
  assert(course.courseCode, `Course ${course.id} is missing a course code`);
  assert(course.credits > 0, `Course ${course.courseCode} has invalid credits`);
  assert.match(course.officialUrl, /^https:\/\//, `Course ${course.courseCode} needs an HTTPS official URL`);
  assert.match(course.lastVerifiedAt, /^\d{4}-\d{2}-\d{2}$/, `Course ${course.courseCode} has an invalid verification date`);
});

seed.requirements.forEach((requirement) => {
  requirement.courseIds.forEach((courseId) => {
    assert(courseIds.has(courseId), `Requirement ${requirement.id} references missing course ${courseId}`);
  });

  const availableCredits = seed.courses
    .filter((course) => requirement.courseIds.includes(course.id))
    .reduce((total, course) => total + course.credits, 0);

  assert(
    availableCredits >= requirement.requiredCredits,
    `Requirement ${requirement.id} requires ${requirement.requiredCredits} credits but only ${availableCredits} are available`
  );
});

console.log(JSON.stringify({
  ok: true,
  universities: seed.universities.length,
  programmes: seed.programmes.length,
  majors: seed.majors.length,
  courses: seed.courses.length,
  requirements: seed.requirements.length
}));
