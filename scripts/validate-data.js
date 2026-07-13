const assert = require('node:assert/strict');
const seed = require('../data/seed.json');
const hkuCdsOfferings = require('../data/hku-cds-offerings-2025.json');
const tpgCatalogue = require('../data/tpg-programmes.json');
const mock = require('../miniprogram/utils/mockData');
const tpgMock = require('../miniprogram/utils/tpgCatalog');

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
const expectedTpgIndex = {
  ...tpgCatalogue,
  programmes: tpgCatalogue.programmes.map((programme) => {
    const courseCount = (programme.courseGroups || []).reduce(
      (sum, group) => sum + (Array.isArray(group.courses) ? group.courses.length : 0),
      0
    );
    const { courseGroups, ...indexEntry } = programme;
    return { ...indexEntry, courseCount };
  })
};
assert.deepEqual(tpgMock, expectedTpgIndex, 'TPG source and mini-program catalogue have drifted');

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

  if (requirement.trackingScope !== 'partial') {
    assert(
      availableCredits >= requirement.requiredCredits,
      `Requirement ${requirement.id} requires ${requirement.requiredCredits} credits but only ${availableCredits} are available`
    );
  }
});

seed.programmes.forEach((programme) => {
  const structureCredits = (programme.curriculumStructure || [])
    .reduce((total, section) => total + section.credits, 0);
  assert.equal(
    structureCredits,
    programme.totalCreditRequired,
    `Programme ${programme.id} curriculum structure does not total ${programme.totalCreditRequired} credits`
  );
  assert.match(programme.curriculumSourceUrl, /^https:\/\//);
  assert.match(programme.curriculumVerifiedAt, /^\d{4}-\d{2}-\d{2}$/);
});

assert.equal(hkuCdsOfferings.universityCode, 'HKU');
assert.match(hkuCdsOfferings.academicYear, /^\d{4}-\d{2}$/);
assert.match(hkuCdsOfferings.sourceUrl, /^https:\/\/www\.cs\.hku\.hk\//);
assert(hkuCdsOfferings.courses.length >= 20, 'HKU CDS offering import is unexpectedly small');
assertUniqueIds(
  hkuCdsOfferings.courses.map((course, index) => ({ id: course.courseCode || index })),
  'HKU CDS offerings'
);
hkuCdsOfferings.courses.forEach((course) => {
  assert.match(course.courseCode, /^[A-Z]{4}\d{4}$/);
  assert(course.title, `${course.courseCode} is missing a title`);
  assert(course.terms.length > 0, `${course.courseCode} has no offering term`);
  assert.match(course.officialUrl, /^https:\/\/www\.cs\.hku\.hk\//);
  assert(course.details, `${course.courseCode} has no imported detail record`);
  assert(
    Number.isFinite(course.details.credits) && course.details.credits >= 0,
    `${course.courseCode} has invalid official credits`
  );
  assert(course.details.prerequisites, `${course.courseCode} has no prerequisite status`);
  assert(course.details.corequisites, `${course.courseCode} has no corequisite status`);
  assert(course.details.exclusions, `${course.courseCode} has no exclusion status`);
});

assert.equal(tpgCatalogue.scope, 'taught_postgraduate');
assert.equal(tpgCatalogue.universities.length, 8);
assert(tpgCatalogue.programmes.length >= 300, 'TPG programme import is unexpectedly small');
assertUniqueIds(tpgCatalogue.programmes, 'TPG programmes');
const tpgUniversityCodes = new Set(tpgCatalogue.universities.map((item) => item.code));
tpgCatalogue.universities.forEach((university) => {
  assert.match(university.academicYear, /^\d{4}-\d{2}$/, `${university.code} needs an academic year`);
  assert.match(university.sourceUrl, /^https:\/\//, `${university.code} needs an official source URL`);
  assert(
    tpgCatalogue.programmes.some((programme) => programme.universityCode === university.code),
    `${university.code} has no TPG programmes`
  );
});
const tpgTrackIds = new Set();
tpgCatalogue.programmes.forEach((programme) => {
  assert(tpgUniversityCodes.has(programme.universityCode));
  assert(programme.name, `${programme.id} is missing a programme name`);
  if (programme.academicYear) {
    assert.match(programme.academicYear, /^\d{4}-\d{2}$/, `${programme.id} has an invalid academic year`);
  }
  assert(['programme', 'structure'].includes(programme.dataLevel));
  assert(Array.isArray(programme.courseGroups));
  assert(Array.isArray(programme.tracks || []));
  assert.match(
    programme.sourceUrl || tpgCatalogue.universities.find((item) => item.code === programme.universityCode).sourceUrl,
    /^https:\/\//,
    `${programme.id} needs an official source URL`
  );
  (programme.tracks || []).forEach((track) => {
    assert(track.id, `${programme.id} has a Track without an ID`);
    assert(!tpgTrackIds.has(track.id), `Duplicate TPG Track ID ${track.id}`);
    tpgTrackIds.add(track.id);
    assert(track.name, `${track.id} is missing a name`);
    assert(track.type, `${track.id} is missing a type`);
    assert.match(track.sourceUrl, /^https:\/\//, `${track.id} needs an official source URL`);
  });
  const courseCodes = [];
  programme.courseGroups.forEach((group) => {
    assert(group.name, `${programme.id} has an unnamed course group`);
    assert(Array.isArray(group.courses), `${programme.id} has an invalid course group`);
    group.courses.forEach((course) => {
      assert(course.code, `${programme.id} has a course without a code`);
      assert(course.name, `${programme.id} has a course without a name`);
      courseCodes.push(course.code);
    });
  });
  if (programme.courseVerificationStatus === 'verified') {
    assert.match(programme.courseVerifiedAt || '', /^\d{4}-\d{2}-\d{2}$/, `${programme.id} needs a course verification date`);
    assert.match(programme.courseSourceUrl || '', /^https:\/\//, `${programme.id} needs an official course source`);
    assert(programme.creditUnit, `${programme.id} needs a credit unit`);
    assert(programme.courseGroups.length > 0, `${programme.id} needs verified course groups`);
    const trackIds = new Set((programme.tracks || []).map((track) => track.id));
    programme.courseGroups.forEach((group) => {
      assert(group.id && group.type, `${programme.id} has an incomplete verified group`);
      assert.match(group.sourceUrl || '', /^https:\/\//, `${programme.id}/${group.id} needs an official source`);
      (group.appliesToTrackIds || []).forEach((trackId) => assert(trackIds.has(trackId), `${programme.id}/${group.id} has unknown Track ${trackId}`));
      (group.excludesTrackIds || []).forEach((trackId) => {
        assert(trackIds.has(trackId), `${programme.id}/${group.id} excludes unknown Track ${trackId}`);
        assert(!(group.appliesToTrackIds || []).includes(trackId), `${programme.id}/${group.id} both applies to and excludes Track ${trackId}`);
      });
      ['creditsRequiredByTrackIds', 'coursesRequiredByTrackIds'].forEach((field) => {
        Object.entries(group[field] || {}).forEach(([trackId, value]) => {
          assert(trackIds.has(trackId), `${programme.id}/${group.id}/${field} has unknown Track ${trackId}`);
          assert(Number.isFinite(Number(value)) && Number(value) > 0, `${programme.id}/${group.id}/${field}/${trackId} has an invalid requirement`);
        });
      });
      group.courses.forEach((course) => {
        assert(
          (course.credits !== undefined && Number.isFinite(Number(course.credits)) && Number(course.credits) >= 0) || (Number(course.creditsMin) > 0 && Number(course.creditsMax) >= Number(course.creditsMin)),
          `${programme.id}/${course.code} needs official credits`
        );
        assert.match(course.sourceUrl || '', /^https:\/\//, `${programme.id}/${course.code} needs an official source`);
        (course.appliesToTrackIds || []).forEach((trackId) => assert(trackIds.has(trackId), `${programme.id}/${course.code} has unknown Track ${trackId}`));
        (course.excludesTrackIds || []).forEach((trackId) => {
          assert(trackIds.has(trackId), `${programme.id}/${course.code} excludes unknown Track ${trackId}`);
          assert(!(course.appliesToTrackIds || []).includes(trackId), `${programme.id}/${course.code} both applies to and excludes Track ${trackId}`);
        });
        (course.countsTowardTrackIds || []).forEach((trackId) => assert(trackIds.has(trackId), `${programme.id}/${course.code} counts toward unknown Track ${trackId}`));
      });
    });
  }
  assert.equal(
    new Set(courseCodes).size,
    courseCodes.length,
    `${programme.id} has duplicate course codes`
  );
});

console.log(JSON.stringify({
  ok: true,
  universities: seed.universities.length,
  programmes: seed.programmes.length,
  majors: seed.majors.length,
  courses: seed.courses.length,
  requirements: seed.requirements.length,
  hkuCdsOfferings: hkuCdsOfferings.courses.length,
  tpgUniversities: tpgCatalogue.universities.length,
  tpgProgrammes: tpgCatalogue.programmes.length
}));
