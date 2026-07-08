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
  filterImportableProgrammes,
  filterSchools,
  listImportableProgrammes,
  parseArgs,
  parseCsv,
  summarizeGeneratedCatalogue,
  summarizeSourceFile,
  summarizeSourceFilePath,
  summarizeSources
} = require('./report-ug-source-coverage');

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
  assert.equal(summary.totals.codedCourseCount, 3294);
  assert.equal(summary.totals.programmeWithCoursesCount, 53);
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
