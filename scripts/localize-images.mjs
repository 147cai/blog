// 把正文中引用的 jsDelivr CDN 图片（147cai/blog-cdn）下载到本地 public/cdn/
// 并改写正文链接为本地路径。处理扩展名(.png/.jpg)与目录(life/note)不一致的情况。
import fs from "node:fs";
import path from "node:path";

const CDN_SRC = "C:/05_Study/blog/Blog-CDN";
const POSTS = "C:/05_Study/blog/blog-astro/src/content/posts";
const PUBLIC_CDN = "C:/05_Study/blog/blog-astro/public/cdn";

// 在 Blog-CDN 中按 basename 解析真实文件（忽略扩展名/目录差异）
function resolveLocal(refPath) {
	const direct = path.join(CDN_SRC, refPath);
	if (fs.existsSync(direct)) return direct;

	const base = path.basename(refPath, path.extname(refPath));
	// 在整个 CDN 仓库里找同名文件
	const dirs = ["life", "note", "img", "."];
	for (const d of dirs) {
		const dir = path.join(CDN_SRC, d);
		if (!fs.existsSync(dir)) continue;
		const hit = fs
			.readdirSync(dir)
			.find((f) => path.basename(f, path.extname(f)) === base);
		if (hit) return path.join(dir, hit);
	}
	return null;
}

const cdnRe = /https?:\/\/cdn\.jsdelivr\.net\/gh\/147cai\/[Bb]log-[Cc][Dd][Nn]\/([^)"'\s]+)/g;

let copied = 0;
let rewritten = 0;
const missing = [];

for (const file of fs.readdirSync(POSTS).filter((f) => f.endsWith(".md"))) {
	const fp = path.join(POSTS, file);
	let content = fs.readFileSync(fp, "utf8");
	let changed = false;

	content = content.replace(cdnRe, (full, refPath) => {
		const local = resolveLocal(refPath);
		if (!local) {
			missing.push(`${file}: ${refPath}`);
			return full; // 找不到则保留原链接
		}
		// 目标路径：保留引用目录，但用真实扩展名
		const refDir = path.dirname(refPath);
		const realName = path.basename(local);
		const destRel = path.posix.join(refDir, realName);
		const dest = path.join(PUBLIC_CDN, destRel);
		fs.mkdirSync(path.dirname(dest), { recursive: true });
		if (!fs.existsSync(dest)) {
			fs.copyFileSync(local, dest);
			copied++;
		}
		changed = true;
		rewritten++;
		return `/cdn/${destRel}`;
	});

	if (changed) {
		fs.writeFileSync(fp, content, "utf8");
		console.log("✓ 改写", file);
	}
}

console.log(`\n复制图片 ${copied} 张，改写链接 ${rewritten} 处。`);
if (missing.length) {
	console.log("未找到：");
	for (const m of missing) console.log("  -", m);
}
