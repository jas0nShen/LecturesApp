const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');
const { validateSourceDir } = require('./generate-ug-catalog');

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
