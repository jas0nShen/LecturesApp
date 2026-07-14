const ug = require('../miniprogram/utils/ugCatalogue');
const tpg = require('../data/tpg-programmes.json');

function duplicateValues(items, getter) {
  const counts = new Map();
  items.forEach((item) => {
    const value = getter(item);
    if (value) counts.set(value, (counts.get(value) || 0) + 1);
  });
  return [...counts].filter(([, count]) => count > 1).map(([value]) => value);
}

function audit({ ugCatalogue = ug, tpgCatalogue = tpg } = {}) {
  const ugProgrammeIds = new Set(ugCatalogue.programmes.map((item) => item.id));
  const tpgUniversityCodes = new Set(tpgCatalogue.universities.map((item) => item.code));
  const tracks = tpgCatalogue.programmes.flatMap((programme) => (
    (programme.tracks || []).map((track) => ({ ...track, programmeId: programme.id }))
  ));
  const universityByCode = new Map(tpgCatalogue.universities.map((item) => [item.code, item]));
  const hasTpgSource = (programme) => Boolean(
    programme.sourceUrl || (universityByCode.get(programme.universityCode) || {}).sourceUrl
  );
  const report = {
    generatedAt: new Date().toISOString(),
    undergraduate: {
      programmes: ugCatalogue.programmes.length,
      majors: ugCatalogue.majors.length,
      duplicateProgrammeIds: duplicateValues(ugCatalogue.programmes, (item) => item.id),
      duplicateMajorIds: duplicateValues(ugCatalogue.majors, (item) => item.id),
      orphanMajorIds: ugCatalogue.majors.filter((item) => !ugProgrammeIds.has(item.programmeId)).map((item) => item.id),
      missingProgrammeSourceIds: ugCatalogue.programmes.filter((item) => !item.officialUrl).map((item) => item.id),
      missingMajorSourceIds: ugCatalogue.majors.filter((item) => !item.officialUrl).map((item) => item.id),
      missingOfficialCodeIds: ugCatalogue.programmes.filter((item) => !item.code && !item.jupasCode).map((item) => item.id)
    },
    taughtPostgraduate: {
      universities: tpgCatalogue.universities.length,
      programmes: tpgCatalogue.programmes.length,
      tracks: tracks.length,
      emptyUniversityCodes: tpgCatalogue.universities.filter(
        (university) => !tpgCatalogue.programmes.some((programme) => programme.universityCode === university.code)
      ).map((item) => item.code),
      unknownUniversityProgrammeIds: tpgCatalogue.programmes.filter(
        (programme) => !tpgUniversityCodes.has(programme.universityCode)
      ).map((item) => item.id),
      duplicateProgrammeIds: duplicateValues(tpgCatalogue.programmes, (item) => item.id),
      duplicateTrackIds: duplicateValues(tracks, (item) => item.id),
      missingProgrammeSourceIds: tpgCatalogue.programmes.filter((item) => !hasTpgSource(item)).map((item) => item.id),
      missingOfficialCodeIds: tpgCatalogue.programmes.filter((item) => !item.programmeCode).map((item) => item.id),
      fieldLabelOnlyProgrammeIds: tpgCatalogue.programmes.filter(
        (item) => item.nameKind === 'official_field_label'
      ).map((item) => item.id),
      missingAcademicYearCodes: tpgCatalogue.universities.filter(
        (item) => !/^\d{4}-\d{2}$/.test(item.academicYear || '')
      ).map((item) => item.code),
      invalidProgrammeAcademicYearIds: tpgCatalogue.programmes.filter(
        (item) => item.academicYear && !/^\d{4}-\d{2}(?: and thereafter)?$/.test(item.academicYear)
      ).map((item) => item.id),
      invalidTrackProgrammeIds: tracks.filter(
        (track) => !tpgCatalogue.programmes.some((programme) => programme.id === track.programmeId)
      ).map((track) => track.id)
    }
  };
  report.blockingErrors = [
    ...report.undergraduate.duplicateProgrammeIds,
    ...report.undergraduate.duplicateMajorIds,
    ...report.undergraduate.orphanMajorIds,
    ...report.undergraduate.missingProgrammeSourceIds,
    ...report.undergraduate.missingMajorSourceIds,
    ...report.taughtPostgraduate.emptyUniversityCodes,
    ...report.taughtPostgraduate.unknownUniversityProgrammeIds,
    ...report.taughtPostgraduate.duplicateProgrammeIds,
    ...report.taughtPostgraduate.duplicateTrackIds,
    ...report.taughtPostgraduate.missingProgrammeSourceIds,
    ...report.taughtPostgraduate.missingAcademicYearCodes,
    ...report.taughtPostgraduate.invalidProgrammeAcademicYearIds,
    ...report.taughtPostgraduate.invalidTrackProgrammeIds
  ];
  return report;
}

if (require.main === module) {
  const report = audit();
  console.log(JSON.stringify(report, null, 2));
  if (process.argv.includes('--check') && report.blockingErrors.length) process.exitCode = 1;
}

module.exports = { audit, duplicateValues };
