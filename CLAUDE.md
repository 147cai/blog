# 项目说明

个人博客，基于 Astro + Fuwari 主题，从 Hexo 迁移而来。

## 技术栈

- 框架：Astro 5（静态输出模式）
- 主题：Fuwari
- 组件：Svelte
- 样式：Tailwind CSS
- 包管理：pnpm（强制，不能用 npm / yarn）
- 构建：`pnpm build` = `astro build && pagefind --site dist`
- 部署：Vercel，push main 分支自动触发

## 项目结构

```
src/
  content/posts/     # 博客文章，Markdown 格式
  pages/             # 页面文件，music.astro 是歌单页
  components/        # 组件，MusicPlayer.svelte 是音乐播放器
public/
  music/             # 播放器静态资源
astro.config.mjs     # 主配置，site 为 https://liuhuanblog.top/
vercel.json          # Vercel 构建配置
```

## 文章格式

新建文章放在 `src/content/posts/`，frontmatter 格式：

```yaml
---
title: "文章标题"
published: 2026-06-02
description: "一句话描述"
image: ""
tags: ["tag1", "tag2"]
category: "笔记"
draft: false
---
```

## 约定

- 回答一律用中文
- 代码里不写注释，除非逻辑非常不直观
- 不要主动推送到 GitHub，除非用户明确说"推送"或"push"
- 新增文章不要自动 commit，写完告诉用户确认后再提交
- 域名：liuhuanblog.top，DNS 在阿里云管理
- GitHub 仓库：https://github.com/147cai/blog.git（branch: main）
