# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

基于 uni-app (Vue 3) + uniCloud (阿里云) 的个人笔记应用，使用 HBuilderX 开发。单用户使用，无需登录认证。核心功能：富文本编辑、分类管理、版本历史、公开分享、文件存储。

## 开发环境

- **IDE**: HBuilderX 3.7.0+
- **框架**: uni-app (Vue 3)
- **云端**: uniCloud 阿里云
- **目标平台**: H5 (Chrome/Safari)、微信小程序、App (iOS/Android)

### 运行与构建

在 HBuilderX 中操作（项目无 CLI 构建流程）：
- **运行 H5**: HBuilderX -> 运行 -> 运行到浏览器
- **运行小程序**: HBuilderX -> 运行 -> 运行到微信开发者工具
- **上传云函数**: 右键 `uniCloud-aliyun/cloudfunctions/` 下的云函数 -> 上传部署
- **运行测试**: 无自动化测试框架，通过 HBuilderX 内建预览手动验证

## 架构

### 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | Vue 3 (Composition API via `createSSRApp`) |
| 云端 | uniCloud Cloud Object (阿里云) |
| 富文本 | uni-app 原生 `<editor>` 组件 |
| 存储 | uniCloud 云存储 |

### 目录结构

```
├── App.vue                    # 根组件
├── main.js                    # 入口，Vue 3 createSSRApp
├── pages.json                 # 路由配置 + tabBar 定义
├── manifest.json              # 应用配置（appid、模块权限、H5 路由 history 模式）
├── common/
│   └── note-api.js            # 统一 API 封装，通过 importObject 调用云对象
├── components/
│   └── note-editor/           # 富文本编辑器组件（工具栏 + <editor> + 自动保存）
├── pages/
│   ├── note/
│   │   ├── list.vue           # 笔记列表（搜索/筛选/分页/下拉刷新）
│   │   ├── edit.vue           # 笔记编辑（标题/分类/标签 + 自动保存）
│   │   ├── detail.vue         # 笔记详情（rich-text 渲染）
│   │   ├── category.vue       # 分类管理（CRUD + 颜色选择）
│   │   ├── version.vue        # 版本历史
│   │   └── share.vue          # 分享管理
│   └── share/
│       └── view.vue           # 公开分享页（通过分享码访问，无需登录）
├── uniCloud-aliyun/
│   └── cloudfunctions/
│       ├── note-co/           # 笔记云对象（CRUD、版本、分享、分类）
│       └── storage-co/        # 存储云对象（上传、临时链接、删除）
└── uni_modules/               # uni_modules 插件（uni-popup 等）
```

### 核心设计模式

**云对象通信**: 前端通过 `uniCloud.importObject('note-co')` 调用云端方法。单用户模式，云对象 `_before` 钩子为空，无需 token 校验。

**笔记状态流转**: `status=0` 草稿 → `status=1` 已发布 → `status=2` 已删除（软删除）。

**版本快照**: 每次创建/更新笔记时，在 `note_version` 表创建快照记录（包含 title_snapshot、content_snapshot、version_number、change_type、diff_summary）。回滚时用快照内容覆盖当前笔记。

**分享机制**: 通过 `note_share` 表的 share_code 生成公开链接（8位随机码），支持 read_only / editable 模式，可设置过期时间。

**数据库集合** (需自行在 uniCloud 创建):
- `note` — 笔记主表
- `note_version` — 版本历史
- `note_category` — 分类
- `note_share` — 分享记录

### 关键文件

- [common/note-api.js](common/note-api.js) — 前端所有云对象调用的入口，新增接口需在此添加对应方法
- [uniCloud-aliyun/cloudfunctions/note-co/index.obj.js](uniCloud-aliyun/cloudfunctions/note-co/index.obj.js) — 笔记核心业务逻辑
- [components/note-editor/note-editor.vue](components/note-editor/note-editor.vue) — 富文本编辑器组件
- [pages.json](pages.json) — 路由与导航配置
- [manifest.json](manifest.json) — 应用全局配置（appid: `__UNI__4D7F218`）
