// Renders a 1200x630 cover image for every blog post (docs/images/blog/<slug>.png) with headless
// Microsoft Edge. Covers double as the og:image for link previews.
// Run: node scripts/make-covers.mjs [slug ...]   (no args = only posts without a cover; "all" = every post)
// Per-post look comes from front matter: coverIcon (Material Symbols name), coverLabel, coverAccent (hex).
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1")), "..");
const CONTENT = path.join(ROOT, "content", "blog");
const OUT = path.join(ROOT, "docs", "images", "blog");
// Chrome first (headless Edge fails silently mid-update); override with EDGE_PATH.
const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const EDGE = process.env.EDGE_PATH || (fs.existsSync(CHROME) ? CHROME : "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe");
const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

const meta = (raw) => Object.fromEntries(raw.replace(/\r\n/g, "\n").split("\n---\n")[0].split("\n").slice(1)
  .map((l) => [l.slice(0, l.indexOf(":")).trim(), l.slice(l.indexOf(":") + 1).trim().replace(/^["']|["']$/g, "")]));

const html = (m) => `<!doctype html><html><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@700;800&family=JetBrains+Mono:wght@500;700&display=block" rel="stylesheet">
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@48,300,0,0&display=block" rel="stylesheet">
<style>
*{margin:0;box-sizing:border-box}
body{width:1200px;height:630px;overflow:hidden;background:#0a0e17;color:#dfe2ee;font-family:'Plus Jakarta Sans',sans-serif;position:relative}
.glow{position:absolute;inset:0;background:radial-gradient(700px 420px at 88% 20%,${m.accent}38,transparent 70%),radial-gradient(600px 400px at 0% 110%,#4d8eff30,transparent 70%)}
.grid{position:absolute;inset:0;background-image:linear-gradient(#ffffff08 1px,transparent 1px),linear-gradient(90deg,#ffffff08 1px,transparent 1px);background-size:48px 48px;mask-image:linear-gradient(90deg,transparent,#000 60%)}
.wrap{position:absolute;inset:64px 72px;display:flex;flex-direction:column;justify-content:space-between}
.label{font-family:'JetBrains Mono',monospace;font-size:22px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:${m.accent}}
h1{font-size:${m.title.length > 70 ? 54 : m.title.length > 50 ? 62 : 70}px;line-height:1.08;font-weight:800;letter-spacing:-.02em;max-width:860px;margin-top:22px}
.foot{display:flex;align-items:center;gap:16px;font-family:'JetBrains Mono',monospace;font-size:20px;color:#8c909f}
.foot b{color:#dfe2ee;font-weight:700}
.icon{position:absolute;right:72px;top:64px;width:200px;height:200px;border-radius:40px;display:grid;place-items:center;background:${m.accent}1f;box-shadow:inset 0 0 0 2px ${m.accent}55}
.icon span{font-family:'Material Symbols Outlined';font-size:120px;color:${m.accent};line-height:1}
.bar{position:absolute;left:0;bottom:0;height:8px;width:100%;background:linear-gradient(90deg,#4d8eff,#d0bcff,${m.accent})}
</style></head><body><div class="glow"></div><div class="grid"></div>
<div class="icon"><span>${esc(m.icon)}</span></div>
<div class="wrap"><div><div class="label">${esc(m.label)}</div><h1>${esc(m.title)}</h1></div>
<div class="foot"><svg width="40" height="40" viewBox="0 0 32 32"><polygon points="16,2 28,9 28,23 16,30 4,23 4,9" fill="none" stroke="#4D8EFF" stroke-width="2"/><path d="M16 2v14M28 9l-12 7M28 23l-12-7M16 30V16M4 23l12-7M4 9l12 7" stroke="#D0BCFF" stroke-width="1.5"/><circle cx="16" cy="16" r="3.5" fill="#4FDBC8"/></svg><span><b>Vincent Inferido</b> · Blog</span></div></div>
<div class="bar"></div></body></html>`;

fs.mkdirSync(OUT, { recursive: true });
const args = process.argv.slice(2);
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "covers-"));
for (const f of fs.readdirSync(CONTENT).filter((f) => f.endsWith(".md"))) {
  const slug = f.replace(/\.md$/, "");
  const target = path.join(OUT, `${slug}.png`);
  if (args.length ? !(args.includes("all") || args.includes(slug)) : fs.existsSync(target)) continue;
  const m = meta(fs.readFileSync(path.join(CONTENT, f), "utf8"));
  const page = path.join(tmp, `${slug}.html`), png = path.join(tmp, `${slug}.png`);
  fs.writeFileSync(page, html({ title: m.coverTitle || m.title, label: m.coverLabel || (m.tags || "").split(",")[0], icon: m.coverIcon || "article", accent: m.coverAccent || "#4fdbc8" }));
  execFileSync(EDGE, ["--headless=new", `--user-data-dir=${process.env.EDGE_PROFILE || path.join(os.tmpdir(), "edge-covers")}`, "--disable-gpu", "--hide-scrollbars", "--force-device-scale-factor=1", "--window-size=1200,630",
    "--virtual-time-budget=5000", `--screenshot=${png}`, "file:///" + page.replace(/\\/g, "/")], { stdio: "ignore" });
  fs.copyFileSync(png, target);
  console.log("cover:", slug);
}
fs.rmSync(tmp, { recursive: true, force: true });
