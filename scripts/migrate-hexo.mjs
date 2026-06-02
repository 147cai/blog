// 一次性迁移脚本：将旧 Hexo(Shoka) 文章转换为 Fuwari 格式
// 元数据采用人工核对后的映射，避免旧 frontmatter 中的脏数据（中文逗号、拼写错误、非标准日期）
import fs from "node:fs";
import path from "node:path";

const SRC = "C:/05_Study/blog/liuhuan-blog/source/_posts";
const DEST = "C:/05_Study/blog/blog-astro/src/content/posts";

const posts = [
	{
		file: "coding-train/hot-100/day1.md",
		slug: "jianzhi-offer-day1",
		title: "剑指 offer day1 栈与队列（简单）",
		published: "2022-03-30",
		description: "知识点：栈、队列、设计，难度为简单",
		image: "/img/header_img/polygon-pony-wallpaper-for-1920x1080-63-1175.jpg",
		tags: ["leetcode", "栈", "队列", "设计"],
		category: "题目记录",
	},
	{
		file: "life/2023-university.md",
		slug: "letter-to-myself-2024",
		title: "2024，写给自己的一篇文章",
		published: "2022-04-22",
		description: "凡为过往，皆为序章",
		image: "/img/header_img/90040507_p0.jpg",
		tags: ["总结"],
		category: "随笔",
	},
	{
		file: "note/Interview questions/HTML+CSS.md",
		slug: "interview-html-css",
		title: "HTML + CSS 面试题",
		published: "2023-02-10",
		description: "记录 HTML 和 CSS 的问题",
		image: "",
		tags: ["HTML", "CSS"],
		category: "笔记",
	},
	{
		file: "note/Interview questions/JavaScript.md",
		slug: "interview-javascript",
		title: "JavaScript 面试题",
		published: "2023-02-10",
		description: "记录 JavaScript 问题",
		image: "",
		tags: ["JavaScript"],
		category: "笔记",
	},
	{
		file: "note/Interview questions/Vue.md",
		slug: "interview-vue",
		title: "Vue 面试题",
		published: "2023-02-10",
		description: "记录 Vue 的一些记录",
		image: "",
		tags: ["Vue", "vite"],
		category: "笔记",
	},
	{
		file: "note/Interview questions/浏览器性能优化.md",
		slug: "interview-browser-performance",
		title: "浏览器性能优化",
		published: "2023-02-10",
		description: "记录浏览器性能优化相关问题",
		image: "",
		tags: ["性能优化"],
		category: "笔记",
	},
	{
		file: "note/Interview questions/计算机网络.md",
		slug: "interview-network",
		title: "计算机网络面试题",
		published: "2023-02-10",
		description: "记录在面试中遇到的计算机网络的问题",
		image: "",
		tags: ["http", "计算机网络"],
		category: "笔记",
	},
	{
		file: "note/tool/git常用命令.md",
		slug: "git-commands",
		title: "git 常用命令",
		published: "2023-06-16",
		description: "git 常用命令速查",
		image: "",
		tags: ["git", "tool"],
		category: "笔记",
	},
	{
		file: "note/tool/mysql常用命令.md",
		slug: "mysql-commands",
		title: "mysql 常用命令",
		published: "2023-06-16",
		description: "mysql 常用命令速查",
		image: "",
		tags: ["mysql", "tool"],
		category: "笔记",
	},
	{
		file: "note/tool/node版本问题.md",
		slug: "node-version-issues",
		title: "node 版本问题",
		published: "2023-06-16",
		description: "node 版本管理相关问题",
		image: "",
		tags: ["node", "tool"],
		category: "笔记",
	},
	{
		file: "note/vue/vue3+ts中遇到的问题.md",
		slug: "vue3-ts-issues",
		title: "vue3 + ts 中遇到的问题",
		published: "2023-06-16",
		description: "记录 vue3 + typescript 开发中的疑难杂症",
		image: "",
		tags: ["vue", "typescript", "疑难杂症"],
		category: "笔记",
	},
];

// 去掉原文件的 frontmatter，仅保留正文
function bodyOf(content) {
	const m = content.match(/^﻿?---[\s\S]*?\n---[ \t]*\r?\n?/);
	return m ? content.slice(m[0].length) : content;
}

function yamlStr(s) {
	return JSON.stringify(s); // 用 JSON 引号确保中文 / 特殊字符安全
}

if (!fs.existsSync(DEST)) fs.mkdirSync(DEST, { recursive: true });

for (const p of posts) {
	const raw = fs.readFileSync(path.join(SRC, p.file), "utf8");
	const body = bodyOf(raw).replace(/^\s+/, "");

	const fm = [
		"---",
		`title: ${yamlStr(p.title)}`,
		`published: ${p.published}`,
		`description: ${yamlStr(p.description)}`,
		`image: ${yamlStr(p.image)}`,
		`tags: [${p.tags.map(yamlStr).join(", ")}]`,
		`category: ${yamlStr(p.category)}`,
		"draft: false",
		"---",
		"",
		"",
	].join("\n");

	fs.writeFileSync(path.join(DEST, `${p.slug}.md`), fm + body, "utf8");
	console.log("✓ wrote", `${p.slug}.md`);
}

console.log(`\nDone. ${posts.length} posts migrated.`);
