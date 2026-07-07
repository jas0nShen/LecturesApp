const assert = require('node:assert/strict');
const path = require('node:path');
const test = require('node:test');

const ROOT = path.join(__dirname, '..');
const ONBOARDING_PATH = path.join(ROOT, 'miniprogram', 'pages', 'onboarding', 'onboarding.js');

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function loadOnboardingPage(profile = null) {
  delete require.cache[require.resolve(ONBOARDING_PATH)];
  global.wx = {
    getStorageSync: (key) => (key === 'userProfile' ? profile : null),
    setStorageSync: () => {},
    navigateTo: () => {},
    switchTab: () => {},
    showToast: () => {}
  };
  let page = null;
  global.Page = (config) => {
    page = {
      ...config,
      data: clone(config.data),
      setData(patch) {
        this.data = { ...this.data, ...patch };
      }
    };
  };
  require(ONBOARDING_PATH);
  return page;
}

test('first onboarding visit does not preselect a university or programme', async () => {
  const page = loadOnboardingPage();

  await page.onLoad({});

  assert.equal(page.data.mode, 'tpg');
  assert.equal(page.data.selectedUniversity.code, undefined);
  assert.equal(page.data.selectedProgramme.id, undefined);
  assert.equal(page.data.filteredUgProgrammes.length, 0);
  assert.equal(page.data.selectedTpgUniversity.code, undefined);
  assert.equal(page.data.selectedTpgProgramme.id, undefined);
  assert.equal(page.data.filteredTpgProgrammes.length, 0);
  assert(page.data.universities.length >= 8);
  assert(page.data.tpgUniversities.length >= 8);
});

test('editing a saved undergraduate profile keeps the saved school and programme', async () => {
  const page = loadOnboardingPage({
    profileType: 'undergraduate',
    universityId: 'POLYU',
    universityCode: 'POLYU',
    programmeId: 'POLYU-UG-JS3220-2',
    programmeName: 'Bachelor of Science (Honours) Scheme in Applied Mathematics and Finance Analytics (Applied Mathematics / Investment Science and Finance Analytics / Quantitative Finance and FinTech)',
    majorId: 'POLYU-UG-JS3220-2-M1',
    majorCode: 'APPLIED-MATHEMATICS',
    curriculumYear: '2026',
    currentYear: 1
  });

  await page.onLoad({ mode: 'undergraduate' });

  assert.equal(page.data.mode, 'undergraduate');
  assert.equal(page.data.selectedUniversity.code, 'POLYU');
  assert.equal(page.data.selectedProgramme.id, 'POLYU-UG-JS3220-2');
  assert.equal(page.data.selectedMajor.code, 'APPLIED-MATHEMATICS');
  assert.equal(page.data.curriculumYear, '2026');
});
