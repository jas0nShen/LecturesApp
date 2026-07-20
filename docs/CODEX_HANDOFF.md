# Codex 项目交接

最后核验时间：2026-07-19（Asia/Shanghai）

## 当前项目目标

维护一个本地优先、原生微信小程序形式的“香港高校课程选择助手”。用户可以选择本科或授课硕士 Programme / Major，浏览随包发布的离线课程结构，在本机保存收藏、已修课程、笔记、计划与历史，并在规则证据足够时使用保守的课程规划和毕业检查。

当前产品边界是：先保证离线发布、数据可追溯和规则不误导，再继续补课程覆盖与规划能力。未经明确产品决定，不引入登录、云同步、统计、敏感权限或生产 API。

当前仓库发布资料已统一为 `1.0.8`（`package.json`、运行时 `releaseInfo`、`docs/MVP_SPEC.md`、`docs/RELEASE_CHECKLIST.md`、`docs/REVIEW_SUBMISSION.md`）。微信开发者工具官方 CLI 已上传 `1.0.8`；没有提交审核或发布正式版。

## 可验证的仓库快照

- 工作目录：`/Users/shenjingsong/Documents/develop/lecturesApp`
- 分支：`main`
- 1.0.8 最新课程补充：HKBU TPG Creative Writing、CityU UG JS1108/JS1111 及 750 项测试
- 本批课程数据提交：`e4500fd Add HKBU and CityU course curricula`
- 包版本：`1.0.8`
- `main` 与 `origin/main` 同步；提交 `e4500fd` 已包含本批 TPG/UG source supplements、生成 catalogue/shards/分包和测试。
- 本批新增源包括 HKBU TPG Ethics and Public Affairs、Marketing for the Creative Economy，以及 UG JS2060、JS2620、JS2660、JS2920；此前同一工作区的 CUHK、EdUHK、Lingnan、PolyU、CityU、HKU、HKUST 和 HKBU 补充均继续保留。
- 旧单一 `ug-data-hku`、`ug-data-hkbu` 已由生成脚本分别替换为 `ug-data-hku-a` / `ug-data-hku-b`、`ug-data-hkbu-a` / `ug-data-hkbu-b`。这些删除与新增是既有分包拆分结果，不要手工恢复旧 loader。

- 本批课程补充已提交、推送并以 `1.0.8` 重新上传；`git diff --check` 通过。
- `.playwright-cli/` 为 96 KB 的本地浏览器诊断产物，共有 console log 和 page YAML；本次没有删除、覆盖或暂存。

最近关键提交（本次交接提交前）：

```text
e4500fd Add HKBU and CityU course curricula
233f0f3 Document 1.0.8 upload
4061944 Release 1.0.8 with expanded course coverage
d438548 Document updated 1.0.7 upload
d03f7b3 Add undergraduate course completion tracking
292e5ec Document 1.0.7 upload
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
- 本科已修状态同样以 Programme + Major + Course 隔离，可在课程详情和 Study Plan 标记或撤销；移出计划不删除已修状态，且备份、恢复、清除、摘要和非法导入校验均已覆盖。
- 开发版可使用零依赖 Node 本机 API；体验版和正式版在未配置生产 HTTPS 时只使用随包离线数据，不访问用户设备的 `localhost`。
- UG 与 TPG 大型课程数据分别拆入微信分包，主包保留轻量索引；UG 双分包 loader 可返回调用页并完成 activation，所有当前分包均低于 2 MB。
- UG/TPG Node 测试 fallback 不再使用微信基础库禁止的 `eval`。

### 数据与规则覆盖

2026-07-20 重新运行覆盖报告所得当前值：

- TPG：8 所学校、448 个 Programme，全部 448 个已完成来源审查，来源覆盖率 100%。
- TPG：336 个 Programme 有课程结构，Programme-local 课程共 8,866 门。
- TPG 状态：111 个 `blocked`、1 个 `archived`、0 个 `unreviewed`。
- HKU：62/62 已审查，55 个 `verified`、7 个 `blocked`、2,517 门 Programme-local 课程。
- PolyU：105/105 已审查，54 个已核验课程结构、51 个来源阻塞、1,334 门课程。
- HKBU：48/48 已审查，44 个已核验课程结构、4 个来源阻塞、1,229 门课程。
- HKUST：53/53 已审查，52 个已核验课程结构、1 个归档、769 门课程。
- 已加入 PolyU `POLYU-TPG-038 Chinese Language and Literature`：31 credits、44 门课程，含中文语言/文学选修块、非 LST 选修与有条件 Dissertation。
- 已完成 HKU `HKU-TPG-049` 至 `055` 的最后一批来源审查：050 MChDS（18 门）、051 MExpArtsTh（20 门）、052 MIPA（45 门）为 `verified`；049、053、054、055 因官方审批、学分冲突或逐课学分缺口为 `blocked`。
- 已补充 CUHK `CUHK-TPG-018 Global Communication`：4 门 Required 加任意 4 门 Elective，共 24 units；24 门唯一课程及两个 optional Specialization Streams 已由 2026-27 Study Scheme 和 Course Lists 核验，开放式获批替代规则保留 `manual_review_required`。
- CUHK `CUHK-TPG-010 Early Childhood Education` 继续 `blocked`：2026-27 Programme 结构发布 37 个不同代码，当前 Faculty Course Information 可核实其中 34 个的 title/units；`PEDU6072`、`PEDU6503`、`PEDU6701` 仍没有当前条目。Programme 页面晚于课程目录更新，目录缺失既不能证明三门课已移除，也不能验证旧 title/units，因此不发布 34/37 的不完整结构。
- 已补充 EdUHK `EDUHK-TPG-DIR-MA-NMSM Master of Arts in New Media and Social Media`：4 门 Core 全部必修、8 门 Elective 任选 4 门，共 24 credit points；官方 2026-27 Moodle 以 `MDA6017` 补齐最后一个缺失代码，12 门课程完整开放。
- 已补充 EdUHK `EDUHK-TPG-DIR-MA-CVBLE Master of Arts in Chinese Values-Based Leadership Education`：4 门 Core 全部必修、7 门 Elective 任选 4 门，共 24 credit points；11 门课程代码均由官方 curriculum module 闭合。`SED6146` module 标题比 Programme 页面多 `Environment`，差异已保留在说明中；七门 Elective 不保证每年全部开设。
- 已补充 EdUHK `EDUHK-TPG-DIR-MA-CECI Master of Arts in Comparative Education and Collaborative Innovation`：4 门 Core、5 门 Elective 与 6-credit `PFS6085` Capstone 共 10 个唯一课程代码；普通路径修四门 Elective，获选全日制学生可改修 Capstone 加两门 Elective。遴选资格和两条替代组合保留 `manual_review_required`。
- 已补充 EdUHK `EDUHK-TPG-DIR-MA-DHRMOM Master of Arts in Digital Human Resource Management and Organisational Marketing`：4 门 Core 全修、7 门 Elective 选四，共 24 credit points；11 门课程代码全部闭合，`BUS6084` 为 3-credit Capstone option。`BUS6078` 的官方 module/Programme 页英式与美式拼写差异已记录，完整 Elective pool 不表示每年保证开设。
- 已补充 EdUHK `EDUHK-TPG-DIR-MA-DMEC Master of Arts in Digital Marketing and E-Commerce`：6 门 Core 全修、4 门 Elective 任选 2 门，共 24 credit points；10 门课程代码与 3-credit 学分均由官方 curriculum module 闭合，`BUS6088` 为 Capstone option。Programme 页的年度开课调整声明已保留，不把完整 Elective pool 表述为每年保证开设。
- 已补充 EdUHK `EDUHK-TPG-DIR-MA-BRBCA Master of Arts in Belt and Road Business Communication and Administration`：6 门 Core 全修、5 门 Elective 任选 2 门，共 24 credit points；11 门课程代码、标题和 3-credit 学分均由官方 Programme 与 curriculum module 页面闭合，`MDA6013` 为 Capstone Project。`PUA6036` 与 `LIN6075` 的额外英语资格条件已显式保留，规则状态为 `manual_review_required`。
- HKBU `HKBU-TPG-032 Master of Science in Business Management` 继续 `blocked`，但 blocker 已按 2026 当前官方资料收窄：招生页与 MScBM Curriculum 页面均确认 8 Core、2 Required、2 Elective 的 36-unit 路径，旧 Handbook 的 6/9 Elective units 小计冲突已解决。当前 Elective pool 新增 `MGNT7900 Business Negotiation`，公开页面未给逐课 units，2026-27 Handbook 仍需授权；不从“两门共 6 units”算术推断该课为 3 units。
- 已补充 HKBU `HKBU-TPG-001 Master of Arts in Ethics and Public Affairs` 的两条 27-unit Stream。当前招生页与 Programme Curriculum 已解决旧 Handbook 的 Dissertation Stream 小计冲突：两门 Foundation 共 6 units、从七个逻辑选项选 5 门共 15 units、`LSE7111` 与 `LSE7112` Dissertation 共 6 units；七个逻辑选项是六门独立课程加 `LSE7060 / LSE7150` 二选一。Programme Elective Stream 为两门 Foundation、六门 Required 加该二选一。cGPA 3.33、委员会批准和互斥选择保留 `manual_review_required`。
- 已补充 HKBU `HKBU-TPG-044 Master of Science in Marketing for the Creative Economy` 当前 30-unit 结构：6 门 Core 共 18 units、Semester 1 三选一、Semester 2 MMIS 二选一、Semester 2 AVA 二选一，以及 3-unit `MKTG7200` Field Trip，共 14 个唯一代码。当前 Curriculum 页面已把旧 Handbook 的“four courses 但只列三门”改为明确三选一；Field Trip 被取消、改期或缩减时的替代仍由 Programme 决定，故保留 `manual_review_required`。
- 已补充 HKBU `HKBU-TPG-002 Master of Arts in Creative Writing for Cultural Professionals`：当前招生页与直接链接的 Programme Curriculum 闭合 27-unit 路径，包括 5 门 Core/Required 共 15 units（含 `WRIT7051` Master Project）及 9 门 Elective 任选 4 门共 12 units。14 份官方 course outline 均确认每门 3 units；`WRIT7030` 采用正式 outline 的复数标题 `Creative Industries`。结构可直接机器判定，已从 `blocked` 改为 `verified`。
- 已补充 Lingnan `LINGNAN-TPG-DIR-16-000107-L6 Master of Science in Finance`：7 门 Core 全部必修、18 门 Elective 任选 3 门，共 30 credits；25 门课程的代码、标题和 3-credit 学分均来自当前 Programme 页面与官方 FIN/RIM/ACT Course Description PDF。
- 已补充 Lingnan `LINGNAN-TPG-DIR-08-000500-6 Master of Science in International Banking and Finance`：6 门 Core 共 18 credits、21 门混合 3/1.5-credit Elective 修满 12 credits；保留 IBF504/IBF615 互斥并标记 `manual_review_required`。
- 已补充 Lingnan `LINGNAN-TPG-DIR-25-000019-L6 Master of Science in Risk, Insurance and Actuarial Analytics`：5 门 Core 全部必修、14 门 Elective 任选五门，所有课程均为 3 credits，总计 30 credits；19 门课程代码、标题和学分由官方 RIM、FIN、ACT Course Description PDF 交叉确认。
- 已补充 Lingnan `Master of Science in Smart Ageing and Gerontology`：4 门 LU Core、4 门 HKMU Core 和 1 门联合 Capstone，共 30 credits；发布 10 个院校代码，其中 `SAG502` 与 `HSCI8621NEF` 是同一联合课程的两校代码，院校归属和转学分记账保留 `manual_review_required`。
- 已补充 Lingnan `LINGNAN-TPG-DIR-24-000812-L6 Master of Science in Human Resource and Organisational Management`：2 门共享 Core 加 24-credit 路径组，共 17 个 Programme-local 唯一课程代码；Mainstream 与 HRADT 均要求 6 Core 加 4 Elective，因 `MGT501/502/505/507` 与 `HRM542/543` 在两条路径间发生 Core/Elective 角色转换，保留 `manual_review_required`。
- 已补充 Lingnan `LINGNAN-TPG-DIR-25-000888-L6 Master of Liberal Sciences`：19 个 Programme-local 唯一课程代码，4 门 Core、6-credit Practice 路径和 12-credit Programme Elective/Concentration 路径；Sports、Music、TechMedia 三个 Concentration 均闭合，其中 TechMedia 的第三门为共享的 `LSC533`，三加一课程组合保留 `manual_review_required`。
- Lingnan `MSc in eBusiness and Supply Chain Management` 继续 `blocked`：Department、Faculty TPO 和 ORM Course Description PDF 对当前 CDS/ORM 代码、Elective 池及 `ORM545` 标题存在冲突；已更新精确 blocker，没有从相互冲突的官方来源拼接课程表。
- Lingnan `LINGNAN-TPG-DIR-25-000634-L6 Master of Arts in Digital English Studies` 继续 `blocked`：逐课官方 PDF 已能确认代码、标题、类别和学分，但 Programme 页面只把 DES 课程列作 highlighted examples，未公开完整课程池或各组必修数量；不从 30-credit 总数反推 Elective 门数。
- Lingnan `LINGNAN-TPG-DIR-19-000493-L6 Master of Social Sciences in Health and Social Services Management` 继续 `blocked`：30-credit 规则、6 门 Core、`MHM509` Project 及 3 门 Elective 已闭合代码，仍有 4 门当前 Elective 缺官方代码；不发布不完整的 7-course Elective pool。
- PolyU `POLYU-TPG-007 ESG and Sustainability` 继续 `blocked`：AF 当前 Programme 页面已补齐全部当前代码，包括新 Core `AF5144` 与 `AF5145`，但没有当前公开 SDF/PRD 明确两门各自学分；不从 22-credit 组总数算术反推两个 3-credit 值。
- PolyU `POLYU-TPG-016 Microelectronics Technology and Materials` 继续 `blocked`：当前来源已闭合六门 Core 和七个已编码 Elective/Project，但 `Wide Bandgap Semiconductors for Microelectronics` 仍无公开代码/SDF，Programme 所需 `Engineering Ethics and Academic Integrity` 也未公布代码；不以标题不同的 `AP5T01 Academic Integrity and Ethics in Science` 替代。
- PolyU `POLYU-TPG-017 Advanced Photonic Technology and Materials` 继续 `blocked`：2027 Programme 页面发布 8 门 Core、Elective/Project 和 1-credit AIE 的标题与组规则，但全部 8 门 Core、`Wide Bandgap Semiconductors for Microelectronics` 和 AIE 都缺当前公开代码；Department Subject List 只能精确匹配 `AP5017`、`AP5007`、`AP5002`、`AP5020`，不以标题不同的 `AP5008`、`AP5022`、`AP5T01` 替代。
- PolyU `POLYU-TPG-074 Master of Science in Advanced Physiotherapy` 继续 `blocked`：同一 Programme 的 2026/27 官方页面明确 `RS567 Project Study` 为 6 credits，但 2027/28 Programme 页面、现行 2026-or-after Curriculum 图和 v14 leaflet 都未重申代码，且没有公开的当前 51069 PRD/SDF；不跨学年搬运 `RS567`。
- PolyU `POLYU-TPG-011 Master of Science in Low-altitude Economy` 继续 `blocked`：2027 Programme 页面已闭合 8 门 Core、7 门 Elective 和两条 31-credit 路径，但官方 PRD、当前 AAE Subject List 及 2026/27 leaflet 均未发布 9-credit Dissertation 的课程代码；不从其他 Programme 类推 Dissertation code。
- HKU `HKU-TPG-055 Master of Public Administration` 继续 `blocked`：当前官方来源已闭合 4 门 Compulsory、23 门 Elective、`POLI8012` Dissertation 和 `POLI8028` Capstone Project 的代码与组结构；4 门 Compulsory 和 22 门 Elective 均为 6 credits，两项毕业项目均为 12 credits，但 `POLI8032 Selected Topics in Public Administration: Policy in China` 的 2026-06-09 当前课程描述仍未注明学分，不从其他 Elective 推断为 6 credits。
- UG：8 所学校、444 个 Programme、678 个 Major、12,511 条 Major-local 带代码课程、179 个 Programme 已开放课程清单；运行时 265 个 Programme 待开放，来源覆盖报告另有 266 个 Programme-level 缺口。
- 已补充 CityU `JS1109 BA Linguistics and Language Applications` 当前 2026/27 课程结构：唯一正式 Major 下 40 门唯一代码，11 门 Core 共 33 credits、29 门 Major Elective 候选池（选 24 credits，至少 12 credits 为 B4 level），全部课程 3 credits。上游 JUPAS 标题中的五项 Features 不再被伪建成五个 Major；`LT4235` 按当前 Catalogue 保持 Core，不纳入旧 2025/26 pool 的 `LT4391`，也不从旧 Suggested Study Plan 搬运 Year/Term。
- 已补充 CityU `JS1102 BSocSc International Relations and Global Affairs` 当前 2026/27 课程结构：唯一正式 Major 下 53 个唯一代码，18 门 Core 共 51 credits（含 0-credit `PIA3812` International Experience）及 35 门 Major Elective 候选池（选 12 credits）。Asian Studies、International Studies、Development Studies 分别是 24、21、13 门的重叠 Stream 子集，不再伪建成三个 Major；`PIA3810/3810J/3810K` 的最终 Stream award 由 Major leader 决定，未自动推断。
- 已补充 CityU `JS1112 BSocSc Psychology` 当前 2026/27 课程结构：唯一 Psychology Major 下 37 个唯一代码，Foundation 3 门/9 credits、Core 11 门/36 credits、Major Elective 主池 20 门（选 18 credits），另保留 3 门仅列于 Stream pool 的课程。Health and Development 与 Mind and Brain 分别是 9 门和 6 门的可选 Stream 子集，不再伪建成两个 Major；`SS2715` 1 credit、`SS3733` 2 credits、`SS4708` 6 credits 均来自当前课程页，`LT3234` 不可与 College-specified requirement 双算的限制已保留。
- 已补充 CityU `JS1108 BSocSc Public Affairs and Management` 当前 2026/27 课程结构：唯一正式 Major 下 56 个唯一代码，5 门 Foundation 共 15 credits；Public Affairs and Governance 与 Public Policy and Management 是二选一 Stream，每条路径再修 33-credit Core 和 15-credit Elective，Major 共 63 credits。共享课程只保留一条记录并合并身份；`PIA3800 / CAI4001` 互斥与 Stream 路径保留人工核对说明，不填 Year/Term。
- 已补充 CityU `JS1111 BSocSc Crime Science` 当前 2026/27 课程结构：唯一 Crime Science Major 下 27 个唯一代码，Foundation 3 门/9 credits、Core 12 门/39 credits、Major Elective 12 门（选 9 credits），Major 共 57 credits。JUPAS 标题的五项 Features 不再伪建成五个 Major；`SS4296` 保留为 6-credit Capstone，不从开课学期推断推荐 Year/Term。
- CUHK `JS4018 Chinese Language and Literature` 继续仅索引：2026-27 Major Requirement 发布 66-unit 结构、11 个 Required code 和四类 Specialty elective code，但当前 Course Offerings 只能核实 19 个唯一代码的 title/unit，且 Modern Chinese Literature 列表重复 `CHLL3402`，无法无推断地闭合当前完整课程池；已记录 `no_public_course_codes`，不以年度开课子集冒充完整 curriculum。
- 已补充 HKBU `JS2020 Bachelor of Arts (Hons)` 的 5 个独立 Major：Chinese Language and Literature 74 门、Creative and Professional Writing 62 门、English Language and Literature 86 门、Humanities 66 门、Translation 50 门，共 338 条 Major-local 课程记录、312 个跨 Major 唯一代码。共享代码继续按 Programme + Major 隔离；Third Language、Humanities 额外 Free Elective 等未编码开放项只记录边界，不伪造课程。
- 已补充 HKBU `JS2410 Bachelor of Chinese Medicine and Bachelor of Science (Hons) in Biomedical Science` 的 71 个唯一代码：Biomedical Sciences 24 门/52 units、Chinese Medicine 31 门/97 units、Clinical Internship 3 门/49 units、Honours Project 2 门/6 units，以及 11 门公开推荐的 Free Elective 课程。推荐清单保持开放性质，不表述为封闭选修池。
- 已补充 HKBU `JS2420 Bachelor of Pharmacy (Hons) in Chinese Medicine` 的 46 个唯一代码：37 门 Major Required 共 90 units、两个封闭 Elective 池共 7 门（分别选 1 门和 2 门）、3 门 Supervised Practicum 及 2 门 Honours Project。数据明确限定为 2025-26，未从无代码的 Language、GE 或 Free Elective 部分补写课程。
- 已补充 HKBU `JS2940 Innovation in Health and Social Well-Being` 的 67 个唯一代码；Health Technology and Informatics 与 Health and Social Wellness 两条 Concentration 均闭合为 73-unit Major Courses，并保留 Either/Or、共同与路径专属课程角色、实习、Practicum、两个封闭 6-unit Elective 池及 12-unit Honours Project。
- 已补充 HKBU `JS2960 Digital Futures and Humanities` 的 100 个唯一代码：15 门 Major Required 共 46 units、三条各 24-unit Concentration 候选池及 2 门 Honours Project。三条路径各自的 3 门星号必修与 published elective pool 分开表达；`Innovation Project Management` 名称不再导致课程被误判为 Capstone。
- 已补充 HKBU `JS2510 Bachelor of Science (Hons)` 的 7 个独立 Major，共 365 条 Major-local 课程记录、274 个跨 Major 唯一代码：Applied Biology 49、Applied Biology and Ecology and Conservation Double Degree 38、Bioresource and Agricultural Science 34、Biochemical and Testing Sciences 42、Computer Science 83、Mathematics and Statistics 78、Green Energy and Smart Technology 41。Science Common Core、各 Concentration/Double Concentration、Project、Internship 和 Elective 角色均按精确 Major 隔离；Lincoln Year 4 未公开代码、DMC 3/6-unit 冲突及部门批准开放池均未被补写或算术推断。
- 已补充 HKBU `JS2610 Bachelor of Arts / Bachelor of Social Sciences (Hons)` 的 6 个独立 Major，共 384 条 Major-local 课程记录、260 个跨 Major 唯一代码：European Studies 31、Geography 47、Global and China Studies 137、Government and International Studies 43、History 78、Sociology 48。French/German Stream、主题 Elective、Experiential Learning、Internship 与 Honours Project 保持各 Major 官方角色；Sociology 标题称 3-unit Honours Project、但同时发布两门各 3-unit 课程的冲突按原证据保留。
- HKBU `JS2950 Bachelor of Arts, Science and Technology (Hons) Individualised Major` 继续仅索引：官方仅发布 14 门固定代码共 57 units，另有 36 units Personalised Knowledge and Skills 须由学生从 HKBU 全校范围与导师协商并经审批，没有稳定封闭代码池。只发布固定部分会把个性化课程错误表述成完整 Programme，故记录为 `no_public_course_codes`，不创建不完整 supplement。
- 已补充 HKU `6315 Bachelor of Engineering in Data and Systems Engineering` 适用于 2025-26 及以后入学者的 60 门明确编码课程：25 门 Core、33 门 Discipline Elective、1 门 0-credit Internship 和 1 门 12-credit Capstone；只把 suggested study plan 作为推荐年级，不补写占位代码或开放式 Elective 池。
- 已补充 HKU `6339 Bachelor of Engineering in Mechanical Engineering` 适用于 2025-26 及以后入学者的 60 门明确编码课程；`ENGG1200` 保持为无 HKDSE Physics 学生的条件 Free Elective，`MECH3432` 保持为不计入 36-credit Elective 要求的 0-credit 可选实习，占位课程、开放 Elective/MSc 池和仅见于 Focus 表的课程未纳入。
- 已补充 HKU `6353 Bachelor of Engineering in Civil Engineering` 适用于 2025-26 及以后入学者的 57 门明确编码课程：24 门 Core、31 门 Discipline Elective、1 门 0-credit 必修 Internship 和 1 门 12-credit Capstone；排除未定第二门 AILT、开放 Elective/MSc 池、仅见于 Focus 表的外部课程和未进入正式 curriculum table 的 `ENGG1200`。
- 已补充 HKU `6092 Bachelor of Education in Early Childhood Education and Special Education` 适用于 2025-26 及以后入学者的 47 门唯一编码课程：25 门 Professional Core、3 门共 66 credits 的 Professional Practicum、1 门 18-credit Project、7 门 Specialised Elective 和语言增强默认/替代课程；47 门是完整发布池而非每名学生的实际修读门数，未编码 Common Core、AI literacy 和 national education/security 要求未纳入。
- 已补充 HKU `6066 Bachelor of Arts and Bachelor of Education in Language Education - English` 官方 2025-26 PDF 当前公布的 210 个唯一编码课程：English Language and Linguistics Major 163 门、Professional Core 36 门、Language Enhancement 11 门；开放 60-credit free electives、未编码 Common Core/AI literacy/national requirements 和只作为 free elective 的 Advanced Pedagogy English 课程未纳入，16 门 CPP 只作为当前公布且可能变化的选项池。
- 已补充 HKU `6406 Bachelor of Laws` 的 39 门明确课程：18 门 Professional compulsory、9 门 Capstone alternatives、12 门 Designated disciplinary elective alternatives；PDF 合并标示的 Third/Fourth Years 未被伪拆为单一年级。
- 已补充 CUHK `JS4320 Human Movement Science and Health Studies` 的 24 门唯一课程；没有猜 Year/Semester，并显式记录官方页面把 SPED3910 同时列入 Core 与 Health Studies Elective、以及 Core 30-unit 小计与逐门合计冲突。
- 已补充 CUHK `ESHEN Exercise Science and Health Education` 适用于 2025-26 及以后入学者的 Programme A：28 门唯一课程、55-unit 完整结构；排除只在 Course List、未进入 Programme A requirement pool 的 SPED2050、SPED2122 和 PHPC2009。
- 已补充 CUHK `JS4329 Physical Education, Exercise Science and Health` 适用于 2026-27 及以后入学者的 Programme A：52 门唯一课程，按最低选修要求闭合 104 units；`SPED3201`、`SPED2201` 只作为 Teaching Practice 历史代码记录，不另建课程，也不猜测 Year/Semester。
- 已补充 CUHK `JS4525 Pharmacy` 的 57 门唯一课程：29 门按 Attendance Year 发布的共同必修、Year 3 二选一与 Summer Free Elective、互斥的 Research 和 Pharmacy Clerkship 最终年路径；`PHAR4911` 保留官方 0 unit，开放校级要求及未发布的 Free Elective 修读数量不作推断。
- 已补充 CUHK `JS4434 Electronic Engineering` 适用于 2025-26 入学者的 79 门标准四年制主路径课程：33 门包含官方替代项的 Faculty/Foundation/Required 课程、2 门 Research Component、44 门 Elective；排除不计入 75-unit Major Requirement 的 `ENGG1040` 条件桥接、开放 5000-level 替代池及其他入学路径。
- 已补充 HKUST `BSc in Mathematics` 2025/26 Major Requirement 中 85 门显式课程，保留 Applied、Computer Science、Financial and Actuarial、General、IRE、Pure Advanced、Pure、Statistics 八条 Track 的角色；不把 subject-level 开放选修池伪装为封闭课程表，`MATH4823` 的官方 1-4 variable credits 以未知学分存储。
- 已补充 HKUST `BSc in Chemistry` 2025/26 Major Requirement 的 57 门唯一课程，覆盖共同 Major、Biomolecular/Core Chemistry、IRE 及三个 Chemistry Options；开放的 3000-level-or-above CHEM 池未伪装成封闭清单，`CHEM3610` 的 2-3 variable credits 以未知学分存储。
- 已补充 HKUST `BSc in Physics` 2025/26 Major Requirement 的 56 门唯一课程，覆盖共同 Major、IRE、Honors Physics 及 Physics and Mathematics Option；固定使用 2025/26 PDF，不混入 2026/27 新增 AI Option，开放的 3000-level-or-above PHYS 池未展开。
- 已补充 CUHK `JS4408 Mechanical and Automation Engineering` 2026-27 Major Requirement 的 104 门唯一课程：7 门 Faculty、8 门 Foundation、18 门 Required、4 门标准/ELITE Research alternatives、37 门 Breadth 和 30 门 Depth；保留 75-unit 主规则、Breadth/Depth 最低学分及 reciprocal alternatives，不纳入条件 bridge、University Core 和开放 5000-level 池。
- 已补充 HKU `6274 Bachelor of Arts in Global Creative Industries` 2026-27 pending-approval syllabus 的 98 门唯一显式代码：20 门 AI/English/Chinese requirements、8 门 Major Core/Industry Experience/Capstone 和 70 门高级选修；跨 concentration 重复项只存一次，开放 Common Core、free elective、introductory Arts/Social Sciences 与其他 AILT 池不封闭化。
- 已补充 HKU `6286 Bachelor of Arts in Humanities and Digital Technologies` 2026-27 pending-approval syllabus 的 80 门唯一显式代码：14 门 AI/语言要求、7 门 Major 必修、55 门 HDT advanced interdisciplinary electives 和 4 门仅见于 Gaming Studies Humanities Focus 的课程；其他 Humanities Focus、Common Core、free elective 及未编码语言替代池未展开。
- 已补充 HKU `6298 Bachelor of Arts and Bachelor of Engineering in Artificial Intelligence and Data Science` 的 67 门唯一显式代码：7 门 AI and Humanity Core、18 门 Professional Core 必修、2 门数学替代、26 门 disciplinary electives 和 14 门 AILT/语言课程；开放 Humanities/Common Core/free-elective 池和占位范围未展开。Pending regulations 称 internship 不计学分，但课程 syllabus 与 curriculum structure 明确 `COMP3512` 为 6 credits，本地课程记录采用课程专属 syllabus 并保留冲突说明。
- 已补充 HKBU `BBA(ACCT) Bachelor of Business Administration (Hons) - Accounting Concentration` 2025-26 Handbook 的 24 门唯一课程、67 units：17 门 BBA Required Courses 共 46 units，7 门 Accounting Concentration Required Courses 共 21 units；未展开 Language、GE、Free Elective，`ACCT3007` 只属于认证相关 free-elective 选项，未纳入 Major Courses。
- 已补充 HKBU `JS2120 Bachelor of Business Administration (Hons)` 中证据闭合的 Economics and Data Analytics 与 Finance 两个 Concentration：共同 17 门 BBA Required Courses 共 46 units；Economics 有 4 门 Required 和 21 门显式 Elective，Finance 有 4 门 Required 和 19 门显式 Elective，两个 Concentration 均从 Elective pool 选择 9 units。65 个唯一代码通过 `majorIds` 隔离为 42/40 门可见课程；其余六个当前 Concentration 因 2025-26 Handbook 名单与 2026 目录存在 cohort 变化而保持未开放。
- 已补充同一 HKBU `JS2120` 中名称与当前目录直接一致的 Human Resources Management 与 Information Systems and Business Intelligence：共同 17 门 BBA Required；HRM 为 5 门 Required 加 13 门 Elective pool（选择 6 units），其中 `HRMN3027` 按官方保留为 0 unit；ISBI 为 3 门 Required 加 23 个唯一 Elective 代码（选择 12 units），官方重复两次的 `BUSI4027` 只存一次。61 个唯一代码通过 `majorIds` 隔离为 35/43 门可见课程。
- 已补充同一 HKBU `JS2120` 中的 Marketing 与 Strategic Retail Management and Innovation：共同 17 门 BBA Required；Marketing 为 5 门 Required 加 21 门 Elective pool（选择 6 units），Strategic Retail 为 4 门 Required 加 23 门 Elective pool（选择 9 units）。跨 Major 重复的 `MKTG3017`、`REMT3006` 等课程通过精确 `majorIds` 保留各自 Required/Elective 角色，两个 Major 分别开放 43/44 门课程。
- HKBU `JS2120` 的 FinTech 与 MarTech 暂不开放：官方明确两者对 BBA 学生只能作为第二 Concentration，并使用 Free Elective units、最多与 primary Major 重复计算 6 units；当前单一 Major 模型无法表达 primary Concentration 依赖。MarTech 的当前 Handbook 与 2025-09 官方课程 PDF 还分别列出 `ISEM3036` 与 `ISEM3035`，不能选择其一拼成主 Concentration。
- 已补充 HKBU `JS2910 Bachelor of Science (Hons) in Business Computing and Data Analytics` 的 58 门唯一课程：17 门 Business/Computer Science Required、18 门 Business Applications、21 门 Analytical Methodologies 和两门 Final Year Project；`COMP3056` 按官方保留为 required 0-unit Internship。Analytical Methodologies 允许经 Department 批准的其他 COMP 课程，未把显式 21 门列表伪装成绝对封闭池。
- 已补充 HKBU `JS2025 Bachelor of Arts (Hons) in Religion, Philosophy and Ethics` 的 57 门唯一课程：7 门 Major Required 共 21 units、48 个唯一 Major Elective 代码与两门 Honours Project；严格保留 A/B/C/D 四组各至少选两门和合计 33 elective units 的规则。`RELI2037` 与 `RELI3235` 的跨组资格各合并为单一课程记录，并保留同一课程只能计入一个组的限制；Language、GE、Free Elective 未展开。
- 已补充 HKBU `JS2060 Bachelor of Arts (Hons) / Bachelor of Music (Hons) (Music / Creative Industries)` 的两个 Major：Music 96 个唯一代码，Creative Industries 93 个唯一代码，按 Major ID 完全隔离。保留 Music 页面 69-unit 标题与显式 37 + 21 = 58 units 的冲突、Music Education Chamber 路径 21/23 units 冲突、`MUSI2057` Programme 表 2 units 与单课页 3 units 冲突；Directed Studies 明确标为 coordinator-directed 开放池，不把当前显示课程伪装成封闭池。
- 已补充 HKBU `JS2620` 的两个正式 Major：PERM M1 为 51 个唯一代码，Sports Science M2 为 40 个唯一代码；26 门公共课程按 Major 分别生成并保持本机状态隔离。PERM 保留 40-unit Required、基础 17-unit Elective 及 Internship 抵扣后需额外 3 units Elective 的规则；Sports Science 保留 45-unit Required、15-unit Elective 及中英文能力两条 6-unit 替代路径。Sports Science 是同一 Programme 下需另行申请的正式 Major，不再混入 PERM M1。
- 已补充 HKBU `JS2660 Bachelor of Social Work (Hons)` 的 40 个唯一代码：3 门 Social Sciences Common Core、21 门 Major Required 共 45 units、14 门 Major Elective、两门 Honours Project 共 3 units。三门 Field Practice 共 20 units；`SOWK3005` 抵扣 3-unit Experiential Learning 后，官方脚注要求 SOWK Elective 从表头 18 units 增至实际 21 units。`SOWK1027` 的单课目录无结果，但 Programme 表明确代码、标题和 0.5 unit，已单独标注。
- 已补充 HKBU `JS2920 Bachelor of Arts and Science (Hons) in Arts and Technology` 的 86 个唯一代码：Transdisciplinary Common Core、Programme-specific Knowledge/Skill、Experiential Learning、10-unit Honours Project，以及 Sound、Technology、Visual 三个 Concentration。跨 Concentration 的 9-unit Free Elective 保持开放资格；Sound 规则写三门 3-unit 课程但列有四门 2-unit Composition 课程，`MUSI4025/4026/4027` Concentration 页写 3 units、单课页写 2 units，采用逐课页值并保留冲突。
- 已补充 HKBU `JS2930 Bachelor of Arts (Hons) in Business Administration (Global Entertainment)` 的 57 门唯一课程：3 门 Transdisciplinary Common Core、3 门 Experiential Learning、9 门 Knowledge/Skills Core、40 门显式 Elective pool 和两门 Honours Project；选修池同时含 3/9-unit 课程，严格保留选择 21 units 而不推断固定门数，`BAGE3006` 保留为 Internship。
- 已补充 HKBU `JS2310 Bachelor of Communication (Hons)` 的两个 Major：Journalism and Digital Media 为 104 个唯一代码，Public Relations and Advertising 为 51 个唯一代码；完整保留 School Core、Concentration、Stream、Major Elective、0-unit Internship 和 Honours Project 角色。JDM General Stream 标题称 14 门但实际展示 20 门，以及部分 Stream 学分小计冲突均按官方原样记录，不自行修正。
- 已补充 HKBU `JS2330 Bachelor of Arts (Hons) in Film and Television` 的 76 门唯一显式课程：保留 Professional 与 Liberal Studies 两条路径、两组 Liberal required-elective、Major Elective、Honours Project 和 Internship。`FILM4016` 在 Programme 表为 3 units、单课页为 0 unit；采用 Programme-specific 3 units 并明确标记需人工确认。
- 已补充 HKBU `JS2340 Bachelor of Fine Arts (Hons) in Acting for Global Screen` 的 51 门唯一课程：17 门 Major Required 共 49 units、32 门显式 Major Elective pool 选 30 units、两门 Honours Project 共 6 units；`FAGS3015` 保留官方 1 unit，`FAGS3007` 保留 Internship 或 Practicum option 说明，不补写 Year/Term。
- 已补充 HKBU `JS2370 Bachelor of Communication (Hons) in Game Design and Animation` 的 71 门唯一课程：5 门 School Core、20 门 Major Required 共 46 units、Advanced Animation 与 Advanced Game Design 两个各 9-unit Stream、38 门显式 Major Elective pool 和两门 Honours Project。四门 Practicum 与 `FILM4016` 保留为 0 unit，`GAME3045` 保留为 1 unit；`GAME1006` 采用官方单课页标题 `Transcultural Studies of Games`，不补写 Year/Term。
- 已补充 HKBU `JS2810 Bachelor of Arts (Hons) in Visual Arts` Professional Mode 的 77 门唯一课程：8 门 24-unit Required、0-unit `VART2337` Work Experience、`VART3446` senior-year 替代课、28 门 Cluster Elective、38 门其他 Major Elective 和 6-unit `VART4137` Studio Honours Project。保留至少 27 units Level-3 studio、同 division 18 units 加 Project 的 Concentration 规则；Liberal Arts Mode 没有独立编码表，不虚构封闭路径。
- 已补充 CityU `JS1104 BA English` 2025 cohort normative curriculum：Department/Major 共 59 个唯一代码，English and Professional Communication Stream 可用 59 门、Language and Literature Stream 可用 58 门；`EN2859` 仅属于 EPC，Year 4 Capstone 保留跨 Semester A/B 的说明，具体选修不猜 Year/Term，开放 GE/Free Elective 池不纳入。
- EdUHK `JS8687 Bachelor of Arts (Honours) in Heritage Education and Arts Management` 继续仅索引：官方 2026-27 PDF 已发布 30 个唯一课程代码，但没有逐课 credit points，Programme 页面只有 69/15/22/9/6 的分组总学分；不从总额算术反推每门学分，也不把 15-credit Electives 当作封闭池。
- EdUHK `JS8651 Bachelor of Social Sciences (Honours) in Psychology` 继续仅索引：官方 2026-27 PDF 发布 34 个唯一代码，但除两门 3-cp Internship 外缺逐课 credit points，29 门 PSY 课程也未细分 Core、Major Elective 与 FYP；不从 121-cp 组总额或课程代码反推学分和分组。
- EdUHK `JS8005 Bachelor of Arts (Honours) in Heritage Education and Arts Management and Bachelor of Education (Honours) (Chinese History)` 继续仅索引：当前招生页、FHM Programme 页面与 2026-27 Prospectus 只闭合五年制 156 cps 的领域总额和 2-cp compulsory internship，未发布 A5B109 逐门 code/title/credits/group。单门 FHM outline 与旧单学位课程不能证明属于该双学位或对应 Core/Elective/Education Major/FE/FYP 分组。
- HKU `6705 Bachelor of Psychology` 继续仅索引：2026-27 招生页与 Programme leaflet 未发布 coded curriculum；当前 Department 页面仍只链接 2023-24 Regulations/Syllabus 与推荐路径。旧文件虽能闭合旧 cohort 的课程代码、学分和分组，但没有当前官方声明证明它们继续适用于 2026-27。
- HKU `6303 Bachelor of Engineering Elite Programme` 继续仅索引：未找到适用于当前或 2026-27 的专属官方 curriculum/regulations/syllabus，无法确认逐课代码、标题、学分和分组；不从其他 BEng Programme 拼接课程。
- HKU `6377 Bachelor of Engineering and Master of Science in Engineering in Artificial Intelligence in Engineering` 继续仅索引：官方资料明确 Year 2 起须在六个现有 BEng Major 中任选其一、Year 5 再修 MScEng AIE，只建议本科阶段完成 4 门 general AI 与 2 门 discipline-specific AI，未发布这些课程代码/标题/学分。当前 generic Major 无法表示六条独立 BEng 路径，不把六份现有 syllabus 合成一个虚假封闭课程表。
- HKU `6418 Bachelor of Nursing Advanced Leadership Track` 继续仅索引：官方说明 ALT 建立在五年制 BNurs curriculum 之上，但当前 School of Nursing Programme Outline 只发布 Year/Semester、课程标题、逐课学分和 Practica 分组，完全没有课程代码；也未找到 ALT 专属 coded curriculum 或差异课程表。不使用旧年度 `NURS` 代码映射，也不把普通 BNurs 课程表直接复制为 ALT。
- HKU `6456 Bachelor of Medicine and Bachelor of Surgery` 继续仅索引：适用于 2025-26 及以后的官方文件明确采用 integrated system-based blocks 与 clinical clerkships，而非同构的独立课程，只发布 Professional Core 429 credits 及类别/块学分，不发布完整当前逐课代码；不使用 2007 等旧年度 `MBBS1001` 编码，也不混入 Distinguished MedScholar。
- 已补充 HKU `6494 Bachelor of Pharmacy` 适用于 2024-25 及以后入学者的 33 门唯一课程：24 门 compulsory BPHM 共 192 credits、6 门封闭 Year 4 Elective pool 任选 12 credits、3 门语言课程；Professional Core 按官方闭合为 204 credits，开放 Common Core 未展开，逐课 Semester 未作推断。
- 已补充 HKU `6482 Bachelor of Chinese Medicine` 适用于 2021-22 及以后入学者的 55 门唯一课程：34 门 required academic core 共 234 credits、10 门封闭 disciplinary elective 任选 12 credits、6 门 clinical attachment/practicum/clerkship 共 114 credits，以及 5 门语言课程或明确替代；Professional Core 闭合为 360 credits。`BCHM6601` 为 90-credit final-year Clinical Clerkship，`BCHM4608` 跨 Year 4 至 Year 5 Semester 1，不压成单一年级。

### 当前发布状态

- Git 提交 `2f37396` 已包含 HKU Social Sciences 049 至 055、生成分包、builder、测试及 `1.0.5` 版本资料。
- Git 提交 `f51c980` 已包含 TPG 选课计划、本地备份/恢复支持、浏览入口、Study Plan 页面和页面状态测试。
- Git 提交 `361ee05` 已包含 `1.0.6` 版本资料、冷分包 loader 返回兜底、8 个生成 loader 和回归测试。
- Git 提交 `d39634d` 已包含本科可编辑排期、UG 双分包加载修复、微信基础库兼容、测试及 `1.0.7` 版本资料。
- Git 提交 `d03f7b3` 已包含本科已修状态、Study Plan 状态统计与复制、首页入口序号修复、测试及更新后的 `1.0.7` 发布资料。
- 本地 `main` 与本地远端跟踪引用 `origin/main` 同步；当前课程补充已由提交 `e4500fd` 推送。
- 微信开发者工具已显示最新 `1.0.5` 代码上传成功，更新类型为“修订补丁”，备注为 `1.0.5: Add TPG course planning`。
- 2026-07-17 已通过微信开发者工具官方 CLI 上传 `1.0.6`，备注为 `1.0.6: Add TPG course planning and reliable loaders`，命令返回 `✔ upload`；上传包 8.6 MB，主包 1.4 MB，所有分包低于 2 MB。
- 2026-07-18 已通过微信开发者工具官方 CLI 上传 `1.0.7`，备注为 `1.0.7: Add editable UG course planning`，命令返回 `✔ upload`；实际上传包 8.6 MB，主包 1.4 MB，所有分包低于 2 MB。
- 2026-07-18 已用新增本科已修状态的代码再次上传同版本 `1.0.7`，备注为 `1.0.7: Add UG course completion tracking`，命令返回 `✔ upload`；本次上传覆盖此前 1.0.7 开发版，实际上传包 8.6 MB、主包 1.4 MB，所有分包低于 2 MB。
- 2026-07-19 已通过微信开发者工具官方 CLI 上传 `1.0.8`，备注为 `1.0.8: Expand UG and TPG course coverage`，命令返回 `✔ upload`；实际上传包 12,501,143 bytes，主包 1,463,604 bytes，所有 19 个分包低于 2 MB。
- 2026-07-20 已用 HKBU TPG Creative Writing 与 CityU UG JS1108/JS1111 课程数据重新上传同版本 `1.0.8`，备注为 `1.0.8: Add HKBU and CityU course curricula`，命令返回 `✔ upload`；本次上传覆盖此前 1.0.8 开发版，实际上传包 12,563,551 bytes、主包 1,462,259 bytes，所有 19 个分包低于 2 MB。
- 当前课程补充重新运行完整检查：750/750 测试通过、`ready=true`、主包 1,817,444 bytes，所有分包低于 2 MB。
- 微信开发者工具确认 PolyU Computer Science 可加载 83 门课程，首页入口序号为 `01 / 02 / 03 / 04`；模拟器测试结束后已恢复原 Architectural Studies 资料，`plannedUgCourseKeys`、`ugCoursePlanAssignments`、`completedUgCourseKeys` 均为空。
- 微信官方 automation 已完成普通 `POLYU-TPG-090` 闭环：36 门课程、`COMP5521` 加入计划、列表状态、官方分组、标记已修、复制与移除均通过。
- 多 Track `HKU-TPG-031` 验收通过：Generalist 计 1 门，Chinese Language Education 计 2 门；两条记录均保留，旧 Track 课程不计入 Generalist 当前统计。
- PolyU 与 HKU 冷分包均能从临时 loader 返回调用页；iOS/Android 真机未执行。
- 上传过程中测试文件按 `packOptions.ignore` 排除；没有执行“提交审核”或“发布”。

## 尚未完成的内容

### 最具体的数据缺口

- 八校 TPG 已达到 100% source reviewed；没有剩余 `unreviewed` Programme。
- 仍有 111 个 Programme 因官方公开来源缺代码、学分、Track 归属、最终审批或规则冲突而标记 `blocked`。除非出现新的官方证据，不应把它们当作待猜测补全项。
- UG 来源覆盖报告仍有 266 个缺口：124 个 index-only、23 个 reviewed-no-codes、119 个 no-source；运行时轻量目录按来源 Programme 口径显示 265 个待开放项。下一批继续从官方课程手册或部门课程页取证，不从 Programme 简介反推代码或规则。
- 多个已核验 TPG Programme 仍标记 `manual_review_required`，表示课程池可发布，但复杂路径/跨组最低要求不能由当前规则引擎自动证明。

### 发布与验收缺口

- 仓库版本资料和微信已上传代码均为 `1.0.8`；上传不等于已提交审核。
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
2. 1.0.8 包含当前本科与授课硕士课程扩充、本科正式 Major 合并、HKU/HKBU 分包拆分及相关测试。不要把 `.playwright-cli/` 纳入提交。
3. 如继续处理 `blocked` TPG，只在获得新的官方证据时更新对应 supplement；不要根据相似 Programme、旧学年或算术推断补全课程。
4. 每批 TPG 来源变更执行：

```bash
npm run import:tpg-courses
npm run sync:tpg
npm run status:tpg-courses -- --school=HKU
npm run check:ship
git diff --check
```

5. 若继续 `1.0.8` 提审，先完成 iOS/Android 真机矩阵；通过后才提交审核。上传、提交审核和发布是三个独立外部动作，均需用户明确授权。
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

当前课程补充已提交并推送；上传记录文档提交后，工作区仅保留：

```text
?? .playwright-cli/
```

`.playwright-cli/` 仍保持未跟踪；本次没有重置、删除、覆盖或清理该目录。

## 已运行的测试及结果

2026-07-20 在当前课程补充工作区上重新运行：

```text
npm run check:ship: PASS
  check:ug-sync: PASS
  check:tpg-directory-sync: PASS
  check:tpg-course-sync: PASS (245 files, 448 Programmes)
  check:tpg-catalog-sync: PASS (8 schools, 448 Programmes, 8 packages, 336 course structures)
  seed/data validation: PASS
  UG supplement validation: PASS (217 supplements; 204 explicit, 13 copied)
  directory audit: PASS, blockingErrors=[]
  server --check: PASS
  Node tests: PASS, 750/750
  check:release: PASS, ready=true

git diff --check: PASS
npm run status:tpg-courses -- --school=HKU: PASS (448/448 reviewed, 0 unreviewed)
npm run status:ug-sources -- --missing-only --missing-summary --missing-limit 3: PASS (266 Programme-level source gaps: 124 index-only, 23 reviewed-no-codes, 119 no-source; runtime pending 265)
```

发布指标：

- 主包：1,817,444 bytes。
- 总估算包体：16,159,899 bytes，181 个上传文件。
- 所有 19 个 UG/TPG 分包低于 2 MB；HKBU UG 为 `ug-data-hkbu-a` 1,339,364 bytes 与 `ug-data-hkbu-b` 1,373,435 bytes；`ug-data-hku-a` 为 1,168,298 bytes，`ug-data-hku-b` 为 1,009,199 bytes。
- HKU TPG 分包：1,051,628 bytes。
- 页面：17；敏感 API：0。
- release warnings 仅为人工微信后台检查尚需完成，以及未配置生产 HTTPS（体验/正式版按设计离线）。

文档修改后再次运行了 `git diff --check`。微信开发者工具模拟器已完成 PolyU 本科双分包、加入计划、设置/清除排期、复制及移出闭环；iOS/Android 真机未执行。

## 已知问题、风险和不要做的事情

- 微信已上传 `1.0.8`，但不要把上传成功当作已提审或已发布。
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
