const fs = require('node:fs');
const path = require('node:path');
const { SOURCES, listCourses, validateSourceDir } = require('./generate-ug-catalog');
const ugService = require('../miniprogram/utils/ugService');

const DEFAULT_SOURCE_DIR = '/Users/shenjingsong/Documents/Codex/2026-07-06/pdf/outputs';

function parseArgs(argv = process.argv.slice(2)) {
  const sourceDirIndex = argv.indexOf('--source-dir');
  const schoolIndex = argv.indexOf('--school');
  const missingLimitIndex = argv.indexOf('--missing-limit');
  return {
    sourceDir: sourceDirIndex === -1 ? DEFAULT_SOURCE_DIR : path.resolve(argv[sourceDirIndex + 1]),
    school: schoolIndex === -1 ? '' : String(argv[schoolIndex + 1] || '').trim().toUpperCase(),
    missingLimit: missingLimitIndex === -1 ? 20 : Number(argv[missingLimitIndex + 1]),
    missingOnly: argv.includes('--missing-only')
  };
}

function summarizeSourceFile(source, sourceDir) {
  const filePath = path.join(sourceDir, source.file);
  const raw = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const programmes = raw.programmes || [];
  const rows = programmes.map((programme) => {
    const courses = listCourses(programme);
    const codedCourses = courses.filter((course) => course.code);
    const uncodedCourses = courses.filter((course) => !course.code);
    return {
      programmeCode: programme.programme_code || programme.jupas_code || '',
      programmeName: programme.programme_name || '',
      courseRowCount: courses.length,
      codedCourseCount: codedCourses.length,
      uncodedCourseRowCount: uncodedCourses.length
    };
  });
  const programmeWithCodedCoursesCount = rows.filter((row) => row.codedCourseCount > 0).length;
  const programmeSummaryOnlyCount = rows.filter((row) => row.codedCourseCount === 0 && row.courseRowCount > 0).length;

  return {
    code: source.code,
    file: source.file,
    programmeCount: programmes.length,
    courseRowCount: rows.reduce((sum, row) => sum + row.courseRowCount, 0),
    codedCourseCount: rows.reduce((sum, row) => sum + row.codedCourseCount, 0),
    uncodedCourseRowCount: rows.reduce((sum, row) => sum + row.uncodedCourseRowCount, 0),
    programmeWithCodedCoursesCount,
    programmeSummaryOnlyCount,
    importReady: programmeWithCodedCoursesCount > 0
  };
}

function summarizeSources(sourceDir) {
  validateSourceDir(sourceDir);
  const schools = SOURCES.map((source) => summarizeSourceFile(source, sourceDir));
  return {
    sourceDir,
    schools,
    totals: {
      programmeCount: schools.reduce((sum, school) => sum + school.programmeCount, 0),
      courseRowCount: schools.reduce((sum, school) => sum + school.courseRowCount, 0),
      codedCourseCount: schools.reduce((sum, school) => sum + school.codedCourseCount, 0),
      uncodedCourseRowCount: schools.reduce((sum, school) => sum + school.uncodedCourseRowCount, 0),
      programmeWithCodedCoursesCount: schools.reduce((sum, school) => sum + school.programmeWithCodedCoursesCount, 0),
      programmeSummaryOnlyCount: schools.reduce((sum, school) => sum + school.programmeSummaryOnlyCount, 0)
    }
  };
}

function filterSchools(schools, schoolCode = '') {
  if (!schoolCode) return schools;
  return schools.filter((school) => school.code === schoolCode);
}

function buildGeneratedTotals(schools) {
  return {
    programmeCount: schools.reduce((sum, school) => sum + school.programmeCount, 0),
    majorCount: schools.reduce((sum, school) => sum + school.majorCount, 0),
    programmeWithCoursesCount: schools.reduce((sum, school) => sum + school.programmeWithCoursesCount, 0),
    missingProgrammeCount: schools.reduce((sum, school) => sum + school.missingProgrammeCount, 0),
    codedCourseCount: schools.reduce((sum, school) => sum + school.codedCourseCount, 0)
  };
}

function summarizeGeneratedCatalogue(options = {}) {
  const schools = filterSchools(ugService.listUniversities().map((university) => {
    const programmes = ugService.listProgrammes({
      universityId: university.id,
      degreeLevel: 'undergraduate'
    });
    const majors = programmes.flatMap((programme) => ugService.listMajors(programme.id));
    const programmeWithCoursesCount = programmes.filter((programme) => (programme.codedCourseCount || 0) > 0).length;
    const codedCourseCount = programmes.reduce((sum, programme) => sum + (programme.codedCourseCount || 0), 0);
    const missingProgrammes = programmes
      .filter((programme) => !(programme.codedCourseCount || 0))
      .map((programme) => ({
        code: programme.jupasCode || programme.code,
        name: programme.nameEn,
        faculty: programme.faculty || ''
      }));

    return {
      code: university.code,
      nameZh: university.nameZh,
      programmeCount: programmes.length,
      majorCount: majors.length,
      programmeWithCoursesCount,
      missingProgrammeCount: missingProgrammes.length,
      codedCourseCount,
      missingProgrammes
    };
  }), options.school);

  return {
    schools,
    totals: buildGeneratedTotals(schools)
  };
}

function printReport(summary) {
  console.log(`UG source coverage: ${summary.sourceDir}`);
  summary.schools.forEach((school) => {
    console.log([
      school.code,
      `${school.programmeCount} programmes`,
      `${school.codedCourseCount} coded courses`,
      `${school.programmeWithCodedCoursesCount} programmes with courses`,
      `${school.programmeSummaryOnlyCount} summary-only programmes`,
      school.importReady ? 'import-ready' : 'needs course-code source'
    ].join(' · '));
  });
  console.log([
    'TOTAL',
    `${summary.totals.programmeCount} programmes`,
    `${summary.totals.codedCourseCount} coded courses`,
    `${summary.totals.programmeWithCodedCoursesCount} programmes with courses`,
    `${summary.totals.programmeSummaryOnlyCount} summary-only programmes`
  ].join(' · '));
}

function printGeneratedCatalogueReport(summary, options = {}) {
  const schoolSuffix = options.school ? ` (${options.school})` : '';
  if (!summary.schools.length) {
    console.log('');
    console.log(`Current mini-program UG catalogue coverage${schoolSuffix}: no matching school`);
    return;
  }
  if (options.missingOnly) {
    printMissingProgrammes(summary, options);
    return;
  }
  console.log('');
  console.log(`Current mini-program UG catalogue coverage${schoolSuffix}:`);
  summary.schools.forEach((school) => {
    console.log([
      school.code,
      school.nameZh,
      `${school.programmeCount} programmes`,
      `${school.majorCount} majors/tracks`,
      `${school.codedCourseCount} coded courses`,
      `${school.programmeWithCoursesCount} programmes with courses`,
      `${school.missingProgrammeCount} programmes pending`
    ].join(' · '));
  });
  console.log([
    'TOTAL',
    `${summary.totals.programmeCount} programmes`,
    `${summary.totals.majorCount} majors/tracks`,
    `${summary.totals.codedCourseCount} coded courses`,
    `${summary.totals.programmeWithCoursesCount} programmes with courses`,
    `${summary.totals.missingProgrammeCount} programmes pending`
  ].join(' · '));

  printMissingProgrammes(summary, options);
}

function printMissingProgrammes(summary, options = {}) {
  const missingLimit = Number.isFinite(Number(options.missingLimit)) ? Number(options.missingLimit) : 20;
  if (missingLimit <= 0) return;
  const missing = summary.schools
    .flatMap((school) => school.missingProgrammes.map((programme) => ({
      schoolCode: school.code,
      ...programme
    })))
    .slice(0, missingLimit);
  if (!missing.length) return;

  console.log('');
  console.log(`Next missing UG programmes (first ${missing.length}):`);
  missing.forEach((programme) => {
    console.log([
      programme.schoolCode,
      programme.code,
      programme.name,
      programme.faculty
    ].filter(Boolean).join(' · '));
  });
}

function main() {
  const options = parseArgs();
  if (!options.missingOnly) printReport(summarizeSources(options.sourceDir));
  printGeneratedCatalogueReport(summarizeGeneratedCatalogue(options), options);
}

if (require.main === module) {
  main();
}

module.exports = {
  parseArgs,
  summarizeSourceFile,
  summarizeSources,
  summarizeGeneratedCatalogue,
  filterSchools,
  printGeneratedCatalogueReport
};
