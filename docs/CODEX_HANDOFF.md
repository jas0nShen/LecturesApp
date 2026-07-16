# Codex 项目交接

最后核验时间：2026-07-16（Asia/Shanghai）

## 当前项目目标

维护一个本地优先、原生微信小程序形式的“香港高校课程选择助手”。用户可以选择本科或授课硕士 Programme / Major，浏览随包发布的离线课程结构，在本机保存收藏、已修课程、笔记、计划与历史，并在规则证据足够时使用保守的课程规划和毕业检查。

当前产品边界是：先保证离线发布、数据可追溯和规则不误导，再继续补课程覆盖与规划能力。未经明确产品决定，不引入登录、云同步、统计、敏感权限或生产 API。

当前仓库发布资料仍以 `1.0.3` 为版本（`package.json`、`docs/MVP_SPEC.md`、`docs/RELEASE_CHECKLIST.md`、`docs/REVIEW_SUBMISSION.md`）。2026-07-16 已在微信开发者工具成功上传代码版本 `1.0.4`，但尚未在仓库内统一版本文案，也没有提交审核或发布正式版。

## 可验证的仓库快照

- 工作目录：`/Users/shenjingsong/Documents/develop/lecturesApp`
- 分支：`main`
- HEAD：`550d2ba Expand TPG curriculum coverage`
- 本地 `origin/main`：同样指向 `550d2ba`
- 包版本：`1.0.3`
- 交接开始时的 `git status --short --branch`：

```text
## main...origin/main
?? .playwright-cli/
```

- 交接开始时 `git diff`、`git diff --cached` 和 `git diff --check` 均无输出；没有未提交的受跟踪代码改动。
- `.playwright-cli/` 为 96 KB 的本地浏览器诊断产物，共有 console log 和 page YAML；本次没有删除、覆盖或暂存。
- 本交接会新增未提交文档修改：`AGENTS.md` 与 `docs/CODEX_HANDOFF.md`。最终状态以文末记录为准。

最近提交：

```text
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
- 开发版可使用零依赖 Node 本机 API；体验版和正式版在未配置生产 HTTPS 时只使用随包离线数据，不访问用户设备的 `localhost`。
- UG 与 TPG 大型课程数据分别拆入微信分包，主包保留轻量索引；所有当前分包均低于 2 MB。

### 数据与规则覆盖

2026-07-16 重新运行覆盖报告所得当前值：

- TPG：8 所学校、448 个 Programme、425 个已完成来源审查，来源覆盖率 94.9%。
- TPG：304 个 Programme 有已核验课程结构，Programme-local 课程共 7,578 门。
- TPG 状态：120 个 `blocked`、1 个 `archived`、23 个 `unreviewed`；仅 HKU 仍有 `unreviewed`。
- PolyU：105/105 已审查，54 个已核验课程结构、51 个来源阻塞、1,334 门课程。
- HKBU：48/48 已审查，41 个已核验课程结构、7 个来源阻塞、1,189 门课程。
- HKUST：53/53 已审查，52 个已核验课程结构、1 个归档、769 门课程。
- 已加入 PolyU `POLYU-TPG-038 Chinese Language and Literature`：31 credits、44 门课程，含中文语言/文学选修块、非 LST 选修与有条件 Dissertation。
- UG：8 所学校、444 个 Programme、689 个 Major、8,183 条带代码课程、132 个 Programme 已开放课程清单。

### 当前发布状态

- Git 提交 `550d2ba` 已包含最新 HKUST、HKBU、PolyU TPG 数据、生成分包、导入脚本和测试。
- 本地 `main` 与本地远端跟踪引用 `origin/main` 无 ahead/behind 差异。
- 微信开发者工具已显示 `1.0.4` 代码上传成功，更新类型为“修订补丁”，备注为 `1.0.4: Expand TPG curriculum coverage`。
- 上传过程中测试文件按 `packOptions.ignore` 排除；没有执行“提交审核”或“发布”。

## 尚未完成的内容

### 最具体的数据缺口

- HKU 仍有 23 个 TPG Programme 为 `unreviewed`：`HKU-TPG-024` 至 `031`、`040` 至 `047`、`049` 至 `055`。需要逐项检查 HKU 官方 Programme 页面、规例、课程表或 PDF。
- 其他学校虽已达到 100% source reviewed，仍有 120 个 Programme 因官方公开来源缺代码、学分、Track 归属或规则冲突而标记 `blocked`。除非出现新的官方证据，不应把它们当作待猜测补全项。
- UG launch-priority 仍有 313 个缺口：138 个 index-only、21 个 reviewed-no-codes、154 个 no-source；当前没有可直接导入或只需清洗的候选。
- 多个已核验 TPG Programme 仍标记 `manual_review_required`，表示课程池可发布，但复杂路径/跨组最低要求不能由当前规则引擎自动证明。

### 发布与验收缺口

- 仓库版本资料仍为 `1.0.3`，而微信代码上传版本为 `1.0.4`。提交审核前必须先决定是否把 `package.json`、MVP/Checklist/Review 文档统一到 `1.0.4`，并重新运行发布检查。
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
git diff -- AGENTS.md docs/CODEX_HANDOFF.md
npm run status:tpg-courses -- --school=HKU
```

然后按以下顺序继续：

1. 保留 `.playwright-cli/` 和交接产生的文档修改；不要 reset、checkout、clean 或 stash 后遗忘。
2. 若继续 TPG 补数，从 `HKU-TPG-024` 开始，按 Programme ID 顺序核验 23 个 HKU `unreviewed` 项目。只用 HKU 官方来源；若完整代码/学分/规则不可公开核实，写成 `blocked` 并记录精确缺口。
3. 为每批 HKU 结果新增或更新 `data/tpg-course-supplements/` 中的 source-status/课程 supplement 及对应 builder；不要直接手改生成分包。
4. 每批执行：

```bash
npm run import:tpg-courses
npm run sync:tpg
npm run status:tpg-courses -- --school=HKU
npm run check:ship
git diff --check
```

5. 若目标改为准备 `1.0.4` 提审，先统一版本化文件与审核文案，再完成微信开发者工具模拟器检查和 iOS/Android 真机矩阵；通过后才提交审核。上传、提交审核和发布是三个独立外部动作，均需用户明确授权。
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

## 当前未提交的修改

交接开始前只有：

```text
?? .playwright-cli/
```

本次交接完成后应为：

```text
 M AGENTS.md
 M docs/CODEX_HANDOFF.md
?? .playwright-cli/
```

没有暂存内容。本次没有重置、删除、覆盖、清理或提交任何现有修改。

## 已运行的测试及结果

2026-07-16 在 `550d2ba` 和交接前干净的受跟踪代码上重新运行：

```text
npm run check:ship: PASS
  check:ug-sync: PASS
  check:tpg-directory-sync: PASS
  check:tpg-course-sync: PASS (218 files, 425 Programmes)
  check:tpg-catalog-sync: PASS (8 schools, 448 Programmes, 8 packages, 304 course structures)
  seed/data validation: PASS
  UG supplement validation: PASS (150 supplements; 137 explicit, 13 copied)
  directory audit: PASS, blockingErrors=[]
  server --check: PASS
  Node tests: PASS, 632/632
  check:release: PASS, ready=true

git diff --check: PASS
npm run status:tpg-courses: PASS
npm run status:ug-sources -- --missing-only --priority launch --missing-limit 10 --batch-plan: PASS
```

发布指标：

- 主包：1,718,711 bytes。
- 总估算包体：11,345,628 bytes，166 个上传文件。
- 所有 16 个 UG/TPG 分包低于 2 MB；最大为 `ug-data-hku`，1,485,882 bytes。
- 页面：17；敏感 API：0。
- release warnings 仅为人工微信后台检查尚需完成，以及未配置生产 HTTPS（体验/正式版按设计离线）。

文档和 `AGENTS.md` 修改后再次运行了 `git diff --check`；这些修改不改变运行时代码。没有在本次交接中执行新的模拟器或真机验收。

## 已知问题、风险和不要做的事情

- 不要把微信已上传的 `1.0.4` 当作仓库版本已完成迁移；当前 package 和提审文档仍写 `1.0.3`。
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

足够。一个全新的 Codex 任务只要先读取根目录 `AGENTS.md` 和本文件，再执行“下一步最具体的操作”中的四个只读/验证命令，就能确认当前 Git 状态、数据覆盖、剩余 HKU 队列、生成同步和发布门禁，并可在不依赖聊天记录的情况下继续工作。

限制是：微信后台的真实审核/发布状态和 iOS/Android 真机结果不在 Git 中。继续发布流程前，新的任务仍必须通过微信开发者工具/后台和真机重新核实这些外部状态。
