# 知识库笔记

基于 uni-app (Vue 3) + uniCloud (阿里云) 的个人笔记应用，使用 HBuilderX 开发。单用户使用，无需登录认证。

## 功能特性

- **富文本编辑** — 基于 uni-app 原生 `<editor>` 组件，支持图文混排
- **分类管理** — 自定义分类及颜色标识，快速筛选笔记
- **版本历史** — 每次编辑自动创建版本快照，支持查看与回滚
- **公开分享** — 生成分享码链接，支持只读/可编辑模式及过期时间
- **文件存储** — 图片等附件上传至 uniCloud 云存储
- **搜索与分页** — 笔记列表支持关键词搜索、分类筛选、下拉刷新

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | Vue 3 (Composition API via `createSSRApp`) |
| 框架 | uni-app 3.x |
| 云端 | uniCloud Cloud Object (阿里云) |
| 富文本 | uni-app 原生 `<editor>` 组件 |
| 存储 | uniCloud 云存储 |

## 目录结构

```
├── App.vue                    # 根组件
├── main.js                    # 入口，Vue 3 createSSRApp
├── pages.json                 # 路由配置 + tabBar 定义
├── manifest.json              # 应用配置（appid、模块权限等）
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

## 快速开始

### 环境要求

- **IDE**: HBuilderX 3.7.0+
- **云端**: uniCloud 阿里云环境

### 运行

1. 用 HBuilderX 打开项目目录
2. **运行 H5**: HBuilderX -> 运行 -> 运行到浏览器
3. **运行小程序**: HBuilderX -> 运行 -> 运行到微信开发者工具
4. **运行 App**: HBuilderX -> 运行 -> 运行到手机或模拟器

### 云端部署

1. 在 uniCloud 控制台创建阿里云服务空间
2. 右键 `uniCloud-aliyun` 目录 -> 关联云服务空间
3. 创建以下数据库集合：
   - `note` — 笔记主表
   - `note_version` — 版本历史
   - `note_category` — 分类
   - `note_share` — 分享记录
4. 右键 `uniCloud-aliyun/cloudfunctions/` 下的云函数 -> 上传部署

## 架构设计

### 云对象通信

前端通过 `uniCloud.importObject('note-co')` 调用云端方法。单用户模式，云对象 `_before` 钩子为空，无需 token 校验。

### 笔记状态流转

`status=0` 草稿 → `status=1` 已发布 → `status=2` 已删除（软删除）

### 版本快照

每次创建/更新笔记时，在 `note_version` 表创建快照记录（包含 title_snapshot、content_snapshot、version_number、change_type、diff_summary）。回滚时用快照内容覆盖当前笔记。

### 分享机制

通过 `note_share` 表的 share_code 生成公开链接（8位随机码），支持 read_only / editable 模式，可设置过期时间。

## 数据库集合

| 集合 | 说明 |
|------|------|
| `note` | 笔记主表（title、content、category_id、tags、status 等） |
| `note_version` | 版本历史（note_id、version_number、title_snapshot、content_snapshot、change_type） |
| `note_category` | 分类（name、color、sort_order） |
| `note_share` | 分享记录（note_id、share_code、mode、expire_time） |

## 仓库分支与 HBuilder 版本对应关系

| 分支 | 对应 HBuilder 版本 |
|------|-------------------|
| main | [正式版](https://www.dcloud.io/hbuilderx.html) |
| alpha | [Alpha 版](https://www.dcloud.io/hbuilderx.html) |
| dev | [内部 dev 版](https://www.dcloud.io/hbuilderx.html) |

## License

[MIT](LICENSE)
