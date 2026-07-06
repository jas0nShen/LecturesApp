const releaseInfo = require('./releaseInfo');
const tpgService = require('./tpgService');

function valueOrDash(value) {
  const text = String(value || '').trim();
  return text || '待填写';
}

function buildProgrammeFields(profile, programmeOverride) {
  if (programmeOverride) {
    const university = tpgService.getProgrammeUniversity(programmeOverride);
    const status = tpgService.getStatus(programmeOverride);
    const sourceParts = [
      university && university.sourceFile,
      programmeOverride.sourceUrl
    ].filter(Boolean);

    return {
      university: valueOrDash((university && university.shortName) || programmeOverride.universityCode),
      programme: valueOrDash(programmeOverride.name),
      curriculumYear: valueOrDash((university && university.academicYear) || ''),
      status: `${status.title} · ${status.courseCount ? `${status.courseCount} 门课程` : '课程清单待开放'}`,
      source: sourceParts.length ? sourceParts.join(' · ') : '资料来源待确认'
    };
  }

  if (!profile) {
    return {
      university: '待填写',
      programme: '待填写',
      curriculumYear: '待填写',
      status: '尚未设置 Programme',
      source: '待填写'
    };
  }

  if (profile.profileType === 'tpg') {
    const programme = tpgService.getProgramme(profile.programmeId);
    const university = programme
      ? tpgService.getProgrammeUniversity(programme)
      : tpgService.getUniversity(profile.universityCode);
    const status = programme ? tpgService.getStatus(programme) : null;
    const sourceParts = [
      university && university.sourceFile,
      programme && programme.sourceUrl
    ].filter(Boolean);

    return {
      university: valueOrDash((university && university.shortName) || profile.universityCode),
      programme: valueOrDash((programme && programme.name) || profile.programmeName),
      curriculumYear: valueOrDash((university && university.academicYear) || profile.curriculumYear),
      status: status
        ? `${status.title} · ${status.courseCount ? `${status.courseCount} 门课程` : '课程清单待开放'}`
        : '课程状态待确认',
      source: sourceParts.length ? sourceParts.join(' · ') : '资料来源待确认'
    };
  }

  return {
    university: valueOrDash(profile.universityCode || profile.universityName),
    programme: valueOrDash(profile.programmeName),
    curriculumYear: valueOrDash(profile.curriculumYear),
    status: valueOrDash(profile.majorName || profile.majorCode),
    source: 'HKU 官方开课目录 / 培养方案'
  };
}

function buildFeedbackTemplate(profile, options = {}) {
  const fields = buildProgrammeFields(profile, options.programme);

  return [
    '【选课港反馈 / 纠错】',
    `版本：${releaseInfo.version}`,
    `学校：${fields.university}`,
    `Programme：${fields.programme}`,
    `Curriculum Year：${fields.curriculumYear}`,
    `当前资料状态：${fields.status}`,
    `资料来源：${fields.source}`,
    '',
    '问题类型：数据纠错 / 功能问题 / 界面建议 / 其他',
    '问题位置：首页 / 选择专业 / 课程 / 毕业检查 / 我的',
    '问题描述：',
    '',
    '期望结果：',
    '',
    '补充截图：可附上页面截图',
    '',
    '隐私说明：这段文字只会在你点击后复制到剪贴板，不会自动上传本机资料、收藏、笔记或 Study Plan。'
  ].join('\n');
}

module.exports = {
  buildFeedbackTemplate
};
