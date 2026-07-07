const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');
const { validateSourceDir } = require('./generate-ug-catalog');
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
