# MVP 开发说明

## 0.1.0 首发范围

当前版本目标是尽快上线一个可用、边界清晰的授课硕士课程规划助手，并提供本科 Programme / Major 目录预览：

1. 支持已整理学校的授课硕士 Programme 索引，并保留后续扩展更多学校的空间；
2. 用户可选择学校、搜索 Programme，并保存为“我的 Programme”；
3. 已开放课程组的 Programme 可查看必修、选修或项目课程结构；
4. 课程组尚未开放的 Programme 只展示索引、学分、学院和资料来源，不生成毕业判断；
5. 首页、课程页、毕业检查页和我的页均展示当前 Programme 状态与下一步提示；
6. 提供 HKU 官方开课示例数据、收藏、已修标记、Study Plan、课程笔记和本机备份；
7. 接入本科 Programme / Major 索引，未复核课程规则前不生成本科毕业进度；
8. 提供数据状态、数据来源、数据与隐私说明，便于用户和微信审核理解数据边界；
9. 体验版和正式版使用随包离线数据，不依赖开发环境服务。

## 暂不做

- 微信登录、学校账号登录或 transcript 自动导入；
- 云端同步、用户体系、支付、广告或第三方统计 SDK；
- 自动爬虫或 AI 自动解析官网；
- 所有 Programme 的完整毕业规则自动判断；
- 课程评价、难度评分和社交功能；
- 生产 HTTPS API 与后台管理端。

## 数据准确性策略

当前版本采用“可追溯、分层开放”的数据策略：

- Programme 索引来自公开资料 PDF；
- 本科 Programme / Major 目录来自本地整理 JSON，课程代码和毕业规则分层开放；
- 已开放课程组才展示课程结构；
- 课程组尚未开放的 Programme 只展示索引与来源；
- HKU 官方开课示例保留课程来源、抓取日期和详情链接；
- 毕业检查与课程规划仅供学习规划参考，不替代学校官网、选课系统或学校正式审核结果；
- 小程序内必须保留数据状态、数据来源、隐私说明和本机数据管理入口。

## 发布前标准

每次上传前必须通过：

```bash
npm run check
npm run check:release
```

`check:release` 需要保持：

- `ready: true`；
- 已整理 TPG 学校数量与 Programme 数量符合当前数据快照；
- 348 个 TPG Programme；
- UG 目录至少包含 8 所学校、390 个 Programme 和 600 个 Major / Track；
- 0 个敏感 API；
- `releaseInfo.version` 与 `package.json` 版本一致；
- 微信项目描述与授课硕士课程规划定位一致。

## 上线后优先路线

1. 稳定可发布版本：持续通过 `npm run check:ship`，保留本地存储和离线数据边界；
2. 用 `npm run status:ug-sources` 定位本科 Programme 缺口，优先补资料可追溯和用户高频 Programme；
3. 每批新增课程都通过 supplement JSON、重新生成 UG catalogue，并补充课程数量和关键课程码测试；
4. 将 Study Plan 作为下一阶段核心功能，从课程清单推进到 Year / Semester 规划、收藏、已修和备注；
5. 增强数据反馈入口和数据覆盖页，方便收集用户反馈与定位缺失课程；
6. 云同步、生产 HTTPS API、复杂毕业规则引擎和 transcript 自动导入放到更后续阶段。

详细路线见 [`ROADMAP.md`](ROADMAP.md)。
