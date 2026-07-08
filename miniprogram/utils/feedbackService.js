const releaseInfo = require('./releaseInfo');
const tpgService = require('./tpgService');
const ugService = require('./ugService');

function valueOrDash(value) {
  const text = String(value || '').trim();
  return text || '待填写';
}

function joinProgrammeMajor(programme, major) {
  const programmeText = valueOrDash(programme);
  const majorText = String(major || '').trim();
  if (!majorText || majorText === programmeText) return programmeText;
  return `${programmeText} / ${majorText}`;
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
      major: '',
      curriculumYear: valueOrDash((university && university.academicYear) || ''),
      status: `${status.title} · ${status.courseCount ? `${status.courseCount} 门课程` : '课程清单待开放'}`,
      source: sourceParts.length ? sourceParts.join(' · ') : '资料来源待确认'
    };
  }

  if (!profile) {
    return {
      university: '待填写',
      programme: '待填写',
      major: '',
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
      major: '',
      curriculumYear: valueOrDash((university && university.academicYear) || profile.curriculumYear),
      status: status
        ? `${status.title} · ${status.courseCount ? `${status.courseCount} 门课程` : '课程清单待开放'}`
        : '课程状态待确认',
      source: sourceParts.length ? sourceParts.join(' · ') : '资料来源待确认'
    };
  }

  const ugProfile = profile.profileType === 'undergraduate'
    ? ugService.getMajorProfile(profile.programmeId, profile.majorId, profile.curriculumYear)
    : null;
  if (ugProfile && ugProfile.sourceStatus) {
    return {
      university: valueOrDash((ugProfile.university && ugProfile.university.nameZh) || profile.universityCode),
      programme: valueOrDash((ugProfile.programme && ugProfile.programme.nameEn) || profile.programmeName),
      major: valueOrDash((ugProfile.major && ugProfile.major.nameEn) || profile.majorName || profile.majorCode),
      curriculumYear: valueOrDash(ugProfile.curriculumYear),
      status: ugProfile.codedCourseCount
        ? `${ugProfile.major.nameEn} · 已开放 ${ugProfile.codedCourseCount} 门课程`
        : `${ugProfile.major.nameEn} · 课程清单待开放`,
      source: valueOrDash(ugProfile.sourceUrl)
    };
  }

  return {
    university: valueOrDash(profile.universityCode || profile.universityName),
    programme: valueOrDash(profile.programmeName),
    major: valueOrDash(profile.majorName || profile.majorCode),
    curriculumYear: valueOrDash(profile.curriculumYear),
    status: valueOrDash(profile.majorName || profile.majorCode),
    source: 'HKU 官方开课目录 / 培养方案'
  };
}

function buildLocalSummaryLine(userSummary) {
  if (!userSummary) return '';
  return [
    `已设置资料：${userSummary.hasProfile ? '是' : '否'}`,
    `收藏 ${Number(userSummary.favoriteCount || 0)}`,
    `已修 ${Number(userSummary.completedCount || 0)}`,
    `计划 ${Number(userSummary.studyPlanCount || 0)}`,
    `笔记 ${Number(userSummary.noteCount || 0)}`,
    `搜索 ${Number(userSummary.searchCount || 0)}`
  ].join(' · ');
}

function buildFeedbackTemplate(profile, options = {}) {
  const fields = buildProgrammeFields(profile, options.programme);
  const localSummary = buildLocalSummaryLine(options.userSummary);
  const isCourseDataPending = fields.status.includes('课程清单待开放') || fields.status.includes('待确认');
  const programmeMajor = joinProgrammeMajor(fields.programme, fields.major);
  const sourceHint = fields.source && fields.source !== '待填写' ? fields.source : '待填写';

  return [
    '【选课港反馈 / 纠错】',
    `版本：${releaseInfo.version}`,
    `学校：${fields.university}`,
    `Programme：${fields.programme}`,
    `Curriculum Year：${fields.curriculumYear}`,
    `当前资料状态：${fields.status}`,
    `资料来源：${fields.source}`,
    ...(localSummary ? [`本机数据摘要：${localSummary}`] : []),
    '',
    '数据补充模板：',
    `- 当前 Programme / Major：${programmeMajor}`,
    `- 当前资料状态：${fields.status}`,
    `- 需要补充的课程代码 / 课程名：${isCourseDataPending ? '这个 Programme 课程清单待开放，请补充官方课程表' : '待填写'}`,
    `- 官方链接 / 截图来源：${sourceHint}`,
    '- 备注：待填写',
    '',
    '问题类型：数据纠错 / 功能问题 / 界面建议 / 其他',
    '问题位置：首页 / 选择专业 / 课程 / 毕业检查 / 我的',
    '问题描述：',
    '',
    '期望结果：',
    '',
    '补充截图：可附上页面截图',
    '',
    '隐私说明：这段文字只会在你点击后复制到剪贴板，不会自动上传本机资料、收藏、笔记或 Study Plan；本机数据摘要只包含数量，不包含具体课程或笔记内容。'
  ].join('\n');
}

module.exports = {
  buildLocalSummaryLine,
  buildFeedbackTemplate
};
