const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const MINI_ROOT = path.join(ROOT, 'miniprogram');

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function walkFiles(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const target = path.join(directory, entry.name);
    return entry.isDirectory() ? walkFiles(target) : [target];
  });
}

function summarizeTpgCatalogue(tpgCatalogue) {
  const programmeWithCourses = tpgCatalogue.programmes.filter((programme) => (
    (programme.courseGroups || []).some((group) => (group.courses || []).length > 0)
  ));
  const courseCount = tpgCatalogue.programmes.reduce((total, programme) => (
    total + (programme.courseGroups || []).reduce((groupTotal, group) => (
      groupTotal + (group.courses || []).length
    ), 0)
  ), 0);
  return {
    schoolCount: tpgCatalogue.universities.length,
    programmeCount: tpgCatalogue.programmes.length,
    programmeWithCoursesCount: programmeWithCourses.length,
    courseCount,
    schoolCodes: tpgCatalogue.universities.map((university) => university.code)
  };
}

function checkReleaseReadiness(now = new Date()) {
  const packageJson = readJson(path.join(ROOT, 'package.json'));
  const project = readJson(path.join(MINI_ROOT, 'project.config.json'));
  const app = readJson(path.join(MINI_ROOT, 'app.json'));
  const sitemap = readJson(path.join(MINI_ROOT, app.sitemapLocation || 'sitemap.json'));
  const seed = readJson(path.join(ROOT, 'data', 'seed.json'));
  const offerings = readJson(path.join(ROOT, 'data', 'hku-cds-offerings-2025.json'));
  const tpgCatalogue = readJson(path.join(ROOT, 'data', 'tpg-programmes.json'));
  const releaseInfo = require(path.join(MINI_ROOT, 'utils', 'releaseInfo'));
  const tpgSummary = summarizeTpgCatalogue(tpgCatalogue);
  const errors = [];
  const warnings = [];

  if (!/^wx[a-f0-9]{16}$/i.test(project.appid || '')) {
    errors.push('project.config.json does not contain a valid WeChat AppID');
  }
  if (!String(project.description || '').includes('香港高校') || !String(project.description || '').includes('授课硕士')) {
    errors.push('project.config.json description must match the six-school taught postgraduate launch positioning');
  }
  if (project.setting && project.setting.uploadWithSourceMap !== false) {
    errors.push('Source map upload must be disabled for the release build');
  }
  if (releaseInfo.version !== packageJson.version) {
    errors.push(`releaseInfo version ${releaseInfo.version} does not match package version ${packageJson.version}`);
  }
  if (!sitemap.rules || !sitemap.rules.some((rule) => (
    rule.action === 'disallow' && rule.page === '*'
  ))) {
    errors.push('sitemap.json must prevent personal and planning pages from being indexed');
  }

  const requiredExtensions = ['js', 'json', 'wxml', 'wxss'];
  app.pages.forEach((page) => {
    requiredExtensions.forEach((extension) => {
      if (!fs.existsSync(path.join(MINI_ROOT, `${page}.${extension}`))) {
        errors.push(`Missing page file: ${page}.${extension}`);
      }
    });
  });

  ['pages/privacy-data/privacy-data', 'pages/data-status/data-status'].forEach((page) => {
    if (!app.pages.includes(page)) errors.push(`Required release page is not registered: ${page}`);
  });

  const ignoredFiles = new Set((project.packOptions && project.packOptions.ignore || [])
    .filter((item) => item.type === 'file')
    .map((item) => item.value));
  walkFiles(MINI_ROOT)
    .filter((file) => file.endsWith('.test.js'))
    .forEach((file) => {
      const relative = path.relative(MINI_ROOT, file);
      if (!ignoredFiles.has(relative)) errors.push(`Test file is not excluded from upload: ${relative}`);
    });

  const programme = seed.programmes[0];
  const structureCredits = programme.curriculumStructure
    .reduce((sum, section) => sum + section.credits, 0);
  if (structureCredits !== programme.totalCreditRequired) {
    errors.push(`Curriculum structure totals ${structureCredits}, expected ${programme.totalCreditRequired}`);
  }

  const sourceAgeDays = Math.floor(
    (now.getTime() - new Date(offerings.retrievedAt).getTime()) / 86400000
  );
  if (sourceAgeDays > 90) {
    errors.push(`Course offering snapshot is ${sourceAgeDays} days old and must be reviewed`);
  }
  if (offerings.courses.some((course) => !course.details || !course.officialUrl)) {
    errors.push('One or more official offerings are missing details or source URLs');
  }
  if (tpgSummary.schoolCount < 6) {
    errors.push(`TPG catalogue includes ${tpgSummary.schoolCount} schools, expected at least 6`);
  }
  if (tpgSummary.programmeCount < 300) {
    errors.push(`TPG catalogue includes ${tpgSummary.programmeCount} programmes, expected at least 300`);
  }

  const uploadFiles = walkFiles(MINI_ROOT).filter((file) => {
    const relative = path.relative(MINI_ROOT, file);
    return !ignoredFiles.has(relative) && relative !== 'project.private.config.json';
  });
  const packageBytes = uploadFiles.reduce((sum, file) => sum + fs.statSync(file).size, 0);
  const sourceText = walkFiles(MINI_ROOT)
    .filter((file) => file.endsWith('.js') && !file.endsWith('.test.js'))
    .map((file) => fs.readFileSync(file, 'utf8'))
    .join('\n');
  const sensitiveApis = [
    'wx.getLocation',
    'wx.chooseLocation',
    'wx.getUserProfile',
    'wx.getUserInfo',
    'wx.getPhoneNumber',
    'wx.chooseAddress',
    'wx.chooseMedia'
  ].filter((apiName) => sourceText.includes(apiName));
  if (sensitiveApis.length) {
    errors.push(`Sensitive APIs require a reviewed privacy declaration: ${sensitiveApis.join(', ')}`);
  }

  warnings.push('Manual WeChat privacy declaration, category, filing and review checks are still required');
  warnings.push('Production HTTPS API is not configured; trial and release builds run offline');

  return {
    ready: errors.length === 0,
    release: {
      version: releaseInfo.version,
      target: releaseInfo.target,
      dataMode: releaseInfo.dataMode
    },
    errors,
    warnings,
    metrics: {
      pageCount: app.pages.length,
      offeringCount: offerings.courses.length,
      offeringAgeDays: Math.max(0, sourceAgeDays),
      tpgSchoolCount: tpgSummary.schoolCount,
      tpgProgrammeCount: tpgSummary.programmeCount,
      tpgProgrammeWithCoursesCount: tpgSummary.programmeWithCoursesCount,
      tpgCourseCount: tpgSummary.courseCount,
      uploadFileCount: uploadFiles.length,
      packageBytes,
      sensitiveApiCount: sensitiveApis.length
    },
    manualChecklist: {
      privacyDeclaration: 'Confirm storage, clipboard read/write, share, and offline data behavior in WeChat admin',
      categoryAndFiling: 'Confirm service category, ICP/filing, app name, avatar, and description',
      deviceTesting: 'Run the TPG setup, catalogue, programme detail, audit, profile, data status, and privacy flows on iOS and Android',
      reviewMaterial: 'Use docs/REVIEW_SUBMISSION.md for the version description and reviewer path'
    }
  };
}

if (require.main === module) {
  const result = checkReleaseReadiness();
  console.log(JSON.stringify(result, null, 2));
  assert.equal(result.ready, true, result.errors.join('\n'));
}

module.exports = {
  checkReleaseReadiness,
  summarizeTpgCatalogue,
  walkFiles
};
