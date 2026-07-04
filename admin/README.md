# 后台管理端 MVP 规划

MVP 可以先用轻量 Web Admin 或低代码工具维护数据。核心页面：

1. 学校管理
2. Faculty 管理
3. Programme 管理
4. Major 管理
5. 课程管理
6. 毕业要求管理
7. CSV / Excel 导入
8. 数据核验记录

## 课程管理字段

- Course Code
- Course Title
- Credits
- Course Type
- Department
- Prerequisites
- Exclusions
- Semester
- Language
- Description
- Official URL
- Source Updated At
- Last Verified At

## 权限

- Super Admin：所有权限
- Data Admin：维护指定学校数据
- Reviewer：审核导入数据和用户反馈

## 审核原则

爬虫或 AI 产生的数据只能进入草稿状态，必须由管理员核验官方来源后才能发布。
