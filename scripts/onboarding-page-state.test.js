const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const ROOT = path.join(__dirname, '..');
const ONBOARDING_PATH = path.join(ROOT, 'miniprogram', 'pages', 'onboarding', 'onboarding.js');

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function loadOnboardingPage(profile = null, app = {}) {
  delete require.cache[require.resolve(ONBOARDING_PATH)];
  const storageWrites = [];
  const toasts = [];
  global.wx = {
    getStorageSync: (key) => (key === 'userProfile' ? profile : null),
    setStorageSync: (key, value) => storageWrites.push({ key, value }),
    navigateTo: () => {},
    switchTab: () => {},
    showToast: (value) => toasts.push(value),
    showModal: () => {}
  };
  global.getApp = () => app;
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
  page.__events = { storageWrites, toasts };
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

test('saved TPG Track is restored and switching to a no-Track Programme clears it', async () => {
  const programmeId = 'EDUHK-TPG-DIR-MED';
  const page = loadOnboardingPage({
    profileType: 'tpg',
    universityCode: 'EDUHK',
    programmeId,
    trackId: `${programmeId}-CTA`
  });
  await page.onLoad({ mode: 'tpg' });
  assert.equal(page.data.selectedTpgProgramme.id, programmeId);
  assert.equal(page.data.selectedTpgTrack.id, `${programmeId}-CTA`);
  assert.equal(page.data.tpgTracks.length, 10);

  const polyu = page.data.tpgUniversities.find((item) => item.code === 'POLYU');
  const programmes = require('../miniprogram/utils/tpgService').listProgrammes('POLYU');
  page.setTpgSelection(polyu, programmes, programmes.find((item) => item.id === 'POLYU-TPG-093'), '');
  assert.equal(page.data.tpgTracks.length, 0);
  assert.equal(page.data.selectedTpgTrack.id, undefined);
});

test('selecting a TPG Track refreshes the Track-specific course count', async () => {
  const page = loadOnboardingPage();
  await page.onLoad({ mode: 'tpg' });
  const cityu = page.data.tpgUniversities.find((item) => item.code === 'CITYU');
  const programmes = require('../miniprogram/utils/tpgService').listProgrammes('CITYU');
  const programme = programmes.find((item) => item.id === 'CITYU-TPG-057');
  page.setTpgSelection(cityu, programmes, programme, '');

  assert.equal(page.data.tpgCourseCount, 20);
  const noConcentrationIndex = page.data.tpgTracks.findIndex((track) => track.id === 'CITYU-TPG-057-NO-CONCENTRATION');
  page.selectTpgTrack({ currentTarget: { dataset: { index: noConcentrationIndex } } });
  assert.equal(page.data.tpgCourseCount, 24);
  assert.equal(page.data.tpgCourseStatus, '已录入 24 门课程');
});

test('optional Concentrations can be saved empty while Award Paths remain required', async () => {
  const tpgService = require('../miniprogram/utils/tpgService');
  const optionalPage = loadOnboardingPage();
  await optionalPage.onLoad({ mode: 'tpg' });
  const hkust = optionalPage.data.tpgUniversities.find((item) => item.code === 'HKUST');
  const programmes = tpgService.listProgrammes('HKUST');
  optionalPage.setTpgSelection(hkust, programmes, programmes.find((item) => item.id === 'HKUST-TPG-036'), '');
  optionalPage.save();
  const optionalProfile = optionalPage.__events.storageWrites.find((item) => item.key === 'userProfile');
  assert(optionalProfile);
  assert.equal(optionalProfile.value.trackId, '');
  assert.equal(optionalPage.__events.toasts.some((item) => item.title === '请选择 Track'), false);

  const requiredPage = loadOnboardingPage();
  await requiredPage.onLoad({ mode: 'tpg' });
  const requiredHkust = requiredPage.data.tpgUniversities.find((item) => item.code === 'HKUST');
  const requiredProgrammes = tpgService.listProgrammes('HKUST');
  requiredPage.setTpgSelection(requiredHkust, requiredProgrammes, requiredProgrammes.find((item) => item.id === 'HKUST-TPG-044'), '');
  requiredPage.save();
  assert.equal(requiredPage.__events.toasts.at(-1).title, '请选择 Track');
  assert.equal(requiredPage.__events.storageWrites.some((item) => item.key === 'userProfile'), false);
});

test('TPG Programme keyword input immediately matches Blockchain Technology', async () => {
  const page = loadOnboardingPage({
    profileType: 'tpg',
    universityCode: 'POLYU',
    programmeId: 'POLYU-TPG-001'
  });
  await page.onLoad({ mode: 'tpg' });

  page.onTpgKeyword({ detail: { value: 'block' } });

  assert.equal(page.data.tpgKeyword, 'block');
  assert.equal(page.data.selectedTpgProgramme.name, 'Blockchain Technology');
  assert.equal(page.data.filteredTpgProgrammes.some((item) => item.name === 'Blockchain Technology'), true);
  assert.equal(page.data.visibleTpgProgrammes[0].name, 'Blockchain Technology');
});

test('Programme keyword handlers accept confirm text event fallbacks', async () => {
  const page = loadOnboardingPage({
    profileType: 'tpg',
    universityCode: 'POLYU',
    programmeId: 'POLYU-TPG-001'
  });
  await page.onLoad({ mode: 'tpg' });

  page.onTpgKeyword({ detail: { text: 'block' } });

  assert.equal(page.data.tpgKeyword, 'block');
  assert.equal(page.data.selectedTpgProgramme.name, 'Blockchain Technology');
});

test('Programme inputs do not rebuild the selection on blur before a button tap completes', () => {
  const wxml = fs.readFileSync(
    path.join(ROOT, 'miniprogram', 'pages', 'onboarding', 'onboarding.wxml'),
    'utf8'
  );

  assert.doesNotMatch(wxml, /bind:blur="on(?:Ug|Tpg)Keyword"/);
  assert.match(wxml, /bind:input="onTpgKeyword"/);
  assert.match(wxml, /bind:confirm="onTpgKeyword"/);
});

test('TPG Programme inputs stay embedded and actions keep their original two-column bindings', () => {
  const wxml = fs.readFileSync(
    path.join(ROOT, 'miniprogram', 'pages', 'onboarding', 'onboarding.wxml'),
    'utf8'
  );

  assert.match(wxml, /always-embed="{{true}}"/);
  assert.match(wxml, /<view class="button-space tpg-actions">/);
  assert.match(wxml, /<view class="preview-button" bindtap="previewTpgProgramme">预览 Programme<\/view>/);
  assert.match(wxml, /<view class="button" bindtap="save">保存授课硕士 Programme<\/view>/);
});

test('undergraduate school switching does not wait for course packages', async () => {
  const page = loadOnboardingPage();
  await page.onLoad({});
  const hkuIndex = page.data.universities.findIndex((item) => item.code === 'HKU');
  const polyuIndex = page.data.universities.findIndex((item) => item.code === 'POLYU');

  await page.selectUgUniversityByIndex(hkuIndex);
  await page.selectUgUniversityByIndex(polyuIndex);

  assert.equal(page.data.selectedUniversity.code, 'POLYU');
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
