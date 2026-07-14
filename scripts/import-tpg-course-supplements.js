const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const sourcePath = path.join(ROOT, 'data', 'tpg-programmes.json');
const supplementsDir = path.join(ROOT, 'data', 'tpg-course-supplements');

function readSupplements(directory = supplementsDir) {
  if (!fs.existsSync(directory)) return [];
  return fs.readdirSync(directory)
    .filter((name) => name.endsWith('.json') && !name.startsWith('_'))
    .sort()
    .map((name) => ({
      file: name,
      value: JSON.parse(fs.readFileSync(path.join(directory, name), 'utf8'))
    }));
}

function validateHttps(value, label) {
  assert.match(value || '', /^https:\/\//, `${label} needs an official HTTPS source`);
}

function validateTrackReferences(item, trackIds, label) {
  const appliesToTrackIds = item.appliesToTrackIds || [];
  const excludesTrackIds = item.excludesTrackIds || [];
  assert(Array.isArray(appliesToTrackIds), `${label} has invalid appliesToTrackIds`);
  assert(Array.isArray(excludesTrackIds), `${label} has invalid excludesTrackIds`);
  appliesToTrackIds.forEach((trackId) => assert(trackIds.has(trackId), `${label} references unknown Track ${trackId}`));
  excludesTrackIds.forEach((trackId) => assert(trackIds.has(trackId), `${label} excludes unknown Track ${trackId}`));
  appliesToTrackIds.forEach((trackId) => assert(!excludesTrackIds.includes(trackId), `${label} both applies to and excludes Track ${trackId}`));
  ['creditsRequiredByTrackIds', 'coursesRequiredByTrackIds'].forEach((field) => {
    if (item[field] === undefined) return;
    assert(item[field] && typeof item[field] === 'object' && !Array.isArray(item[field]), `${label} has invalid ${field}`);
    Object.entries(item[field]).forEach(([trackId, value]) => {
      assert(trackIds.has(trackId), `${label}/${field} references unknown Track ${trackId}`);
      assert(Number.isFinite(Number(value)) && Number(value) > 0, `${label}/${field}/${trackId} has an invalid requirement`);
      if (field === 'coursesRequiredByTrackIds') assert(Number.isInteger(Number(value)), `${label}/${field}/${trackId} must be an integer`);
    });
  });
  if (item.typeByTrackIds !== undefined) {
    assert(item.typeByTrackIds && typeof item.typeByTrackIds === 'object' && !Array.isArray(item.typeByTrackIds), `${label} has invalid typeByTrackIds`);
    Object.entries(item.typeByTrackIds).forEach(([trackId, value]) => {
      assert(trackIds.has(trackId), `${label}/typeByTrackIds references unknown Track ${trackId}`);
      assert(typeof value === 'string' && value.trim(), `${label}/typeByTrackIds/${trackId} has an invalid type`);
    });
  }
  if (item.nameByTrackIds !== undefined) {
    assert(item.nameByTrackIds && typeof item.nameByTrackIds === 'object' && !Array.isArray(item.nameByTrackIds), `${label} has invalid nameByTrackIds`);
    Object.entries(item.nameByTrackIds).forEach(([trackId, value]) => {
      assert(trackIds.has(trackId), `${label}/nameByTrackIds references unknown Track ${trackId}`);
      assert(typeof value === 'string' && value.trim(), `${label}/nameByTrackIds/${trackId} has an invalid name`);
    });
  }
}

function validateSupplement(supplement, catalogue, file = 'supplement') {
  assert.equal(supplement.schemaVersion, 1, `${file} has an unsupported schemaVersion`);
  assert.match(supplement.schoolCode || '', /^[A-Z]+$/, `${file} needs a schoolCode`);
  assert.match(supplement.academicYear || '', /^\d{4}-\d{2}(?: and thereafter)?$/, `${file} needs an academicYear`);
  assert.match(supplement.verifiedAt || '', /^\d{4}-\d{2}-\d{2}$/, `${file} needs a verifiedAt date`);
  assert(Array.isArray(supplement.programmes), `${file} needs programmes`);

  const programmesById = new Map(catalogue.programmes.map((item) => [item.id, item]));
  const seenProgrammeIds = new Set();
  supplement.programmes.forEach((entry) => {
    const programme = programmesById.get(entry.programmeId);
    assert(programme, `${file} references unknown Programme ${entry.programmeId}`);
    assert.equal(programme.universityCode, supplement.schoolCode, `${entry.programmeId} belongs to another school`);
    assert(!seenProgrammeIds.has(entry.programmeId), `${file} repeats ${entry.programmeId}`);
    seenProgrammeIds.add(entry.programmeId);
    assert(['verified', 'blocked', 'archived'].includes(entry.status), `${entry.programmeId} has an invalid status`);
    validateHttps(entry.sourceUrl, entry.programmeId);

    if (entry.tracks !== undefined) {
      assert(Array.isArray(entry.tracks), `${entry.programmeId} has invalid Tracks`);
      const entryTrackIds = new Set();
      entry.tracks.forEach((track) => {
        assert(track.id && track.name && track.type, `${entry.programmeId} has an incomplete Track`);
        if (track.creditsRequired !== undefined) assert(Number(track.creditsRequired) > 0, `${track.id} has invalid creditsRequired`);
        assert(!entryTrackIds.has(track.id), `${entry.programmeId} repeats Track ${track.id}`);
        entryTrackIds.add(track.id);
        validateHttps(track.sourceUrl, track.id);
      });
    }

    if (entry.status !== 'verified') {
      assert(!(entry.courseGroups || []).length, `${entry.programmeId} cannot publish courses while ${entry.status}`);
      assert(entry.statusNote, `${entry.programmeId} needs a statusNote`);
      return;
    }

    assert(Number(entry.creditsRequired) > 0, `${entry.programmeId} needs creditsRequired`);
    assert(entry.creditUnit, `${entry.programmeId} needs creditUnit`);
    assert(Array.isArray(entry.courseGroups) && entry.courseGroups.length, `${entry.programmeId} needs courseGroups`);
    const trackIds = new Set((entry.tracks || programme.tracks || []).map((track) => track.id));
    const courseCodes = new Set();
    const groupIds = new Set();
    entry.courseGroups.forEach((group) => {
      assert(group.id, `${entry.programmeId} has a group without id`);
      assert(!groupIds.has(group.id), `${entry.programmeId} repeats group ${group.id}`);
      groupIds.add(group.id);
      assert(group.name && group.type, `${entry.programmeId}/${group.id} needs name and type`);
      validateHttps(group.sourceUrl || entry.sourceUrl, `${entry.programmeId}/${group.id}`);
      assert(Array.isArray(group.courses), `${entry.programmeId}/${group.id} needs courses`);
      validateTrackReferences(group, trackIds, `${entry.programmeId}/${group.id}`);
      group.courses.forEach((course) => {
        assert(course.code && course.name, `${entry.programmeId}/${group.id} has an incomplete course`);
        assert(!courseCodes.has(course.code), `${entry.programmeId} repeats course ${course.code}`);
        courseCodes.add(course.code);
        assert(
          (course.credits !== undefined && Number.isFinite(Number(course.credits)) && Number(course.credits) >= 0) || (Number(course.creditsMin) > 0 && Number(course.creditsMax) >= Number(course.creditsMin)),
          `${entry.programmeId}/${course.code} needs official credits`
        );
        validateHttps(course.sourceUrl || group.sourceUrl || entry.sourceUrl, `${entry.programmeId}/${course.code}`);
        validateTrackReferences(course, trackIds, `${entry.programmeId}/${course.code}`);
        (course.countsTowardTrackIds || []).forEach((trackId) => {
          assert(trackIds.has(trackId), `${entry.programmeId}/${course.code} counts toward unknown Track ${trackId}`);
        });
      });
    });
  });
}

function applySupplements(catalogue, supplementFiles) {
  const next = JSON.parse(JSON.stringify(catalogue));
  const programmesById = new Map(next.programmes.map((item) => [item.id, item]));
  const supplementedProgrammeIds = new Set();
  supplementFiles.forEach(({ file, value }) => {
    validateSupplement(value, next, file);
    value.programmes.forEach((entry) => {
      assert(!supplementedProgrammeIds.has(entry.programmeId), `TPG course supplements repeat ${entry.programmeId} across files`);
      supplementedProgrammeIds.add(entry.programmeId);
      const programme = programmesById.get(entry.programmeId);
      programme.academicYear = value.academicYear;
      programme.courseVerificationStatus = entry.status;
      programme.courseVerifiedAt = value.verifiedAt;
      programme.courseSourceUrl = entry.sourceUrl;
      programme.courseStatusNote = entry.statusNote || '';
      if (entry.status === 'verified') {
        if (entry.tracks !== undefined) {
          const existingTracksById = new Map((programme.tracks || []).map((track) => [track.id, track]));
          programme.tracks = entry.tracks.map((track) => ({
            ...(existingTracksById.get(track.id) || {}),
            ...track
          }));
        }
        if (entry.trackSelectionOptional !== undefined) programme.trackSelectionOptional = Boolean(entry.trackSelectionOptional);
        programme.creditsRequired = entry.creditsRequired;
        programme.creditUnit = entry.creditUnit;
        programme.courseGroups = entry.courseGroups.map((group) => ({
          ...group,
          sourceUrl: group.sourceUrl || entry.sourceUrl,
          courses: group.courses.map((course) => ({
            ...course,
            sourceUrl: course.sourceUrl || group.sourceUrl || entry.sourceUrl
          }))
        }));
        programme.dataLevel = 'structure';
        programme.ruleReviewStatus = entry.ruleReviewStatus || 'manual_review_required';
      }
    });
  });
  return next;
}

function main() {
  const check = process.argv.includes('--check');
  const catalogue = JSON.parse(fs.readFileSync(sourcePath, 'utf8'));
  const supplements = readSupplements();
  const next = applySupplements(catalogue, supplements);
  const output = `${JSON.stringify(next, null, 2)}\n`;
  if (check) {
    assert.equal(fs.readFileSync(sourcePath, 'utf8'), output, 'TPG course supplements are not imported; run npm run import:tpg-courses');
  } else {
    fs.writeFileSync(sourcePath, output);
  }
  console.log(JSON.stringify({ ok: true, files: supplements.length, programmes: supplements.reduce((n, item) => n + item.value.programmes.length, 0), check }));
}

if (require.main === module) main();

module.exports = { applySupplements, readSupplements, validateSupplement };
