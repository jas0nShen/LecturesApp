const { checkReleaseReadiness } = require('./check-release-readiness');

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

function buildReleaseStatusLines(result) {
  const metrics = result.metrics;
  return [
    `发布状态：${result.ready ? 'READY ✅' : 'BLOCKED ❌'}`,
    `版本：${result.release.version} · ${result.release.target}`,
    `数据模式：${result.release.dataMode}`,
    '',
    `TPG：${metrics.tpgSchoolCount} 所学校 · ${metrics.tpgProgrammeCount} Programme · ${metrics.tpgProgrammeWithCoursesCount} 个已开放课程组 · ${metrics.tpgCourseCount} 门课程`,
    `UG：${metrics.ugSchoolCount} 所学校 · ${metrics.ugProgrammeCount} Programme · ${metrics.ugMajorCount} Major/Track · ${metrics.ugCodedCourseCount} 条课程代码`,
    `HKU 官方开课：${metrics.offeringCount} 门 · 更新 ${metrics.offeringAgeDays} 天前`,
    `上传包：${metrics.uploadFileCount} 个文件 · 总计 ${formatBytes(metrics.packageBytes)} · 主包 ${formatBytes(metrics.mainPackageBytes || metrics.packageBytes)} · 敏感 API ${metrics.sensitiveApiCount} 个`,
    '',
    result.errors.length ? `阻塞项：${result.errors.join('；')}` : '阻塞项：无',
    result.warnings.length ? `人工确认：${result.warnings.join('；')}` : '人工确认：无',
    '',
    `审核材料：${result.manualChecklist.reviewMaterial}`
  ];
}

function main() {
  const result = checkReleaseReadiness();
  console.log(buildReleaseStatusLines(result).join('\n'));
  if (!result.ready) process.exitCode = 1;
}

if (require.main === module) {
  main();
}

module.exports = {
  buildReleaseStatusLines,
  formatBytes
};
