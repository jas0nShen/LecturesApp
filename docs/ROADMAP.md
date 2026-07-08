# 后续开发路线图

## 当前方向

项目后续按“先稳定发布、再补课程数据、最后增强规划能力”的顺序推进。首发和近期迭代继续保持本地存储与离线数据模式，不引入登录、云同步或生产 API。

## Phase 1：发布后稳定与可维护性

- 每次上传前运行 `npm run check:ship`，并在微信开发者工具完成预览与真机检查。
- 使用 `npm run status:ug-sources` 作为本科数据补全入口，确认每所学校的 Programme 缺口、官方入口、raw coded rows 与实际可导入课程数。
- 所有未开放课程组继续显示“课程清单待开放”，不得生成误导性的毕业进度。

## Phase 2：本科课程数据补全

- 优先补资料可追溯、用户更可能使用、当前已有部分覆盖的 Programme。
- 每批新增本科课程都通过 supplement JSON 落库，不直接手改生成后的 `miniprogram/utils/ugCourseData/*`。
- 只录入能追溯到官方来源或用户提供可信资料的课程；只有简介、宣传页或被防爬挡住且无课程码的 Programme 继续保留索引状态。
- 每批数据补充后运行：

```bash
npm run sync:ug-catalog
npm run check:ship
```

## Phase 3：从课程清单到规划工具

- Study Plan 作为下一阶段核心能力，围绕 Year / Semester、收藏、已修、备注与课程安排展开。
- 对已开放课程组逐步增强 core / elective / capstone 分类、学分统计与未修课程提示。
- 对未复核毕业规则的本科 Programme，只提供课程浏览和计划，不生成毕业判断。

## Phase 4：上线后产品增强

- 增强反馈入口，让用户能复制当前 Programme、资料状态和缺失课程说明。
- 增强数据覆盖页，展示每所学校 Programme 覆盖率、课程数据更新时间和离线发布说明。
- 云端能力放在更后面：只有用户明确需要多设备同步或后台维护时，再评估微信云开发或轻量 HTTPS 服务。

## 数据补全默认流程

1. 用 `npm run status:ug-sources -- --school <code> --missing-only --missing-limit 10` 找缺口。
2. 打开报告中的 `officialUrl` 或用户提供资料，确认是否有课程代码。
3. 新增或更新 `data/ug-course-supplements/*.json`。
4. 运行 `npm run sync:ug-catalog` 生成离线数据。
5. 增加 programme count、关键 course code、search/profile 相关测试。
6. 运行 `npm run check:ship`。
7. 通过后再提交。
