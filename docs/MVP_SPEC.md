# MVP 开发说明

## MVP 范围

当前版本只做最小闭环：

1. 选择学校、Programme、Major、Curriculum Year、当前年级
2. 查看课程列表和课程详情
3. 按关键词、课程类型、有无先修要求筛选
4. 收藏课程
5. 标记已修课程
6. 查看基础毕业要求完成度
7. 用本地 API mock 固定接口形状

## 暂不做

- 课程评价和难度评分
- 自动导入 transcript
- AI 解析官网
- 爬虫
- 多学校完整数据覆盖
- 复杂毕业规则引擎

## 数据准确性策略

正式数据进入系统前必须有：

- 官方课程链接
- 官方 Programme / curriculum 链接
- `source_updated_at`
- `last_verified_at`
- 管理员审核记录

小程序端需要展示免责声明：毕业检查仅供参考，以大学官方要求为准。

## 后续技术迁移

当前小程序使用本地 mock 数据，方便原型验证。后续迁移步骤：

1. 将 `miniprogram/utils/courseService.js` 替换为 `wx.request` API client
2. 将 `server/index.js` 升级为 NestJS 模块
3. 将 `data/seed.json` 导入 PostgreSQL
4. 管理后台接入课程、专业和 requirement 维护
