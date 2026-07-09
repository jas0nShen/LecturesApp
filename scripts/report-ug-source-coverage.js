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
  const readinessIndex = argv.indexOf('--readiness');
  return {
    sourceDir: sourceDirIndex === -1 ? DEFAULT_SOURCE_DIR : path.resolve(argv[sourceDirIndex + 1]),
    sourceFile: sourceFileIndex === -1 ? '' : path.resolve(argv[sourceFileIndex + 1]),
    school: schoolIndex === -1 ? '' : String(argv[schoolIndex + 1] || '').trim().toUpperCase(),
    missingLimit: missingLimitIndex === -1 ? 20 : Number(argv[missingLimitIndex + 1]),
    readiness: readinessIndex === -1 ? '' : String(argv[readinessIndex + 1] || '').trim(),
    missingOnly: argv.includes('--missing-only'),
    missingSummary: argv.includes('--missing-summary'),
    collectorTemplate: argv.includes('--collector-template'),
    importableOnly: argv.includes('--importable-only'),
    needsImportOnly: argv.includes('--needs-import-only'),
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

function summarizeRows(rows, getProgrammeCode, getProgrammeName, getCourseCode, getTrack = () => '', getOfficialUrl = () => '') {
  const groups = new Map();
  rows.forEach((row) => {
    const programmeCode = String(getProgrammeCode(row) || '').trim();
    const programmeName = String(getProgrammeName(row) || '').trim();
    const key = programmeCode || programmeName || '__UNKNOWN__';
    if (!groups.has(key)) {
      groups.set(key, {
        programmeCode,
        programmeName,
        officialUrl: String(getOfficialUrl(row) || '').trim(),
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
      officialUrl: programme.officialUrl || '',
      courseRowCount: programme.courseRows.length,
      codedCourseCount: codedCourses.length,
      uniqueCodedCourseCount: uniqueCourseCodes.size,
      duplicateCodedCourseRowCount: codedCourses.length - uniqueCourseCodes.size,
      importableCodedCourseCount,
      duplicateWithinTrackRowCount: codedCourses.length - importableCodedCourseCount,
      uncodedCourseRowCount: uncodedCourses.length
    };
  });

  const importableProgrammes = programmeRows
    .filter((row) => row.importableCodedCourseCount > 0)
    .map((row) => ({
      programmeCode: row.programmeCode,
      programmeName: row.programmeName,
      officialUrl: row.officialUrl,
      codedCourseCount: row.codedCourseCount,
      importableCodedCourseCount: row.importableCodedCourseCount,
      duplicateWithinTrackRowCount: row.duplicateWithinTrackRowCount
    }));

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
    programmeSummaryOnlyCount: programmeRows.filter((row) => row.codedCourseCount === 0 && row.courseRowCount > 0).length,
    importableProgrammes
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
      (row) => row.track_or_award || row.track || row.majorName || row['Track'],
      (row) => row.official_url || row.officialUrl || row.source_url || row.sourceUrl || row['Official URL']
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
      officialUrl: programme.official_url || programme.source_url || '',
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
  const importableProgrammes = rows
    .filter((row) => row.importableCodedCourseCount > 0)
    .map((row) => ({
      programmeCode: row.programmeCode,
      programmeName: row.programmeName,
      officialUrl: row.officialUrl,
      codedCourseCount: row.codedCourseCount,
      importableCodedCourseCount: row.importableCodedCourseCount,
      duplicateWithinTrackRowCount: row.duplicateWithinTrackRowCount
    }));

  return {
    code: source.code,
    file: source.file,
    programmeRows: rows,
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
    importableProgrammes,
    importReady: programmeWithCodedCoursesCount > 0
  };
}

function getSourceProgrammeMap(sourceSummary = null) {
  const bySchoolAndCode = new Map();
  const sourceSchools = sourceSummary?.schools
    ? sourceSummary.schools
    : sourceSummary
      ? [sourceSummary]
      : [];
  sourceSchools.forEach((school) => {
    (school.programmeRows || []).forEach((programme) => {
      if (!programme.programmeCode) return;
      const sourceStatus = programme.importableCodedCourseCount > 0
        ? 'source_importable_rows'
        : programme.codedCourseCount > 0
          ? 'source_coded_rows_not_importable'
          : 'source_index_only';
      bySchoolAndCode.set(`${school.code}::${programme.programmeCode}`, {
        sourceStatus,
        sourceCourseRowCount: programme.courseRowCount,
        sourceCodedCourseCount: programme.codedCourseCount,
        sourceImportableCodedCourseCount: programme.importableCodedCourseCount,
        sourceOfficialUrl: programme.officialUrl || ''
      });
    });
  });
  return bySchoolAndCode;
}

function summarizeSources(sourceDir, options = {}) {
  validateSourceDir(sourceDir);
  const schools = filterSchools(
    SOURCES.map((source) => summarizeSourceFile(source, sourceDir)),
    options.school
  );
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
  const sourceReadiness = schools.reduce((totals, school) => {
    Object.entries(school.sourceReadiness || {}).forEach(([key, value]) => {
      totals[key] = (totals[key] || 0) + value;
    });
    return totals;
  }, {});
  return {
    programmeCount: schools.reduce((sum, school) => sum + school.programmeCount, 0),
    majorCount: schools.reduce((sum, school) => sum + school.majorCount, 0),
    programmeWithCoursesCount: schools.reduce((sum, school) => sum + school.programmeWithCoursesCount, 0),
    missingProgrammeCount: schools.reduce((sum, school) => sum + school.missingProgrammeCount, 0),
    codedCourseCount: schools.reduce((sum, school) => sum + school.codedCourseCount, 0),
    sourceReadiness
  };
}

function sourceReadinessKey(programme) {
  if (programme.sourceStatus === 'source_importable_rows') return 'sourceImportableRows';
  if (programme.sourceStatus === 'source_coded_rows_not_importable') return 'sourceCodedRowsNotImportable';
  if (programme.sourceStatus === 'source_index_only') return 'sourceIndexOnly';
  return 'noSource';
}

function normalizeReadinessFilter(readiness = '') {
  const normalized = String(readiness || '').trim().toLowerCase().replace(/_/g, '-');
  if (!normalized || normalized === 'all') return '';
  if (['source-importable', 'importable', 'source-importable-rows'].includes(normalized)) return 'sourceImportableRows';
  if (['coded', 'coded-not-importable', 'source-coded', 'source-coded-rows-not-importable'].includes(normalized)) return 'sourceCodedRowsNotImportable';
  if (['index', 'index-only', 'source-index', 'source-index-only'].includes(normalized)) return 'sourceIndexOnly';
  if (['none', 'missing-source', 'no-source'].includes(normalized)) return 'noSource';
  throw new Error(`Unknown --readiness "${readiness}". Use all, importable, coded, index-only, or no-source.`);
}

function summarizeMissingSourceReadiness(missingProgrammes = []) {
  return missingProgrammes.reduce((summary, programme) => {
    const key = sourceReadinessKey(programme);
    summary[key] = (summary[key] || 0) + 1;
    return summary;
  }, {
    sourceImportableRows: 0,
    sourceCodedRowsNotImportable: 0,
    sourceIndexOnly: 0,
    noSource: 0
  });
}

function summarizeGeneratedCatalogue(options = {}) {
  const missingLimit = Number.isFinite(Number(options.missingLimit)) ? Number(options.missingLimit) : 20;
  const shouldLimitMissing = Number.isFinite(missingLimit) && missingLimit >= 0;
  const readinessFilter = normalizeReadinessFilter(options.readiness);
  const sourceProgrammes = getSourceProgrammeMap(options.sourceSummary);
  const schools = filterSchools(ugService.listUniversities().map((university) => {
    const programmes = ugService.listProgrammes({
      universityId: university.id,
      degreeLevel: 'undergraduate'
    });
    const majors = programmes.flatMap((programme) => ugService.listMajors(programme.id));
    const courseProgrammes = programmes
      .filter((programme) => (programme.codedCourseCount || 0) > 0)
      .map((programme) => ({
        code: programme.jupasCode || programme.code,
        name: programme.nameEn,
        codedCourseCount: programme.codedCourseCount || 0,
        officialUrl: programme.officialUrl || ''
      }));
    const programmeWithCoursesCount = courseProgrammes.length;
    const codedCourseCount = programmes.reduce((sum, programme) => sum + (programme.codedCourseCount || 0), 0);
    const allMissingProgrammes = programmes
      .filter((programme) => !(programme.codedCourseCount || 0))
      .map((programme) => ({
        code: programme.jupasCode || programme.code,
        name: programme.nameEn,
        faculty: programme.faculty || '',
        officialUrl: programme.officialUrl || '',
        ...(sourceProgrammes.get(`${university.code}::${programme.jupasCode || programme.code}`) || {})
      }));
    const filteredMissingProgrammes = readinessFilter
      ? allMissingProgrammes.filter((programme) => sourceReadinessKey(programme) === readinessFilter)
      : allMissingProgrammes;
    const missingProgrammes = shouldLimitMissing
      ? filteredMissingProgrammes.slice(0, missingLimit)
      : filteredMissingProgrammes;
    const sourceReadiness = summarizeMissingSourceReadiness(allMissingProgrammes);

    return {
      code: university.code,
      nameZh: university.nameZh,
      programmeCount: programmes.length,
      majorCount: majors.length,
      programmeWithCoursesCount,
      missingProgrammeCount: allMissingProgrammes.length,
      filteredMissingProgrammeCount: filteredMissingProgrammes.length,
      codedCourseCount,
      courseProgrammes,
      sourceReadiness,
      missingProgrammes
    };
  }), options.school);

  return {
    schools,
    totals: buildGeneratedTotals(schools)
  };
}

function formatMissingSourceStatus(programme) {
  if (!programme.sourceStatus) return '';
  if (programme.sourceStatus === 'source_importable_rows') {
    return `source importable: ${programme.sourceImportableCodedCourseCount} importable / ${programme.sourceCodedCourseCount} raw coded rows`;
  }
  if (programme.sourceStatus === 'source_coded_rows_not_importable') {
    return `source coded rows not importable: ${programme.sourceCodedCourseCount} raw coded rows`;
  }
  return `source index only: ${programme.sourceCourseRowCount || 0} raw course rows`;
}

function getGeneratedCourseProgrammeMap(generatedSummary) {
  const bySchoolAndCode = new Map();
  (generatedSummary?.schools || []).forEach((school) => {
    (school.courseProgrammes || []).forEach((programme) => {
      bySchoolAndCode.set(`${school.code}::${programme.code}`, programme);
    });
  });
  return bySchoolAndCode;
}

function listImportableProgrammes(summary, generatedSummary = null) {
  const generatedProgrammes = getGeneratedCourseProgrammeMap(generatedSummary);
  const decorate = (schoolCode, programme) => {
    const generatedProgramme = generatedProgrammes.get(`${schoolCode}::${programme.programmeCode}`);
    return {
      schoolCode,
      ...programme,
      generatedCodedCourseCount: generatedProgramme ? generatedProgramme.codedCourseCount : 0,
      importStatus: generatedProgramme ? 'already-open' : 'needs-import'
    };
  };
  if (!summary.schools && Array.isArray(summary.importableProgrammes)) {
    const schoolCode = summary.code || summary.file || 'SOURCE';
    return summary.importableProgrammes.map((programme) => decorate(schoolCode, programme));
  }
  return (summary.schools || []).flatMap((school) => (
    (school.importableProgrammes || []).map((programme) => decorate(school.code, programme))
  ));
}

function filterImportableProgrammes(programmes, options = {}) {
  return options.needsImportOnly
    ? programmes.filter((programme) => programme.importStatus === 'needs-import')
    : programmes;
}

function printImportableProgrammes(summary, generatedSummary = null, options = {}) {
  const importableProgrammes = filterImportableProgrammes(
    listImportableProgrammes(summary, generatedSummary),
    options
  );
  console.log(`${options.needsImportOnly ? 'Needs-import' : 'Importable'} UG source programmes: ${summary.sourceDir || summary.filePath}`);
  if (!importableProgrammes.length) {
    console.log(options.needsImportOnly
      ? 'No needs-import programme course rows found. Existing importable rows are already open, or source files only contain indexes/summaries.'
      : 'No importable programme course rows found. Keep index/source only until course-code evidence is available.');
    return;
  }
  importableProgrammes.forEach((programme) => {
    console.log([
      programme.schoolCode,
      programme.programmeCode,
      programme.programmeName,
      programme.importStatus,
      programme.generatedCodedCourseCount ? `${programme.generatedCodedCourseCount} generated` : '',
      `${programme.importableCodedCourseCount} importable`,
      `${programme.codedCourseCount} raw coded rows`,
      programme.duplicateWithinTrackRowCount ? `${programme.duplicateWithinTrackRowCount} duplicate rows within track` : '',
      programme.officialUrl
    ].filter(Boolean).join(' · '));
  });
}

function printReport(summary, options = {}, generatedSummary = null) {
  if (options.importableOnly || options.needsImportOnly) {
    printImportableProgrammes(summary, generatedSummary, options);
    return;
  }
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
    (school.importableProgrammes || []).slice(0, 5).forEach((programme) => {
      console.log([
        '  importable',
        programme.programmeCode,
        programme.programmeName,
        `${programme.importableCodedCourseCount} importable`,
        programme.officialUrl
      ].filter(Boolean).join(' · '));
    });
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
    if (options.collectorTemplate) {
      printMissingCollectorTemplate(summary, options);
      return;
    }
    if (options.missingSummary) printMissingSourceReadiness(summary);
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

  if (options.missingSummary) printMissingSourceReadiness(summary);
  printMissingProgrammes(summary, options);
}

function formatSourceReadinessSummary(sourceReadiness = {}) {
  return [
    `${sourceReadiness.sourceImportableRows || 0} source importable`,
    `${sourceReadiness.sourceCodedRowsNotImportable || 0} coded not importable`,
    `${sourceReadiness.sourceIndexOnly || 0} index only`,
    `${sourceReadiness.noSource || 0} no source`
  ].join(' · ');
}

function formatCollectorSourceStatus(programme) {
  if (programme.sourceStatus === 'source_importable_rows') {
    return `已有可导入课程码：${programme.sourceImportableCodedCourseCount || 0} 条`;
  }
  if (programme.sourceStatus === 'source_coded_rows_not_importable') {
    return `已有 raw 课程码但需整理：${programme.sourceCodedCourseCount || 0} 条`;
  }
  if (programme.sourceStatus === 'source_index_only') {
    return `仅有 Programme 索引：${programme.sourceCourseRowCount || 0} 条`;
  }
  return '暂无外部来源';
}

function listMissingProgrammesForCollection(summary, options = {}) {
  const missingLimit = Number.isFinite(Number(options.missingLimit)) ? Number(options.missingLimit) : 20;
  if (missingLimit <= 0) return [];
  return summary.schools
    .flatMap((school) => school.missingProgrammes.map((programme) => ({
      schoolCode: school.code,
      schoolNameZh: school.nameZh,
      ...programme
    })))
    .slice(0, missingLimit);
}

function buildMissingCollectorTemplate(summary, options = {}) {
  const programmes = listMissingProgrammesForCollection(summary, options);
  const scope = options.school ? options.school : 'ALL';
  const lines = [
    '【本科课程资料待补清单】',
    `范围：${scope}`,
    `待补 Programme：${summary.totals.missingProgrammeCount}`,
    `来源状态：${formatSourceReadinessSummary(summary.totals.sourceReadiness)}`,
    '',
    '采集要求：',
    '- 只收集学校官网、官方课程手册、JUPAS/招生页或用户提供的可信资料。',
    '- 需要尽量包含课程代码、课程名、学分/units、推荐 Year/Semester、core/elective/capstone 分类和官方链接。',
    '- 如果官网只有 Programme 简介、没有课程码，请标记为“仅索引”，不要自行推测课程。',
    '',
    `待补项目（前 ${programmes.length} 个）：`
  ];

  if (!programmes.length) {
    lines.push('- 暂无待补 Programme。');
  } else {
    programmes.forEach((programme, index) => {
      lines.push(`${index + 1}. ${programme.schoolCode} · ${programme.code} · ${programme.name}`);
      if (programme.faculty) lines.push(`   学院：${programme.faculty}`);
      lines.push(`   当前来源状态：${formatCollectorSourceStatus(programme)}`);
      lines.push(`   官方入口：${programme.officialUrl || '待查'}`);
      lines.push('   待补资料：课程代码 / 课程名 / 学分 / Year / Semester / 课程类别 / 来源链接');
    });
  }

  return lines.join('\n');
}

function printMissingSourceReadiness(summary) {
  console.log('');
  console.log('UG missing programme source readiness:');
  summary.schools.forEach((school) => {
    console.log([
      school.code,
      `${school.missingProgrammeCount} pending`,
      formatSourceReadinessSummary(school.sourceReadiness)
    ].join(' · '));
  });
  console.log([
    'TOTAL',
    `${summary.totals.missingProgrammeCount} pending`,
    formatSourceReadinessSummary(summary.totals.sourceReadiness)
  ].join(' · '));
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
  console.log(`Next missing UG programmes${options.readiness ? ` matching ${options.readiness}` : ''} (first ${missing.length}):`);
  missing.forEach((programme) => {
    console.log([
      programme.schoolCode,
      programme.code,
      programme.name,
      programme.faculty,
      formatMissingSourceStatus(programme),
      programme.officialUrl
    ].filter(Boolean).join(' · '));
  });
}

function printMissingCollectorTemplate(summary, options = {}) {
  console.log(buildMissingCollectorTemplate(summary, options));
}

function main() {
  const options = parseArgs();
  const sourceSummary = options.sourceFile
      ? summarizeSourceFilePath(options.sourceFile)
      : summarizeSources(options.sourceDir, options);
  const generatedSummary = summarizeGeneratedCatalogue({ ...options, sourceSummary });

  if (options.json) {
    console.log(JSON.stringify({
      source: sourceSummary,
      generated: generatedSummary,
      ...((options.importableOnly || options.needsImportOnly) && sourceSummary ? {
        importableProgrammes: filterImportableProgrammes(
          listImportableProgrammes(sourceSummary, generatedSummary),
          options
        )
      } : {})
    }, null, 2));
    return;
  }

  if (sourceSummary && !(options.missingOnly && !options.importableOnly && !options.needsImportOnly)) {
    if (options.sourceFile && (options.importableOnly || options.needsImportOnly)) printImportableProgrammes(sourceSummary, generatedSummary, options);
    else if (options.sourceFile) printSingleSourceReport(sourceSummary);
    else printReport(sourceSummary, options, generatedSummary);
  }
  if (!options.importableOnly && !options.needsImportOnly) printGeneratedCatalogueReport(generatedSummary, options);
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
  filterImportableProgrammes,
  normalizeReadinessFilter,
  getSourceProgrammeMap,
  getGeneratedCourseProgrammeMap,
  listImportableProgrammes,
  formatMissingSourceStatus,
  formatSourceReadinessSummary,
  formatCollectorSourceStatus,
  listMissingProgrammesForCollection,
  buildMissingCollectorTemplate,
  summarizeMissingSourceReadiness,
  printGeneratedCatalogueReport
};
