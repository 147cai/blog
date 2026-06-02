<script>
import { onDestroy, onMount } from "svelte";

export let playlists = [];
const META_API = "https://api.injahow.cn/meting/";

let audio; // <audio> 元素
let tabIndex = 0;
let tracks = [];
let cache = {};
let index = 0;
let playing = false;
let curTime = 0;
let duration = 0;
let volume = 0.7;
let muted = false;
let mode = "order"; // order | random | loop
let loading = false;
let lrcLines = [];
let curLrc = "";

const icons = {
	play: "M8 5v14l11-7z",
	pause: "M6 19h4V5H6v14zm8-14v14h4V5h-4z",
	prev: "M6 6h2v12H6zm3.5 6l8.5 6V6z",
	next: "M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z",
	volume:
		"M3 9v6h4l5 5V4L7 9H3zm13.5 3A4.5 4.5 0 0 0 14 7.97v8.05A4.5 4.5 0 0 0 16.5 12zM14 3.23v2.06a7 7 0 0 1 0 13.42v2.06a9 9 0 0 0 0-17.54z",
	mute: "M16.5 12A4.5 4.5 0 0 0 14 7.97v2.21l2.45 2.45A5 5 0 0 0 16.5 12zM19 12a7 7 0 0 1-1.05 3.69l1.46 1.46A8.97 8.97 0 0 0 21 12a9 9 0 0 0-6-8.49v2.06A7 7 0 0 1 19 12zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25A6.96 6.96 0 0 1 14 18.7v2.06a9 9 0 0 0 3.69-1.46L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z",
	order:
		"M3 9h2V7H3v2zm0 4h2v-2H3v2zm0 4h2v-2H3v2zm4-8h14V7H7v2zm0 4h14v-2H7v2zm0 4h14v-2H7v2z",
	random:
		"M10.59 9.17L5.41 4 4 5.41l5.17 5.17 1.42-1.41zM14.5 4l2.04 2.04L4 18.59 5.41 20 17.96 7.46 20 9.5V4h-5.5zm.33 9.41l-1.41 1.41 3.13 3.13L14.5 20H20v-5.5l-2.04 2.04-3.13-3.13z",
	loop: "M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4zm-4-2V9h-1l-2 1v1h1.5v4H13z",
};

function fmt(s) {
	if (isNaN(s) || s < 0) return "00:00";
	const m = Math.floor(s / 60);
	const x = Math.floor(s % 60);
	return `${String(m).padStart(2, "0")}:${String(x).padStart(2, "0")}`;
}

async function loadTab(i, autoplay = false) {
	tabIndex = i;
	const p = playlists[i];
	const key = `${p.server}/${p.id}`;
	loading = true;
	try {
		let list = cache[key];
		if (!list) {
			const r = await fetch(
				`${META_API}?server=${p.server}&type=${p.type}&id=${p.id}`,
			);
			const arr = await r.json();
			list = (arr || []).map((x) => ({
				name: x.name,
				artist: x.artist,
				url: x.url,
				cover: x.pic,
				lrc: x.lrc,
			}));
			cache[key] = list;
		}
		tracks = list;
		if (tracks.length) setTrack(0, autoplay);
	} catch (e) {
		tracks = [];
	}
	loading = false;
}

function setTrack(i, autoplay = true) {
	if (!tracks.length) return;
	index = (i + tracks.length) % tracks.length;
	const t = tracks[index];
	curLrc = "";
	lrcLines = [];
	curTime = 0;
	duration = 0;
	if (audio) {
		audio.src = t.url || "";
		if (autoplay) audio.play().catch(() => {});
	}
	loadLrc(t.lrc);
}

async function loadLrc(urlOrText) {
	if (!urlOrText) return;
	try {
		let text = urlOrText;
		if (/^https?:\/\//.test(urlOrText)) {
			const r = await fetch(urlOrText);
			text = await r.text();
		}
		lrcLines = parseLrc(text);
	} catch (e) {
		lrcLines = [];
	}
}

function parseLrc(text) {
	const out = [];
	for (const line of text.split("\n")) {
		const m = line.match(/\[(\d{1,2}):(\d{1,2})(?:[.:](\d{1,3}))?\]/g);
		if (!m) continue;
		const content = line.replace(/\[(\d{1,2}):(\d{1,2})(?:[.:](\d{1,3}))?\]/g, "").trim();
		if (!content) continue;
		for (const tag of m) {
			const mm = tag.match(/\[(\d{1,2}):(\d{1,2})(?:[.:](\d{1,3}))?\]/);
			const t = Number(mm[1]) * 60 + Number(mm[2]) + (mm[3] ? Number(`0.${mm[3]}`) : 0);
			out.push({ time: t, text: content });
		}
	}
	return out.sort((a, b) => a.time - b.time);
}

function updateLrc() {
	if (!lrcLines.length) return;
	let t = "";
	for (const l of lrcLines) {
		if (l.time <= curTime) t = l.text;
		else break;
	}
	curLrc = t;
}

function togglePlay() {
	if (!audio || !audio.src) return;
	if (audio.paused) audio.play().catch(() => {});
	else audio.pause();
}
function rand() {
	return Math.floor(Math.random() * tracks.length);
}
function prev() {
	setTrack(mode === "random" ? rand() : index - 1);
}
function next() {
	setTrack(mode === "random" ? rand() : index + 1);
}
function onEnded() {
	if (mode === "loop") setTrack(index);
	else next();
}
function cycleMode() {
	mode = mode === "order" ? "random" : mode === "random" ? "loop" : "order";
}
function seek(e) {
	if (!audio || !duration) return;
	const rect = e.currentTarget.getBoundingClientRect();
	audio.currentTime = ((e.clientX - rect.left) / rect.width) * duration;
}
function setVol(e) {
	const rect = e.currentTarget.getBoundingClientRect();
	volume = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
	muted = false;
	if (audio) {
		audio.volume = volume;
		audio.muted = false;
	}
}
function toggleMute() {
	muted = !muted;
	if (audio) audio.muted = muted;
}

function onTime() {
	curTime = audio.currentTime;
	duration = audio.duration || 0;
	updateLrc();
}

onMount(() => {
	if (audio) audio.volume = volume;
	if (playlists.length) loadTab(0, false);
});
onDestroy(() => {
	if (audio) {
		audio.pause();
		audio.src = "";
	}
});

$: modeIcon = mode === "order" ? icons.order : mode === "random" ? icons.random : icons.loop;
$: cur = tracks[index] || {};
$: progress = duration ? (curTime / duration) * 100 : 0;
</script>

<div class="mp">
	<!-- 歌单切换 Tab（位于播放器上方） -->
	<div class="mp-tabs">
		{#each playlists as p, i}
			<button type="button" class="mp-tab" class:active={i === tabIndex} on:click={() => loadTab(i, true)}>
				{p.name}
			</button>
		{/each}
	</div>

	<!-- 播放器主体 -->
	<div class="mp-player">
		<div class="mp-top">
			<!-- 黑胶唱片 -->
			<div class="cover" class:playing>
				<img class="needle" src="/music/play_needle.png" alt="" />
				<div class="disc">
					{#if cur.cover}
						<img class="album" src={cur.cover} alt="" />
					{:else}
						<div class="album album-empty"></div>
					{/if}
					<div class="disc-ring"></div>
				</div>
			</div>

			<!-- 歌曲信息 + 歌词 -->
			<div class="mp-info">
				<div class="mp-title">{cur.name || (loading ? "加载中…" : "暂无歌曲")}</div>
				<div class="mp-artist">{cur.artist || ""}</div>
				<div class="mp-lrc">{curLrc || "纯音乐，请欣赏"}</div>
			</div>
		</div>

		<!-- 进度条 -->
		<div class="mp-progress-row">
			<div class="mp-progress" on:click={seek}>
				<div class="mp-progress-bar" style={`width:${progress}%`}></div>
			</div>
			<div class="mp-time">{fmt(curTime)} / {fmt(duration)}</div>
		</div>

		<!-- 控件 -->
		<div class="mp-controls">
			<button type="button" class="ctrl" title="播放模式" on:click={cycleMode}>
				<svg viewBox="0 0 24 24"><path d={modeIcon} /></svg>
			</button>
			<button type="button" class="ctrl" title="上一首" on:click={prev}>
				<svg viewBox="0 0 24 24"><path d={icons.prev} /></svg>
			</button>
			<button type="button" class="ctrl ctrl-play" title="播放/暂停" on:click={togglePlay}>
				<svg viewBox="0 0 24 24"><path d={playing ? icons.pause : icons.play} /></svg>
			</button>
			<button type="button" class="ctrl" title="下一首" on:click={next}>
				<svg viewBox="0 0 24 24"><path d={icons.next} /></svg>
			</button>
			<div class="ctrl-volume">
				<button type="button" class="ctrl" title="静音" on:click={toggleMute}>
					<svg viewBox="0 0 24 24"><path d={muted ? icons.mute : icons.volume} /></svg>
				</button>
				<div class="mp-vol" on:click={setVol}>
					<div class="mp-vol-bar" style={`width:${muted ? 0 : volume * 100}%`}></div>
				</div>
			</div>
		</div>
	</div>

	<!-- 曲目列表 -->
	<ol class="mp-list">
		{#each tracks as t, i}
			<li class:current={i === index} on:click={() => setTrack(i, true)}>
				<span class="num">{i === index ? "▶" : i + 1}</span>
				<span class="name">{t.name}</span>
				<span class="artist">{t.artist}</span>
			</li>
		{/each}
	</ol>

	<audio
		bind:this={audio}
		bind:volume
		on:timeupdate={onTime}
		on:loadedmetadata={onTime}
		on:play={() => (playing = true)}
		on:pause={() => (playing = false)}
		on:ended={onEnded}
	></audio>
</div>

<style>
.mp { width: 100%; }

/* Tabs */
.mp-tabs {
	display: flex;
	flex-wrap: wrap;
	gap: 0.4rem 1.6rem;
	margin-bottom: 1rem;
}
.mp-tab {
	font-size: 1.05rem;
	color: var(--btn-content);
	padding-bottom: 0.25rem;
	border-bottom: 2px solid transparent;
	transition: all 0.2s;
}
.mp-tab:hover { color: var(--primary); }
.mp-tab.active {
	color: var(--primary);
	font-weight: 700;
	border-bottom-color: var(--primary);
}

/* Player box */
.mp-player {
	border: 1px solid var(--line-divider);
	border-radius: var(--radius-large);
	padding: 1.5rem 1.5rem 1rem;
	background: var(--btn-regular-bg);
}
.mp-top { display: flex; align-items: center; gap: 1.5rem; }

/* 黑胶 */
.cover { position: relative; width: 144px; height: 144px; flex-shrink: 0; }
.cover .needle {
	position: absolute; z-index: 4;
	width: 55px; height: 83px; top: -22px; left: -22px;
	transform: rotateZ(-55deg); transform-origin: 12px 12px;
	transition: transform 0.5s ease; pointer-events: none;
	filter: drop-shadow(0 2px 3px rgba(0,0,0,0.25));
}
.cover.playing .needle { transform: rotateZ(0deg); }
.cover .disc {
	position: absolute; inset: 0;
	animation: vinyl-rotate 20s linear infinite;
	animation-play-state: paused;
}
.cover.playing .disc { animation-play-state: running; }
.cover .disc-ring {
	position: absolute; inset: 0; z-index: 2; pointer-events: none;
	background: url("/music/play_disc.png") no-repeat center / contain;
}
.cover .album {
	position: absolute; top: 24px; left: 24px;
	width: 96px; height: 96px; border-radius: 50%; object-fit: cover; z-index: 1;
}
.cover .album-empty { background: linear-gradient(135deg, var(--primary), #fff); opacity: 0.6; }
@keyframes vinyl-rotate { to { transform: rotate(360deg); } }

/* Info */
.mp-info { flex: 1; min-width: 0; }
.mp-title {
	font-size: 1.5rem; font-weight: 700; color: var(--deep-text);
	white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.mp-artist { font-size: 0.95rem; color: var(--btn-content); margin-top: 0.25rem; }
.mp-lrc {
	margin-top: 1rem; text-align: center; font-size: 0.9rem;
	color: var(--btn-content); opacity: 0.75;
	white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}

/* Progress */
.mp-progress-row { display: flex; align-items: center; gap: 0.75rem; margin-top: 1rem; }
.mp-progress {
	flex: 1; height: 4px; border-radius: 2px;
	background: var(--line-color); cursor: pointer; overflow: hidden;
}
.mp-progress-bar { height: 100%; background: var(--primary); border-radius: 2px; transition: width 0.15s linear; }
.mp-time { font-size: 0.8rem; color: var(--btn-content); opacity: 0.8; white-space: nowrap; font-variant-numeric: tabular-nums; }

/* Controls */
.mp-controls {
	display: flex; align-items: center; justify-content: space-between;
	margin-top: 0.75rem; padding-top: 0.75rem;
}
.ctrl {
	display: inline-flex; align-items: center; justify-content: center;
	color: var(--btn-content); transition: all 0.2s; border-radius: 999px;
}
.ctrl svg { width: 26px; height: 26px; fill: currentColor; }
.ctrl:hover { color: var(--primary); }
.ctrl-play svg { width: 40px; height: 40px; }
.ctrl-volume { display: flex; align-items: center; gap: 0.4rem; }
.mp-vol { width: 60px; height: 4px; border-radius: 2px; background: var(--line-color); cursor: pointer; overflow: hidden; }
.mp-vol-bar { height: 100%; background: var(--primary); }

/* List */
.mp-list {
	list-style: none; margin: 1rem 0 0; padding: 0;
	max-height: 16rem; overflow-y: auto;
}
.mp-list li {
	display: flex; align-items: center; gap: 0.75rem;
	padding: 0.5rem 0.75rem; cursor: pointer; border-radius: 0.4rem;
	transition: background 0.2s; font-size: 0.95rem; color: var(--deep-text);
}
.mp-list li:hover { background: var(--btn-plain-bg-hover); }
.mp-list li.current { color: var(--primary); }
.mp-list .num { width: 1.5rem; text-align: right; color: var(--btn-content); flex-shrink: 0; font-size: 0.85rem; }
.mp-list li.current .num { color: var(--primary); }
.mp-list .name { flex: 1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.mp-list .artist { color: var(--btn-content); flex-shrink: 0; max-width: 40%; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

@media (max-width: 768px) {
	.mp-top { flex-direction: column; text-align: center; }
	.mp-lrc { margin-top: 0.5rem; }
}
</style>
