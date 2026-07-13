const catalogue = require('../data/tpg-programmes.json');

function inspectProgramme(programme, today = new Date()) {
  const issues = [];
  const groups = programme.courseGroups || [];
  const courses = groups.flatMap((group) => group.courses || []);
  const trackIds = new Set((programme.tracks || []).map((track) => track.id));
  const seenCodes = new Set();
  const inspectTrackReferences = (item, label) => {
    (item.appliesToTrackIds || []).forEach((id) => {
      if (!trackIds.has(id)) issues.push(`${label}:unknown-track:${id}`);
    });
    (item.excludesTrackIds || []).forEach((id) => {
      if (!trackIds.has(id)) issues.push(`${label}:unknown-excluded-track:${id}`);
      if ((item.appliesToTrackIds || []).includes(id)) issues.push(`${label}:conflicting-track:${id}`);
    });
    ['creditsRequiredByTrackIds', 'coursesRequiredByTrackIds'].forEach((field) => {
      Object.entries(item[field] || {}).forEach(([id, value]) => {
        if (!trackIds.has(id)) issues.push(`${label}:${field}:unknown-track:${id}`);
        if (!(Number.isFinite(Number(value)) && Number(value) > 0)) issues.push(`${label}:${field}:invalid:${id}`);
      });
    });
  };
  if (programme.courseVerificationStatus === 'blocked') {
    return { programmeId: programme.id, universityCode: programme.universityCode, courseCount: courses.length, issues: ['source-blocked'] };
  }
  if (programme.courseVerificationStatus === 'archived') {
    return { programmeId: programme.id, universityCode: programme.universityCode, courseCount: courses.length, issues: ['archived'] };
  }
  if (!groups.length) issues.push('missing-course-groups');
  if (!programme.courseSourceUrl && !programme.sourceUrl) issues.push('missing-course-source');
  if (!programme.courseVerifiedAt) issues.push('missing-verification-date');
  if (!programme.creditUnit) issues.push('missing-credit-unit');
  groups.forEach((group) => {
    if (!group.type) issues.push(`group:${group.id || group.name}:missing-type`);
    if (!group.sourceUrl && !programme.courseSourceUrl && !programme.sourceUrl) issues.push(`group:${group.id || group.name}:missing-source`);
    inspectTrackReferences(group, `group:${group.id || group.name}`);
    (group.courses || []).forEach((course) => {
      if (!course.code) issues.push('course:missing-code');
      if (!course.name) issues.push(`course:${course.code || '?'}:missing-name`);
      if (!(course.credits !== undefined && Number.isFinite(Number(course.credits)) && Number(course.credits) >= 0) && !(Number(course.creditsMin) > 0 && Number(course.creditsMax) >= Number(course.creditsMin))) issues.push(`course:${course.code || '?'}:missing-credits`);
      if (!course.sourceUrl && !group.sourceUrl && !programme.courseSourceUrl && !programme.sourceUrl) issues.push(`course:${course.code || '?'}:missing-source`);
      if (seenCodes.has(course.code)) issues.push(`course:${course.code}:duplicate`);
      seenCodes.add(course.code);
      inspectTrackReferences(course, `course:${course.code}`);
      (course.countsTowardTrackIds || []).forEach((id) => {
        if (!trackIds.has(id)) issues.push(`course:${course.code}:unknown-counts-toward-track:${id}`);
      });
    });
  });
  const year = programme.academicYear || '';
  const startYear = Number(year.slice(0, 4));
  if (startYear && startYear < today.getFullYear() - 1) issues.push('stale-academic-year');
  if (programme.ruleReviewStatus === 'manual_review_required') issues.push('manual-rule-review');
  return { programmeId: programme.id, universityCode: programme.universityCode, courseCount: courses.length, issues: [...new Set(issues)] };
}

function buildCoverageReport(programmes = catalogue.programmes) {
  const rows = programmes.map((programme) => inspectProgramme(programme));
  const schools = [...new Set(programmes.map((item) => item.universityCode))].map((code) => {
    const items = rows.filter((row) => row.universityCode === code);
    const complete = items.filter((row) => !row.issues.some((issue) => issue !== 'manual-rule-review'));
    return { code, programmes: items.length, complete: complete.length, pending: items.length - complete.length, courses: items.reduce((n, row) => n + row.courseCount, 0) };
  });
  return { programmes: rows.length, complete: schools.reduce((n, school) => n + school.complete, 0), schools, rows };
}

function main() {
  const report = buildCoverageReport();
  const school = process.argv.find((arg) => arg.startsWith('--school='));
  const filtered = school ? report.rows.filter((row) => row.universityCode === school.split('=')[1].toUpperCase()) : report.rows;
  console.log(JSON.stringify({ ...report, rows: filtered }, null, 2));
  if (process.argv.includes('--check') && report.complete !== report.programmes) process.exitCode = 1;
}

if (require.main === module) main();
module.exports = { buildCoverageReport, inspectProgramme };
