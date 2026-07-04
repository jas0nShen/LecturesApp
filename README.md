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
- `POST /api/graduation-audit`

## 小程序运行

使用微信开发者工具导入 `miniprogram/` 目录即可。

当前小程序会优先请求 `http://localhost:3000`，如果 API 没启动或开发者工具拦截本地请求，会自动回退到本地 mock 数据。

如果想在开发者工具里看到“数据源：本地 API”，需要在微信开发者工具里勾选：

```text
详情 -> 本地设置 -> 不校验合法域名、web-view（业务域名）、TLS 版本以及 HTTPS 证书
```
