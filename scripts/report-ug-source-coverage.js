const fs = require('node:fs');
const path = require('node:path');
const { SOURCES, listCourses, validateSourceDir } = require('./generate-ug-catalog');

const DEFAULT_SOURCE_DIR = '/Users/shenjingsong/Documents/Codex/2026-07-06/pdf/outputs';

function parseArgs(argv = process.argv.slice(2)) {
  const sourceDirIndex = argv.indexOf('--source-dir');
  return {
    sourceDir: sourceDirIndex === -1 ? DEFAULT_SOURCE_DIR : path.resolve(argv[sourceDirIndex + 1])
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

function main() {
  const { sourceDir } = parseArgs();
  printReport(summarizeSources(sourceDir));
}

if (require.main === module) {
  main();
}

module.exports = {
  parseArgs,
  summarizeSourceFile,
  summarizeSources
};
