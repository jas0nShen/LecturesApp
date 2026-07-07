const assert = require('node:assert/strict');
const test = require('node:test');
const { buildSnapshot, parseLastPage, parseProgrammeCards } = require('./import-hku-ug-programmes');

const sampleHtml = `
  <div class="view-content">
    <div class="views-row">
      <div class="program-list-item" tabindex="0">
        <div class="program-content">
          <a href="/programmes/undergraduate-programmes/bachelor-of-engineering" class="link-to-program btn-arrow">EXPLORE MORE</a>
          <div class="faculty">Faculty of Engineering</div>
          <div class="program-title">Bachelor of Engineering</div>
          <div class="program-info-wrapper">
            <div class="program-info-col">
              <div class="content-title">CODE</div>
              <div class="content code">6963</div>
            </div>
            <div class="program-info-col">
              <div class="content-title">FACULTY</div>
              <div class="content faculty">Faculty of Engineering</div>
            </div>
            <div class="program-info-col">
              <div class="content-title">STUDY PERIOD</div>
              <div class="content study-period">4-year</div>
            </div>
            <div class="program-info-col">
              <div class="content-title">TYPE</div>
              <div class="content curriculum">Single Degree Programme</div>
            </div>
          </div>
        </div>
        <div class="program-summary">
          <p>Students can select from different engineering majors after admission.</p>
        </div>
      </div>
    </div>
    <div class="views-row">
      <div class="program-list-item" tabindex="0">
        <div class="program-content">
          <a href="/programmes/undergraduate-programmes/bachelor-of-arts" class="link-to-program btn-arrow">EXPLORE MORE</a>
          <div class="faculty">Faculty of Arts</div>
          <div class="program-title">Bachelor of Arts</div>
          <div class="program-info-wrapper">
            <div class="program-info-col"><div class="content-title">CODE</div><div class="content code">6054</div></div>
            <div class="program-info-col"><div class="content-title">FACULTY</div><div class="content faculty">Faculty of Arts</div></div>
            <div class="program-info-col"><div class="content-title">STUDY PERIOD</div><div class="content study-period">4-year</div></div>
            <div class="program-info-col"><div class="content-title">TYPE</div><div class="content curriculum">Single Degree Programme</div></div>
          </div>
        </div>
        <div class="program-summary"><p>A flexible curriculum with multiple disciplines.</p></div>
      </div>
    </div>
  </div>
`;

test('HKU undergraduate programme cards are parsed from official page markup', () => {
  const programmes = parseProgrammeCards(sampleHtml);

  assert.equal(programmes.length, 2);
  assert.deepEqual(programmes[0], {
    code: '6963',
    title: 'Bachelor of Engineering',
    faculty: 'Faculty of Engineering',
    studyPeriod: '4-year',
    type: 'Single Degree Programme',
    summary: 'Students can select from different engineering majors after admission.',
    officialUrl: 'https://admissions.hku.hk/programmes/undergraduate-programmes/bachelor-of-engineering'
  });
});

test('last page is detected from Drupal pager links', () => {
  const html = `
    <nav class="pager">
      <a href="?page=1">2</a>
      <a href="?page=13" title="Go to last page">Last</a>
    </nav>
  `;

  assert.equal(parseLastPage(html), 13);
});

test('programmes without official codes are still imported', () => {
  const html = `
    <div class="views-row">
      <div class="program-list-item">
        <div class="program-content">
          <a href="https://example.edu/dual-degree" class="link-to-program btn-arrow">EXPLORE MORE</a>
          <div class="faculty">Faculty of Social Sciences</div>
          <div class="program-title">HKU-PKU Dual Degree Programme</div>
          <div class="program-info-wrapper">
            <div class="program-info-col"><div class="content-title">FACULTY</div><div class="content faculty">Faculty of Social Sciences</div></div>
            <div class="program-info-col"><div class="content-title">STUDY PERIOD</div><div class="content study-period">2 years at HKU, 2 years at PKU</div></div>
            <div class="program-info-col"><div class="content-title">TYPE</div><div class="content curriculum">Dual Degrees and Joint Admissions</div></div>
          </div>
        </div>
      </div>
    </div>
  `;
  const programmes = parseProgrammeCards(html);

  assert.equal(programmes.length, 1);
  assert.equal(programmes[0].code, '');
  assert.equal(programmes[0].title, 'HKU-PKU Dual Degree Programme');
});

test('snapshot deduplicates repeated programmes across pages', () => {
  const snapshot = buildSnapshot([sampleHtml, sampleHtml], '2026-07-07T00:00:00.000Z');

  assert.equal(snapshot.universityCode, 'HKU');
  assert.equal(snapshot.level, 'undergraduate');
  assert.equal(snapshot.programmes.length, 2);
  assert.deepEqual(
    snapshot.programmes.map((programme) => programme.code),
    ['6054', '6963']
  );
});
