# HANDOFF 文档

> 本文件用于新对话继续当前工作，记录截至 2026-06-03 的完整状态。

---

## 已完成功能清单

- [x] Hexo → Astro/Fuwari 框架迁移
- [x] 博客部署到 Vercel，自动 CI/CD（push 即部署）
- [x] 自定义域名配置：`liuhuanblog.top`（阿里云 DNS）
- [x] DNS 配置：A 记录 `@` → `216.198.79.1`，CNAME `www` → `cname.vercel-dns.com`
- [x] Vercel HTTPS 证书自动签发（已生效）
- [x] 修复歌单页面 404（`src/pages/music.astro`）
- [x] 更新 `astro.config.mjs` 的 `site` 字段为 `https://liuhuanblog.top/`
- [x] 更新 `vercel.json` 明确指定构建配置
- [x] 新增文章：Claude Code 使用记录、展信舒颜（2023）、两年后我好像还行（2026）、看小说不如自己写小说、about-me、ReAct 论文笔记
- [x] 插图迁移：从 `C:\05_Study\blog\插图` 压缩处理后放入 `public/cdn/anime/`（anime-01~09）
- [x] 所有文章配封面图（anime 系列），封面图不在文章详情页顶部显示
- [x] 文章顶置功能：frontmatter 加 `sticky: true`，about-me 已顶置
- [x] 关于页（`src/content/spec/about.md`）用 about-me 内容重写
- [x] 修复 PostCard fallback 图池中不存在的图片引用（87749466_p0.jpg → 74793317_p0.jpg）
- [x] 删除旧的面试题文章和失效图片

---

## 当前在做的功能 / 卡在哪一步

**国内访问优化** — 已确定方案，待实施。

**背景：** Vercel 在国内经常无法访问，朋友看不了博客。

**确定方案（方案三）：阿里云 OSS 大陆节点 + GitHub Actions 自动部署**

实施前置条件：
1. **ICP 备案**：用朋友的阿里云服务器「新增网站」，把 `liuhuanblog.top` 挂在朋友服务器的备案下
   - 朋友在阿里云控制台 → ICP 备案 → 新增网站
   - 需要提供：姓名、手机、身份证、域名、网站名称
   - 审核周期：约 1-2 周
2. **备案通过后**：
   - 开通阿里云 OSS（大陆节点，如华南-深圳）
   - Bucket 开启静态网站托管，首页 `index.html`，ACL 公共读
   - 绑定自定义域名 `liuhuanblog.top`
   - 创建 AccessKey，在 GitHub Secrets 中配置
   - 写 GitHub Actions workflow（`.github/workflows/deploy.yml`），push 自动构建上传
   - 阿里云 DNS 把域名 CNAME 指向 OSS 外网地址

**下次对话直接从"备案已通过，开始配 OSS + Actions"继续即可。**

---

## 关键文件路径和职责

```
C:\05_Study\blog\blog-astro\          # 项目根目录（git 仓库根）
├── src/
│   ├── content/
│   │   ├── posts/                    # 博客文章（Markdown）
│   │   └── spec/about.md             # 关于页内容
│   ├── pages/
│   │   ├── posts/[...slug].astro     # 文章详情页（已去掉顶部封面图）
│   │   └── music.astro               # 歌单页面
│   ├── components/
│   │   └── PostCard.astro            # 文章卡片（含 fallback 封面池）
│   └── utils/content-utils.ts        # 文章排序（支持 sticky 顶置）
├── public/
│   ├── cdn/anime/                    # 插图封面（anime-01~09.jpg/avif）
│   ├── cdn/life/                     # 生活照片
│   ├── cdn/note/                     # 笔记配图
│   ├── cdn/code/                     # 代码截图
│   └── img/header_img/               # 首页 banner 轮播图池
├── astro.config.mjs                  # Astro 主配置
├── vercel.json                       # Vercel 构建配置（暂时保留）
└── src/content/config.ts             # 文章 schema（含 sticky 字段）
```

**GitHub 仓库**：`https://github.com/147cai/blog.git`（branch: main）

---

## 已确定的技术决策和约定

| 决策 | 内容 |
|------|------|
| 框架 | Astro + Fuwari 主题，静态输出模式 |
| 部署 | 当前：Vercel；计划迁移：阿里云 OSS + GitHub Actions |
| 包管理 | pnpm（`preinstall` 强制限制） |
| 构建命令 | `pnpm build`（= `astro build && pagefind --site dist`） |
| 域名 | `liuhuanblog.top`，DNS 在阿里云管理 |
| 文章顶置 | frontmatter 加 `sticky: true` |
| 封面图 | 只在列表卡片显示，文章详情页不显示顶部封面 |

---

## 下一步要做的具体任务

1. **等待 ICP 备案通过**（朋友服务器新增网站）
2. **备案通过后配置 OSS + GitHub Actions**：
   - 创建 OSS Bucket（大陆节点，公共读，开静态托管）
   - 绑定域名、创建 AccessKey
   - 在 GitHub Secrets 添加：`OSS_ACCESS_KEY_ID`、`OSS_ACCESS_KEY_SECRET`、`OSS_BUCKET`、`OSS_REGION`
   - 创建 `.github/workflows/deploy.yml`（Claude 帮写）
   - DNS 切换：CNAME 改指 OSS 地址
3. **（可选）私密文章功能**：之前讨论过但未实施，OSS 纯静态方案下客户端密码是唯一可行选项
