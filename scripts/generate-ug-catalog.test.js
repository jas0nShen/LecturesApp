const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');
const {
  addGenericCourseSupplements,
  buildStaticCatalogue,
  groupCoursesByUniversity,
  validateSourceDir
} = require('./generate-ug-catalog');
const {
  buildMissingCollectorTemplate,
  filterImportableProgrammes,
  filterSchools,
  formatCollectorSourceStatus,
  formatMissingSourceStatus,
  formatSourceReadinessSummary,
  getSourceProgrammeMap,
  groupMissingProgrammesByReadiness,
  isUmbrellaSchemeProgramme,
  buildMissingBatchPlan,
  buildMissingSupplementTemplate,
  buildSupplementFileName,
  listMissingProgrammesForCollection,
  listImportableProgrammes,
  normalizePriorityMode,
  normalizeReadinessFilter,
  parseArgs,
  parseCsv,
  summarizeGeneratedCatalogue,
  summarizeMissingSourceReadiness,
  summarizeSourceFile,
  summarizeSourceFilePath,
  summarizeSources
} = require('./report-ug-source-coverage');
const {
  validateUgSupplements,
  validateSupplement
} = require('./validate-ug-supplements');

test('UG catalogue generator reports missing source files clearly', () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ug-catalog-empty-'));

  assert.throws(
    () => validateSourceDir(tempDir),
    (error) => {
      assert.match(error.message, /Missing UG source JSON files/);
      assert.match(error.message, /--source-dir/);
      assert.match(error.message, /hku_programme_year_semester_courses_2026\.json/);
      return true;
    }
  );
});

test('UG catalogue generator includes static EdUHK and Lingnan undergraduate programme indexes', () => {
  const catalogue = buildStaticCatalogue();
  const eduhkProgrammes = catalogue.programmes.filter((programme) => programme.universityCode === 'EDUHK');
  const lingnanProgrammes = catalogue.programmes.filter((programme) => programme.universityCode === 'LINGNAN');

  assert.equal(eduhkProgrammes.length, 25);
  assert.equal(lingnanProgrammes.length, 23);
  assert.equal(catalogue.majors.length, 48);
  assert.equal(catalogue.courses.length, 0);
  assert(eduhkProgrammes.some((programme) => programme.code === 'JS8714' && programme.nameEn.includes('Artificial Intelligence')));
  assert(lingnanProgrammes.some((programme) => programme.code === 'JS7225' && programme.nameEn.includes('Data Science')));
  assert(eduhkProgrammes.every((programme) => programme.sourceStatus === 'programme_summary_only'));
  assert(lingnanProgrammes.every((programme) => programme.officialUrl.startsWith('https://www.jupas.edu.hk/en/programme/lingnanu/JS')));
});

test('UG source coverage report counts only rows with course codes as coded courses', () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ug-catalog-source-'));
  const source = {
    code: 'TEST',
    file: 'test_programmes.json'
  };
  fs.writeFileSync(path.join(tempDir, source.file), JSON.stringify({
    programmes: [
      {
        programme_code: 'BTEST',
        programme_name: 'Bachelor of Testing',
        years: [
          {
            year: 'Year 1',
            semesters: [
              {
                semester: 'Semester 1',
                courses: [
                  {
                    code: 'TEST1001',
                    title: 'Testing Fundamentals',
                    track: 'Testing'
                  },
                  {
                    code: 'TEST1001',
                    title: 'Testing Fundamentals duplicate row',
                    track: 'Testing'
                  },
                  {
                    code: 'TEST1001',
                    title: 'Testing Fundamentals in another track',
                    track: 'Quality Assurance'
                  },
                  {
                    code: '',
                    title: 'Admissions summary placeholder'
                  }
                ]
              }
            ]
          }
        ]
      },
      {
        programme_code: 'BINFO',
        programme_name: 'Bachelor of Information Only',
        years: [
          {
            year: 'Year 1',
            semesters: [
              {
                semester: 'Unspecified / programme information',
                courses: [
                  {
                    code: '',
                    title: 'Programme summary only'
                  }
                ]
              }
            ]
          }
        ]
      }
    ]
  }));

  const summary = summarizeSourceFile(source, tempDir);
  assert.equal(summary.programmeCount, 2);
  assert.equal(summary.courseRowCount, 5);
  assert.equal(summary.codedCourseCount, 3);
  assert.equal(summary.uniqueCodedCourseCount, 1);
  assert.equal(summary.duplicateCodedCourseRowCount, 2);
  assert.equal(summary.importableCodedCourseCount, 2);
  assert.equal(summary.duplicateWithinTrackRowCount, 1);
  assert.equal(summary.uncodedCourseRowCount, 2);
  assert.equal(summary.programmeWithCodedCoursesCount, 1);
  assert.equal(summary.programmeSummaryOnlyCount, 1);
  assert.equal(summary.importReady, true);
});

test('UG source coverage report can diagnose a standalone CSV source file', () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ug-catalog-csv-'));
  const csvPath = path.join(tempDir, 'standalone.csv');
  fs.writeFileSync(csvPath, [
    'programme_code,programme,official_url,track_or_award,year_level,subject_code,subject_title_or_description',
    'JSTEST,Bachelor of CSV Testing,https://example.test/csv-testing,Testing,Year 1,CSV1001,CSV Fundamentals',
    'JSTEST,Bachelor of CSV Testing,https://example.test/csv-testing,Testing,Year 1,CSV1001,CSV Fundamentals duplicate',
    'JSTEST,Bachelor of CSV Testing,https://example.test/csv-testing,Quality Assurance,Year 1,CSV1001,CSV Fundamentals in another track',
    'JSTEST,Bachelor of CSV Testing,https://example.test/csv-testing,Testing,Year 2,CSV2001,Advanced CSV',
    'JSINFO,Bachelor of Summary Only,https://example.test/summary,Summary,Year 1,,Summary text only'
  ].join('\n'));

  const args = parseArgs(['--source-file', csvPath, '--json']);
  const parsed = parseCsv(fs.readFileSync(csvPath, 'utf8'));
  const summary = summarizeSourceFilePath(args.sourceFile);

  assert.equal(args.sourceFile, csvPath);
  assert.equal(args.json, true);
  assert.equal(parsed.length, 5);
  assert.equal(summary.format, 'csv');
  assert.equal(summary.programmeCount, 2);
  assert.equal(summary.courseRowCount, 5);
  assert.equal(summary.codedCourseCount, 4);
  assert.equal(summary.uniqueCodedCourseCount, 2);
  assert.equal(summary.importableCodedCourseCount, 3);
  assert.equal(summary.duplicateWithinTrackRowCount, 1);
  assert.equal(summary.programmeWithCodedCoursesCount, 1);
  assert.equal(summary.programmeSummaryOnlyCount, 1);
  assert.equal(summary.importableProgrammes[0].officialUrl, 'https://example.test/csv-testing');
  assert.equal(summary.importReady, true);
});

test('UG source coverage report can diagnose a standalone JSON source file', () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ug-catalog-json-'));
  const jsonPath = path.join(tempDir, 'standalone.json');
  fs.writeFileSync(jsonPath, JSON.stringify({
    university: 'Standalone University',
    programmes: [
      {
        programme_code: 'JSJSON',
        programme_name: 'Bachelor of JSON Testing',
        years: [
          {
            year: 'Year 1',
            semesters: [
              {
                semester: 'Semester 1',
                courses: [
                  { code: 'JSON1001', title: 'JSON Fundamentals' },
                  { code: '', title: 'Summary row' }
                ]
              }
            ]
          }
        ]
      }
    ]
  }));

  const summary = summarizeSourceFilePath(jsonPath);

  assert.equal(summary.format, 'json');
  assert.equal(summary.file, 'standalone.json');
  assert.equal(summary.programmeCount, 1);
  assert.equal(summary.courseRowCount, 2);
  assert.equal(summary.codedCourseCount, 1);
  assert.equal(summary.importableCodedCourseCount, 1);
  assert.equal(summary.uncodedCourseRowCount, 1);
  assert.equal(summary.importReady, true);
});

test('UG source coverage report distinguishes raw coded rows from importable track courses', () => {
  const summary = summarizeSources('/Users/shenjingsong/Documents/Codex/2026-07-06/pdf/outputs');
  const polyu = summary.schools.find((school) => school.code === 'POLYU');

  assert.equal(polyu.codedCourseCount, 172);
  assert.equal(polyu.importableCodedCourseCount, 166);
  assert.equal(polyu.duplicateWithinTrackRowCount, 6);
  assert.equal(polyu.importableProgrammes.length, 1);
  assert.equal(polyu.importableProgrammes[0].programmeCode, 'JS3868');
  assert.match(polyu.importableProgrammes[0].officialUrl, /polyu\.edu\.hk\/study\/ug\/jupas\/2026\/js3868/);
  assert.equal(polyu.importReady, true);
  assert.equal(summary.totals.importableCodedCourseCount, 166);
});

test('UG source coverage report can focus raw source diagnostics by school', () => {
  const args = parseArgs(['--school', 'polyu', '--importable-only']);
  const summary = summarizeSources('/Users/shenjingsong/Documents/Codex/2026-07-06/pdf/outputs', args);
  const generatedSummary = summarizeGeneratedCatalogue(args);
  const importable = listImportableProgrammes(summary, generatedSummary);

  assert.equal(args.importableOnly, true);
  assert.deepEqual(summary.schools.map((school) => school.code), ['POLYU']);
  assert.equal(summary.totals.programmeCount, 46);
  assert.equal(summary.totals.codedCourseCount, 172);
  assert.equal(summary.totals.importableCodedCourseCount, 166);
  assert.deepEqual(importable.map((programme) => programme.schoolCode), ['POLYU']);
  assert.equal(
    importable[0].programmeName,
    'Bachelor of Science (Honours) Scheme in Computing and AI (Computer Science / Enterprise Information Systems)'
  );
  assert.equal(importable[0].importStatus, 'already-open');
  assert.equal(importable[0].generatedCodedCourseCount, 166);
});

test('UG source coverage report can list only not-yet-imported source programmes', () => {
  const args = parseArgs(['--school', 'polyu', '--needs-import-only']);
  const sourceSummary = summarizeSources('/Users/shenjingsong/Documents/Codex/2026-07-06/pdf/outputs', args);
  const generatedSummary = summarizeGeneratedCatalogue(args);
  const importable = listImportableProgrammes(sourceSummary, generatedSummary);
  const needsImport = filterImportableProgrammes(importable, args);

  assert.equal(args.needsImportOnly, true);
  assert.equal(args.importableOnly, false);
  assert.equal(importable.length, 1);
  assert.equal(importable[0].importStatus, 'already-open');
  assert.deepEqual(needsImport, []);
});

test('UG source coverage report includes generated catalogue supplement coverage', () => {
  const summary = summarizeGeneratedCatalogue();
  const cityu = summary.schools.find((school) => school.code === 'CITYU');
  const lingnan = summary.schools.find((school) => school.code === 'LINGNAN');

  assert.equal(summary.totals.programmeCount, 445);
  assert.equal(summary.totals.codedCourseCount, 7034);
  assert.equal(summary.totals.programmeWithCoursesCount, 98);
  assert.equal(cityu.programmeWithCoursesCount, 20);
  assert.equal(cityu.codedCourseCount, 1966);
  assert(cityu.courseProgrammes.some((programme) => programme.code === 'JS1001' && programme.codedCourseCount > 0));
  assert.equal(lingnan.missingProgrammeCount, 0);
  assert.equal(lingnan.courseProgrammes.length, 23);
});

test('UG source coverage report can focus missing programme work by school', () => {
  const args = parseArgs(['--school', 'cityu', '--missing-limit', '5', '--missing-only']);
  const summary = summarizeGeneratedCatalogue(args);

  assert.equal(args.school, 'CITYU');
  assert.equal(args.missingLimit, 5);
  assert.equal(args.missingOnly, true);
  assert.equal(args.json, false);
  assert.deepEqual(summary.schools.map((school) => school.code), ['CITYU']);
  assert.equal(summary.totals.programmeCount, 58);
  assert.equal(summary.totals.programmeWithCoursesCount, 20);
  assert.equal(summary.totals.missingProgrammeCount, 38);
  assert.equal(summary.schools[0].missingProgrammeCount, 38);
  assert.equal(summary.schools[0].missingProgrammes.length, 5);
  assert.equal(filterSchools(summary.schools, 'HKU').length, 0);
});

test('UG source coverage report annotates missing programmes with source-code readiness', () => {
  const args = parseArgs(['--school', 'hku', '--missing-limit', '2', '--missing-only']);
  const sourceSummary = summarizeSources('/Users/shenjingsong/Documents/Codex/2026-07-06/pdf/outputs', args);
  const sourceProgrammes = getSourceProgrammeMap(sourceSummary);
  const summary = summarizeGeneratedCatalogue({ ...args, sourceSummary });
  const firstMissing = summary.schools[0].missingProgrammes[0];

  assert.equal(firstMissing.code, '6066');
  assert.equal(firstMissing.sourceStatus, 'source_index_only');
  assert.equal(firstMissing.sourceCourseRowCount, 1);
  assert.equal(firstMissing.sourceCodedCourseCount, 0);
  assert.equal(firstMissing.sourceImportableCodedCourseCount, 0);
  assert.match(formatMissingSourceStatus(firstMissing), /reviewed no public course codes/);
  assert.equal(firstMissing.sourceReviewStatus, 'no_public_course_codes');
  assert.equal(sourceProgrammes.get('HKU::6066').sourceStatus, 'source_index_only');
});

test('UG source coverage report summarizes missing source readiness', () => {
  const args = parseArgs(['--school', 'hku', '--missing-limit', '2', '--missing-only', '--missing-summary']);
  const sourceSummary = summarizeSources('/Users/shenjingsong/Documents/Codex/2026-07-06/pdf/outputs', args);
  const summary = summarizeGeneratedCatalogue({ ...args, sourceSummary });
  const hku = summary.schools[0];
  const totalReadiness = Object.values(hku.sourceReadiness).reduce((sum, count) => sum + count, 0);

  assert.equal(args.missingSummary, true);
  assert.equal(totalReadiness, hku.missingProgrammeCount);
  assert(hku.sourceReadiness.sourceIndexOnly > 0);
  assert.equal(summary.totals.sourceReadiness.sourceIndexOnly, hku.sourceReadiness.sourceIndexOnly);
  assert.match(formatSourceReadinessSummary(hku.sourceReadiness), /index only/);
  assert.deepEqual(summarizeMissingSourceReadiness([
    { sourceStatus: 'source_importable_rows' },
    { sourceStatus: 'source_coded_rows_not_importable' },
    { sourceStatus: 'source_index_only' },
    { sourceReviewStatus: 'no_public_course_codes' },
    {}
  ]), {
    sourceImportableRows: 1,
    sourceCodedRowsNotImportable: 1,
    sourceIndexOnly: 1,
    reviewedNoCourseCodes: 1,
    noSource: 1
  });
});

test('UG source coverage report can filter missing programmes by source readiness', () => {
  const args = parseArgs(['--school', 'hku', '--missing-only', '--missing-limit', '3', '--readiness', 'no-source']);
  const sourceSummary = summarizeSources('/Users/shenjingsong/Documents/Codex/2026-07-06/pdf/outputs', args);
  const summary = summarizeGeneratedCatalogue({ ...args, sourceSummary });
  const hku = summary.schools[0];

  assert.equal(args.readiness, 'no-source');
  assert.equal(normalizeReadinessFilter('index_only'), 'sourceIndexOnly');
  assert.equal(normalizeReadinessFilter('coded-not-importable'), 'sourceCodedRowsNotImportable');
  assert.equal(normalizeReadinessFilter('importable'), 'sourceImportableRows');
  assert.equal(normalizeReadinessFilter('reviewed-no-codes'), 'reviewedNoCourseCodes');
  assert.equal(normalizeReadinessFilter('all'), '');
  assert.throws(() => normalizeReadinessFilter('maybe'), /Unknown --readiness/);
  assert.equal(hku.missingProgrammeCount, 113);
  assert.equal(hku.filteredMissingProgrammeCount, 10);
  assert.equal(hku.missingProgrammes.length, 3);
  assert(hku.missingProgrammes.every((programme) => !programme.sourceStatus));
  assert.deepEqual(hku.missingProgrammes.map((programme) => programme.name), [
    'HKU-Cambridge Joint Recruitment Scheme (Engineering)',
    'HKU-Geneva Graduate Institute Dual Degree Programme',
    'HKU-PKU Dual Degree Programme'
  ]);
  const template = buildMissingCollectorTemplate(summary, args);
  assert.match(template, /待补 Programme：113/);
  assert.match(template, /当前筛选：no-source · 10 个/);
  assert.match(template, /1\. HKU · 无代码 · HKU-Cambridge Joint Recruitment Scheme \(Engineering\)/);
});

test('UG source coverage report supports machine-readable JSON mode', () => {
  const args = parseArgs(['--school', 'cityu', '--missing-only', '--missing-limit', '3', '--json']);
  const summary = summarizeGeneratedCatalogue(args);

  assert.equal(args.school, 'CITYU');
  assert.equal(args.missingOnly, true);
  assert.equal(args.json, true);
  assert.deepEqual(summary.schools.map((school) => school.code), ['CITYU']);
  assert.equal(summary.schools[0].missingProgrammeCount, 38);
  assert.equal(summary.schools[0].missingProgrammes.length, 3);
  assert.equal(summary.schools[0].missingProgrammes[0].code, 'JS1050');
  assert.match(summary.schools[0].missingProgrammes[0].officialUrl, /jupas\.edu\.hk\/en\/programme\/cityuhk\/JS1050/);
  assert(summary.totals.codedCourseCount > 0);
});

test('UG source coverage report can generate a collector template for missing programmes', () => {
  const args = parseArgs(['--school', 'hku', '--missing-only', '--missing-limit', '2', '--collector-template']);
  const sourceSummary = summarizeSources('/Users/shenjingsong/Documents/Codex/2026-07-06/pdf/outputs', args);
  const summary = summarizeGeneratedCatalogue({ ...args, sourceSummary });
  const missing = listMissingProgrammesForCollection(summary, args);
  const template = buildMissingCollectorTemplate(summary, args);

  assert.equal(args.collectorTemplate, true);
  assert.equal(missing.length, 2);
  assert.equal(missing[0].schoolCode, 'HKU');
  assert.equal(formatCollectorSourceStatus(missing[0]), '已核实官网暂无公开课程码：2026-07-10');
  assert.match(template, /【本科课程资料待补清单】/);
  assert.match(template, /范围：HKU/);
  assert.match(template, /待补 Programme：113/);
  assert.match(template, /来源状态：0 source importable · 0 coded not importable · 101 index only · 2 reviewed no course codes · 10 no source/);
  assert.match(template, /6066 · Bachelor of Arts and Bachelor of Education in Language Education - English/);
  assert.match(template, /官方入口：https:\/\/admissions\.hku\.hk\/programmes\/undergraduate-programmes\/bachelor-of-arts-and-bachelor-of-education-language-education/);
  assert.match(template, /不要自行推测课程/);
  assert.match(template, /课程代码 \/ 课程名 \/ 学分 \/ Year \/ Semester \/ 课程类别 \/ 来源链接/);
});

test('UG source coverage report can prioritize launch data collection batches', () => {
  const args = parseArgs(['--missing-only', '--missing-limit', '4', '--priority', 'launch', '--collector-template']);
  const sourceSummary = summarizeSources('/Users/shenjingsong/Documents/Codex/2026-07-06/pdf/outputs', args);
  const summary = summarizeGeneratedCatalogue({ ...args, sourceSummary });
  const missing = listMissingProgrammesForCollection(summary, args);
  const template = buildMissingCollectorTemplate(summary, args);

  assert.equal(args.priority, 'launch');
  assert.equal(normalizePriorityMode('first_batch'), 'launch');
  assert.equal(normalizePriorityMode('none'), '');
  assert.throws(() => normalizePriorityMode('random'), /Unknown --priority/);
  assert.deepEqual(summary.schools.slice(0, 3).map((school) => school.code), ['POLYU', 'LINGNAN', 'CITYU']);
  assert.equal(missing.length, 4);
  assert(missing.every((programme) => programme.schoolCode === 'POLYU'));
  assert.equal(missing[0].code, 'JS3011');
  assert.equal(isUmbrellaSchemeProgramme({ name: 'Bachelor’s Degree Scheme in Interdisciplinary Studies' }), true);
  assert.equal(isUmbrellaSchemeProgramme({ name: 'Bachelor of Science (Honours) Scheme in Biotechnology and Chemical Technology' }), false);
  assert.match(template, /优先级：launch/);
  assert.match(template, /1\. POLYU · JS3011 · Bachelor of Science \(Honours\) Scheme in Biotechnology and Chemical Technology/);
});

test('UG source coverage report can build a grouped missing data batch plan', () => {
  const args = parseArgs(['--missing-only', '--missing-limit', '3', '--priority', 'launch', '--batch-plan']);
  const sourceSummary = summarizeSources('/Users/shenjingsong/Documents/Codex/2026-07-06/pdf/outputs', args);
  const summary = summarizeGeneratedCatalogue({ ...args, sourceSummary });
  const groups = groupMissingProgrammesByReadiness(summary, args);
  const plan = buildMissingBatchPlan(summary, args);

  assert.equal(args.batchPlan, true);
  assert.equal(groups.sourceIndexOnly.length, 155);
  assert.equal(groups.reviewedNoCourseCodes.length, 21);
  assert.equal(groups.noSource.length, 171);
  assert.equal(groups.sourceIndexOnly[0].schoolCode, 'HKU');
  assert.equal(groups.sourceIndexOnly[0].code, '6119');
  assert.equal(groups.reviewedNoCourseCodes[0].code, 'JS3011');
  assert.equal(groups.reviewedNoCourseCodes[0].sourceReviewStatus, 'no_public_course_codes');
  assert.match(plan, /【本科课程补数批次计划】/);
  assert.match(plan, /A\. 可直接导入候选：0 个/);
  assert.match(plan, /C\. 需打开官方入口核实课程码：155 个/);
  assert.match(plan, /D\. 已核实官网暂无公开课程码：21 个/);
  assert.match(plan, /E\. 需先寻找官方来源：171 个/);
  assert.match(plan, /POLYU · JS3011 · Bachelor of Science \(Honours\) Scheme in Biotechnology and Chemical Technology/);
  assert.match(plan, /npm run status:ug-sources -- --missing-only --priority launch --missing-limit 3 --collector-template/);
  assert.match(plan, /npm run sync:ug-catalog/);
  assert.match(plan, /npm run check:ship/);
});

test('UG source coverage report can filter reviewed no-code programmes', () => {
  const args = parseArgs(['--school', 'polyu', '--missing-only', '--missing-limit', '10', '--readiness', 'reviewed-no-codes']);
  const sourceSummary = summarizeSources('/Users/shenjingsong/Documents/Codex/2026-07-06/pdf/outputs', args);
  const summary = summarizeGeneratedCatalogue({ ...args, sourceSummary });
  const polyu = summary.schools[0];
  const template = buildMissingCollectorTemplate(summary, args);

  assert.equal(polyu.filteredMissingProgrammeCount, 19);
  assert.equal(polyu.missingProgrammes.length, 10);
  assert.equal(polyu.missingProgrammes[0].code, 'JS3214');
  assert.equal(polyu.missingProgrammes[0].sourceReviewStatus, 'no_public_course_codes');
  assert.equal(polyu.missingProgrammes[1].code, 'JS3011');
  assert.equal(polyu.missingProgrammes[1].sourceReviewStatus, 'no_public_course_codes');
  assert.equal(polyu.missingProgrammes[2].code, 'JS3791');
  assert.equal(polyu.missingProgrammes[2].sourceReviewStatus, 'no_public_course_codes');
  assert(polyu.missingProgrammes.some((programme) => programme.code === 'JS3255' && programme.sourceReviewStatus === 'no_public_course_codes'));
  assert(polyu.missingProgrammes.some((programme) => programme.code === 'JS3569' && programme.sourceReviewStatus === 'no_public_course_codes'));
  assert.match(formatMissingSourceStatus(polyu.missingProgrammes[0]), /reviewed no public course codes/);
  assert.match(formatCollectorSourceStatus(polyu.missingProgrammes[0]), /已核实官网暂无公开课程码/);
  assert.match(template, /当前筛选：reviewed-no-codes · 19 个/);
});

test('UG source coverage report can generate a safe supplement starter template', () => {
  const args = parseArgs(['--missing-only', '--missing-limit', '4', '--priority', 'launch', '--supplement-template']);
  const sourceSummary = summarizeSources('/Users/shenjingsong/Documents/Codex/2026-07-06/pdf/outputs', args);
  const summary = summarizeGeneratedCatalogue({ ...args, sourceSummary });
  const [missing] = listMissingProgrammesForCollection(summary, args);
  const template = buildMissingSupplementTemplate(summary, args);

  assert.equal(args.supplementTemplate, true);
  assert.equal(buildSupplementFileName(missing), 'polyu-js3011-courses-2026.json');
  assert.match(template, /建议文件：data\/ug-course-supplements\/polyu-js3011-courses-2026\.json/);
  assert.match(template, /"provider": "POLYU JS3011 undergraduate course supplement"/);
  assert.match(template, /"jupasCode": "JS3011"/);
  assert.match(template, /"courses": \[\]/);
  assert.doesNotMatch(template, /TODO|PLACEHOLDER|TBC/);
});

test('UG supplement validator blocks placeholders and missing source evidence', () => {
  const result = validateUgSupplements();
  assert.equal(result.ok, true);
  assert(result.supplements >= 60);
  assert(result.explicitCourseSupplements > 0);
  assert(result.copiedCourseSupplements > 0);

  assert.throws(() => validateSupplement({
    provider: 'Example supplement',
    universityCode: 'POLYU',
    jupasCode: 'JS3011',
    sourceUrl: 'https://www.polyu.edu.hk/study/ug/jupas/2026/js3011',
    courses: [
      { code: 'TODO1001', title: 'Placeholder course', credits: 3, sourceUrl: 'https://www.polyu.edu.hk/study/ug/jupas/2026/js3011' }
    ]
  }, 0), /placeholder/i);

  assert.throws(() => validateSupplement({
    provider: 'Example supplement',
    universityCode: 'POLYU',
    jupasCode: 'JS3011',
    courses: [
      { code: 'ABCT1001', title: 'Verified Course', credits: 3 }
    ]
  }, 0), /HTTPS sourceUrl or officialUrl/);
});

test('UG generic course supplements can add non-computing undergraduate courses', () => {
  const catalogue = {
    programmes: [
      {
        id: 'LINGNAN-UG-JS7802-1',
        universityCode: 'LINGNAN',
        code: 'JS7802',
        jupasCode: 'JS7802',
        nameEn: 'Bachelor of Arts (Honours) in Philosophy',
        curriculumYear: '2026',
        officialUrl: 'https://example.test/philosophy',
        sourceStatus: 'programme_summary_only',
        courseCount: 0,
        codedCourseCount: 0
      }
    ],
    majors: [
      {
        id: 'LINGNAN-UG-JS7802-1-M1',
        programmeId: 'LINGNAN-UG-JS7802-1',
        nameEn: 'Bachelor of Arts (Honours) in Philosophy',
        courseCount: 0,
        codedCourseCount: 0
      }
    ],
    courses: []
  };

  addGenericCourseSupplements(catalogue, [
    {
      provider: 'official curriculum page',
      academicYear: '2026',
      universityCode: 'LINGNAN',
      jupasCode: 'JS7802',
      sourceUrl: 'https://example.test/philosophy/courses',
      courses: [
        {
          code: 'PHI1001',
          title: 'Introduction to Philosophy',
          credits: 3,
          group: 'core'
        },
        {
          code: 'PHI2001',
          title: 'Ethics and Society',
          credits: 3,
          group: 'elective'
        }
      ]
    }
  ]);

  assert.equal(catalogue.programmes[0].sourceStatus, 'course_codes_available');
  assert.equal(catalogue.programmes[0].codedCourseCount, 2);
  assert.equal(catalogue.majors[0].codedCourseCount, 2);
  assert.deepEqual(catalogue.courses.map((course) => course.courseCode), ['PHI1001', 'PHI2001']);
  assert.equal(catalogue.courses[0].courseType, 'core');
  assert.equal(catalogue.courses[0].sourceProvider, 'official curriculum page');
});

test('UG generic course supplements can reuse a degree-track course template', () => {
  const catalogue = {
    programmes: [
      {
        id: 'CITYU-UG-JS1042-1',
        universityCode: 'CITYU',
        code: 'JS1042',
        jupasCode: 'JS1042',
        nameEn: 'BA Creative Media',
        curriculumYear: '2026',
        officialUrl: 'https://example.test/bacm',
        sourceStatus: 'programme_summary_only',
        courseCount: 0,
        codedCourseCount: 0
      },
      {
        id: 'CITYU-UG-JS1041-1',
        universityCode: 'CITYU',
        code: 'JS1041',
        jupasCode: 'JS1041',
        nameEn: 'Creative Media',
        curriculumYear: '2026',
        officialUrl: 'https://example.test/scm',
        sourceStatus: 'programme_summary_only',
        courseCount: 0,
        codedCourseCount: 0
      }
    ],
    majors: [
      {
        id: 'CITYU-UG-JS1042-1-M1',
        programmeId: 'CITYU-UG-JS1042-1',
        nameEn: 'BA Creative Media',
        courseCount: 0,
        codedCourseCount: 0
      },
      {
        id: 'CITYU-UG-JS1041-1-M1',
        programmeId: 'CITYU-UG-JS1041-1',
        nameEn: 'BA Creative Media',
        courseCount: 0,
        codedCourseCount: 0
      }
    ],
    courses: []
  };

  addGenericCourseSupplements(catalogue, [
    {
      provider: 'SCM curriculum page',
      academicYear: '2026',
      universityCode: 'CITYU',
      jupasCode: 'JS1042',
      courses: [
        {
          code: 'SM2105',
          title: 'Narrative Strategies & Aesthetics of Time-based Media',
          credits: 3,
          group: 'major core'
        },
        {
          code: 'SM4712A',
          title: 'Graduation Thesis / Project',
          credits: 6,
          group: 'capstone project'
        }
      ]
    },
    {
      provider: 'SCM curriculum page',
      academicYear: '2026',
      universityCode: 'CITYU',
      jupasCode: 'JS1041',
      majorName: 'BA Creative Media',
      officialUrl: 'https://example.test/bacm',
      copyCoursesFrom: { universityCode: 'CITYU', jupasCode: 'JS1042' }
    }
  ]);

  const sourceProgramme = catalogue.programmes.find((programme) => programme.jupasCode === 'JS1042');
  const reusedProgramme = catalogue.programmes.find((programme) => programme.jupasCode === 'JS1041');
  const reusedMajor = catalogue.majors.find((major) => major.programmeId === reusedProgramme.id);
  const reusedCourses = catalogue.courses.filter((course) => course.programmeId === reusedProgramme.id);

  assert.equal(sourceProgramme.codedCourseCount, 2);
  assert.equal(reusedProgramme.sourceStatus, 'course_codes_available');
  assert.equal(reusedProgramme.codedCourseCount, 2);
  assert.equal(reusedMajor.codedCourseCount, 2);
  assert.deepEqual(reusedCourses.map((course) => course.courseCode), ['SM2105', 'SM4712A']);
  assert(reusedCourses.every((course) => course.officialUrl === 'https://example.test/bacm'));
});

test('UG catalogue generator groups course shards by programme university', () => {
  const catalogue = {
    programmes: [
      { id: 'HKU-UG-BSC-1', universityCode: 'HKU' },
      { id: 'CITYU-UG-BBA-1', universityCode: 'CITYU' }
    ],
    courses: [
      { programmeId: 'CITYU-UG-BBA-1', courseCode: 'CB2100' },
      { programmeId: 'HKU-UG-BSC-1', courseCode: 'COMP2119' },
      { programmeId: 'CITYU-UG-BBA-1', courseCode: 'CB2200' }
    ]
  };

  const grouped = groupCoursesByUniversity(catalogue);

  assert.deepEqual([...grouped.keys()].sort(), ['CITYU', 'HKU']);
  assert.deepEqual(grouped.get('CITYU').map((course) => course.courseCode), ['CB2100', 'CB2200']);
  assert.deepEqual(grouped.get('HKU').map((course) => course.courseCode), ['COMP2119']);
});
