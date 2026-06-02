# 刘欢の博客

> 整这么花，你不要命了！

一个基于 [Astro](https://astro.build) 的个人博客，由 Hexo（shoka 主题）迁移而来，在 [Fuwari](https://github.com/saicaca/fuwari) 主题基础上做了大量样式与功能定制，整体观感向原 shoka 主题靠拢。

## ✨ 特性

- ⚡️ 基于 Astro + Tailwind CSS，静态生成，加载快
- 🎞️ 首页/各页**全屏头图**：多图轮播 + 缓慢放大（Ken Burns）+ 动态波浪分隔 + 透明导航栏
- 🪟 头图上的玻璃质感标题文字（可在配置里编辑）
- 🎵 仿 shoka 的**黑胶唱片音乐播放器**（多歌单 Tab 切换，数据来自网易云/QQ音乐）
- 🌗 亮 / 暗模式，主题色可调
- 🔍 全文搜索（Pagefind）
- 📑 文章目录、RSS、归档、标签 / 分类
- 🖼️ 文章卡片在未设封面时自动从图库回退封面图（杂志卡片风格）

## 🧱 技术栈

| 用途 | 技术 |
| --- | --- |
| 框架 | [Astro](https://astro.build) 5 |
| 样式 | [Tailwind CSS](https://tailwindcss.com) 3 + Stylus |
| 交互组件 | [Svelte](https://svelte.dev) 5（搜索、音乐播放器等局部岛屿） |
| 搜索 | [Pagefind](https://pagefind.app/) |
| 内容 | Markdown（Astro Content Collections） |
| 包管理 | [pnpm](https://pnpm.io) 9 |
| 音乐数据 | Meting API（`https://api.injahow.cn/meting/`） |

## 📂 目录结构

```
blog-astro/
├── public/                  # 静态资源（直接按 / 路径引用）
│   ├── img/header_img/       # 头图轮播 & 文章封面图库
│   ├── cdn/                  # 文章正文里用到的图片（life / note）
│   ├── music/                # 黑胶播放器素材（唱片、唱针）
│   └── favicon/              # 网站图标
├── src/
│   ├── assets/images/        # 头像等需被构建处理的图片
│   ├── components/           # 组件
│   │   ├── MusicPlayer.svelte # 黑胶音乐播放器
│   │   ├── PostCard.astro     # 文章卡片（含封面回退逻辑）
│   │   ├── Navbar.astro       # 导航栏
│   │   └── widget/ control/ misc/
│   ├── content/
│   │   ├── posts/             # 所有文章（.md）
│   │   └── spec/about.md      # 关于页内容
│   ├── layouts/
│   │   ├── Layout.astro        # 全局布局（含头图/导航/主题脚本）
│   │   └── MainGridLayout.astro# 主网格布局（头图轮播 + 波浪 + 标题）
│   ├── pages/                 # 路由页面
│   │   ├── archive.astro       # 归档
│   │   ├── about.astro         # 关于
│   │   ├── music.astro         # 歌单
│   │   └── posts/[...slug].astro
│   ├── styles/                # 全局样式（含 variables.styl 主题变量）
│   ├── plugins/               # remark / rehype Markdown 扩展
│   ├── i18n/  constants/  types/  utils/
│   └── config.ts              # 🔧 站点主配置（标题/头图/导航/头像/banner文字）
├── scripts/
│   ├── new-post.js            # 新建文章脚本
│   └── gen-favicon.mjs        # 用头像生成 favicon
├── astro.config.mjs           # Astro 配置（含 site 域名）
├── 使用指南.md                 # 本地启动 / 写文章 / 部署的详细中文教程
└── package.json
```

## 🚀 快速开始

```bash
pnpm install   # 安装依赖
pnpm dev       # 本地开发（默认 http://localhost:4321）
pnpm build     # 构建生产版本到 dist/
pnpm preview   # 预览构建产物
pnpm new-post 文章名   # 新建一篇文章
```

> 📖 更详细的本地启动、写文章、改配置、部署步骤见 [使用指南.md](./使用指南.md)。

## 🔧 常用自定义入口

- 站点标题 / 副标题 / 主题色 / 导航 / 头像 / 头图轮播 / 头图标题文字 → `src/config.ts`
- 关于页内容 → `src/content/spec/about.md`
- 歌单 → `src/pages/music.astro` 顶部的 `playlists`
- 部署域名 → `astro.config.mjs` 的 `site`

## 👥 Contributors

| | 贡献者 | 角色 |
|---|---|---|
| <img src="https://github.com/147cai.png" width="40" style="border-radius:50%"> | **[147cai](https://github.com/147cai)** | 博主、内容创作、需求设计 |
| <img src="https://avatars.githubusercontent.com/u/189039031" width="40" style="border-radius:50%"> | **[Claude](https://claude.ai)** | AI 结对编程、功能开发、样式定制 |

## 📄 License

文章内容采用 [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/)。
主题基于 [Fuwari](https://github.com/saicaca/fuwari)（MIT）二次开发。
