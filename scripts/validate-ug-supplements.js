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
