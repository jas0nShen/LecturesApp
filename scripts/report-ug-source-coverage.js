const fs = require('node:fs');
const path = require('node:path');
const { SOURCES, listCourses, validateSourceDir } = require('./generate-ug-catalog');
const ugService = require('../miniprogram/utils/ugService');

const DEFAULT_SOURCE_DIR = '/Users/shenjingsong/Documents/Codex/2026-07-06/pdf/outputs';
const DEFAULT_SOURCE_REVIEW_FILE = path.join(__dirname, '..', 'data', 'ug-source-reviews.json');

function parseArgs(argv = process.argv.slice(2)) {
  const sourceDirIndex = argv.indexOf('--source-dir');
  const sourceFileIndex = argv.indexOf('--source-file');
  const schoolIndex = argv.indexOf('--school');
  const missingLimitIndex = argv.indexOf('--missing-limit');
  const readinessIndex = argv.indexOf('--readiness');
  const priorityIndex = argv.indexOf('--priority');
  return {
    sourceDir: sourceDirIndex === -1 ? DEFAULT_SOURCE_DIR : path.resolve(argv[sourceDirIndex + 1]),
    sourceFile: sourceFileIndex === -1 ? '' : path.resolve(argv[sourceFileIndex + 1]),
    school: schoolIndex === -1 ? '' : String(argv[schoolIndex + 1] || '').trim().toUpperCase(),
    missingLimit: missingLimitIndex === -1 ? 20 : Number(argv[missingLimitIndex + 1]),
    readiness: readinessIndex === -1 ? '' : String(argv[readinessIndex + 1] || '').trim(),
    priority: priorityIndex === -1 ? '' : String(argv[priorityIndex + 1] || '').trim(),
    missingOnly: argv.includes('--missing-only'),
    missingSummary: argv.includes('--missing-summary'),
    collectorTemplate: argv.includes('--collector-template'),
    supplementTemplate: argv.includes('--supplement-template'),
    batchPlan: argv.includes('--batch-plan'),
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

function loadSourceReviews(filePath = DEFAULT_SOURCE_REVIEW_FILE) {
  if (!fs.existsSync(filePath)) return [];
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function getSourceReviewMap(sourceReviews = loadSourceReviews()) {
  return new Map(sourceReviews
    .filter((review) => review.universityCode && review.programmeCode)
    .map((review) => [`${String(review.universityCode).trim().toUpperCase()}::${String(review.programmeCode).trim()}`, review]));
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
  if (programme.sourceReviewStatus === 'no_public_course_codes') return 'reviewedNoCourseCodes';
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
  if (['reviewed', 'reviewed-no-codes', 'reviewed-no-course-codes', 'no-public-course-codes'].includes(normalized)) return 'reviewedNoCourseCodes';
  if (['none', 'missing-source', 'no-source'].includes(normalized)) return 'noSource';
  throw new Error(`Unknown --readiness "${readiness}". Use all, importable, coded, index-only, reviewed-no-codes, or no-source.`);
}

function normalizePriorityMode(priority = '') {
  const normalized = String(priority || '').trim().toLowerCase().replace(/_/g, '-');
  if (!normalized || normalized === 'none') return '';
  if (['launch', 'mvp', 'first-batch'].includes(normalized)) return 'launch';
  throw new Error(`Unknown --priority "${priority}". Use launch or none.`);
}

const LAUNCH_SCHOOL_PRIORITY = [
  'POLYU',
  'LINGNAN',
  'CITYU',
  'HKU',
  'HKUST',
  'CUHK',
  'HKBU',
  'EDUHK'
];

const LAUNCH_READINESS_PRIORITY = [
  'sourceImportableRows',
  'sourceCodedRowsNotImportable',
  'sourceIndexOnly',
  'reviewedNoCourseCodes',
  'noSource'
];

function priorityIndex(values, value) {
  const index = values.indexOf(value);
  return index === -1 ? values.length : index;
}

function isUmbrellaSchemeProgramme(programme = {}) {
  return /^Bachelor[’']s Degree Scheme in\b/i.test(String(programme.name || programme.programmeName || ''));
}

function fileSlug(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 56);
}

function compareLaunchMissingProgrammes(a, b) {
  const schoolDelta = priorityIndex(LAUNCH_SCHOOL_PRIORITY, a.schoolCode) - priorityIndex(LAUNCH_SCHOOL_PRIORITY, b.schoolCode);
  if (schoolDelta) return schoolDelta;
  const readinessDelta = priorityIndex(LAUNCH_READINESS_PRIORITY, sourceReadinessKey(a))
    - priorityIndex(LAUNCH_READINESS_PRIORITY, sourceReadinessKey(b));
  if (readinessDelta) return readinessDelta;
  const umbrellaDelta = Number(isUmbrellaSchemeProgramme(a)) - Number(isUmbrellaSchemeProgramme(b));
  if (umbrellaDelta) return umbrellaDelta;
  return String(a.code || a.name || '').localeCompare(String(b.code || b.name || ''));
}

function maybeSortMissingForPriority(programmes, options = {}) {
  const priorityMode = normalizePriorityMode(options.priority);
  if (priorityMode !== 'launch') return programmes;
  return [...programmes].sort(compareLaunchMissingProgrammes);
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
    reviewedNoCourseCodes: 0,
    noSource: 0
  });
}

function summarizeGeneratedCatalogue(options = {}) {
  const missingLimit = Number.isFinite(Number(options.missingLimit)) ? Number(options.missingLimit) : 20;
  const shouldLimitMissing = Number.isFinite(missingLimit) && missingLimit >= 0;
  const readinessFilter = normalizeReadinessFilter(options.readiness);
  const priorityMode = normalizePriorityMode(options.priority);
  const sourceProgrammes = getSourceProgrammeMap(options.sourceSummary);
  const sourceReviews = getSourceReviewMap(options.sourceReviews);
  let schools = filterSchools(ugService.listUniversities().map((university) => {
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
        curriculumYear: programme.curriculumYear || '',
        officialUrl: programme.officialUrl || '',
        ...(sourceProgrammes.get(`${university.code}::${programme.jupasCode || programme.code}`) || {}),
        ...(() => {
          const review = sourceReviews.get(`${university.code}::${programme.jupasCode || programme.code}`);
          return review ? {
            sourceReviewStatus: review.status,
            sourceReviewDate: review.reviewedAt || '',
            sourceReviewNote: review.note || '',
            sourceReviewOfficialUrl: review.officialUrl || ''
          } : {};
        })()
      }));
    let filteredMissingProgrammes = readinessFilter
      ? allMissingProgrammes.filter((programme) => sourceReadinessKey(programme) === readinessFilter)
      : allMissingProgrammes;
    filteredMissingProgrammes = maybeSortMissingForPriority(
      filteredMissingProgrammes.map((programme) => ({
        schoolCode: university.code,
        ...programme
      })),
      options
    ).map(({ schoolCode, ...programme }) => programme);
    const missingProgrammes = options.batchPlan
      ? filteredMissingProgrammes
      : shouldLimitMissing
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

  if (priorityMode === 'launch' && !options.school) {
    schools = [...schools].sort((a, b) => (
      priorityIndex(LAUNCH_SCHOOL_PRIORITY, a.code) - priorityIndex(LAUNCH_SCHOOL_PRIORITY, b.code)
    ));
  }

  return {
    schools,
    totals: buildGeneratedTotals(schools)
  };
}

function formatMissingSourceStatus(programme) {
  if (programme.sourceReviewStatus === 'no_public_course_codes') {
    return `reviewed no public course codes${programme.sourceReviewDate ? ` (${programme.sourceReviewDate})` : ''}`;
  }
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
    if (options.supplementTemplate) {
      printMissingSupplementTemplate(summary, options);
      return;
    }
    if (options.collectorTemplate) {
      printMissingCollectorTemplate(summary, options);
      return;
    }
    if (options.batchPlan) {
      printMissingBatchPlan(summary, options);
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
    `${sourceReadiness.reviewedNoCourseCodes || 0} reviewed no course codes`,
    `${sourceReadiness.noSource || 0} no source`
  ].join(' · ');
}

function formatCollectorSourceStatus(programme) {
  if (programme.sourceReviewStatus === 'no_public_course_codes') {
    return `已核实官网暂无公开课程码${programme.sourceReviewDate ? `：${programme.sourceReviewDate}` : ''}`;
  }
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
  const programmes = summary.schools
    .flatMap((school) => school.missingProgrammes.map((programme) => ({
      schoolCode: school.code,
      schoolNameZh: school.nameZh,
      ...programme
    })));
  return maybeSortMissingForPriority(programmes, options).slice(0, missingLimit);
}

function groupMissingProgrammesByReadiness(summary, options = {}) {
  const programmes = listMissingProgrammesForCollection(summary, {
    ...options,
    missingLimit: Number.MAX_SAFE_INTEGER
  });
  return programmes.reduce((groups, programme) => {
    const key = sourceReadinessKey(programme);
    if (!groups[key]) groups[key] = [];
    groups[key].push(programme);
    return groups;
  }, {
    sourceImportableRows: [],
    sourceCodedRowsNotImportable: [],
    sourceIndexOnly: [],
    reviewedNoCourseCodes: [],
    noSource: []
  });
}

function formatBatchProgrammeLine(programme, index) {
  return [
    `${index + 1}. ${programme.schoolCode} · ${programme.code || '无代码'} · ${programme.name}`,
    programme.faculty ? `学院：${programme.faculty}` : '',
    `状态：${formatCollectorSourceStatus(programme)}`,
    `入口：${programme.officialUrl || programme.sourceOfficialUrl || '待查'}`
  ].filter(Boolean).join('\n   ');
}

function buildMissingBatchPlan(summary, options = {}) {
  const limit = Number.isFinite(Number(options.missingLimit)) ? Number(options.missingLimit) : 20;
  const sampleLimit = Math.max(0, limit);
  const groups = groupMissingProgrammesByReadiness(summary, options);
  const scope = options.school ? options.school : 'ALL';
  const lines = [
    '【本科课程补数批次计划】',
    `范围：${scope}`,
    ...(options.priority ? [`优先级：${normalizePriorityMode(options.priority)}`] : []),
    `总缺口：${summary.totals.missingProgrammeCount}`,
    `来源状态：${formatSourceReadinessSummary(summary.totals.sourceReadiness)}`,
    '',
    '建议处理顺序：',
    '1. source importable：已有可导入课程码，优先转成 supplement JSON。',
    '2. coded not importable：已有课程码但 track/重复行需整理，先人工清洗再导入。',
    '3. index only：已有官方 Programme 入口，先打开官网确认是否有课程码。',
    '4. reviewed no course codes：已核实官网暂无公开课程码，继续保留索引和来源。',
    '5. no source：先补官方入口或可信资料；没有课程码时只保留索引。'
  ];

  const sections = [
    ['sourceImportableRows', 'A. 可直接导入候选'],
    ['sourceCodedRowsNotImportable', 'B. 需清洗后导入候选'],
    ['sourceIndexOnly', 'C. 需打开官方入口核实课程码'],
    ['reviewedNoCourseCodes', 'D. 已核实官网暂无公开课程码'],
    ['noSource', 'E. 需先寻找官方来源']
  ];

  sections.forEach(([key, title]) => {
    const programmes = groups[key] || [];
    lines.push('', `${title}：${programmes.length} 个`);
    if (!programmes.length) {
      lines.push('- 暂无。');
      return;
    }
    programmes.slice(0, sampleLimit).forEach((programme, index) => {
      lines.push(formatBatchProgrammeLine(programme, index));
    });
    if (programmes.length > sampleLimit) {
      lines.push(`... 还有 ${programmes.length - sampleLimit} 个，使用 --readiness ${key === 'sourceImportableRows' ? 'importable' : key === 'sourceCodedRowsNotImportable' ? 'coded' : key === 'sourceIndexOnly' ? 'index-only' : key === 'reviewedNoCourseCodes' ? 'reviewed-no-codes' : 'no-source'} 查看。`);
    }
  });

  lines.push(
    '',
    '常用命令：',
    `npm run status:ug-sources -- --missing-only --priority launch --missing-limit ${sampleLimit} --collector-template`,
    `npm run status:ug-sources -- --missing-only --priority launch --missing-limit 1 --supplement-template`,
    'npm run sync:ug-catalog',
    'npm run check:ship'
  );

  return lines.join('\n');
}

function buildMissingCollectorTemplate(summary, options = {}) {
  const programmes = listMissingProgrammesForCollection(summary, options);
  const scope = options.school ? options.school : 'ALL';
  const filteredMissingCount = summary.schools.reduce((sum, school) => (
    sum + (Number.isFinite(Number(school.filteredMissingProgrammeCount))
      ? Number(school.filteredMissingProgrammeCount)
      : Number(school.missingProgrammeCount || 0))
  ), 0);
  const lines = [
    '【本科课程资料待补清单】',
    `范围：${scope}`,
    `待补 Programme：${summary.totals.missingProgrammeCount}`,
    ...(options.readiness ? [`当前筛选：${options.readiness} · ${filteredMissingCount} 个`] : []),
    ...(options.priority ? [`优先级：${normalizePriorityMode(options.priority)}`] : []),
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
      lines.push(`${index + 1}. ${programme.schoolCode} · ${programme.code || '无代码'} · ${programme.name}`);
      if (programme.faculty) lines.push(`   学院：${programme.faculty}`);
      lines.push(`   当前来源状态：${formatCollectorSourceStatus(programme)}`);
      lines.push(`   官方入口：${programme.officialUrl || '待查'}`);
      lines.push('   待补资料：课程代码 / 课程名 / 学分 / Year / Semester / 课程类别 / 来源链接');
    });
  }

  return lines.join('\n');
}

function buildSupplementFileName(programme = {}) {
  const school = fileSlug(programme.schoolCode || programme.universityCode || 'ug');
  const code = fileSlug(programme.code || programme.jupasCode || programme.name || 'programme');
  const year = fileSlug(programme.curriculumYear || '2026');
  return `${school}-${code}-courses-${year}.json`;
}

function buildMissingSupplementTemplate(summary, options = {}) {
  const [programme] = listMissingProgrammesForCollection(summary, { ...options, missingLimit: 1 });
  if (!programme) return '暂无待补 Programme。';

  const academicYear = programme.curriculumYear || '2026';
  const template = {
    _instructions: [
      '只填入已由官方来源或可信资料核实的课程。',
      'courses 为空时不会开放课程清单；不要用占位课程码。',
      '每门课程建议包含 code, title, credits, year, semester, group, sourceUrl。'
    ],
    provider: `${programme.schoolCode} ${programme.code || programme.name} undergraduate course supplement`,
    academicYear,
    sourceUrl: programme.officialUrl || '',
    officialUrl: programme.officialUrl || '',
    supplements: [
      {
        universityCode: programme.schoolCode,
        ...(programme.code ? { jupasCode: programme.code } : { programmeName: programme.name }),
        programmeName: programme.name,
        sourceUrl: programme.officialUrl || '',
        officialUrl: programme.officialUrl || '',
        courses: []
      }
    ]
  };

  return [
    `建议文件：data/ug-course-supplements/${buildSupplementFileName(programme)}`,
    JSON.stringify(template, null, 2)
  ].join('\n');
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
    })));
  const sortedMissing = maybeSortMissingForPriority(missing, options)
    .slice(0, missingLimit);
  if (!sortedMissing.length) return;

  console.log('');
  console.log(`Next missing UG programmes${options.readiness ? ` matching ${options.readiness}` : ''}${options.priority ? ` by ${normalizePriorityMode(options.priority)} priority` : ''} (first ${sortedMissing.length}):`);
  sortedMissing.forEach((programme) => {
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

function printMissingSupplementTemplate(summary, options = {}) {
  console.log(buildMissingSupplementTemplate(summary, options));
}

function printMissingBatchPlan(summary, options = {}) {
  console.log(buildMissingBatchPlan(summary, options));
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
  normalizePriorityMode,
  isUmbrellaSchemeProgramme,
  buildSupplementFileName,
  buildMissingSupplementTemplate,
  maybeSortMissingForPriority,
  getSourceProgrammeMap,
  getGeneratedCourseProgrammeMap,
  listImportableProgrammes,
  formatMissingSourceStatus,
  formatSourceReadinessSummary,
  formatCollectorSourceStatus,
  listMissingProgrammesForCollection,
  groupMissingProgrammesByReadiness,
  buildMissingCollectorTemplate,
  buildMissingBatchPlan,
  summarizeMissingSourceReadiness,
  printGeneratedCatalogueReport
};
