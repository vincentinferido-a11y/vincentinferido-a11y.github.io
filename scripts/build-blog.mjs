// Builds the blog from Markdown files in content/blog/ into static pages under docs/blog/.
// Also writes docs/blog/feed.xml (RSS), docs/sitemap.xml, docs/robots.txt and refreshes the
// "From the Blog" strip on the homepage (between the BLOG:LATEST markers in docs/index.html).
//
// Article format (content/blog/<slug>.md):
//   ---
//   title: How Much Does a Custom CRM Cost?
//   description: One or two sentences for Google and link previews.
//   date: 2026-09-29
//   tags: CRM, Business
//   ---
//   Markdown body...
//
// Run: npm run build   (builds the blog, then the CSS)
import fs from "node:fs";
import path from "node:path";
import { marked } from "marked";
import { pathToFileURL } from "node:url";

// Change this when the custom domain is live (e.g. "https://yourdomain.com").
const SITE_URL = "https://vincentinferido-a11y.github.io";
const AUTHOR = "Vincent Inferido";
const AUTHOR_TITLE = "Full-Stack Engineer & Designer";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1")), "..");
const CONTENT = path.join(ROOT, "content", "blog");
const DOCS = path.join(ROOT, "docs");
// Site-wide settings (analytics ID etc.). Empty values switch the feature off.
const SITE_CFG = JSON.parse(fs.readFileSync(path.join(ROOT, "site.config.json"), "utf8"));
const ANALYTICS = SITE_CFG.umamiWebsiteId
  ? `<script defer src="https://cloud.umami.is/script.js" data-website-id="${SITE_CFG.umamiWebsiteId}" data-domains="${new URL(SITE_URL).host}"></script>\n`
  : "";
const OUT = path.join(DOCS, "blog");

marked.setOptions({ gfm: true });

// ---------------------------------------------------------------- helpers
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const slugify = (s) => String(s).toLowerCase().replace(/<[^>]+>/g, "").replace(/&[a-z#0-9]+;/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const fmtDate = (d) => new Date(d + "T00:00:00Z").toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric", timeZone: "UTC" });

function parseFrontMatter(raw, file) {
  const m = raw.replace(/\r\n/g, "\n").match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!m) throw new Error(`${file}: missing front matter`);
  const meta = {};
  for (const line of m[1].split("\n")) {
    const i = line.indexOf(":");
    if (i > 0) meta[line.slice(0, i).trim()] = line.slice(i + 1).trim().replace(/^["']|["']$/g, "");
  }
  for (const k of ["title", "description", "date"]) if (!meta[k]) throw new Error(`${file}: front matter needs "${k}"`);
  meta.tags = (meta.tags || "").split(",").map((t) => t.trim()).filter(Boolean);
  return { meta, body: m[2] };
}

// ---------------------------------------------------------------- content blocks
// Fenced blocks in Markdown become rich components:
//   ```picks      - For: Solo seller | Pick: HubSpot Free | Why: ... | Link: #hubspot
//   ```product    name/tagline/bestFor/pricing/free/pros/cons/verdict/link/source (see docs in README)
//   ```callout tip|mistake|note Optional title      (body is Markdown)
//   ```faq        Q: question  /  A: answer (Markdown), repeated
const inline = (s) => marked.parseInline(String(s ?? "").trim());
const icon = (name, cls = "") => `<span class="material-symbols-outlined ${cls}" aria-hidden="true">${name}</span>`;

function parseKeyed(text) {
  // key: value lines; a key followed by "- item" lines becomes a list
  const out = {}; let listKey = null;
  for (const raw of text.split("\n")) {
    const line = raw.replace(/\s+$/, "");
    if (!line.trim()) continue;
    const li = line.match(/^\s*-\s+(.*)$/);
    if (li && listKey) { out[listKey].push(li[1]); continue; }
    const kv = line.match(/^([A-Za-z][\w-]*):\s*(.*)$/);
    if (kv) {
      if (kv[2] === "") { listKey = kv[1]; out[listKey] = []; } else { listKey = null; out[kv[1]] = kv[2]; }
    }
  }
  return out;
}

function renderPicks(text) {
  const rows = text.split("\n").map((l) => l.replace(/^\s*-\s*/, "").trim()).filter(Boolean).map((l) =>
    Object.fromEntries(l.split("|").map((part) => { const i = part.indexOf(":"); return [part.slice(0, i).trim().toLowerCase(), part.slice(i + 1).trim()]; })));
  return `<div class="picks not-prose">${rows.map((r) => `<div class="pick">
<span class="pick-for">${icon("person_search", "text-[16px]")}${inline(r.for)}</span>
<span class="pick-name">${r.link ? `<a href="${esc(r.link)}">${inline(r.pick)}</a>` : inline(r.pick)}</span>
<span class="pick-why">${inline(r.why)}</span></div>`).join("")}</div>`;
}

function renderProduct(text) {
  const p = parseKeyed(text);
  const row = (label, val) => (val ? `<div><dt>${label}</dt><dd>${inline(val)}</dd></div>` : "");
  const list = (items, kind) => (items && items.length ? `<ul class="${kind}">${items.map((i) => `<li>${icon(kind === "pros" ? "check_circle" : "cancel", "text-[18px]")}<span>${inline(i)}</span></li>`).join("")}</ul>` : "");
  return `<section class="product" id="${esc(p.anchor || slugify(p.name))}">
<header class="product-head"><div><h3 class="product-name">${esc(p.name)}</h3>${p.tagline ? `<p class="product-tagline">${inline(p.tagline)}</p>` : ""}</div>${p.badge ? `<span class="product-badge">${inline(p.badge)}</span>` : ""}</header>
<dl class="product-facts">${row("Best for", p.bestFor)}${row("Pricing", p.pricing)}${row("Free plan / trial", p.free)}${row("Watch out for", p.watch)}</dl>
<div class="product-proscons">${list(p.pros, "pros")}${list(p.cons, "cons")}</div>
${p.verdict ? `<p class="product-verdict"><strong>Verdict:</strong> ${inline(p.verdict)}</p>` : ""}
${p.link || p.source ? `<p class="product-links">${p.link ? `<a href="${esc(p.link)}">Visit official site ${icon("open_in_new", "text-[14px]")}</a>` : ""}${p.source ? `<a href="${esc(p.source)}">Official pricing ${icon("open_in_new", "text-[14px]")}</a>` : ""}</p>` : ""}
</section>`;
}

function renderCallout(kind, title, text) {
  const cfg = { tip: ["lightbulb", "Tip"], mistake: ["warning", "Common mistake"], note: ["info", "Note"], hook: ["bolt", ""] }[kind] || ["info", "Note"];
  return `<aside class="callout callout-${esc(kind)}">${icon(cfg[0], "text-[22px] callout-icon")}<div><p class="callout-title">${esc(title || cfg[1])}</p>${marked.parse(text)}</div></aside>`;
}

function renderFaq(text, faqs) {
  const items = [];
  let cur = null;
  for (const line of text.split("\n")) {
    const q = line.match(/^Q:\s*(.*)$/), a = line.match(/^A:\s*(.*)$/);
    if (q) { cur = { q: q[1].trim(), a: "" }; items.push(cur); }
    else if (a && cur) cur.a = a[1];
    else if (cur && line.trim()) cur.a += "\n" + line;
  }
  items.forEach((i) => faqs.push({ q: i.q, a: marked.parseInline(i.a.trim()).replace(/<[^>]+>/g, "") }));
  return `<div class="faq-list">${items.map((i) => `<details class="faq-item"><summary>${esc(i.q)}${icon("expand_more", "text-[20px] faq-chevron")}</summary><div>${marked.parse(i.a.trim())}</div></details>`).join("")}</div>`;
}

function renderBlocks(body) {
  const blocks = [], faqs = [];
  const md = body.replace(/```(picks|product|callout|faq)([^\n]*)\n([\s\S]*?)```/g, (_, kind, info, inner) => {
    let html;
    if (kind === "picks") html = renderPicks(inner);
    else if (kind === "product") html = renderProduct(inner);
    else if (kind === "faq") html = renderFaq(inner, faqs);
    else { const [k, ...rest] = info.trim().split(/\s+/); html = renderCallout(k || "note", rest.join(" "), inner); }
    blocks.push(html);
    return `\n\n<!--BLOCK:${blocks.length - 1}-->\n\n`;
  });
  return { md, blocks, faqs };
}

// Post-process marked's HTML: heading ids, external links, responsive tables.
function enhance(html) {
  const toc = [];
  const seen = new Set();
  html = html.replace(/<h([23])>([\s\S]*?)<\/h\1>/g, (_, lvl, inner) => {
    let id = slugify(inner) || "section";
    while (seen.has(id)) id += "-x";
    seen.add(id);
    if (lvl === "2") toc.push({ id, text: inner.replace(/<[^>]+>/g, "").replace(/&#39;/g, "'").replace(/&quot;/g, "\"").replace(/&amp;/g, "&") });
    return `<h${lvl} id="${id}">${inner}</h${lvl}>`;
  });
  html = html.replace(/<a href="(https?:\/\/[^"]+)"/g, (m, href) =>
    href.startsWith(SITE_URL) ? m : `<a href="${href}" target="_blank" rel="noopener noreferrer"`);
  html = html.replace(/<table>/g, '<div class="table-wrap"><table>').replace(/<\/table>/g, "</table></div>");
  return { html, toc };
}

// ---------------------------------------------------------------- share bar
// X, LinkedIn, Facebook, copy link, plus the phone's native share sheet where supported.
const X_ICON = `<svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>`;
const LI_ICON = `<svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.34V9h3.42v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13zM7.12 20.45H3.56V9h3.56v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.73C24 .77 23.2 0 22.22 0z"/></svg>`;
const FB_ICON = `<svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M24 12.07C24 5.41 18.63 0 12 0S0 5.4 0 12.07C0 18.1 4.39 23.1 10.13 24v-8.44H7.08v-3.49h3.04V9.41c0-3.02 1.8-4.7 4.54-4.7 1.31 0 2.68.24 2.68.24v2.97h-1.5c-1.5 0-1.96.93-1.96 1.89v2.26h3.33l-.53 3.49h-2.8V24C19.62 23.1 24 18.1 24 12.07z"/></svg>`;
const SHARE_BTN = "inline-flex items-center gap-1.5 px-space-sm py-1.5 rounded bg-surface-container hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface font-label-sm text-label-sm";
function shareBar(url, title, label = "Share:") {
  const u = encodeURIComponent(url), t = encodeURIComponent(title);
  const a = (name, href, ico) => `<a href="${href}" target="_blank" rel="noopener noreferrer" aria-label="Share on ${name}" class="${SHARE_BTN}">${ico}${name}</a>`;
  return `<div class="flex flex-wrap items-center gap-space-xs" data-share>
<span class="font-label-sm text-label-sm text-outline pr-1">${label}</span>
${a("X", `https://x.com/intent/post?text=${t}&url=${u}&via=web3boyaxdev`, X_ICON)}
${a("LinkedIn", `https://www.linkedin.com/sharing/share-offsite/?url=${u}`, LI_ICON)}
${a("Facebook", `https://www.facebook.com/sharer/sharer.php?u=${u}`, FB_ICON)}
<button type="button" data-copy="${url}" class="${SHARE_BTN}"><span class="material-symbols-outlined text-[15px]" aria-hidden="true">link</span><span>Copy link</span></button>
<button type="button" data-native-share data-url="${url}" data-title="${esc(title)}" hidden class="${SHARE_BTN}"><span class="material-symbols-outlined text-[15px]" aria-hidden="true">ios_share</span><span>More</span></button>
</div>`;
}
const SHARE_SCRIPT = `<script>document.querySelectorAll("[data-copy]").forEach(function(b){b.addEventListener("click",function(){var t=b.dataset.copy,l=b.lastElementChild;function done(ok){l.textContent=ok?"Copied!":"Press Ctrl+C";setTimeout(function(){l.textContent="Copy link"},1800)}function legacy(){var a=document.createElement("textarea");a.value=t;a.setAttribute("readonly","");a.style.position="fixed";a.style.opacity="0";document.body.appendChild(a);a.select();var ok=false;try{ok=document.execCommand("copy")}catch(e){}a.remove();done(ok)}if(navigator.clipboard&&window.isSecureContext){navigator.clipboard.writeText(t).then(function(){done(true)},legacy)}else{legacy()}})});if(navigator.share){document.querySelectorAll("[data-native-share]").forEach(function(b){b.hidden=false;b.addEventListener("click",function(){navigator.share({title:b.dataset.title,url:b.dataset.url}).catch(function(){})})})}</script>`;

// ---------------------------------------------------------------- shared page chrome
const head = ({ title, description, url, type = "website", image = "/og-image.jpg", imageAlt = "", extra = "", active = "blog" }) => `<!DOCTYPE html>
<html class="dark scroll-smooth" lang="en">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}"/>
<link rel="canonical" href="${url}"/>
<meta property="og:title" content="${esc(title)}"/>
<meta property="og:description" content="${esc(description)}"/>
<meta property="og:type" content="${type}"/>
<meta property="og:url" content="${url}"/>
<meta property="og:image" content="${SITE_URL}${image}"/>
${image !== "/vincent-inferido.jpg" ? `<meta property="og:image:width" content="1200"/>
<meta property="og:image:height" content="630"/>
<meta property="og:image:alt" content="${esc(imageAlt || title)}"/>
<meta name="twitter:card" content="summary_large_image"/>` : `<meta name="twitter:card" content="summary"/>`}
<meta name="twitter:title" content="${esc(title)}"/>
<meta name="twitter:description" content="${esc(description)}"/>
<meta name="twitter:image" content="${SITE_URL}${image}"/>
<meta name="twitter:image:alt" content="${esc(imageAlt || title)}"/>
<meta property="og:site_name" content="${AUTHOR}"/>
<meta property="og:locale" content="en_US"/>
<meta name="author" content="${AUTHOR}"/>
<meta name="robots" content="index, follow, max-image-preview:large"/>
<meta name="twitter:site" content="@web3boyaxdev"/>
<meta name="twitter:creator" content="@web3boyaxdev"/>
<meta name="theme-color" content="#0f131c"/>
<link rel="icon" href="/favicon.svg" type="image/svg+xml"/>
<link rel="alternate" type="application/rss+xml" title="${AUTHOR} — Blog" href="${SITE_URL}/blog/feed.xml"/>
<link href="https://fonts.googleapis.com" rel="preconnect"/>
<link crossorigin="" href="https://fonts.gstatic.com" rel="preconnect"/>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&amp;family=JetBrains+Mono:wght@400;500;600;700&amp;family=Plus+Jakarta+Sans:wght@600;700&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&amp;display=block" rel="stylesheet"/>
<link href="/styles.css" rel="stylesheet"/>
${ANALYTICS}${extra}</head>
<body class="bg-surface font-body-md text-body-md text-on-surface antialiased selection:bg-primary selection:text-on-primary">
<a href="#main" class="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[60] focus:px-space-md focus:py-2 focus:rounded focus:bg-tertiary focus:text-on-tertiary font-label-md text-label-md">Skip to content</a>
<header class="sticky top-0 z-50 bg-surface/85 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.4)]">
<div class="h-16 max-w-[1440px] mx-auto px-margin-mobile lg:px-margin-desktop flex items-center justify-between gap-space-md">
<a href="/" class="flex items-center gap-space-sm sm:gap-space-md min-w-0" aria-label="${AUTHOR} — home">
<svg class="h-8 w-8 shrink-0" viewBox="0 0 32 32" aria-hidden="true"><polygon points="16,2 28,9 28,23 16,30 4,23 4,9" fill="none" stroke="#4D8EFF" stroke-width="2"/><path d="M16 2v14M28 9l-12 7M28 23l-12-7M16 30V16M4 23l12-7M4 9l12 7" stroke="#D0BCFF" stroke-width="1.5"/><circle cx="16" cy="16" r="3.5" fill="#4FDBC8"/></svg>
<div class="flex flex-col min-w-0"><span class="font-label-md text-label-md font-bold tracking-tight text-on-surface uppercase">${AUTHOR}</span><span class="font-label-sm text-label-sm text-outline tracking-normal sm:tracking-wider uppercase truncate">${esc(AUTHOR_TITLE)}</span></div>
</a>
<nav class="hidden md:flex items-center gap-space-md font-label-md text-label-md" aria-label="Primary">
<a class="nav-link" href="/#services">Services</a>
<a class="nav-link" href="/#projects">Projects</a>
<a class="nav-link" href="/#estimate">Estimate</a>
<a class="nav-link${active === "blog" ? " is-active" : ""}" href="/blog/"${active === "blog" ? ' aria-current="page"' : ""}>Blog</a>
<a class="nav-link" href="/#contact">Contact</a>
</nav>
<a href="/#contact" data-umami-event="hire-me-header" aria-label="Hire me" class="flex items-center gap-space-xs px-2.5 sm:px-space-md py-2 rounded bg-tertiary text-on-tertiary hover:bg-tertiary-fixed transition-colors font-label-md text-label-md font-bold shrink-0"><span class="material-symbols-outlined text-[18px] sm:text-[16px]" aria-hidden="true">handshake</span><span class="hidden sm:inline">Hire me</span></a>
</div>
</header>
<main id="main">`;

const foot = () => `</main>
<footer class="w-full bg-surface-container-lowest mt-space-xl py-space-xl">
<div class="max-w-[1440px] mx-auto px-margin-mobile lg:px-margin-desktop flex flex-col md:flex-row md:items-center justify-between gap-space-md font-label-sm text-label-sm text-outline">
<div class="flex flex-col gap-1">
<span class="font-headline-sm text-headline-sm font-bold text-on-surface">${AUTHOR}</span>
<span>${esc(AUTHOR_TITLE)} · Building business systems, web apps and Web3 products.</span>
</div>
<div class="flex flex-wrap gap-space-md">
<a class="hover:text-primary" href="/">Portfolio</a>
<a class="hover:text-primary" href="/blog/">Blog</a>
<a class="hover:text-primary" href="/for/agencies/">For agencies</a>
<a class="hover:text-primary" href="/for/clinics-salons/">For clinics &amp; salons</a>
<a class="hover:text-primary" href="/for/saas-web3/">For SaaS &amp; Web3</a>
<a class="hover:text-primary" href="/blog/feed.xml">RSS</a>
<a class="hover:text-primary" href="https://github.com/vincentinferido-a11y" target="_blank" rel="noreferrer">GitHub</a>
<a class="hover:text-primary" href="https://www.linkedin.com/in/vincentci/" target="_blank" rel="noreferrer">LinkedIn</a>
<a class="hover:text-primary" href="https://x.com/web3boyaxdev" target="_blank" rel="noreferrer">X</a>
</div>
</div>
<p class="max-w-[1440px] mx-auto px-margin-mobile lg:px-margin-desktop pt-space-md font-label-sm text-label-sm text-outline">© ${new Date().getUTCFullYear()} ${AUTHOR}. All rights reserved.</p>
</footer>
</body>
</html>
`;

const tagChip = (t) => `<span class="px-2 py-0.5 rounded bg-surface-container text-on-surface-variant font-label-sm text-label-sm">${esc(t)}</span>`;

const postCard = (p) => `<article class="post-card group relative flex flex-col rounded-xl overflow-hidden bg-surface-container-low hover:bg-surface-container transition-colors" data-tags="${esc(p.meta.tags.join("|"))}">
${p.cover ? `<img src="${p.cover}" alt="" width="1200" height="630" loading="lazy" decoding="async" class="w-full aspect-[1200/630] object-cover"/>` : ""}
<div class="flex flex-col gap-space-sm p-space-md flex-1">
<div class="flex flex-wrap items-center gap-1.5">${p.meta.tags.map(tagChip).join("")}</div>
<h3 class="font-headline-sm text-headline-sm font-bold text-on-surface group-hover:text-primary transition-colors"><a href="/blog/${p.slug}/" class="after:absolute after:inset-0">${esc(p.meta.title)}</a></h3>
<p class="font-body-sm text-body-sm text-on-surface-variant flex-1">${esc(p.meta.description)}</p>
<p class="font-label-sm text-label-sm text-outline">${fmtDate(p.meta.date)} · ${p.minutes} min read</p>
</div>
</article>`;

// ---------------------------------------------------------------- load posts
if (!fs.existsSync(CONTENT)) throw new Error("content/blog not found");
const posts = fs.readdirSync(CONTENT).filter((f) => f.endsWith(".md")).map((f) => {
  const { meta, body } = parseFrontMatter(fs.readFileSync(path.join(CONTENT, f), "utf8"), f);
  const words = body.split(/\s+/).filter(Boolean).length;
  const { md, blocks, faqs } = renderBlocks(body);
  let { html, toc } = enhance(marked.parse(md));
  html = html.replace(/<!--BLOCK:(\d+)-->/g, (_, i) => enhance(blocks[Number(i)]).html);
  const slug = f.replace(/\.md$/, "");
  const cover = meta.image || (fs.existsSync(path.join(DOCS, "images", "blog", `${slug}.png`)) ? `/images/blog/${slug}.png` : null);
  return { slug, meta, html, toc, faqs, cover, words, minutes: Math.max(1, Math.round(words / 220)) };
}).sort((a, b) => (a.meta.date < b.meta.date ? 1 : a.meta.date > b.meta.date ? -1 : a.meta.title.localeCompare(b.meta.title)));

fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });

// ---------------------------------------------------------------- post pages
posts.forEach((p, i) => {
  const url = `${SITE_URL}/blog/${p.slug}/`;
  const related = posts.filter((q) => q !== p && q.meta.tags.some((t) => p.meta.tags.includes(t))).slice(0, 3);
  const more = related.length ? related : posts.filter((q) => q !== p).slice(0, 3);
  const newer = posts[i - 1], older = posts[i + 1];
  const jsonLd = {
    "@context": "https://schema.org", "@type": "BlogPosting", headline: p.meta.title, description: p.meta.description,
    datePublished: p.meta.date, dateModified: p.meta.updated || p.meta.date, mainEntityOfPage: url, url,
    author: { "@type": "Person", name: AUTHOR, url: SITE_URL, jobTitle: AUTHOR_TITLE },
    publisher: { "@type": "Person", name: AUTHOR }, keywords: p.meta.tags.join(", "), wordCount: p.words,
    ...(p.cover ? { image: `${SITE_URL}${p.cover}` } : {}), inLanguage: "en",
  };
  const ld = [jsonLd, { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: `${SITE_URL}/` },
    { "@type": "ListItem", position: 2, name: "Blog", item: `${SITE_URL}/blog/` },
    { "@type": "ListItem", position: 3, name: p.meta.title, item: url }] }];
  if (p.faqs.length) ld.push({ "@context": "https://schema.org", "@type": "FAQPage", mainEntity: p.faqs.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) });

  const page = head({ title: `${p.meta.seoTitle || p.meta.title} | ${AUTHOR}`, description: p.meta.description, url, type: "article", image: p.cover || undefined, imageAlt: p.meta.title,
    extra: `<meta property="article:published_time" content="${p.meta.date}"/>
<meta property="article:modified_time" content="${p.meta.updated || p.meta.date}"/>
${p.meta.tags.map((t) => `<meta property="article:tag" content="${esc(t)}"/>`).join("\n")}
${ld.map((o) => `<script type="application/ld+json">${JSON.stringify(o).replace(/</g, "\\u003c")}</script>`).join("\n")}
` }) + `
<div class="max-w-[1440px] mx-auto px-margin-mobile lg:px-margin-desktop pt-space-lg">
<nav class="font-label-sm text-label-sm text-outline pb-space-md" aria-label="Breadcrumb"><a class="hover:text-primary" href="/">Home</a> / <a class="hover:text-primary" href="/blog/">Blog</a></nav>
<div class="grid grid-cols-1 lg:grid-cols-12 gap-gutter-lg">
<article class="lg:col-span-8 min-w-0">
<header class="flex flex-col gap-space-sm pb-space-lg border-b border-white/5">
<div class="flex flex-wrap gap-1.5">${p.meta.tags.map(tagChip).join("")}</div>
<h1 class="font-headline-lg text-headline-lg-mobile md:text-headline-lg font-bold text-on-surface">${esc(p.meta.title)}</h1>
<p class="font-body-lg text-body-lg text-on-surface-variant">${esc(p.meta.description)}</p>
<div class="flex flex-wrap items-center gap-space-sm font-label-sm text-label-sm text-outline">
<img src="/vincent-inferido.jpg" alt="" width="28" height="28" class="w-7 h-7 rounded-full object-cover"/>
<span class="text-on-surface">${AUTHOR}</span><span>·</span><time datetime="${p.meta.date}">${fmtDate(p.meta.date)}</time><span>·</span><span>${p.minutes} min read</span>
</div>
<div class="pt-1">${shareBar(url, p.meta.title)}</div>
${p.meta.checked ? `<p class="research-badge">${icon("fact_check", "text-[18px]")}<span><strong>${esc(p.meta.research || "Research-based")}</strong> · prices and features checked on official sources on <time datetime="${p.meta.checked}">${fmtDate(p.meta.checked)}</time>. <a href="#sources">See sources</a></span></p>` : ""}
</header>
${p.cover ? `<img src="${p.cover}" alt="${esc(p.meta.imageAlt || p.meta.title)}" width="1200" height="630" fetchpriority="high" decoding="async" class="w-full aspect-[1200/630] object-cover rounded-xl mt-space-lg"/>` : ""}
${p.toc.length > 2 ? `<details class="lg:hidden mt-space-lg rounded-xl bg-surface-container-low"><summary class="cursor-pointer p-space-md font-label-md text-label-md text-on-surface">On this page</summary><ol class="flex flex-col gap-1.5 px-space-md pb-space-md font-body-sm text-body-sm">${p.toc.map((t) => `<li><a class="text-on-surface-variant hover:text-primary" href="#${t.id}">${esc(t.text)}</a></li>`).join("")}</ol></details>` : ""}
<div class="article pt-space-lg">
${p.html}
</div>
<aside class="mt-space-xl p-space-lg rounded-xl bg-surface-container-low ring-1 ring-tertiary/20 flex flex-col gap-space-sm" aria-label="Get help">
<span class="font-label-sm text-label-sm text-tertiary uppercase tracking-wider">Need help with this?</span>
<p class="font-headline-sm text-headline-sm font-bold text-on-surface">Let&#39;s talk about your project</p>
<p class="font-body-sm text-body-sm text-on-surface-variant">Get an instant ballpark for effort and timeline, or send me a message about your project. No pressure, and you&#39;ll leave with a clearer plan either way.</p>
<div class="flex flex-wrap gap-space-sm pt-1">
<a href="/#estimate" class="inline-flex items-center gap-space-xs px-space-md h-11 rounded bg-surface-container-high hover:bg-surface-container-highest text-primary font-label-md text-label-md font-semibold"><span class="material-symbols-outlined text-[18px]" aria-hidden="true">calculate</span>Estimate my project</a>
<a href="/#contact" class="inline-flex items-center gap-space-xs px-space-md h-11 rounded bg-tertiary text-on-tertiary hover:bg-tertiary-fixed font-label-md text-label-md font-bold"><span class="material-symbols-outlined text-[18px]" aria-hidden="true">handshake</span>Hire me</a>
</div>
</aside>
<div class="mt-space-lg flex items-center gap-space-md p-space-md rounded-xl bg-surface-container-low">
<img src="/vincent-inferido.jpg" alt="${AUTHOR}" width="64" height="64" class="w-16 h-16 rounded-full object-cover shrink-0"/>
<div class="flex flex-col gap-1"><span class="font-headline-sm text-headline-sm font-bold text-on-surface">${AUTHOR}</span>
<span class="font-body-sm text-body-sm text-on-surface-variant">${esc(AUTHOR_TITLE)} based in the Philippines. I design and build CRMs, booking systems, web apps and Web3 products for growing businesses.</span></div>
</div>
<div class="mt-space-md">${shareBar(url, p.meta.title, "Found this useful? Share it:")}</div>
<nav class="mt-space-lg grid grid-cols-1 sm:grid-cols-2 gap-space-sm" aria-label="More articles">
${older ? `<a href="/blog/${older.slug}/" class="p-space-md rounded-lg bg-surface-container-low hover:bg-surface-container"><span class="font-label-sm text-label-sm text-outline">← Previous</span><span class="block font-body-sm text-body-sm text-on-surface">${esc(older.meta.title)}</span></a>` : "<span></span>"}
${newer ? `<a href="/blog/${newer.slug}/" class="p-space-md rounded-lg bg-surface-container-low hover:bg-surface-container sm:text-right"><span class="font-label-sm text-label-sm text-outline">Next →</span><span class="block font-body-sm text-body-sm text-on-surface">${esc(newer.meta.title)}</span></a>` : ""}
</nav>
</article>
<aside class="hidden lg:block lg:col-span-4">
<div class="sticky top-24 flex flex-col gap-space-md">
${p.toc.length > 2 ? `<nav class="p-space-md rounded-xl bg-surface-container-low" aria-label="On this page"><p class="font-label-sm text-label-sm text-outline uppercase tracking-wider pb-space-sm">On this page</p><ol class="flex flex-col gap-1.5 font-body-sm text-body-sm">${p.toc.map((t) => `<li><a class="text-on-surface-variant hover:text-primary" href="#${t.id}">${esc(t.text)}</a></li>`).join("")}</ol></nav>` : ""}
<div class="p-space-md rounded-xl bg-surface-container-low"><p class="font-label-sm text-label-sm text-outline uppercase tracking-wider pb-space-sm">Related</p><ul class="flex flex-col gap-space-sm">${more.map((q) => `<li><a class="font-body-sm text-body-sm text-on-surface hover:text-primary" href="/blog/${q.slug}/">${esc(q.meta.title)}</a></li>`).join("")}</ul></div>
</div>
</aside>
</div>
</div>
${SHARE_SCRIPT}
` + foot();
  fs.mkdirSync(path.join(OUT, p.slug), { recursive: true });
  fs.writeFileSync(path.join(OUT, p.slug, "index.html"), page);
});

// ---------------------------------------------------------------- blog index
const allTags = [...new Set(posts.flatMap((p) => p.meta.tags))];
const index = head({ title: `Blog | ${AUTHOR} — ${AUTHOR_TITLE}`, description: "Practical, plain-English guides for business owners and founders: CRMs, booking systems, websites vs. apps, choosing a backend, and how to plan a software project.", url: `${SITE_URL}/blog/` }) + `
<section class="max-w-[1440px] mx-auto px-margin-mobile lg:px-margin-desktop py-space-xl">
<div class="flex flex-col gap-space-xs pb-space-lg">
<span class="font-label-md text-label-md text-tertiary tracking-wider uppercase">// Blog</span>
<h1 class="font-headline-lg text-headline-lg-mobile md:text-headline-lg font-bold text-on-surface">Practical Guides for Growing Businesses</h1>
<p class="font-body-md text-body-md text-on-surface-variant max-w-2xl">Plain-English answers to the questions business owners and founders ask before building software: what it costs, what you actually need, how to choose, and how to avoid expensive mistakes.</p>
</div>
<div class="pb-space-lg">${shareBar(`${SITE_URL}/blog/`, "Practical guides for growing businesses, by Vincent Inferido", "Share the blog:")}</div>
<div class="flex flex-wrap gap-space-xs pb-space-lg" role="group" aria-label="Filter by topic">
<button type="button" data-tag="" aria-pressed="true" class="tag-btn px-space-md py-1.5 rounded font-label-sm text-label-sm bg-primary text-on-primary">All (${posts.length})</button>
${allTags.map((t) => `<button type="button" data-tag="${esc(t)}" aria-pressed="false" class="tag-btn px-space-md py-1.5 rounded font-label-sm text-label-sm bg-surface-container-low text-on-surface-variant hover:text-on-surface">${esc(t)}</button>`).join("\n")}
</div>
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-gutter-lg" id="post-grid">
${posts.map(postCard).join("\n")}
</div>
</section>
<script>(function(){var btns=document.querySelectorAll(".tag-btn"),cards=document.querySelectorAll(".post-card");btns.forEach(function(b){b.addEventListener("click",function(){var t=b.dataset.tag;btns.forEach(function(x){var on=x===b;x.setAttribute("aria-pressed",on);x.classList.toggle("bg-primary",on);x.classList.toggle("text-on-primary",on);x.classList.toggle("bg-surface-container-low",!on);x.classList.toggle("text-on-surface-variant",!on)});cards.forEach(function(c){c.hidden=!!t&&c.dataset.tags.split("|").indexOf(t)<0})})})})();</script>
${SHARE_SCRIPT}
` + foot();
fs.writeFileSync(path.join(OUT, "index.html"), index);

// ---------------------------------------------------------------- audience landing pages (/for/<slug>/)
const { landingPages, REVIEW } = await import(pathToFileURL(path.join(ROOT, "content", "landing", "pages.mjs")).href);
const LANDING_OUT = path.join(DOCS, "for");
fs.rmSync(LANDING_OUT, { recursive: true, force: true });
const msIcon = (n, cls = "text-[20px]") => `<span class="material-symbols-outlined ${cls}" aria-hidden="true">${n}</span>`;

const BOOKING_DEMO = `<div id="booking-demo" class="rounded-xl bg-surface-container-lowest ring-1 ring-white/10 p-space-md md:p-space-lg flex flex-col gap-space-md" aria-live="polite">
<div><p class="font-label-sm text-label-sm text-outline uppercase tracking-wider pb-2">1 · Service</p><div class="flex flex-wrap gap-2" data-group="service">
<button type="button" data-v="Consultation · 30 min" class="bd-opt">Consultation · 30 min</button><button type="button" data-v="Follow-up · 20 min" class="bd-opt">Follow-up · 20 min</button><button type="button" data-v="Facial treatment · 60 min" class="bd-opt">Facial treatment · 60 min</button></div></div>
<div><p class="font-label-sm text-label-sm text-outline uppercase tracking-wider pb-2">2 · Day</p><div class="flex flex-wrap gap-2" data-group="day"></div></div>
<div><p class="font-label-sm text-label-sm text-outline uppercase tracking-wider pb-2">3 · Time</p><div class="flex flex-wrap gap-2" data-group="time"><span class="font-body-sm text-body-sm text-outline">Pick a day first.</span></div></div>
<label class="flex items-center gap-2 font-body-sm text-body-sm text-on-surface-variant"><input type="checkbox" id="bd-deposit" checked class="accent-[#4fdbc8]"/> Pay a $20 deposit to secure the slot (demo)</label>
<button type="button" id="bd-confirm" disabled class="self-start inline-flex items-center gap-space-xs px-space-md h-11 rounded bg-tertiary text-on-tertiary font-label-md text-label-md font-bold disabled:opacity-40" data-umami-event="booking-demo-confirm">${msIcon("check_circle", "text-[18px]")}Confirm booking</button>
<div id="bd-result" hidden class="rounded-lg bg-tertiary/10 ring-1 ring-tertiary/30 p-space-md font-body-sm text-body-sm text-on-surface"></div>
</div>
<script>(function(){var s={},root=document.getElementById("booking-demo");if(!root)return;var cls="bd-opt px-3 py-2 rounded bg-surface-container text-on-surface-variant font-label-md text-label-md hover:text-on-surface";root.querySelectorAll(".bd-opt").forEach(function(b){b.className=cls});
var days=root.querySelector('[data-group=day]'),times=root.querySelector('[data-group=time]'),btn=document.getElementById("bd-confirm"),out=document.getElementById("bd-result");
function pick(group,b){root.querySelectorAll('[data-group='+group+'] button').forEach(function(x){var on=x===b;x.setAttribute("aria-pressed",on);x.classList.toggle("bg-tertiary",on);x.classList.toggle("text-on-tertiary",on);x.classList.toggle("bg-surface-container",!on)});s[group]=b.dataset.v;btn.disabled=!(s.service&&s.day&&s.time);out.hidden=true}
function bind(group){root.querySelectorAll('[data-group='+group+'] button').forEach(function(b){b.onclick=function(){pick(group,b);if(group==="day")renderTimes(b.dataset.seed)}})}
var d=new Date();for(var i=1;i<=5;i++){var x=new Date(d);x.setDate(d.getDate()+i);var b=document.createElement("button");b.type="button";b.className=cls;b.dataset.v=x.toLocaleDateString("en-US",{weekday:"short",month:"short",day:"numeric"});b.dataset.seed=i;b.textContent=b.dataset.v;days.appendChild(b)}
function renderTimes(seed){times.innerHTML="";delete s.time;["9:00 AM","10:30 AM","1:00 PM","2:30 PM","4:00 PM","5:30 PM","7:00 PM"].forEach(function(t,j){var b=document.createElement("button");b.type="button";b.className=cls;b.dataset.v=t;b.textContent=t;if((j+Number(seed))%3===0){b.disabled=true;b.className+=" opacity-40 line-through";b.title="Already booked"}times.appendChild(b)});bind("time");btn.disabled=true}
bind("service");bind("day");
btn.onclick=function(){var dep=document.getElementById("bd-deposit").checked;out.innerHTML="<p class='font-bold text-tertiary pb-1'>Booked (demo): "+s.service+"</p><p>"+s.day+" at "+s.time+"</p><ul class='pt-2 list-disc pl-5 text-on-surface-variant'><li>Confirmation email sent</li><li>SMS reminder scheduled for 24 hours before</li><li>Added to the staff calendar, slot blocked for others</li>"+(dep?"<li>$20 deposit captured</li>":"")+"</ul><p class='pt-2 text-outline'>This is a sample. On your site, it would use your real services, staff and calendar.</p>";out.hidden=false}})();</script>`;

for (const L of landingPages) {
  const url = `${SITE_URL}/for/${L.slug}/`;
  const cta = `/?need=${L.need}#contact`;
  const relatedPosts = L.articles.map((slug) => posts.find((p) => p.slug === slug)).filter(Boolean);
  const ld = [
    { "@context": "https://schema.org", "@type": "Service", name: L.seoTitle, description: L.description, provider: { "@type": "Person", name: AUTHOR, url: SITE_URL, jobTitle: AUTHOR_TITLE }, areaServed: "Worldwide", url },
    { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "Home", item: `${SITE_URL}/` }, { "@type": "ListItem", position: 2, name: L.nav, item: url }] },
    { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: L.faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) },
  ];
  const demo = L.demo.type === "booking" ? BOOKING_DEMO : `<a href="${L.demo.url}" target="_blank" rel="noopener noreferrer" data-umami-event="demo-open-${L.slug}" class="group block rounded-xl overflow-hidden ring-1 ring-white/10 bg-surface-container-lowest">
<img src="${L.demo.image}" alt="${esc(L.demo.title)}" width="960" height="533" loading="lazy" class="w-full aspect-[960/533] object-cover object-top group-hover:scale-[1.02] transition-transform duration-500"/></a>`;
  const page = head({ title: `${L.seoTitle} | ${AUTHOR}`, description: L.description, url, active: "none",
    extra: ld.map((o) => `<script type="application/ld+json">${JSON.stringify(o).replace(/</g, "\\u003c")}</script>`).join("\n") + "\n" }) + `
<div class="max-w-[1200px] mx-auto px-margin-mobile lg:px-margin-desktop">
<nav class="font-label-sm text-label-sm text-outline pt-space-lg" aria-label="Breadcrumb"><a class="hover:text-primary" href="/">Home</a> / <span class="text-on-surface-variant">${esc(L.nav)}</span></nav>

<section class="py-space-xl flex flex-col gap-space-md max-w-3xl">
<span class="font-label-md text-label-md text-tertiary tracking-wider uppercase">// ${esc(L.eyebrow)}</span>
<h1 class="font-headline-lg text-headline-lg-mobile md:text-headline-lg font-bold text-on-surface">${esc(L.title)}</h1>
<p class="font-body-lg text-body-lg text-on-surface-variant">${esc(L.sub)}</p>
<div class="flex flex-wrap gap-space-sm pt-space-xs">
<a href="${cta}" data-umami-event="cta-hero-${L.slug}" class="inline-flex items-center gap-space-xs px-space-lg h-12 rounded bg-tertiary text-on-tertiary hover:bg-tertiary-fixed font-label-md text-label-md font-bold">${msIcon("handshake", "text-[18px]")}Tell me about your project</a>
<a href="#demo" class="inline-flex items-center gap-space-xs px-space-lg h-12 rounded bg-surface-container-high hover:bg-surface-container-highest text-primary font-label-md text-label-md font-semibold">${msIcon(L.demo.type === "booking" ? "touch_app" : "play_circle", "text-[18px]")}${L.demo.type === "booking" ? "Try the booking demo" : "See the live demo"}</a>
</div>
<ul class="flex flex-wrap gap-x-space-md gap-y-1 pt-space-xs font-label-sm text-label-sm text-outline">
<li class="flex items-center gap-1">${msIcon("check", "text-[16px] text-tertiary")}Fixed-scope plan before you pay</li>
<li class="flex items-center gap-1">${msIcon("check", "text-[16px] text-tertiary")}You own the code</li>
<li class="flex items-center gap-1">${msIcon("check", "text-[16px] text-tertiary")}Reply within 24 hours</li>
<li class="flex items-center gap-1">${msIcon("check", "text-[16px] text-tertiary")}Typical timeline: ${esc(L.timeline)}</li>
</ul>
</section>

<section class="pb-space-xl" aria-labelledby="pains">
<h2 id="pains" class="font-headline-md text-headline-md font-bold text-on-surface pb-space-md">Sound familiar?</h2>
<div class="grid grid-cols-1 md:grid-cols-3 gap-gutter-lg">
${L.pains.map((p) => `<div class="rounded-xl bg-surface-container-low p-space-md flex flex-col gap-space-xs">${msIcon("error", "text-[22px] text-error")}<h3 class="font-headline-sm text-headline-sm font-bold text-on-surface">${esc(p.title)}</h3><p class="font-body-sm text-body-sm text-on-surface-variant">${esc(p.body)}</p></div>`).join("\n")}
</div>
</section>

<section class="pb-space-xl" aria-labelledby="build">
<h2 id="build" class="font-headline-md text-headline-md font-bold text-on-surface pb-space-md">What I build for you</h2>
<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-gutter-lg">
${L.build.map((b) => `<div class="rounded-xl bg-surface-container-low p-space-md flex gap-space-sm"><span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-tertiary/15 text-tertiary">${msIcon(b.icon)}</span><div><h3 class="font-label-md text-label-md font-bold text-on-surface">${esc(b.title)}</h3><p class="font-body-sm text-body-sm text-on-surface-variant pt-1">${esc(b.body)}</p></div></div>`).join("\n")}
</div>
</section>

<section id="demo" class="pb-space-xl scroll-mt-24" aria-labelledby="demo-title">
<div class="grid grid-cols-1 lg:grid-cols-[1fr_1.3fr] gap-gutter-lg items-center rounded-2xl bg-surface-container-low p-space-md md:p-space-lg">
<div class="flex flex-col gap-space-sm">
<span class="font-label-sm text-label-sm text-tertiary uppercase tracking-wider">${L.demo.type === "booking" ? "Interactive demo" : "Live demo"}</span>
<h2 id="demo-title" class="font-headline-md text-headline-md font-bold text-on-surface">${esc(L.demo.title)}</h2>
<p class="font-body-md text-body-md text-on-surface-variant">${esc(L.demo.body)}</p>
${L.demo.url ? `<a href="${L.demo.url}" target="_blank" rel="noopener noreferrer" data-umami-event="demo-open-${L.slug}" class="self-start inline-flex items-center gap-space-xs px-space-md h-11 rounded bg-surface-container-high hover:bg-surface-container-highest text-primary font-label-md text-label-md font-semibold">${esc(L.demo.cta)}${msIcon("open_in_new", "text-[16px]")}</a>` : ""}
<p class="font-label-sm text-label-sm text-outline">${esc(L.demo.note)}</p>
</div>
${demo}
</div>
</section>

<section id="proof" class="pb-space-xl scroll-mt-24" aria-labelledby="proof-title">
<h2 id="proof-title" class="font-headline-md text-headline-md font-bold text-on-surface pb-space-md">Proof, not promises</h2>
<div class="grid grid-cols-1 lg:grid-cols-3 gap-gutter-lg">
<figure class="rounded-xl bg-surface-container-low p-space-md flex flex-col gap-space-sm ring-1 ring-tertiary/20">
<div class="flex gap-0.5 text-[#f5c518]" aria-label="5 out of 5 stars">${"★".repeat(5)}</div>
<blockquote class="font-body-md text-body-md text-on-surface">&ldquo;${esc(REVIEW.quote)}&rdquo;</blockquote>
<figcaption class="font-label-sm text-label-sm text-outline"><span class="text-on-surface font-bold">${esc(REVIEW.name)}</span> · ${esc(REVIEW.role)}<br/><span class="inline-flex items-center gap-1 text-tertiary pt-1">${msIcon("verified", "text-[15px]")}${esc(REVIEW.badge)}</span></figcaption>
</figure>
${L.projects.map((p) => `<a href="${p.url}"${p.url.startsWith("http") ? ' target="_blank" rel="noopener noreferrer"' : ""} class="rounded-xl bg-surface-container-low hover:bg-surface-container p-space-md flex flex-col gap-space-xs"><span class="font-label-sm text-label-sm text-primary">${esc(p.label)}</span><h3 class="font-headline-sm text-headline-sm font-bold text-on-surface">${esc(p.title)}</h3><p class="font-body-sm text-body-sm text-on-surface-variant">${esc(p.body)}</p></a>`).join("\n")}
</div>
</section>

<section class="pb-space-xl" aria-labelledby="how">
<h2 id="how" class="font-headline-md text-headline-md font-bold text-on-surface pb-space-md">How we'd work together</h2>
<ol class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-gutter-lg">
${[["Tell me what's broken", "A short message about your business and what you want to fix."], ["Get a clear plan", "Screens, features, milestones and a fixed-scope quote, in plain language."], ["See it take shape", "Designs you approve, then working software shown to you regularly."], ["Launch & own it", `Live in about ${L.timeline}, with a bug-fix period and all code in your name.`]].map(([t, b], i) => `<li class="rounded-xl bg-surface-container-low p-space-md"><span class="font-label-md text-label-md text-tertiary">0${i + 1}</span><h3 class="font-label-md text-label-md font-bold text-on-surface pt-1">${esc(t)}</h3><p class="font-body-sm text-body-sm text-on-surface-variant pt-1">${esc(b)}</p></li>`).join("\n")}
</ol>
</section>

<section class="pb-space-xl" aria-labelledby="faq">
<h2 id="faq" class="font-headline-md text-headline-md font-bold text-on-surface pb-space-md">Questions</h2>
<div class="flex flex-col gap-space-xs max-w-3xl">
${L.faq.map((f) => `<details class="group rounded-xl bg-surface-container-low"><summary class="flex cursor-pointer list-none items-center justify-between gap-space-sm p-space-md font-body-md text-body-md font-semibold text-on-surface [&::-webkit-details-marker]:hidden">${esc(f.q)}${msIcon("expand_more", "text-[20px] transition-transform group-open:rotate-180")}</summary><p class="px-space-md pb-space-md font-body-sm text-body-sm text-on-surface-variant">${esc(f.a)}</p></details>`).join("\n")}
</div>
</section>

${relatedPosts.length ? `<section class="pb-space-xl" aria-labelledby="reading"><h2 id="reading" class="font-headline-md text-headline-md font-bold text-on-surface pb-space-md">Helpful guides</h2><div class="grid grid-cols-1 md:grid-cols-3 gap-gutter-lg">${relatedPosts.map(postCard).join("\n")}</div></section>` : ""}

<section class="pb-space-xl">
<div class="rounded-2xl bg-surface-container-low ring-1 ring-tertiary/25 p-space-lg md:p-space-xl flex flex-col items-start gap-space-sm">
<span class="font-label-sm text-label-sm text-tertiary uppercase tracking-wider">Next step</span>
<h2 class="font-headline-md text-headline-md font-bold text-on-surface">Tell me what you'd like to fix. I'll reply within 24 hours.</h2>
<p class="font-body-md text-body-md text-on-surface-variant max-w-2xl">No sales call needed. Send a short message, and you'll get questions, a suggested approach and, if it's a fit, a fixed-scope plan.</p>
<div class="flex flex-wrap gap-space-sm pt-space-xs">
<a href="${cta}" data-umami-event="cta-bottom-${L.slug}" class="inline-flex items-center gap-space-xs px-space-lg h-12 rounded bg-tertiary text-on-tertiary hover:bg-tertiary-fixed font-label-md text-label-md font-bold">${msIcon("handshake", "text-[18px]")}Send me a message</a>
<a href="/#estimate" data-umami-event="cta-estimate-${L.slug}" class="inline-flex items-center gap-space-xs px-space-lg h-12 rounded bg-surface-container-high hover:bg-surface-container-highest text-primary font-label-md text-label-md font-semibold">${msIcon("calculate", "text-[18px]")}Estimate my project</a>
</div>
</div>
</section>
</div>
` + foot();
  fs.mkdirSync(path.join(LANDING_OUT, L.slug), { recursive: true });
  fs.writeFileSync(path.join(LANDING_OUT, L.slug, "index.html"), page);
}

// ---------------------------------------------------------------- RSS, sitemap, robots
const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
<channel>
<title>${esc(AUTHOR)} — Blog</title>
<link>${SITE_URL}/blog/</link>
<atom:link href="${SITE_URL}/blog/feed.xml" rel="self" type="application/rss+xml"/>
<description>Practical guides for business owners and founders on CRMs, booking systems, web apps and planning software projects.</description>
<language>en</language>
${posts.map((p) => `<item><title>${esc(p.meta.title)}</title><link>${SITE_URL}/blog/${p.slug}/</link><guid>${SITE_URL}/blog/${p.slug}/</guid><pubDate>${new Date(p.meta.date + "T00:00:00Z").toUTCString()}</pubDate><description>${esc(p.meta.description)}</description>${p.meta.tags.map((t) => `<category>${esc(t)}</category>`).join("")}</item>`).join("\n")}
</channel>
</rss>
`;
fs.writeFileSync(path.join(OUT, "feed.xml"), rss);
const today = new Date().toISOString().slice(0, 10);
const urls = [{ loc: `${SITE_URL}/`, lastmod: today }, { loc: `${SITE_URL}/blog/`, lastmod: posts[0]?.meta.date || today },
  ...landingPages.map((L) => ({ loc: `${SITE_URL}/for/${L.slug}/`, lastmod: today })),
  ...posts.map((p) => ({ loc: `${SITE_URL}/blog/${p.slug}/`, lastmod: p.meta.updated || p.meta.date }))];
fs.writeFileSync(path.join(DOCS, "sitemap.xml"), `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `<url><loc>${u.loc}</loc><lastmod>${u.lastmod}</lastmod></url>`).join("\n")}
</urlset>
`);
fs.writeFileSync(path.join(DOCS, "robots.txt"), `User-agent: *\nAllow: /\n\nSitemap: ${SITE_URL}/sitemap.xml\n`);

// ---------------------------------------------------------------- homepage "From the Blog" strip
const homePath = path.join(DOCS, "index.html");
let home = fs.readFileSync(homePath, "utf8");
const START = "<!-- BLOG:LATEST:START -->", END = "<!-- BLOG:LATEST:END -->";
if (home.includes(START) && home.includes(END)) {
  const strip = `${START}
<div class="grid grid-cols-1 md:grid-cols-3 gap-gutter-lg">
${posts.slice(0, 3).map(postCard).join("\n")}
</div>
${END}`;
  home = home.slice(0, home.indexOf(START)) + strip + home.slice(home.indexOf(END) + END.length);
  // Analytics snippet on the homepage too (between ANALYTICS markers in <head>).
  const AS = "<!-- ANALYTICS:START -->", AE = "<!-- ANALYTICS:END -->";
  if (home.includes(AS) && home.includes(AE)) home = home.slice(0, home.indexOf(AS)) + AS + ANALYTICS.trim() + AE + home.slice(home.indexOf(AE) + AE.length);
  fs.writeFileSync(homePath, home);
}

console.log(`landing: ${landingPages.length} pages → docs/for/ · blog: ${posts.length} posts → docs/blog/ (+ feed.xml, sitemap.xml, robots.txt${home.includes(START) ? ", homepage strip" : ""})`);
