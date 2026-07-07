const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');
const { addGenericCourseSupplements, buildStaticCatalogue, validateSourceDir } = require('./generate-ug-catalog');
const { summarizeSourceFile } = require('./report-ug-source-coverage');

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
                    title: 'Testing Fundamentals'
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
  assert.equal(summary.courseRowCount, 3);
  assert.equal(summary.codedCourseCount, 1);
  assert.equal(summary.uncodedCourseRowCount, 2);
  assert.equal(summary.programmeWithCodedCoursesCount, 1);
  assert.equal(summary.programmeSummaryOnlyCount, 1);
  assert.equal(summary.importReady, true);
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
