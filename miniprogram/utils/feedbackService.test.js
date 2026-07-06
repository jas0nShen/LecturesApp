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
  assert(template.includes('版本：0.1.0'));
  assert(template.includes('学校：香港大学'));
  assert(template.includes('Programme：Master of Science in Artificial Intelligence (MSc(AI))'));
  assert(template.includes('当前资料状态：课程结构已录入 · 22 门课程'));
  assert(template.includes('不会自动上传本机资料、收藏、笔记或 Study Plan'));
  assert(!template.includes('should-not-leak'));
});

test('feedback template works before a programme is saved', () => {
  const template = feedbackService.buildFeedbackTemplate(null);

  assert(template.includes('学校：待填写'));
  assert(template.includes('Programme：待填写'));
  assert(template.includes('当前资料状态：尚未设置 Programme'));
});

test('feedback template can target an unsaved programme detail', () => {
  const tpgService = require('./tpgService');
  const programme = tpgService.getProgramme('HKU-TPG-001');
  const template = feedbackService.buildFeedbackTemplate(null, { programme });

  assert(template.includes('学校：香港大学'));
  assert(template.includes('Programme：Master of Architecture (Design) (MArch (Design))'));
  assert(template.includes('当前资料状态：结构资料待拆分 · 课程清单待开放'));
  assert(template.includes('HKU_Master_Course_Guide.pdf'));
});
