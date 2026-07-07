# 香港高校课程选择助手 MVP

这是一个面向香港高校学生的课程规划微信小程序 MVP：

- 微信小程序原生页面
- 授课硕士 Programme 离线资料库
- 本科 Programme / Major 目录预览
- HKU 官方开课示例数据
- 零依赖 Node 本机调试服务
- PostgreSQL 表结构草案
- MVP 产品与开发说明

## 目录

- `miniprogram/`：微信小程序源码
- `data/seed.json`：首批示例数据
- `data/tpg-programmes.json`：授课硕士 Programme 索引
- `miniprogram/utils/ugCatalogue.js`：本科 Programme / Major 离线目录
- `server/index.js`：本机调试服务
- `database/schema.sql`：核心数据库表结构
- `admin/README.md`：后台管理端规划
- `docs/MVP_SPEC.md`：MVP 说明

## 本机调试服务

```bash
npm run dev:api
```

默认地址：`http://localhost:3000`

可用接口：

- `GET /api/universities`
- `GET /api/programmes?university_id=1`
- `GET /api/courses?programme_id=1&major_id=1&keyword=comp`
- `GET /api/courses/:id`
- `GET /api/course-offerings?academic_year=2025-26&term=2&keyword=machine`
- `GET /api/course-offerings/COMP1117`
- `POST /api/graduation-audit`

## 小程序运行

使用微信开发者工具导入 `miniprogram/` 目录即可。

开发版会优先请求 `http://localhost:3000`，如果本机服务没启动或开发者工具拦截本地请求，会自动回退到离线数据。

体验版和正式版在尚未配置生产 HTTPS 服务时直接使用离线数据，不会请求用户设备上的 `localhost`。将来接入生产服务时，在 `miniprogram/utils/apiClient.js` 中为对应环境配置已加入微信合法域名的 HTTPS 地址。

如果想在开发者工具里看到“数据源：开发环境服务”，需要在微信开发者工具里勾选：

```text
详情 -> 本地设置 -> 不校验合法域名、web-view（业务域名）、TLS 版本以及 HTTPS 证书
```

## 数据维护

`data/seed.json` 是 API 和小程序离线数据的唯一维护入口。修改后运行：

```bash
npm run sync:data
npm run check
```

第一条命令会生成 `miniprogram/utils/mockData.js`，第二条命令会检查数据引用、官方链接、学分覆盖以及 API 和离线逻辑。

当前 HKU 课程目录参考 HKU 官方课程说明及 2025–26 Sample Study Plan；毕业检查仅用于规划参考，不能替代学校官网、选课系统或学校正式审核结果。

授课硕士资料来自公开资料 PDF。当前已导入 Programme 索引，部分 Programme 已开放课程组；课程组尚未开放的 Programme 只展示索引与来源，暂不生成毕业判断。修改 `data/tpg-programmes.json` 后运行：

```bash
npm run sync:tpg
npm run check
```

本科资料来自整理后的 Programme / Major JSON，并生成到小程序离线目录。当前本科目录用于选择学校、Programme 与 Major；只有已公开并复核到课程代码的项目会显示课程清单，未开放项目不生成毕业进度。重新生成本科目录可运行：

```bash
npm run sync:ug-catalog
```

如果 JSON 文件不在默认目录，可显式传入：

```bash
npm run sync:ug-catalog -- --source-dir "/path/to/pdf/outputs"
```

如需从原始 PDF 重新生成索引（本机须安装 `pypdf`）：

```bash
python3 scripts/import-tpg-pdfs.py \
  --pdf-dir "/path/to/pdf-directory" \
  --output data/tpg-programmes.json
npm run sync:tpg
```

HKU Computing and Data Science 的学年开课表可通过以下命令从官网重新导入：

```bash
npm run import:hku:cds
npm run import:hku:details
npm run sync:data
```

导入结果保存在 `data/hku-cds-offerings-2025.json`，包括课程代码、班次、学期、学分、先修、共修、互斥条件、简介和官方来源链接。

## 发布前检查

```bash
npm run check:ship
```

`check:ship` 会依次执行功能/数据测试和 release readiness 检查。若需要单独排查，也可以分别运行 `npm run check` 和 `npm run check:release`。

如果只想快速查看当前发布状态摘要，可运行：

```bash
npm run status:release
```

人工发布步骤见 [`docs/RELEASE_CHECKLIST.md`](docs/RELEASE_CHECKLIST.md)。
可直接复制到微信后台的首发说明见 [`docs/REVIEW_SUBMISSION.md`](docs/REVIEW_SUBMISSION.md)。
