const fs = require('node:fs');
const path = require('node:path');
const { SOURCES, listCourses, validateSourceDir } = require('./generate-ug-catalog');
const ugService = require('../miniprogram/utils/ugService');

const DEFAULT_SOURCE_DIR = '/Users/shenjingsong/Documents/Codex/2026-07-06/pdf/outputs';

function parseArgs(argv = process.argv.slice(2)) {
  const sourceDirIndex = argv.indexOf('--source-dir');
  const sourceFileIndex = argv.indexOf('--source-file');
  const schoolIndex = argv.indexOf('--school');
  const missingLimitIndex = argv.indexOf('--missing-limit');
  return {
    sourceDir: sourceDirIndex === -1 ? DEFAULT_SOURCE_DIR : path.resolve(argv[sourceDirIndex + 1]),
    sourceFile: sourceFileIndex === -1 ? '' : path.resolve(argv[sourceFileIndex + 1]),
    school: schoolIndex === -1 ? '' : String(argv[schoolIndex + 1] || '').trim().toUpperCase(),
    missingLimit: missingLimitIndex === -1 ? 20 : Number(argv[missingLimitIndex + 1]),
    missingOnly: argv.includes('--missing-only'),
    json: argv.includes('--json')
  };
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let value = '';
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];
    if (quoted) {
      if (char === '"' && next === '"') {
        value += '"';
        index += 1;
      } else if (char === '"') {
        quoted = false;
      } else {
        value += char;
      }
      continue;
    }
    if (char === '"') {
      quoted = true;
    } else if (char === ',') {
      row.push(value);
      value = '';
    } else if (char === '\n') {
      row.push(value);
      rows.push(row);
      row = [];
      value = '';
    } else if (char !== '\r') {
      value += char;
    }
  }
  if (value || row.length) {
    row.push(value);
    rows.push(row);
  }
  if (!rows.length) return [];

  const headers = rows[0].map((header) => String(header || '').replace(/^\uFEFF/, '').trim());
  return rows.slice(1)
    .filter((cells) => cells.some((cell) => String(cell || '').trim()))
    .map((cells) => Object.fromEntries(headers.map((header, index) => [header, cells[index] || ''])));
}

function summarizeRows(rows, getProgrammeCode, getProgrammeName, getCourseCode, getTrack = () => '') {
  const groups = new Map();
  rows.forEach((row) => {
    const programmeCode = String(getProgrammeCode(row) || '').trim();
    const programmeName = String(getProgrammeName(row) || '').trim();
    const key = programmeCode || programmeName || '__UNKNOWN__';
    if (!groups.has(key)) {
      groups.set(key, {
        programmeCode,
        programmeName,
        courseRows: []
      });
    }
    groups.get(key).courseRows.push(row);
  });

  const programmeRows = Array.from(groups.values()).map((programme) => {
    const codedCourses = programme.courseRows.filter((row) => String(getCourseCode(row) || '').trim());
    const uncodedCourses = programme.courseRows.filter((row) => !String(getCourseCode(row) || '').trim());
    const uniqueCourseCodes = new Set(codedCourses.map((row) => String(getCourseCode(row)).trim()));
    const courseCodesByTrack = codedCourses.reduce((groups, row) => {
      const track = String(getTrack(row) || '').trim() || '__PROGRAMME__';
      if (!groups.has(track)) groups.set(track, []);
      groups.get(track).push(String(getCourseCode(row)).trim());
      return groups;
    }, new Map());
    const importableCodedCourseCount = Array.from(courseCodesByTrack.values())
      .reduce((sum, codes) => sum + new Set(codes).size, 0);
    return {
      programmeCode: programme.programmeCode,
      programmeName: programme.programmeName,
      courseRowCount: programme.courseRows.length,
      codedCourseCount: codedCourses.length,
      uniqueCodedCourseCount: uniqueCourseCodes.size,
      duplicateCodedCourseRowCount: codedCourses.length - uniqueCourseCodes.size,
      importableCodedCourseCount,
      duplicateWithinTrackRowCount: codedCourses.length - importableCodedCourseCount,
      uncodedCourseRowCount: uncodedCourses.length
    };
  });

  return {
    programmeRows,
    programmeCount: programmeRows.length,
    courseRowCount: programmeRows.reduce((sum, row) => sum + row.courseRowCount, 0),
    codedCourseCount: programmeRows.reduce((sum, row) => sum + row.codedCourseCount, 0),
    uniqueCodedCourseCount: programmeRows.reduce((sum, row) => sum + row.uniqueCodedCourseCount, 0),
    duplicateCodedCourseRowCount: programmeRows.reduce((sum, row) => sum + row.duplicateCodedCourseRowCount, 0),
    importableCodedCourseCount: programmeRows.reduce((sum, row) => sum + row.importableCodedCourseCount, 0),
    duplicateWithinTrackRowCount: programmeRows.reduce((sum, row) => sum + row.duplicateWithinTrackRowCount, 0),
    uncodedCourseRowCount: programmeRows.reduce((sum, row) => sum + row.uncodedCourseRowCount, 0),
    programmeWithCodedCoursesCount: programmeRows.filter((row) => row.codedCourseCount > 0).length,
    programmeSummaryOnlyCount: programmeRows.filter((row) => row.codedCourseCount === 0 && row.courseRowCount > 0).length
  };
}

function summarizeSourceFilePath(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const text = fs.readFileSync(filePath, 'utf8');
  if (ext === '.csv') {
    const rows = parseCsv(text);
    const summary = summarizeRows(
      rows,
      (row) => row.programme_code || row.programmeCode || row.jupasCode || row['Programme Code'],
      (row) => row.programme || row.programme_name || row.programmeName || row['Programme'],
      (row) => row.subject_code || row.code || row.courseCode || row['Subject Code'],
      (row) => row.track_or_award || row.track || row.majorName || row['Track']
    );
    return {
      file: path.basename(filePath),
      filePath,
      format: 'csv',
      ...summary,
      importReady: summary.programmeWithCodedCoursesCount > 0
    };
  }

  const raw = JSON.parse(text);
  const source = {
    code: raw.university_code || raw.universityCode || raw.university || path.basename(filePath, ext).toUpperCase(),
    file: path.basename(filePath)
  };
  return {
    ...summarizeSourceFile(source, path.dirname(filePath)),
    filePath,
    format: 'json'
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
    const uniqueCourseCodes = new Set(codedCourses.map((course) => course.code));
    const courseCodesByTrack = codedCourses.reduce((groups, course) => {
      const track = course.track || '__PROGRAMME__';
      if (!groups.has(track)) groups.set(track, []);
      groups.get(track).push(course.code);
      return groups;
    }, new Map());
    const importableCodedCourseCount = Array.from(courseCodesByTrack.values())
      .reduce((sum, codes) => sum + new Set(codes).size, 0);
    return {
      programmeCode: programme.programme_code || programme.jupas_code || '',
      programmeName: programme.programme_name || '',
      courseRowCount: courses.length,
      codedCourseCount: codedCourses.length,
      uniqueCodedCourseCount: uniqueCourseCodes.size,
      duplicateCodedCourseRowCount: codedCourses.length - uniqueCourseCodes.size,
      importableCodedCourseCount,
      duplicateWithinTrackRowCount: codedCourses.length - importableCodedCourseCount,
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
    uniqueCodedCourseCount: rows.reduce((sum, row) => sum + row.uniqueCodedCourseCount, 0),
    duplicateCodedCourseRowCount: rows.reduce((sum, row) => sum + row.duplicateCodedCourseRowCount, 0),
    importableCodedCourseCount: rows.reduce((sum, row) => sum + row.importableCodedCourseCount, 0),
    duplicateWithinTrackRowCount: rows.reduce((sum, row) => sum + row.duplicateWithinTrackRowCount, 0),
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
      uniqueCodedCourseCount: schools.reduce((sum, school) => sum + school.uniqueCodedCourseCount, 0),
      duplicateCodedCourseRowCount: schools.reduce((sum, school) => sum + school.duplicateCodedCourseRowCount, 0),
      importableCodedCourseCount: schools.reduce((sum, school) => sum + school.importableCodedCourseCount, 0),
      duplicateWithinTrackRowCount: schools.reduce((sum, school) => sum + school.duplicateWithinTrackRowCount, 0),
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
  const missingLimit = Number.isFinite(Number(options.missingLimit)) ? Number(options.missingLimit) : 20;
  const shouldLimitMissing = Number.isFinite(missingLimit) && missingLimit >= 0;
  const schools = filterSchools(ugService.listUniversities().map((university) => {
    const programmes = ugService.listProgrammes({
      universityId: university.id,
      degreeLevel: 'undergraduate'
    });
    const majors = programmes.flatMap((programme) => ugService.listMajors(programme.id));
    const programmeWithCoursesCount = programmes.filter((programme) => (programme.codedCourseCount || 0) > 0).length;
    const codedCourseCount = programmes.reduce((sum, programme) => sum + (programme.codedCourseCount || 0), 0);
    const allMissingProgrammes = programmes
      .filter((programme) => !(programme.codedCourseCount || 0))
      .map((programme) => ({
        code: programme.jupasCode || programme.code,
        name: programme.nameEn,
        faculty: programme.faculty || '',
        officialUrl: programme.officialUrl || ''
      }));
    const missingProgrammes = shouldLimitMissing
      ? allMissingProgrammes.slice(0, missingLimit)
      : allMissingProgrammes;

    return {
      code: university.code,
      nameZh: university.nameZh,
      programmeCount: programmes.length,
      majorCount: majors.length,
      programmeWithCoursesCount,
      missingProgrammeCount: allMissingProgrammes.length,
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
  console.log(`UG source coverage: ${summary.sourceDir || summary.filePath}`);
  summary.schools.forEach((school) => {
    console.log([
      school.code,
      `${school.programmeCount} programmes`,
      `${school.codedCourseCount} coded courses`,
      `${school.importableCodedCourseCount} importable by track`,
      `${school.uniqueCodedCourseCount} unique course codes`,
      `${school.duplicateWithinTrackRowCount} duplicate rows within track`,
      `${school.programmeWithCodedCoursesCount} programmes with courses`,
      `${school.programmeSummaryOnlyCount} summary-only programmes`,
      school.importReady ? 'import-ready' : 'needs course-code source'
    ].join(' · '));
  });
  console.log([
    'TOTAL',
    `${summary.totals.programmeCount} programmes`,
    `${summary.totals.codedCourseCount} coded courses`,
    `${summary.totals.importableCodedCourseCount} importable by track`,
    `${summary.totals.uniqueCodedCourseCount} unique course codes`,
    `${summary.totals.duplicateWithinTrackRowCount} duplicate rows within track`,
    `${summary.totals.programmeWithCodedCoursesCount} programmes with courses`,
    `${summary.totals.programmeSummaryOnlyCount} summary-only programmes`
  ].join(' · '));
}

function printSingleSourceReport(summary) {
  console.log(`UG source file coverage: ${summary.filePath}`);
  console.log([
    summary.file,
    summary.format,
    `${summary.programmeCount} programmes`,
    `${summary.courseRowCount} raw course rows`,
    `${summary.codedCourseCount} coded rows`,
    `${summary.importableCodedCourseCount} importable coded rows`,
    `${summary.uniqueCodedCourseCount} unique course codes`,
    `${summary.duplicateWithinTrackRowCount} duplicate rows`,
    `${summary.programmeWithCodedCoursesCount} programmes with courses`,
    `${summary.programmeSummaryOnlyCount} summary-only programmes`,
    summary.importReady ? 'import-ready' : 'needs course-code source'
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
      programme.faculty,
      programme.officialUrl
    ].filter(Boolean).join(' · '));
  });
}

function main() {
  const options = parseArgs();
  const sourceSummary = options.missingOnly
    ? null
    : options.sourceFile
      ? summarizeSourceFilePath(options.sourceFile)
      : summarizeSources(options.sourceDir);
  const generatedSummary = summarizeGeneratedCatalogue(options);

  if (options.json) {
    console.log(JSON.stringify({
      source: sourceSummary,
      generated: generatedSummary
    }, null, 2));
    return;
  }

  if (sourceSummary) {
    if (options.sourceFile) printSingleSourceReport(sourceSummary);
    else printReport(sourceSummary);
  }
  printGeneratedCatalogueReport(generatedSummary, options);
}

if (require.main === module) {
  main();
}

module.exports = {
  parseArgs,
  parseCsv,
  summarizeSourceFile,
  summarizeSourceFilePath,
  summarizeSources,
  summarizeGeneratedCatalogue,
  filterSchools,
  printGeneratedCatalogueReport
};
