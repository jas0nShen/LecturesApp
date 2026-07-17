# Codex 项目交接

最后核验时间：2026-07-18（Asia/Shanghai）

## 当前项目目标

维护一个本地优先、原生微信小程序形式的“香港高校课程选择助手”。用户可以选择本科或授课硕士 Programme / Major，浏览随包发布的离线课程结构，在本机保存收藏、已修课程、笔记、计划与历史，并在规则证据足够时使用保守的课程规划和毕业检查。

当前产品边界是：先保证离线发布、数据可追溯和规则不误导，再继续补课程覆盖与规划能力。未经明确产品决定，不引入登录、云同步、统计、敏感权限或生产 API。

当前仓库发布资料已统一为 `1.0.7`（`package.json`、运行时 `releaseInfo`、`docs/MVP_SPEC.md`、`docs/RELEASE_CHECKLIST.md`、`docs/REVIEW_SUBMISSION.md`）。微信开发者工具官方 CLI 已上传 `1.0.7`；没有提交审核或发布正式版。

## 可验证的仓库快照

- 工作目录：`/Users/shenjingsong/Documents/develop/lecturesApp`
- 分支：`main`
- 1.0.7 发布候选：本科可编辑排期、UG 双分包加载修复、微信基础库兼容及 683 项测试
- 本地 `origin/main`：`6915796 Add undergraduate course planning`
- 包版本：`1.0.7`
- 当前 `git status --short --branch`：

```text
## main...origin/main [ahead 2]
?? .playwright-cli/
```

- `git diff`、`git diff --cached` 和 `git diff --check` 均无输出；受跟踪文件干净。
- `.playwright-cli/` 为 96 KB 的本地浏览器诊断产物，共有 console log 和 page YAML；本次没有删除、覆盖或暂存。

最近关键提交（本次交接提交前）：

```text
d39634d Release 1.0.7 with editable UG planning
6915796 Add undergraduate course planning
d1403bf Update EdUHK cultural heritage programme status
8e4dc01 Document 1.0.6 upload
361ee05 Release 1.0.6 with reliable TPG planning
f51c980 Add TPG course planning
18c026a Document 1.0.5 upload handoff
2f37396 Release 1.0.5 with complete TPG source review
8da5fdc Expand HKU law TPG curriculum coverage
0f01d64 Expand HKU TPG curriculum coverage
550d2ba Expand TPG curriculum coverage
791a6c8 Expand PolyU BRE and LST curriculum coverage
1cb5d16 Add PolyU language science curricula
8cffb25 Correct PolyU PM and APSS programme metadata
1279e3a Expand PolyU TPG curriculum coverage
a64a17c Add PolyU accounting and finance curricula
b3a7770 Add PolyU accounting curriculum and English metadata
b2dd674 Correct PolyU wearable and hospitality programme metadata
dfeff31 Document PolyU fashion programme source evidence
df91815 Add PolyU Design curriculum and source evidence
56207c7 Fix profile selection and catalogue consistency bugs
7d9c2a4 Add PolyU Generative AI curriculum for 1.0.3
```

## 已完成的功能

### 产品与本地数据

- 原生微信小程序首页、课程、毕业检查、我的四个主入口。
- 首次设置和资料编辑支持本科与授课硕士，不会在未选择学校时静默回退到 HKU。
- 八校本科 Programme / Major 索引与八校 TPG Programme / Track 索引。
- 已开放项目的离线课程列表、详情、来源、课程组和 Track/路径过滤；未开放项目保留索引和来源状态。
- 收藏、已修、最近查看、搜索历史、课程笔记、Study Plan、备份/恢复和清除数据均保存在微信本地存储。
- TPG 收藏和已修状态以 Programme ID 加标准化课程代码为键，避免跨 Programme 冲突。
- TPG 已支持 Programme/Track 范围内的选课计划、课程组统计、计划课程详情、移除和标记已修；切换 Track 后旧记录保留但不计入当前统计。
- 已开放课程清单的本科 Major 支持加入/移出课程、Year 1–6 与 Term 1/2/3、Summer、Full Year 排期、待安排分组和复制计划；官方推荐信息与用户排期分开展示。
- 本科排期以 Programme + Major + Course 隔离，已纳入本机备份、恢复、清除和非法导入校验；移出课程会同步清除排期。
- 开发版可使用零依赖 Node 本机 API；体验版和正式版在未配置生产 HTTPS 时只使用随包离线数据，不访问用户设备的 `localhost`。
- UG 与 TPG 大型课程数据分别拆入微信分包，主包保留轻量索引；UG 双分包 loader 可返回调用页并完成 activation，所有当前分包均低于 2 MB。
- UG/TPG Node 测试 fallback 不再使用微信基础库禁止的 `eval`。

### 数据与规则覆盖

2026-07-16 重新运行覆盖报告所得当前值：

- TPG：8 所学校、448 个 Programme，全部 448 个已完成来源审查，来源覆盖率 100%。
- TPG：320 个 Programme 有已核验课程结构，Programme-local 课程共 8,620 门。
- TPG 状态：127 个 `blocked`、1 个 `archived`、0 个 `unreviewed`。
- HKU：62/62 已审查，55 个 `verified`、7 个 `blocked`、2,517 门 Programme-local 课程。
- PolyU：105/105 已审查，54 个已核验课程结构、51 个来源阻塞、1,334 门课程。
- HKBU：48/48 已审查，41 个已核验课程结构、7 个来源阻塞、1,189 门课程。
- HKUST：53/53 已审查，52 个已核验课程结构、1 个归档、769 门课程。
- 已加入 PolyU `POLYU-TPG-038 Chinese Language and Literature`：31 credits、44 门课程，含中文语言/文学选修块、非 LST 选修与有条件 Dissertation。
- 已完成 HKU `HKU-TPG-049` 至 `055` 的最后一批来源审查：050 MChDS（18 门）、051 MExpArtsTh（20 门）、052 MIPA（45 门）为 `verified`；049、053、054、055 因官方审批、学分冲突或逐课学分缺口为 `blocked`。
- UG：8 所学校、444 个 Programme、689 个 Major、8,183 条带代码课程、132 个 Programme 已开放课程清单。

### 当前发布状态

- Git 提交 `2f37396` 已包含 HKU Social Sciences 049 至 055、生成分包、builder、测试及 `1.0.5` 版本资料。
- Git 提交 `f51c980` 已包含 TPG 选课计划、本地备份/恢复支持、浏览入口、Study Plan 页面和页面状态测试。
- Git 提交 `361ee05` 已包含 `1.0.6` 版本资料、冷分包 loader 返回兜底、8 个生成 loader 和回归测试。
- Git 提交 `d39634d` 已包含本科可编辑排期、UG 双分包加载修复、微信基础库兼容、测试及 `1.0.7` 版本资料。
- 本地 `main` 在本次上传记录提交完成后比本地远端跟踪引用 `origin/main` ahead 2；本次没有 push。
- 微信开发者工具已显示最新 `1.0.5` 代码上传成功，更新类型为“修订补丁”，备注为 `1.0.5: Add TPG course planning`。
- 2026-07-17 已通过微信开发者工具官方 CLI 上传 `1.0.6`，备注为 `1.0.6: Add TPG course planning and reliable loaders`，命令返回 `✔ upload`；上传包 8.6 MB，主包 1.4 MB，所有分包低于 2 MB。
- 2026-07-18 已通过微信开发者工具官方 CLI 上传 `1.0.7`，备注为 `1.0.7: Add editable UG course planning`，命令返回 `✔ upload`；实际上传包 8.6 MB，主包 1.4 MB，所有分包低于 2 MB。
- `npm run check:ship` 通过：683/683 测试、`ready=true`、主包 1,804,892 bytes，所有分包低于 2 MB。
- 微信官方 automation 已完成普通 `POLYU-TPG-090` 闭环：36 门课程、`COMP5521` 加入计划、列表状态、官方分组、标记已修、复制与移除均通过。
- 多 Track `HKU-TPG-031` 验收通过：Generalist 计 1 门，Chinese Language Education 计 2 门；两条记录均保留，旧 Track 课程不计入 Generalist 当前统计。
- PolyU 与 HKU 冷分包均能从临时 loader 返回调用页；iOS/Android 真机未执行。
- 上传过程中测试文件按 `packOptions.ignore` 排除；没有执行“提交审核”或“发布”。

## 尚未完成的内容

### 最具体的数据缺口

- 八校 TPG 已达到 100% source reviewed；没有剩余 `unreviewed` Programme。
- 仍有 127 个 Programme 因官方公开来源缺代码、学分、Track 归属、最终审批或规则冲突而标记 `blocked`。除非出现新的官方证据，不应把它们当作待猜测补全项。
- UG launch-priority 仍有 313 个缺口：138 个 index-only、21 个 reviewed-no-codes、154 个 no-source；当前没有可直接导入或只需清洗的候选。
- 多个已核验 TPG Programme 仍标记 `manual_review_required`，表示课程池可发布，但复杂路径/跨组最低要求不能由当前规则引擎自动证明。

### 发布与验收缺口

- 仓库版本资料和微信已上传代码均为 `1.0.7`；上传不等于已提交审核。
- `docs/RELEASE_CHECKLIST.md` 的 iOS/Android 真机矩阵没有完成记录。
- 微信后台隐私声明、服务类目、备案、审核材料核对尚未在仓库中记录为完成。
- 尚未提交微信审核，也没有发布正式版。
- 生产 HTTPS API 未配置；这是当前离线发布设计，不是阻塞体验版的错误。

## 下一步最具体的操作

新任务接手后先执行：

```bash
cd /Users/shenjingsong/Documents/develop/lecturesApp
git status --short --branch
git diff --check
git diff -- docs/CODEX_HANDOFF.md
npm run status:tpg-courses -- --school=HKU
```

然后按以下顺序继续：

1. 保留 `.playwright-cli/`；不要 reset、checkout、clean 或 stash 后遗忘。
2. 1.0.7 包含本科可编辑排期、UG 双分包加载修复、微信基础库兼容、测试和验收记录。不要把 `.playwright-cli/` 纳入提交。
3. 如继续处理 `blocked` TPG，只在获得新的官方证据时更新对应 supplement；不要根据相似 Programme、旧学年或算术推断补全课程。
4. 每批 TPG 来源变更执行：

```bash
npm run import:tpg-courses
npm run sync:tpg
npm run status:tpg-courses -- --school=HKU
npm run check:ship
git diff --check
```

5. 若继续 `1.0.7` 提审，先完成 iOS/Android 真机矩阵；通过后才提交审核。上传、提交审核和发布是三个独立外部动作，均需用户明确授权。
6. 若转入 UG 补数，先运行：

```bash
npm run status:ug-sources -- --missing-only --priority launch --missing-limit 10 --batch-plan
```

按 index-only 官方入口开始，不对 reviewed-no-codes 或 no-source 项目编造课程。

## 已确定的架构和技术决策

### 本地优先、离线发布

体验版和正式版读取随包数据与微信本地存储，开发版才可回退到本机 Node API。这样无需云服务即可发布，并与“不登录、不上传个人规划数据”的隐私承诺一致。

### 维护源、聚合数据与生成物分层

- `data/seed.json`、TPG directory/course supplements、UG source reviews/course supplements 是可维护来源。
- 导入脚本把 supplement 合并到 `data/tpg-programmes.json`。
- 生成脚本输出小程序轻量目录、分包注册表和各校课程 shard。
- 生成物提交到 Git 是为了离线发布，但不能脱离来源文件和生成脚本手工修改。

这一分层让 `--check` 命令可以检测来源、聚合数据和发布分包之间的漂移。

### UG/TPG 分包与显式加载

课程数据不塞回主包。UG 与 TPG 都按学校拆分，CityU/PolyU UG 还使用双 shard；`miniprogram/app.js` 管理激活状态。Home/Onboarding 不预加载大 UG shard，避免 loader 页面阻断资料编辑。加载失败必须可观察、可重试，不能伪装成“课程清单待开放”。

### 保守的数据状态模型

- `verified`：官方证据覆盖代码、名称、学分、分组和发布路径。
- `blocked`：已经审查，但官方公开证据缺失或互相冲突。
- `unreviewed`：尚未完成官方来源评估。
- `manual_review_required`：课程结构可发布，但复杂组合规则仍需人工核对。

该模型的目的，是让来源受阻与尚未处理分开，并防止不完整课程池显示为可毕业结构。

### 本地用户数据兼容性

`miniprogram/utils/courseService.js` 的 `USER_DATA_KEYS` 是备份、恢复和清除范围的单一入口。任何新 key 都必须参与导入校验和测试；TPG 课程状态必须包含 Programme ID。

### 发布门禁

`npm run check:ship` 是声明可上传前的最低门禁，覆盖来源/生成同步、数据校验、Node 测试、服务检查、页面/包体/敏感 API 和 release readiness。模拟器不替代真机；微信上传成功也不等于已提审或已发布。

## 重要文件及职责

- `AGENTS.md`：跨任务长期开发规则与安全边界。
- `package.json`：版本号以及导入、生成、覆盖报告、测试和发布检查命令。
- `data/tpg-programmes.json`：TPG 合并后的完整聚合目录。
- `data/tpg-directory-supplements.json`：TPG 目录补充来源。
- `data/tpg-course-supplements/*.json`：按官方证据维护的 TPG 课程结构与 source-status。
- `data/tpg-source-snapshots/`、`data/tpg-course-candidates/`：官方页面快照与候选提取证据；候选不能直接视为已核验课程。
- `data/ug-source-reviews.json`、`data/ug-course-supplements/*.json`：UG 来源状态和可发布课程补充。
- `scripts/import-tpg-course-supplements.js`：校验并合并 TPG course/source-status supplements。
- `scripts/import-tpg-directory-supplements.js`：合并 TPG Programme/Track 目录补充。
- `scripts/generate-tpg-catalog.js`：生成主包内轻量 TPG 索引。
- `scripts/generate-tpg-course-shards.js`：按学校生成 TPG 课程分包和 `tpgCourseShards.js`。
- `scripts/generate-ug-catalog.js`：生成 UG 轻量目录、课程 shard 与 loader。
- `scripts/report-tpg-course-coverage.js`：区分 verified/blocked/archived/unreviewed 和复杂规则状态。
- `scripts/report-ug-source-coverage.js`：输出 UG source-importable/index-only/no-source 等补数队列。
- `scripts/check-release-readiness.js`：检查页面、包体、敏感 API、数据指标和人工发布清单。
- `miniprogram/app.js`：应用启动、资料缓存、UG/TPG 分包激活生命周期。
- `miniprogram/utils/courseService.js`：本地资料、收藏/已修、历史、笔记、Study Plan、备份恢复与离线/本机 API 调用。
- `miniprogram/utils/tpgService.js`：TPG 搜索、状态、Track 过滤、课程扁平化、学分和课程查询。
- `miniprogram/utils/ugService.js`：UG Programme/Major/课程查询与资料投影。
- `miniprogram/utils/tpgCatalog.js`、`miniprogram/utils/tpgCourseShards.js`：生成的 TPG 轻量索引与分包注册表。
- `miniprogram/subpackages/tpg-data-*/`、`miniprogram/subpackages/ug-data-*/`：生成的离线课程分包。
- `miniprogram/pages/onboarding/`：本科/TPG 资料选择与编辑。
- `miniprogram/pages/courses/`、`miniprogram/pages/course-detail/`：课程列表与详情。
- `miniprogram/pages/audit/`：保守毕业检查与 TPG 本地完成进度。
- `miniprogram/pages/profile/`、`miniprogram/pages/privacy-data/`：资料状态、隐私和本地数据管理。
- `docs/RELEASE_CHECKLIST.md`：模拟器、真机和后台发布核对表。
- `docs/REVIEW_SUBMISSION.md`：微信后台审核文案和审核路径。
- `docs/ROADMAP.md`：发布后数据与 Study Plan 的长期方向。

## 当前工作区

本文档提交完成后的预期状态为：

```text
?? .playwright-cli/
```

没有暂存内容或受跟踪文件修改。`.playwright-cli/` 仍保持未跟踪；本次没有重置、删除、覆盖或清理该目录。

## 已运行的测试及结果

2026-07-18 在 `1.0.7` 发布候选完整工作区上重新运行：

```text
npm run check:ship: PASS
  check:ug-sync: PASS
  check:tpg-directory-sync: PASS
  check:tpg-course-sync: PASS (230 files, 448 Programmes)
  check:tpg-catalog-sync: PASS (8 schools, 448 Programmes, 8 packages, 320 course structures)
  seed/data validation: PASS
  UG supplement validation: PASS (150 supplements; 137 explicit, 13 copied)
  directory audit: PASS, blockingErrors=[]
  server --check: PASS
  Node tests: PASS, 683/683
  check:release: PASS, ready=true

git diff --check: PASS
npm run status:tpg-courses -- --school=HKU: PASS (448/448 reviewed, 0 unreviewed)
```

发布指标：

- 主包：1,804,892 bytes。
- 总估算包体：11,876,978 bytes，166 个上传文件。
- 所有 16 个 UG/TPG 分包低于 2 MB；最大为 `ug-data-hku`，1,486,352 bytes。
- HKU TPG 分包：1,051,628 bytes。
- 页面：17；敏感 API：0。
- release warnings 仅为人工微信后台检查尚需完成，以及未配置生产 HTTPS（体验/正式版按设计离线）。

文档修改后再次运行了 `git diff --check`。微信开发者工具模拟器已完成 PolyU 本科双分包、加入计划、设置/清除排期、复制及移出闭环；iOS/Android 真机未执行。

## 已知问题、风险和不要做的事情

- 微信已上传 `1.0.7`，但不要把上传成功当作已提审或已发布。
- 不要把“上传成功”写成“已提审”或“已发布”。这两个外部动作尚未执行。
- 不要删除或提交 `.playwright-cli/`，除非用户明确决定如何处理该诊断目录。
- 不要手改生成的 catalogue、course shard 或 loader；从 source/supplement 和 builder 修改后重新生成。
- 不要把官方来源缺失的 Programme 从 `blocked` 改成 `verified`，也不要从相似 Programme、旧学年或课程标题猜代码、学分和规则。
- 不要把只有部分课程代码的 Programme 作为完整结构开放。
- 不要简化 Dissertation、Project、Track、Concentration、Stream、跨组最低数量或互斥路径；无法自动证明时保留人工复核提示。
- 不要用课程代码单独作为 TPG 用户状态 key。
- 不要在 Home/Onboarding 预加载 UG 大分包，也不要将多个数据集重新合成超过 2 MB 的单一分包。
- 不要让分包加载失败静默显示成“课程清单待开放”。
- 不要新增本地用户数据 key 而遗漏备份、恢复、清除和测试。
- 不要为未核验毕业规则显示虚假的完成百分比。
- 不要未经明确授权点击微信 Upload、Submit for Review、Publish、清除本机数据，或执行 Git push/历史覆盖。

## 交接充分性判断

足够。一个全新的 Codex 任务只要先读取根目录 `AGENTS.md` 和本文件，再执行“下一步最具体的操作”中的四个只读/验证命令，就能确认当前 Git 状态、八校 TPG 全量来源覆盖、生成同步和发布门禁，并可在不依赖聊天记录的情况下继续工作。

限制是：微信后台的真实审核/发布状态和 iOS/Android 真机结果不在 Git 中。继续发布流程前，新的任务仍必须通过微信开发者工具/后台和真机重新核实这些外部状态。
