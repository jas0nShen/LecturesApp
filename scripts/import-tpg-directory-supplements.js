const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const cataloguePath = path.join(ROOT, 'data', 'tpg-programmes.json');
const supplementPath = path.join(ROOT, 'data', 'tpg-directory-supplements.json');

function slug(value) {
  return String(value || '')
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 48);
}

function buildId(universityCode, programmeCode, name, index) {
  const stablePart = slug(programmeCode) || slug(name);
  return `${universityCode}-TPG-DIR-${stablePart || index + 1}`;
}

const EDUHK_MED_TRACKS = [
  ['BH', 'Business Education and Human Resources Development'],
  ['CTA', 'Curriculum, Teaching and Assessment'],
  ['EC', 'Early Childhood Education'],
  ['EDP', 'Educational and Developmental Psychology'],
  ['ELS', 'Educational Leadership'],
  ['EDS', 'Educational Studies'],
  ['EAP', 'English for Academic Purposes'],
  ['HPE', 'Health and Physical Education'],
  ['MTSE', 'Mathematics, Technology, Science and Environment'],
  ['SNC', 'Special Needs, Giftedness and Counselling']
];

function applyDirectorySupplements(inputCatalogue, supplement) {
  const catalogue = JSON.parse(JSON.stringify(inputCatalogue));
  const existingProgrammesById = new Map(catalogue.programmes.map((programme) => [programme.id, programme]));
  const supplementCodes = new Set(supplement.universities.map((item) => item.code));
  catalogue.programmes = catalogue.programmes.filter(
    (programme) => !supplementCodes.has(programme.universityCode) || !programme.directorySupplement
  );

  supplement.universities.forEach((source) => {
  const university = catalogue.universities.find((item) => item.code === source.code);
  if (!university) throw new Error(`Unknown TPG university ${source.code}`);
  university.academicYear = source.academicYear;
  university.sourceFile = 'tpg-directory-supplements.json';
  university.sourceUrl = source.sourceUrl;
  university.sourcePages = 1;
  university.verificationStatus = 'official_directory_imported';

  const programmes = source.programmes.map((rawEntry, index) => {
    const entry = Array.isArray(rawEntry)
      ? { programmeCode: rawEntry[0], name: rawEntry[1], academicYear: rawEntry[2] }
      : rawEntry;
    const programmeCode = entry.programmeCode || '';
    const name = entry.name;
    const programmeYear = entry.academicYear;
    const id = source.nameKind === 'official_field_label' && !programmeCode
      ? `${source.code}-TPG-DIR-${String(index + 1).padStart(3, '0')}`
      : buildId(source.code, programmeCode, name, index);
    const isEduhkMed = source.code === 'EDUHK' && programmeCode === 'MEd';
    const existingProgramme = existingProgrammesById.get(id);
    const tracks = isEduhkMed ? EDUHK_MED_TRACKS.map(([code, trackName]) => ({
      id: `${id}-${code}`,
      code,
      name: trackName,
      type: 'area_of_focus',
      sourceUrl: 'https://gs.eduhk.hk/prospective/med/',
      lastVerifiedAt: supplement.lastVerifiedAt
    })) : (entry.tracks || []).map((track, trackIndex) => ({
      id: `${id}-${slug(track.code || track.name) || trackIndex + 1}`,
      code: track.code || '',
      name: track.name,
      type: track.type || 'specialism',
      sourceUrl: track.sourceUrl || entry.sourceUrl || source.sourceUrl,
      lastVerifiedAt: supplement.lastVerifiedAt
    }));
    return {
    ...(existingProgramme || {}),
    id,
    universityCode: source.code,
    programmeCode,
    name,
    academicYear: programmeYear || source.academicYear,
    faculty: entry.faculty || 'Faculty / School shown on official programme page',
    creditsRequired: isEduhkMed
      ? 24
      : entry.creditsRequired || (existingProgramme && existingProgramme.creditsRequired) || null,
    sourceUrl: isEduhkMed ? 'https://gs.eduhk.hk/prospective/med/' : entry.sourceUrl || source.sourceUrl,
    sourceLabel: source.sourceLabel,
    nameKind: entry.nameKind || source.nameKind || 'official_programme_name',
    lastVerifiedAt: supplement.lastVerifiedAt,
    sourceStatus: source.nameKind === 'official_field_label'
      ? 'official_field_index'
      : 'programme_directory_verified',
    directorySupplement: true,
    trackSelectionOptional: entry.trackSelectionOptional !== undefined
      ? Boolean(entry.trackSelectionOptional)
      : existingProgramme && existingProgramme.trackSelectionOptional,
    tracks,
    dataLevel: existingProgramme && existingProgramme.courseGroups && existingProgramme.courseGroups.length
      ? existingProgramme.dataLevel
      : 'programme',
    courseGroups: existingProgramme && existingProgramme.courseGroups
      ? existingProgramme.courseGroups
      : []
  };
  });
  university.programmeCount = programmes.length;
  catalogue.programmes.push(...programmes);
  });
  return catalogue;
}

function main() {
  const currentText = fs.readFileSync(cataloguePath, 'utf8');
  const currentCatalogue = JSON.parse(currentText);
  const supplement = JSON.parse(fs.readFileSync(supplementPath, 'utf8'));
  const catalogue = applyDirectorySupplements(currentCatalogue, supplement);
  const expectedText = `${JSON.stringify(catalogue, null, 2)}\n`;
  if (process.argv.includes('--check')) {
    if (currentText !== expectedText) {
      console.error('TPG directory supplements are out of sync. Run npm run import:tpg-directories.');
      process.exitCode = 1;
      return;
    }
    console.log('TPG directory supplements are in sync.');
    return;
  }
  fs.writeFileSync(cataloguePath, expectedText);
  console.log(JSON.stringify({
    ok: true,
    universities: supplement.universities.map((source) => ({
      code: source.code,
      programmes: source.programmes.length
    })),
    totalProgrammes: catalogue.programmes.length
  }));
}

if (require.main === module) main();

module.exports = { applyDirectorySupplements, buildId, slug };
