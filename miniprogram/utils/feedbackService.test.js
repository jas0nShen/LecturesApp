const assert = require('node:assert/strict');
const { test } = require('node:test');

const feedbackService = require('./feedbackService');

test('feedback template includes launch context without uploading local user data', () => {
  const template = feedbackService.buildFeedbackTemplate({
    profileType: 'tpg',
    universityCode: 'HKU',
    programmeId: 'HKU-TPG-048',
    programmeName: 'Master of Science in Artificial Intelligence (MSc(AI))',
    curriculumYear: '2025-26',
    userName: 'should-not-leak'
  });

  assert(template.includes('【选课港反馈 / 纠错】'));
  assert(template.includes('版本：1.0.10'));
  assert(template.includes('学校：香港大学'));
  assert(template.includes('Programme：Master of Science in Artificial Intelligence (MSc(AI))'));
  assert(template.includes('当前资料状态：课程结构已开放 · 22 门课程'));
  assert(template.includes('数据补充模板：'));
  assert(template.includes('- 当前 Programme / Major：Master of Science in Artificial Intelligence (MSc(AI))'));
  assert(template.includes('不会自动上传本机资料、收藏、笔记或 Study Plan'));
  assert(!template.includes('should-not-leak'));
});

test('feedback template can include only count-based local data summary', () => {
  const template = feedbackService.buildFeedbackTemplate({
    profileType: 'tpg',
    universityCode: 'HKU',
    programmeId: 'HKU-TPG-048',
    programmeName: 'Master of Science in Artificial Intelligence (MSc(AI))',
    curriculumYear: '2025-26'
  }, {
    userSummary: {
      hasProfile: true,
      favoriteCount: 2,
      completedCount: 1,
      studyPlanCount: 3,
      noteCount: 4,
      searchCount: 5,
      noteText: 'private note should not leak',
      courseCodes: ['COMP1117']
    }
  });

  assert(template.includes('本机数据摘要：已设置资料：是 · 收藏 2 · 已修 1 · 计划 3 · 笔记 4 · 搜索 5'));
  assert(template.includes('只包含数量，不包含具体课程或笔记内容'));
  assert(!template.includes('private note should not leak'));
  assert(!template.includes('COMP1117'));
});

test('feedback template works before a programme is saved', () => {
  const template = feedbackService.buildFeedbackTemplate(null);

  assert(template.includes('学校：待填写'));
  assert(template.includes('Programme：待填写'));
  assert(template.includes('当前资料状态：尚未设置 Programme'));
});

test('feedback template can target an unsaved programme detail', () => {
  const tpgService = require('./tpgService');
  const programme = tpgService.getProgramme('HKU-TPG-024');
  const template = feedbackService.buildFeedbackTemplate(null, { programme });

  assert(template.includes('学校：香港大学'));
  assert(template.includes('Programme：Master of Dental Surgery in Orthodontics and Dentofacial Orthopaedics (MDS(Orthodontics&DentofacialOrthopaedics;))'));
  assert(template.includes('当前资料状态：课程结构已开放 · 15 门课程'));
  assert(template.includes('- 需要补充的课程代码 / 课程名：待填写'));
  assert(template.includes('HKU_Master_Course_Guide.pdf'));
});

test('feedback template includes imported undergraduate catalogue context', () => {
  const template = feedbackService.buildFeedbackTemplate({
    profileType: 'undergraduate',
    universityCode: 'HKU',
    programmeId: 'HKU-UG-6004-1',
    programmeName: 'Bachelor of Arts in Architectural Studies',
    majorId: 'HKU-UG-6004-1-M1',
    majorName: 'Bachelor of Arts in Architectural Studies',
    curriculumYear: '2026'
  });

  assert(template.includes('学校：香港大学'));
  assert(template.includes('Programme：Bachelor of Arts in Architectural Studies'));
  assert(template.includes('当前资料状态：Bachelor of Arts in Architectural Studies · 已开放 24 门课程'));
  assert(template.includes('- 当前 Programme / Major：Bachelor of Arts in Architectural Studies'));
  assert(template.includes('- 资料采集方向：课程清单已开放，如发现课程缺漏或分类错误，请补充官方课程页或截图。'));
  assert(template.includes('- 官方链接 / 截图来源：https://admissions.hku.hk/programmes/undergraduate-programmes/bachelor-of-arts-architectural-studies'));
  assert(template.includes('https://admissions.hku.hk/programmes/undergraduate-programmes/bachelor-of-arts-architectural-studies'));
});

test('feedback template highlights missing undergraduate course lists for data collection', () => {
  const template = feedbackService.buildFeedbackTemplate({
    profileType: 'undergraduate',
    universityCode: 'CITYU',
    programmeId: 'CITYU-UG-INSPIRE-19',
    programmeName: 'International Sustainability Programme for Innovation, Research & Entrepreneurship(INSPIRE)',
    majorId: 'CITYU-UG-INSPIRE-19-M1',
    majorName: 'BEng Energy Science & Engineering',
    curriculumYear: '2026'
  });

  assert(template.includes('学校：香港城市大学'));
  assert(template.includes('课程清单待开放'));
  assert(template.includes('- 当前 Programme / Major：International Sustainability Programme for Innovation, Research & Entrepreneurship(INSPIRE)'));
  assert(template.includes('/ BEng Energy Science & Engineering'));
  assert(template.includes('- 资料采集方向：已有 Programme 官方入口，优先补课程代码、课程名、学分、Year/Semester 和课程类别。'));
  assert(template.includes('- 需要补充的课程代码 / 课程名：这个 Programme 课程清单待开放，请补充官方课程表'));
  assert(template.includes('- 官方链接 / 截图来源：https://www.jupas.edu.hk/en/programme/cityuhk/JS1050'));
});
