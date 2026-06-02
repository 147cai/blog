import type {
	ExpressiveCodeConfig,
	LicenseConfig,
	NavBarConfig,
	ProfileConfig,
	SiteConfig,
} from "./types/config";
import { LinkPreset } from "./types/config";

export const siteConfig: SiteConfig = {
	title: "刘欢の博客",
	subtitle: "整这么花，你不要命了！",
	lang: "zh_CN", // Language code, e.g. 'en', 'zh_CN', 'ja', etc.
	themeColor: {
		hue: 351, // 匹配旧 shoka 主题主色 #e9546b（粉红，色相约 351）。范围 0-360
		fixed: false, // Hide the theme color picker for visitors
	},
	banner: {
		enable: true,
		src: "/img/header_img/96707717_p0.jpg", // 全屏头图：粉色樱花动漫图（以 / 开头表示相对 /public 目录）
		position: "center", // Equivalent to object-position, only supports 'top', 'center', 'bottom'. 'center' by default
		credit: {
			enable: false, // Display the credit text of the banner image
			text: "", // Credit text to be displayed
			url: "", // (Optional) URL link to the original artwork or artist's page
		},
	},
	toc: {
		enable: true, // Display the table of contents on the right side of the post
		depth: 2, // Maximum heading depth to show in the table, from 1 to 3
	},
	favicon: [
		// 自定义 favicon（由 src/assets/images/avatar.jpg 通过 scripts/gen-favicon.mjs 生成）
		// 白底图标，亮/暗模式通用，因此不区分 theme
		{ src: "/favicon/favicon-avatar-32.png", sizes: "32x32" },
		{ src: "/favicon/favicon-avatar-128.png", sizes: "128x128" },
		{ src: "/favicon/favicon-avatar-180.png", sizes: "180x180" },
		{ src: "/favicon/favicon-avatar-192.png", sizes: "192x192" },
	],
};

// 首页头图轮播列表（仿旧 shoka 主题的多图切换 + 缓慢放大效果）。
// 留空数组则只用上面 banner.src 的单张图。图片放在 public/ 下，用 / 开头引用。
export const bannerImages: string[] = [
	"/img/header_img/96707717_p0.jpg",
	"/img/header_img/95694792_p0.jpg",
	"/img/header_img/90040507_p0.jpg",
	"/img/header_img/91988144_p0.jpg",
	"/img/header_img/95916021_p0.jpg",
	"/img/header_img/93604793_p0.jpg",
];

// 首页/各页头图上的居中标题文字（仿 shoka）。在这里改文字即可，无需动样式。
export const bannerText = {
	enable: true, // 是否在头图上显示标题文字
	titleEn: "liuhuan", // 第一行：英文名（衬线字体）
	title: "刘欢の博客", // 第二行：主标题
	subtitle: "整这么花，你不要命了！", // 第三行：副标题（会自动加上两侧的 = =）
};

export const navBarConfig: NavBarConfig = {
	links: [
		LinkPreset.Home,
		LinkPreset.Archive,
		LinkPreset.About,
		{
			name: "歌单",
			url: "/music/", // 自定义页面，对应 src/pages/music.astro
		},
		{
			name: "GitHub",
			url: "https://github.com/147cai", // Internal links should not include the base path, as it is automatically added
			external: true, // Show an external link icon and will open in a new tab
		},
	],
};

export const profileConfig: ProfileConfig = {
	avatar: "assets/images/avatar.jpg", // Relative to the /src directory. Relative to the /public directory if it starts with '/'
	name: "liuhuan",
	bio: "东偶已逝 桑榆非晚",
	links: [
		{
			name: "GitHub",
			icon: "fa6-brands:github",
			url: "https://github.com/147cai",
		},
		{
			name: "Email",
			icon: "fa6-regular:envelope",
			url: "mailto:3244735816@qq.com",
		},
	],
};

export const licenseConfig: LicenseConfig = {
	enable: true,
	name: "CC BY-NC-SA 4.0",
	url: "https://creativecommons.org/licenses/by-nc-sa/4.0/",
};

export const expressiveCodeConfig: ExpressiveCodeConfig = {
	// Note: Some styles (such as background color) are being overridden, see the astro.config.mjs file.
	// Please select a dark theme, as this blog theme currently only supports dark background color
	theme: "github-dark",
};
