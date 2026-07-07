const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');
const { buildStaticCatalogue, validateSourceDir } = require('./generate-ug-catalog');
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
  assert.equal(summary.programmeWithCodedCoursesCount, 1);
});
