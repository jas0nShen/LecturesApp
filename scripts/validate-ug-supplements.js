const assert = require('node:assert/strict');
const { loadGenericCourseSupplements } = require('./generate-ug-catalog');

function hasHttpsUrl(value) {
  return /^https:\/\//.test(String(value || '').trim());
}

function getCourseCode(course = {}) {
  return String(course.code || course.courseCode || course.course_code || '').trim();
}

function getCourseTitle(course = {}) {
  return String(course.title || course.titleEn || course.courseTitle || course.course_title || '').trim();
}

function assertNoPlaceholder(value, label) {
  assert(!/(?:\b(?:TODO|TBC|TBD|PLACEHOLDER)\b|待填|待补)/i.test(String(value || '')), `${label} contains placeholder text`);
}

function validateMajorOverride(supplement, label) {
  const declaration = supplement.majorOverride;
  if (!declaration) return;

  assert.equal(typeof declaration, 'object', `${label} majorOverride must be an object`);
  assert(supplement.programmeId, `${label} majorOverride requires programmeId`);
  assert(supplement.majorId, `${label} majorOverride requires majorId`);
  assert(!supplement.createMajor, `${label} cannot combine majorOverride and createMajor`);

  const expectedMajorIds = declaration.expectedMajorIds;
  assert(Array.isArray(expectedMajorIds) && expectedMajorIds.length > 0, `${label} majorOverride needs expectedMajorIds`);
  expectedMajorIds.forEach((majorId, index) => {
    assert.equal(typeof majorId, 'string', `${label} majorOverride expectedMajorIds[${index}] must be a string`);
    assert(majorId.trim(), `${label} majorOverride expectedMajorIds[${index}] is empty`);
    assert(majorId.startsWith(`${supplement.programmeId}-M`), `${label} majorOverride Major ${majorId} does not belong to programmeId`);
  });
  assert.equal(new Set(expectedMajorIds).size, expectedMajorIds.length, `${label} majorOverride expectedMajorIds must be unique`);

  ['id', 'code', 'nameEn'].forEach((field) => {
    assert(String(declaration[field] || '').trim(), `${label} majorOverride is missing ${field}`);
    assertNoPlaceholder(declaration[field], `${label} majorOverride ${field}`);
  });
  assert.equal(supplement.majorId, declaration.id, `${label} majorOverride id must match majorId`);
  assert(expectedMajorIds.includes(declaration.id), `${label} majorOverride id must be included in expectedMajorIds`);
}

function validateSupplement(supplement, index) {
  const label = supplement.provider || supplement.jupasCode || supplement.programmeName || `supplement #${index + 1}`;
  assert(supplement.universityCode, `${label} is missing universityCode`);
  assert(
    supplement.jupasCode || supplement.programmeCode || supplement.programmeId || supplement.programmeName || supplement.programmeNameIncludes,
    `${label} needs a programme matcher`
  );
  assert(
    hasHttpsUrl(supplement.sourceUrl) || hasHttpsUrl(supplement.officialUrl),
    `${label} needs an HTTPS sourceUrl or officialUrl`
  );
  assertNoPlaceholder(label, `${label} provider`);
  validateMajorOverride(supplement, label);

  const hasExplicitCourses = Array.isArray(supplement.courses);
  const hasCopySource = supplement.copyCoursesFrom && Object.keys(supplement.copyCoursesFrom).length > 0;
  assert(hasExplicitCourses || hasCopySource, `${label} needs courses or copyCoursesFrom`);

  if (!hasExplicitCourses) return;
  supplement.courses.forEach((course, courseIndex) => {
    const courseLabel = `${label} course #${courseIndex + 1}`;
    const code = getCourseCode(course);
    const title = getCourseTitle(course);
    const sourceUrl = course.sourceUrl || supplement.sourceUrl || course.officialUrl || supplement.officialUrl;
    const credits = course.credits ?? course.units;

    assert(code, `${courseLabel} is missing a course code`);
    assert(title, `${courseLabel} is missing a title`);
    assert(hasHttpsUrl(sourceUrl), `${courseLabel} needs an HTTPS sourceUrl`);
    assertNoPlaceholder(code, `${courseLabel} code`);
    assertNoPlaceholder(title, `${courseLabel} title`);
    if (credits !== undefined) {
      assert(Number.isFinite(Number(credits)) && Number(credits) >= 0, `${courseLabel} has invalid credits`);
    }
  });
}

function validateUgSupplements(supplements = loadGenericCourseSupplements()) {
  supplements.forEach(validateSupplement);
  return {
    ok: true,
    supplements: supplements.length,
    explicitCourseSupplements: supplements.filter((supplement) => Array.isArray(supplement.courses)).length,
    copiedCourseSupplements: supplements.filter((supplement) => supplement.copyCoursesFrom).length
  };
}

if (require.main === module) {
  console.log(JSON.stringify(validateUgSupplements()));
}

module.exports = {
  validateUgSupplements,
  validateSupplement,
  getCourseCode,
  getCourseTitle
};
