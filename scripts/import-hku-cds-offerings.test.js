const assert = require('node:assert/strict');
const test = require('node:test');
const { normalizeCourseCode, parseOfferings } = require('./import-hku-cds-offerings');

test('section suffixes are normalized without changing unsuffixed course codes', () => {
  assert.equal(normalizeCourseCode('COMP1117A'), 'COMP1117');
  assert.equal(normalizeCourseCode('COMP3251'), 'COMP3251');
});

test('HKU offering rows are grouped into one course with multiple terms', () => {
  const html = `
    <tr><td colspan="4"><a name="courseLevel13_4y"></a>Year 1 - Core</td></tr>
    <tr><td>COMP1117A</td><td><a href="/index.php/programmes/course-offered?infile=2025/comp1117.html">Computer Programming</a></td><td>1</td><td>Teacher A</td></tr>
    <tr><td>COMP1117B</td><td><a href="/index.php/programmes/course-offered?infile=2025/comp1117.html">Computer Programming</a></td><td>2</td><td>Teacher B</td></tr>
  `;
  const courses = parseOfferings(html);

  assert.equal(courses.length, 1);
  assert.equal(courses[0].courseCode, 'COMP1117');
  assert.deepEqual(courses[0].terms, ['1', '2']);
  assert.deepEqual(courses[0].categories, ['Year 1 - Core']);
  assert.equal(courses[0].sections.length, 2);
});
