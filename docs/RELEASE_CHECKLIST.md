# 微信小程序发布检查清单

## 1.0.2 正式版定位

- 版本号：`1.0.2`
- 目标用户：香港高校授课硕士学生；本科用户可先使用 Programme / Major 目录预览
- 核心能力：选择 Programme、浏览授课硕士资料库、查看已开放课程组、预览本科 Programme / Major、收藏/计划 HKU 官方开课示例、查看数据状态与隐私说明
- 数据边界：TPG Programme 索引已导入；课程组按 Programme 逐步开放。课程组尚未开放的 Programme 只展示索引与资料来源，暂不生成毕业判断。本科目录用于选择学校、Programme 与 Major；未复核课程规则前不生成本科毕业进度
- 发布模式：体验版和正式版读取随包发布的离线数据，不依赖开发环境服务

## 自动检查

上传前运行：

```bash
npm run check
npm run check:release
```

也可以直接运行合并版上传前预检：

```bash
npm run check:ship
```

查看本科资料覆盖和后续补数缺口：

```bash
npm run status:ug-sources -- --missing-only --missing-limit 20
npm run status:ug-sources -- --missing-only --priority launch --missing-limit 10 --batch-plan
npm run status:ug-sources -- --missing-only --missing-limit 10 --priority launch --collector-template
npm run status:ug-sources -- --missing-only --priority launch --supplement-template
```

生成可复制的本科课程资料采集任务单：

```bash
npm run status:ug-sources -- --school HKU --missing-only --missing-limit 10 --collector-template
```

按来源状态拆分采集任务单：

```bash
npm run status:ug-sources -- --school HKU --missing-only --missing-limit 10 --readiness index-only --collector-template
npm run status:ug-sources -- --school HKU --missing-only --missing-limit 10 --readiness no-source --collector-template
```

`check:release` 当前检查：

- 微信 AppID 格式；
- `app.json` 中所有页面文件是否齐全；
- 数据与隐私、数据状态页面是否注册；
- Source Map 是否关闭、个人数据页面是否禁止搜索索引；
- 是否意外引入定位、用户资料、手机号、地址或媒体等敏感接口；
- 测试文件是否排除在上传包之外；
- 240 学分培养方案结构是否闭合；
- HKU 开课数据是否超过 90 天未复核；
- 官方课程详情与来源链接是否齐全；
- TPG Programme 索引覆盖是否正常；
- TPG 已开放课程组和已拆课程数量；
- UG Programme / Major 目录覆盖是否正常；
- UG 缺口报告是否能显示待补 Programme、官方入口、raw coded rows 和可导入课程数；
- 待上传文件数量和估算包体积。

`check:release` 会输出当前版本、离线发布模式、TPG/UG 覆盖指标和仍需人工确认的微信后台事项。

## 上传失败：分包大小或旧缓存

若微信开发者工具提示 `source size ... exceed max limit 2MB`，先不要反复点击上传。当前课程数据已拆为多个小于 2MB 的分包；报错仍显示旧的 `ug-data` 分包时，通常是开发者工具仍在读取旧项目或缓存。

1. 通过“项目 → 重新打开项目”确认导入目录是本仓库的 `miniprogram/`；
2. 在“详情 / 本地设置”清除全部缓存；
3. 完全退出并重启开发者工具，再重新编译；
4. 在资源管理器确认 `subpackages` 下存在 `ug-data-cityu-a`、`ug-data-cityu-b`、`ug-data-polyu-a`、`ug-data-polyu-b`，而不是旧的 `ug-data` 或 `ug-data-polyu`；
5. 重新执行 `npm run check:ship`，确认每个 `subpackageBytes` 都不超过 2MB 后再上传。

## 微信后台人工检查

- 小程序名称、头像、简介和服务类目；
- 小程序备案及主体信息；
- 用户隐私保护指引与实际数据行为一致；
- 当前版本不配置生产 API；如未来启用生产 API，需配置 HTTPS request 合法域名；
- 上传体验版并在至少一台 iOS 和 Android 真机测试；
- 检查首页、Programme 选择、资料库、Programme 详情、课程页、毕业检查、我的、数据状态、数据与隐私；
- 准备审核说明，明确课程与毕业判断仅供规划参考，最终以学校官网、选课系统和正式审核结果为准；
- 使用 [`REVIEW_SUBMISSION.md`](REVIEW_SUBMISSION.md) 填写版本号、功能路径和审核说明；
- 提交审核，通过后再手动发布。

## 当前发布模式

1.0.2 正式版：

- 开发版可连接本机服务，用于本地调试；
- 体验版和正式版直接使用离线数据；
- 用户资料、收藏、计划、搜索历史与笔记保存在微信本地存储；
- 不要求登录，不读取手机号、定位、通讯录、相机、相册或麦克风。

## 体验版主流程

1. 首页点击“开始选择”；
2. 选择“授课硕士”，切换不同学校，确认 Programme 能显示；
3. 搜索一个 Programme，进入详情，点击“设为我的 Programme”；
4. 回到首页，确认显示 Programme 状态与下一步提示；
5. 进入“课程”，确认已开放课程组或“课程清单待开放”状态；
6. 进入“毕业检查”，确认已开放课程组显示课程，未开放项目不生成毕业判断；
7. 回到“开始选择”，切换“本科”，确认 8 所学校、Programme/Major 搜索和覆盖指标正常；
8. 保存一个本科 Programme，确认课程页和毕业检查页显示本科目录状态且不误算毕业进度；
9. 进入“我的”，查看“数据状态”、“数据与隐私”；
10. 测试复制备份、从剪贴板恢复、清除本机数据前的二次确认。

## 1.0.2 RC1 分包与能力边界专项验收

以下路径在 iOS 和 Android 都至少各走一遍。每次切换学校后，等待课程页完成加载；如果出现“课程数据加载失败”，验证“重新加载”能恢复，且不能把失败误显示成“课程清单待开放”。

| 样本 | 操作 | 预期结果 |
| --- | --- | --- |
| HKU 本科（已开放） | 保存一个已开放课程的 Major，进入课程页和任一课程详情 | 显示对应 Major 的课程，不混入其他学校；详情可显示来源 |
| CityU 本科（双分包） | 保存 CityU 已开放 Major，进入课程页 | 两个课程 shard 作为一个学校资料集加载；课程数量与列表完整，无半截列表 |
| PolyU 本科（双分包） | 保存 PolyU 已开放 Major，进入课程页 | 两个课程 shard 作为一个学校资料集加载；切换后不保留 HKU/CityU 课程 |
| HKBU 或 EdUHK 本科（仅索引） | 保存 Programme / Major 后进入课程和毕业检查 | 明确显示课程清单待开放；不报加载失败，也不显示虚假的毕业进度 |
| TPG 已开放项目 | 选择一个有课程组的 Programme，进入课程和毕业检查 | 显示已开放课程组与正确的课程数量 |
| TPG 待开放项目 | 选择一个无课程组的 Programme，进入课程和毕业检查 | 显示“课程清单待开放”，不显示 0 门已开放课程或默认 HKU 课程 |
| Study Plan 边界 | 对普通 UG、TPG 和未设置资料分别打开 Study Plan | 显示适用范围说明和返回入口；不得显示 HKU 默认建议或误写用户资料 |
| HKU BEng CompSc 示例 | 打开官方开课示例、收藏/标记已修并进入 Study Plan | 仅该内置示例提供收藏、已修、计划和核心课建议；既有本机数据不被清除 |

## 真机验收记录模板

上传体验版后，建议至少完成一次 iOS 和一次 Android 验收。结果可直接在下表记录：

| 检查项 | iOS | Android | 预期结果 |
| --- | --- | --- | --- |
| 首页首屏 | ☐ | ☐ | 显示授课硕士 Programme 选择入口 |
| 授课硕士选择 | ☐ | ☐ | 可切换学校，可搜索并选择 Programme |
| 本科目录预览 | ☐ | ☐ | 可切换本科，显示 8 所学校、Programme/Major 搜索和覆盖指标 |
| 本科保存后状态 | ☐ | ☐ | 课程页/毕业检查页显示本科目录状态，不误算毕业进度 |
| 本科课程详情 | ☐ | ☐ | 已开放课程可点击进入详情，并显示课程来源 |
| Programme 详情 | ☐ | ☐ | 可查看资料来源，可设为“我的 Programme” |
| 课程页 | ☐ | ☐ | 已开放课程组显示课程；未开放项目显示“课程清单待开放” |
| 毕业检查 | ☐ | ☐ | 已开放课程组显示课程结构；未开放项目不生成毕业判断 |
| Programme 资料库 | ☐ | ☐ | 学校筛选、关键词搜索、结果数量提示正常 |
| 我的页面 | ☐ | ☐ | 显示 Programme、本科/TPG 数据状态和隐私入口 |
| 数据状态 | ☐ | ☐ | 显示 TPG 与 UG Data Passport，以及离线发布说明 |
| 数据与隐私 | ☐ | ☐ | 明确显示本机存储、剪贴板、离线数据和无需登录 |
| 备份恢复 | ☐ | ☐ | 可复制备份；仅用户主动点击时读取剪贴板恢复 |
| 清除本机数据 | ☐ | ☐ | 有二次确认；清除后回到未设置状态 |
| 分享入口 | ☐ | ☐ | 仅用户主动点击分享按钮触发 |
| 审核材料 | ☐ | ☐ | `docs/REVIEW_SUBMISSION.md` 中字段可直接复制到微信后台 |

如任一项未通过，先不要提交审核；修复后重新运行 `npm run check:ship`。
