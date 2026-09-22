---
title: "Claude Code 使用记录"
published: 2026-04-02
description: "记录我学习和使用 Claude Code 的过程，包括安装、常用命令、快捷键和一些实用技巧"
image: "/cdn/anime/anime-02.jpg"
tags: ["AI", "tool", "claude"]
category: "笔记"
draft: false
---

这篇文章记录了我学习 Claude Code 的过程，主要是一些命令和快捷键的备忘，以及实际使用中总结的小技巧。

## 安装

**Windows：**

```bash
npm install -g @anthropic-ai/claude-code
```

**Linux：**

```bash
curl -fsSL https://claude.ai/install.sh | bash
```

安装完成后直接在终端输入 `claude` 就可以启动了。

---

## 三种工作模式

启动后按 `Shift + Tab` 可以在三种模式之间切换：

| 模式 | 说明 |
|------|------|
| **默认模式** | 正常对话和编码 |
| **自动模式** | Claude 自动判断并执行，减少确认步骤 |
| **思考讨论模式** | Claude 会先规划再执行，适合复杂任务 |

---

## 常用快捷键

| 快捷键 | 作用 |
|--------|------|
| `Shift + Tab` | 切换工作模式 |
| `Shift + Enter` | 换行（不发送） |
| `Esc Esc`（按两次） | 创建 Checkpoint，随时可回滚到这个状态 |
| `Ctrl + O` | 退出当前会话 |
| `!` + 命令 | 切换到终端执行，如 `!start index.html` |

---

## 常用斜杠命令

```bash
/resume      # 查看并恢复之前的对话记录
/clear       # 清空对话上下文，但保留已做的代码改动
/compact     # 压缩对话历史，节省 token
             # 也可以指定重点，如 /compact 重点保留数据库部分
/init        # 在项目根目录生成 CLAUDE.md，让 Claude 每次都了解这个项目
/memory      # 查看当前生效的记忆，分为项目级和用户级两种
/rewind      # 回滚到上一个 Checkpoint
/hock        # 配置 Hook，在文件保存前后自动执行操作，比如格式化代码
/plugin      # 访问 Claude 的插件市场
```

---

## 写入 .claude 文件

在对话里用 `#` 开头的内容会被写入 `.claude` 文件，作为持久化指令。比如：

```
# 以后回答我都用中文
# 代码里不要写注释
```

这样新开对话也会遵守这些规则，不用每次重复说。

`/init` 命令可以让 Claude 自动分析项目并生成 `CLAUDE.md`，把项目的背景、约定和要求都记下来。

---

## 权限控制

默认情况下 Claude 执行某些操作会弹出确认提示。如果觉得太频繁可以：

```bash
# 启动时赋予所有权限，直接执行不询问（谨慎使用）
claude --dangerously-skip-permissions
```

也有更细粒度的权限模式：

```bash
claude --permission-mode acceptEdits   # 自动接受所有文件编辑
claude --permission-mode plan          # 只规划不执行
claude --permission-mode auto          # 自动模式，有后台安全分类器
```

---

## 切换模型

```bash
claude --model sonnet   # 使用 Sonnet（速度与能力均衡）
claude --model opus     # 使用 Opus（最强，但较慢）
```

---

## 接入 MCP Server

MCP 是 Claude 连接外部工具的协议，可以接入 Figma、数据库、浏览器等。以 Figma 为例，安装对应的 MCP Server 后，Claude 就可以直接读取 Figma 设计图来写代码，省去了截图描述的步骤。

目前我主要用的是内置的文件、搜索等 MCP，后续打算接入更多工具。

---

## 管道与非交互模式

除了交互模式，Claude Code 也支持在脚本里直接用：

```bash
# Print 模式，直接输出结果不开启对话
claude -p "帮我解释这段代码"

# 管道输入
cat error.log | claude -p "分析这个报错原因"

# 限制对话轮次，避免无限循环
claude --max-turns 3 "帮我修复这个 bug"
```

---

## 学习路线参考

整体来说 Claude Code 的学习可以分三个阶段：

1. **基础**（3小时）：安装、基本对话、Slash 命令、Memory、Checkpoint 回滚
2. **进阶**（5小时）：Skills、Hooks 自动化、MCP 集成、Subagents 任务委派
3. **高级**（5小时）：Planning 模式、插件开发、CI/CD 集成、Extended Thinking

claude code详细学习教程：

https://github.com/luongnv89/claude-howto/blob/main/zh/LEARNING-ROADMAP.md

---

## 一些体会

用下来感觉最有价值的功能是 `Checkpoint + /rewind`，做实验性改动之前先打个 Checkpoint，搞砸了直接回滚，心理负担小很多。

`/init` 生成的 `CLAUDE.md` 也很实用，把项目背景、技术栈、约定写进去之后，新开对话不用再反复介绍项目，Claude 一上来就知道在做什么。

后续打算深入研究 Hooks，实现文件保存后自动格式化，以及 MCP 接入更多外部工具。
