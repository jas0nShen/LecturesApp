# 香港大学生课程选择助手 MVP

这是一个先跑通核心闭环的 MVP 骨架：

- 微信小程序原生页面
- 本地 mock 课程数据
- 零依赖 Node API mock server
- PostgreSQL 表结构草案
- MVP 产品与开发说明

## 目录

- `miniprogram/`：微信小程序源码
- `data/seed.json`：首批示例数据
- `server/index.js`：本地 API mock server
- `database/schema.sql`：核心数据库表结构
- `admin/README.md`：后台管理端规划
- `docs/MVP_SPEC.md`：MVP 说明

## 本地 API

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

当前小程序会优先请求 `http://localhost:3000`，如果 API 没启动或开发者工具拦截本地请求，会自动回退到本地 mock 数据。

如果想在开发者工具里看到“数据源：本地 API”，需要在微信开发者工具里勾选：

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

当前课程目录参考 HKU 官方课程说明及 2025–26 Sample Study Plan；毕业检查规则仍是用于验证产品流程的简化示例，不能替代学校官方 Degree Audit。

HKU Computing and Data Science 的学年开课表可通过以下命令从官网重新导入：

```bash
npm run import:hku:cds
npm run import:hku:details
npm run sync:data
```

导入结果保存在 `data/hku-cds-offerings-2025.json`，包括课程代码、班次、学期、学分、先修、共修、互斥条件、简介和官方来源链接。
