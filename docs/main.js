// ---------------------------------------------------------------------------
// Site config — edit these to make the portfolio yours.
// ---------------------------------------------------------------------------
const CONFIG = {
  contactEmail: "vincent.inferido@gmail.com",
  // Optional: a Formspree / Getform endpoint. When empty, the form opens the visitor's mail client.
  formEndpoint: "",
  // Optional scheduling link for the "Hire me" buttons (e.g. https://calendly.com/yourname/30min or a Cal.com link).
  // Leave empty to send visitors to the contact form with a call request pre-filled.
  bookingUrl: "",
  // Supabase database (see supabase/README.md). Leave empty to use email instead.
  // The publishable key (sb_publishable_...) is safe to put here; NEVER put the secret key here.
  supabase: {
    url: "https://catbgcjucrassbmpwlnw.supabase.co",
    publishableKey: "sb_publishable_cML9VXfRJ6Ou7zMFH-wfPg_Ndv-YhPv",
  },
  rpcRefreshMs: 12000,
  // Networks in the header picker. Live data comes from public RPCs; if the first endpoint
  // is slow or down, the next one in "rpcs" is tried automatically.
  chains: [
    { id: 1, name: "Ethereum", color: "#627EEA", rpcs: ["https://ethereum-rpc.publicnode.com", "https://1rpc.io/eth"], symbol: "ETH", explorer: "https://etherscan.io" },
    { id: 8453, name: "Base", color: "#0052FF", rpcs: ["https://base-rpc.publicnode.com", "https://mainnet.base.org"], symbol: "ETH", explorer: "https://basescan.org" },
    { id: 42161, name: "Arbitrum", color: "#28A0F0", rpcs: ["https://arbitrum-one-rpc.publicnode.com", "https://arb1.arbitrum.io/rpc"], symbol: "ETH", explorer: "https://arbiscan.io" },
    { id: 10, name: "Optimism", color: "#FF0420", rpcs: ["https://optimism-rpc.publicnode.com", "https://mainnet.optimism.io"], symbol: "ETH", explorer: "https://optimistic.etherscan.io" },
    { id: 137, name: "Polygon", color: "#8247E5", rpcs: ["https://polygon-bor-rpc.publicnode.com", "https://polygon.drpc.org"], symbol: "POL", explorer: "https://polygonscan.com" },
    { id: 56, name: "BNB Chain", color: "#F0B90B", rpcs: ["https://bsc-rpc.publicnode.com", "https://bsc-dataseed.bnbchain.org"], symbol: "BNB", explorer: "https://bscscan.com" },
    // Non-EVM: shows live TPS + slot instead of gas + block, and connects Solana wallets (Phantom, Solflare)
    { id: "solana", type: "solana", name: "Solana", color: "#14F195", rpcs: ["https://solana-rpc.publicnode.com"], symbol: "SOL", explorer: "https://solscan.io" },
  ],
  // Project cost estimator (section #estimate). All prices in USD.
  // estimate = (base + screens x perScreen + features) x design x timeline x hourlyRate
  estimator: {
    // Pricing is private: visitors see hours and timeline only. To show price ranges,
    // set showPrices: true AND hourlyRate to your rate (both are public in this file).
    showPrices: false,
    hourlyRate: 0,
    hoursPerWeek: 30, // focused hours per week used for the timeline estimate
    rangeLow: 0.85, // shown range around the point estimate
    rangeHigh: 1.2,
    rushMultiplier: 1.25,
    providedDesignMultiplier: 0.8, // client supplies finished designs
    types: [
      { id: "landing", label: "Landing page / marketing site", icon: "web", base: 12, perScreen: 6, designOnly: false },
      { id: "webapp", label: "Web app / SaaS MVP", icon: "apps", base: 60, perScreen: 10, designOnly: false },
      { id: "system", label: "Business system / CRM / dashboard", icon: "dashboard", base: 70, perScreen: 11, designOnly: false },
      { id: "web3", label: "Web3 dApp / token platform", icon: "token", base: 70, perScreen: 10, designOnly: false },
      { id: "design", label: "UI/UX design + design system only", icon: "brush", base: 16, perScreen: 5, designOnly: true },
    ],
    features: [
      { id: "auth", label: "User accounts & roles", hours: 20 },
      { id: "admin", label: "Admin dashboard", hours: 30 },
      { id: "payments", label: "Payments (Stripe)", hours: 20 },
      { id: "cms", label: "Editable content (CMS)", hours: 16 },
      { id: "integrations", label: "Third-party integrations / API", hours: 20 },
      { id: "realtime", label: "Real-time updates & notifications", hours: 24 },
      { id: "ai", label: "AI features (chat, generation)", hours: 24 },
      { id: "wallet", label: "Crypto wallet connect", hours: 12 },
      { id: "contract", label: "Smart contract (Solidity)", hours: 40 },
      { id: "i18n", label: "Multiple languages", hours: 12 },
    ],
  },
  roles: [
    "Full-Stack AI-First Developer & UI/UX Designer",
    "CRM & Business Systems Developer",
    "Web3 / dApp Developer",
    "UX/UI Systems Architect",
  ],
};

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// --- Toast -----------------------------------------------------------------
let toastTimer;
function toast(message, ms = 3200) {
  const el = $("#toast");
  if (!el) return;
  el.textContent = message;
  el.classList.remove("opacity-0");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.add("opacity-0"), ms);
}

// --- 1. Rotating role pill ------------------------------------------------
function initRoles() {
  const el = $("#rotating-role");
  if (!el || reducedMotion) return;
  let i = 0;
  setInterval(() => {
    el.classList.add("opacity-0");
    setTimeout(() => {
      i = (i + 1) % CONFIG.roles.length;
      el.textContent = CONFIG.roles[i];
      el.classList.remove("opacity-0");
    }, 300);
  }, 2800);
}

// --- 2. Project filter ----------------------------------------------------
const FILTER_ON = ["bg-primary", "text-on-primary", "font-semibold"];
const FILTER_OFF = ["bg-transparent", "hover:bg-surface-container", "text-on-surface-variant", "hover:text-on-surface"];

function initFilters() {
  const buttons = $$(".project-filter-btn");
  const items = $$(".project-item");
  buttons.forEach((btn) =>
    btn.addEventListener("click", () => {
      const category = btn.dataset.filter;
      buttons.forEach((b) => {
        const active = b === btn;
        b.setAttribute("aria-pressed", String(active));
        b.classList.remove(...(active ? FILTER_OFF : FILTER_ON));
        b.classList.add(...(active ? FILTER_ON : FILTER_OFF));
      });
      items.forEach((item) =>
        item.classList.toggle("hidden", category !== "all" && !item.classList.contains(category))
      );
    })
  );
}

// --- 3. Mobile menu + scroll-spy -----------------------------------------
function initNav() {
  const btn = $("#menu-btn");
  const menu = $("#mobile-nav");
  const setOpen = (open) => {
    menu.classList.toggle("hidden", !open);
    btn.setAttribute("aria-expanded", String(open));
    btn.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    $(".material-symbols-outlined", btn).textContent = open ? "close" : "menu";
  };
  btn?.addEventListener("click", () => setOpen(menu.classList.contains("hidden")));
  $$("a", menu).forEach((a) => a.addEventListener("click", () => setOpen(false)));
  window.addEventListener("keydown", (e) => e.key === "Escape" && setOpen(false));

  const links = $$(".nav-link");
  const sections = $$("main section[id]");
  const setActive = (id) =>
    links.forEach((a) => {
      const active = a.getAttribute("href") === `#${id}`;
      a.classList.toggle("is-active", active);
      if (active) a.setAttribute("aria-current", "location");
      else a.removeAttribute("aria-current");
    });
  const observer = new IntersectionObserver(
    (entries) => entries.forEach((e) => e.isIntersecting && setActive(e.target.id)),
    { rootMargin: "-45% 0px -50% 0px" }
  );
  sections.forEach((s) => observer.observe(s));
  setActive("hero");
}

// --- 4. Multichain picker + live telemetry (public RPCs) ------------------
const STORE_KEY = "portfolio.chainId";
const chainById = (id) => CONFIG.chains.find((c) => String(c.id) === String(id));
const isSolana = (chain) => chain?.type === "solana";
let activeChain = CONFIG.chains[0];
try {
  activeChain = chainById(localStorage.getItem(STORE_KEY)) || activeChain;
} catch {}
const chainListeners = [];

const RPC_TIMEOUT_MS = 6000;
const preferredRpc = new Map(); // chain id -> index of the last endpoint that answered

async function rpc(method, params = [], chain = activeChain) {
  const start = preferredRpc.get(chain.id) || 0;
  let lastError;
  for (let n = 0; n < chain.rpcs.length; n++) {
    const i = (start + n) % chain.rpcs.length;
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), RPC_TIMEOUT_MS);
    try {
      const res = await fetch(chain.rpcs[i], {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
        signal: ctrl.signal,
      });
      const json = await res.json();
      if (json.error) throw new Error(json.error.message);
      preferredRpc.set(chain.id, i);
      return json.result;
    } catch (err) {
      lastError = err;
    } finally {
      clearTimeout(timer);
    }
  }
  throw lastError;
}

function setActiveChain(chain) {
  if (!chain || chain === activeChain) return;
  activeChain = chain;
  try { localStorage.setItem(STORE_KEY, String(chain.id)); } catch {}
  chainListeners.forEach((fn) => fn(chain));
}

const formatGwei = (g) => (g < 0.01 ? g.toFixed(4) : g < 1 ? g.toFixed(3) : g < 100 ? g.toFixed(1) : g.toFixed(0));

function initChainTelemetry() {
  const set = (id, text) => { const el = document.getElementById(id); if (el) el.textContent = text; };
  let seq = 0;
  const tick = async () => {
    if (document.hidden) return;
    const chain = activeChain;
    const mine = ++seq;
    const t0 = performance.now();
    try {
      let metric, height;
      if (isSolana(chain)) {
        // Solana: live user TPS (non-vote transactions) and current slot
        const [slot, samples] = await Promise.all([
          rpc("getSlot", [{ commitment: "confirmed" }], chain),
          rpc("getRecentPerformanceSamples", [1], chain),
        ]);
        const s = samples[0];
        metric = Math.round(s.numNonVoteTransactions / s.samplePeriodSecs).toLocaleString("en-US");
        height = slot;
      } else {
        const [gas, block] = await Promise.all([rpc("eth_gasPrice", [], chain), rpc("eth_blockNumber", [], chain)]);
        metric = formatGwei(Number(BigInt(gas)) / 1e9);
        height = parseInt(block, 16);
      }
      if (mine !== seq) return; // a newer request (e.g. after switching chains) owns the UI
      const ms = Math.round(performance.now() - t0);
      const blockNo = "#" + height;
      set("gas-price", metric);
      set("block-number", blockNo);
      set("footer-block", blockNo);
      set("rpc-ping", ms + "ms");
      set("rpc-latency", ms + "ms (" + chain.name + " RPC)");
    } catch {
      if (mine !== seq) return;
      set("rpc-latency", "offline");
      set("rpc-ping", "offline");
    }
  };
  chainListeners.push(() => {
    set("gas-price", "— ");
    set("block-number", "#—");
    set("footer-block", "#—");
    set("rpc-ping", "…");
    set("rpc-latency", "connecting…");
    tick();
  });
  tick();
  setInterval(tick, CONFIG.rpcRefreshMs);
  document.addEventListener("visibilitychange", tick);
}

function initChainPicker() {
  const btn = $("#chain-btn");
  const menu = $("#chain-menu");
  if (!btn || !menu) return;

  menu.innerHTML = CONFIG.chains
    .map(
      (c) => `<li role="option" data-chain="${c.id}" aria-selected="false" tabindex="-1"
        class="flex items-center gap-space-sm px-space-sm py-2 rounded cursor-pointer text-on-surface-variant hover:bg-surface-container-highest hover:text-on-surface focus:bg-surface-container-highest focus:text-on-surface outline-none">
        <span class="w-2 h-2 rounded-full shrink-0" style="background:${c.color}"></span>
        <span class="flex-1">${c.name}</span>
        <span class="material-symbols-outlined text-[16px] text-tertiary invisible" aria-hidden="true">check</span></li>`
    )
    .join("");
  const options = $$("[role=option]", menu);

  const render = (chain) => {
    $("#network-name").textContent = chain.name;
    $("#chain-dot").style.background = chain.color;
    const gasChain = $("#gas-chain");
    if (gasChain) gasChain.textContent = chain.name.toUpperCase();
    const sol = isSolana(chain);
    const setText = (id, t) => { const el = document.getElementById(id); if (el) el.textContent = t; };
    setText("gas-label", sol ? "TPS" : "GAS");
    setText("gas-unit", sol ? "" : "GWEI");
    setText("block-label", sol ? "SLOT" : "BLOCK");
    setText("footer-block-label", sol ? "Slot" : "Block");
    btn.setAttribute("aria-label", "Select network (current: " + chain.name + ")");
    options.forEach((o) => {
      const on = o.dataset.chain === String(chain.id);
      o.setAttribute("aria-selected", String(on));
      o.lastElementChild.classList.toggle("invisible", !on);
    });
  };

  const open = (isOpen) => {
    menu.classList.toggle("hidden", !isOpen);
    btn.setAttribute("aria-expanded", String(isOpen));
    if (isOpen) (options.find((o) => o.getAttribute("aria-selected") === "true") || options[0]).focus();
  };
  const choose = (id) => {
    setActiveChain(chainById(id));
    open(false);
    btn.focus();
  };

  btn.addEventListener("click", () => open(menu.classList.contains("hidden")));
  menu.addEventListener("click", (e) => {
    const li = e.target.closest("[role=option]");
    if (li) choose(li.dataset.chain);
  });
  menu.addEventListener("keydown", (e) => {
    const i = options.indexOf(document.activeElement);
    if (e.key === "ArrowDown") { e.preventDefault(); options[(i + 1) % options.length].focus(); }
    else if (e.key === "ArrowUp") { e.preventDefault(); options[(i - 1 + options.length) % options.length].focus(); }
    else if (e.key === "Enter" || e.key === " ") { e.preventDefault(); if (i >= 0) choose(options[i].dataset.chain); }
    else if (e.key === "Escape") { open(false); btn.focus(); }
    else if (e.key === "Tab") open(false);
  });
  document.addEventListener("click", (e) => {
    if (!e.target.closest("#chain-picker")) open(false);
  });

  chainListeners.push(render);
  render(activeChain);
}

// --- 5. Wallet connect: EVM (EIP-1193) + Solana (Phantom / Solflare) -----
// Read-only: only asks for the public address, never for signatures or transactions.
function initWallet() {
  const btn = $("#wallet-btn");
  const label = $("#wallet-label");
  const eth = window.ethereum;
  const solanaProvider = () => window.phantom?.solana || window.solflare || (window.solana?.connect ? window.solana : null);
  const short = (a) => a.slice(0, 4) + "…" + a.slice(-4);
  const accounts = { evm: null, solana: null };
  let syncingFromWallet = false;

  const ecosystem = () => (isSolana(activeChain) ? "solana" : "evm");
  const render = () => {
    const acct = accounts[ecosystem()];
    label.textContent = acct ? short(acct) : "Connect Wallet";
    btn.title = acct || "";
  };

  // EVM wallet changed network -> follow it in the picker when it's one we support
  const onWalletChain = (hex) => {
    const id = parseInt(hex, 16);
    const chain = chainById(id);
    if (!chain) {
      toast("Wallet is on a network this site doesn't list (chain " + id + ").");
      return;
    }
    syncingFromWallet = true;
    setActiveChain(chain);
    syncingFromWallet = false;
  };

  // Picker changed network -> ask the connected EVM wallet to switch too
  chainListeners.push(async (chain) => {
    render();
    if (isSolana(chain) || !eth || !accounts.evm || syncingFromWallet) return;
    const chainId = "0x" + chain.id.toString(16);
    try {
      await eth.request({ method: "wallet_switchEthereumChain", params: [{ chainId }] });
    } catch (err) {
      if (err?.code === 4902) {
        try {
          await eth.request({
            method: "wallet_addEthereumChain",
            params: [{ chainId, chainName: chain.name, rpcUrls: chain.rpcs, blockExplorerUrls: [chain.explorer],
              nativeCurrency: { name: chain.symbol, symbol: chain.symbol, decimals: 18 } }],
          });
        } catch { toast("Could not add " + chain.name + " to your wallet."); }
      } else if (err?.code === 4001) {
        toast("Network switch rejected in wallet.");
      }
    }
  });

  async function connectEvm() {
    if (!eth) {
      toast("No EVM wallet detected — install MetaMask or another EIP-1193 wallet.");
      return;
    }
    const list = await eth.request({ method: "eth_requestAccounts" });
    accounts.evm = list?.[0] || null;
    onWalletChain(await eth.request({ method: "eth_chainId" }));
    render();
    toast("Wallet connected — read-only, no transactions requested.");
  }

  async function connectSolana() {
    const sol = solanaProvider();
    if (!sol) {
      toast("No Solana wallet detected — install Phantom or Solflare.");
      return;
    }
    const res = await sol.connect();
    accounts.solana = (res?.publicKey || sol.publicKey)?.toString() || null;
    render();
    toast("Solana wallet connected — read-only, no transactions requested.");
    sol.on?.("disconnect", () => { accounts.solana = null; render(); });
    sol.on?.("accountChanged", (pk) => { accounts.solana = pk ? pk.toString() : null; render(); });
  }

  btn?.addEventListener("click", async () => {
    try {
      await (ecosystem() === "solana" ? connectSolana() : connectEvm());
    } catch (err) {
      toast(err?.code === 4001 ? "Connection request rejected." : "Could not connect wallet.");
    }
  });

  if (eth?.on) {
    eth.on("accountsChanged", (list) => { accounts.evm = list?.[0] || null; render(); });
    eth.on("chainChanged", onWalletChain);
  }
  render();
}

// --- 6. Project cost estimator -------------------------------------------
let latestEstimate = null;
let sentEstimate = null; // compact copy of the estimate handed to the contact form

function initEstimator() {
  const form = $("#estimator");
  if (!form) return;
  const E = CONFIG.estimator;
  const usd = (n) => "$" + (Math.round(n / 50) * 50).toLocaleString("en-US");

  $("#est-types").innerHTML = E.types
    .map(
      (t, i) => `<label class="flex items-center gap-space-sm p-space-sm rounded-lg bg-surface-container-high cursor-pointer hover:bg-surface-container-highest has-[:checked]:ring-1 has-[:checked]:ring-tertiary transition-colors">
        <input class="accent-tertiary" type="radio" name="type" value="${t.id}"${i === 1 ? " checked" : ""}/>
        <span class="material-symbols-outlined text-[20px] text-tertiary" aria-hidden="true">${t.icon}</span>
        <span class="font-body-sm text-body-sm text-on-surface">${t.label}</span></label>`
    )
    .join("");
  $("#est-features").innerHTML = E.features
    .map(
      (f) => `<label class="flex items-center gap-2 p-2 rounded bg-surface-container-high cursor-pointer hover:bg-surface-container-highest font-body-sm text-body-sm text-on-surface">
        <input class="accent-primary" type="checkbox" name="feature" value="${f.id}"/><span>${f.label}</span></label>`
    )
    .join("");

  const compute = () => {
    const data = new FormData(form);
    const type = E.types.find((t) => t.id === data.get("type")) || E.types[0];
    const screens = Number(data.get("screens")) || 1;
    const featureIds = type.designOnly ? [] : data.getAll("feature");
    const features = E.features.filter((f) => featureIds.includes(f.id));
    const designProvided = !type.designOnly && data.get("design") === "provided";
    const rush = data.get("timeline") === "rush";

    let hours = type.base + screens * type.perScreen + features.reduce((s, f) => s + f.hours, 0);
    if (designProvided) hours *= E.providedDesignMultiplier;
    const effortHours = hours;
    if (rush) hours *= E.rushMultiplier;

    const low = hours * E.rangeLow * E.hourlyRate;
    const high = hours * E.rangeHigh * E.hourlyRate;
    let weeks = Math.max(1, Math.ceil((effortHours * E.rangeHigh) / E.hoursPerWeek));
    if (rush) weeks = Math.max(1, Math.ceil(weeks * 0.7));

    latestEstimate = { type, screens, features, designProvided, rush, low, high, weeks,
      hoursLow: Math.round(effortHours * E.rangeLow), hoursHigh: Math.round(effortHours * E.rangeHigh) };

    // Features and design choice don't apply to design-only projects
    $("#est-features-set").classList.toggle("opacity-40", type.designOnly);
    $$("#est-features input").forEach((i) => (i.disabled = type.designOnly));
    $$('input[name="design"]').forEach((i) => (i.disabled = type.designOnly));

    $("#est-screens-out").textContent = screens;
    const hoursText = `${latestEstimate.hoursLow}–${latestEstimate.hoursHigh} h`;
    $("#est-cost").textContent = E.showPrices ? `${usd(low)} – ${usd(high)}` : `${latestEstimate.hoursLow}–${latestEstimate.hoursHigh} hours`;
    $("#est-hours").textContent = E.showPrices ? hoursText : "Fixed quote";
    $("#est-weeks").textContent = weeks === 1 ? "~1 week" : `~${weeks} weeks`;
    $("#est-summary").textContent = `${type.label}, ${screens} ${screens === 1 ? "screen" : "screens"}` +
      (features.length ? `, ${features.length} feature${features.length > 1 ? "s" : ""}` : "") +
      (rush ? ", rush delivery" : "") + ".";
    const includes = type.designOnly
      ? ["UX flows and wireframes", "High-fidelity UI in Figma", "Design system and tokens", "Clickable prototype and developer handoff"]
      : [designProvided ? "Build from your designs" : "UX, UI and design system", "Responsive front end (Next.js, TypeScript)", "Back end, database and deployment", "Testing, handoff and 2 weeks of fixes"];
    $("#est-includes").innerHTML = includes
      .map((t) => `<li class="flex items-start gap-2"><span class="material-symbols-outlined text-[16px] text-tertiary" aria-hidden="true">check_circle</span><span>${t}</span></li>`)
      .join("");
  };

  form.addEventListener("input", compute);
  form.addEventListener("change", compute);
  form.addEventListener("submit", (e) => e.preventDefault());
  compute();

  // Hand the estimate to the contact form
  $("#est-send")?.addEventListener("click", () => {
    const est = latestEstimate;
    if (!est) return;
    sentEstimate = {
      type: est.type.id, screens: est.screens, features: est.features.map((f) => f.id),
      design: est.type.designOnly ? "design-only" : est.designProvided ? "provided" : "full",
      timeline: est.rush ? "rush" : "standard", hours: [est.hoursLow, est.hoursHigh], weeks: est.weeks,
    };
    const domain = { web3: "defi", design: "ux", system: "system" }[est.type.id] || "fullstack";
    const domainInput = $(`#project-form input[name="domain"][value="${domain}"]`);
    if (domainInput) domainInput.checked = true;
    if (E.showPrices) {
      const mid = (est.low + est.high) / 2;
      const budget = mid < 1000 ? "under-1k" : mid < 5000 ? "1k-5k" : mid < 15000 ? "5k-15k" : "15k+";
      const budgetInput = $(`#project-form input[name="budget"][value="${budget}"]`);
      if (budgetInput) budgetInput.checked = true;
    }
    const msg = $("#message");
    if (msg) {
      msg.value =
        `Estimate from your site:\n` +
        `- Project: ${est.type.label}\n- Screens: ${est.screens}\n` +
        (est.features.length ? `- Features: ${est.features.map((f) => f.label).join(", ")}\n` : "") +
        (est.type.designOnly ? "" : `- Design: ${est.designProvided ? "I have designs" : "Design it for me"}\n`) +
        `- Timeline: ${est.rush ? "Rush" : "Standard"}\n` +
        (E.showPrices
          ? `- Ballpark: ${usd(est.low)} – ${usd(est.high)}, ~${est.weeks} week${est.weeks > 1 ? "s" : ""}\n\n`
          : `- Estimated effort: ${est.hoursLow}–${est.hoursHigh} hours, ~${est.weeks} week${est.weeks > 1 ? "s" : ""}\n\n`) +
        `(I understand this is an estimate, not a final price. Happy to discuss scope and budget.)\n\n` +
        `About my project:\n`;
    }
    $("#contact")?.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth" });
    setTimeout(() => { msg?.focus(); msg?.setSelectionRange(msg.value.length, msg.value.length); }, reducedMotion ? 0 : 600);
    toast("Estimate added to the contact form. Add a few details and send.");
  });
}

// --- 6b. Hire me + service shortcuts ----------------------------------
function initBooking() {
  $$("[data-book-call]").forEach((btn) =>
    btn.addEventListener("click", () => {
      if (CONFIG.bookingUrl) {
        window.open(CONFIG.bookingUrl, "_blank", "noopener");
        return;
      }
      // No scheduling link yet: pre-fill a call request in the contact form.
      const msg = $("#message");
      if (msg && !msg.value.trim()) {
        msg.value = "Hi Vincent, I'd like to hire you for a project.\n\nWhat I need:\n\nTimeline and budget:\n";
      }
      $("#contact")?.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth" });
      setTimeout(() => { $("#name")?.focus(); }, reducedMotion ? 0 : 600);
      toast("Tell me about your project and I'll reply within 24 hours.");
    })
  );

  // Wallet shortcuts: jump to the Web3 live demo and briefly highlight it.
  $$('a[href="#web3-demo"]').forEach((a) =>
    a.addEventListener("click", () => {
      const demo = $("#web3-demo");
      if (!demo) return;
      setTimeout(() => {
        demo.style.transition = "box-shadow .4s";
        demo.style.boxShadow = "0 0 0 2px #4fdbc8, 0 0 28px rgba(79,219,200,.35)";
        demo.focus({ preventScroll: true });
        setTimeout(() => (demo.style.boxShadow = ""), 1600);
      }, reducedMotion ? 0 : 500);
    })
  );

  // "Estimate this" on a service card: preselect the estimator and jump there.
  $$("[data-est-preset]").forEach((btn) =>
    btn.addEventListener("click", () => {
      const form = $("#estimator");
      if (!form) return;
      const type = form.querySelector(`input[name="type"][value="${btn.dataset.estPreset}"]`);
      if (type) type.checked = true;
      const wanted = (btn.dataset.estFeatures || "").split(",").filter(Boolean);
      $$('input[name="feature"]', form).forEach((f) => (f.checked = wanted.includes(f.value)));
      form.dispatchEvent(new Event("change", { bubbles: true }));
      $("#estimate")?.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth" });
    })
  );
}

// --- 7. Database (Supabase REST, optional) --------------------------------
// Enabled once CONFIG.supabase.url and publishableKey are set. The publishable key is
// safe to be public: row-level security (supabase/schema.sql) limits it to submitting
// inquiries/reviews and reading approved reviews.
const dbEnabled = () => Boolean(CONFIG.supabase?.url && CONFIG.supabase?.publishableKey);

async function dbRequest(path, { method = "GET", body } = {}) {
  const res = await fetch(`${CONFIG.supabase.url.replace(/\/$/, "")}/rest/v1/${path}`, {
    method,
    headers: {
      apikey: CONFIG.supabase.publishableKey,
      "content-type": "application/json",
      ...(method === "POST" ? { prefer: "return=minimal" } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(`Database error ${res.status}`);
  return method === "GET" ? res.json() : null;
}

// --- 8. Contact form -----------------------------------------------------
function initForm() {
  const form = $("#project-form");
  const status = $("#form-status");
  if (!form) return;
  const show = (msg, ok = true) => {
    status.textContent = msg;
    status.classList.remove("hidden");
    status.classList.toggle("text-tertiary", ok);
    status.classList.toggle("text-error", !ok);
  };

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(form));
    const submit = $("button[type=submit]", form);

    if (dbEnabled()) {
      submit.disabled = true;
      const fromEstimator = Boolean(sentEstimate) && (data.message || "").startsWith("Estimate from your site");
      try {
        await dbRequest("inquiries", {
          method: "POST",
          body: {
            source: fromEstimator ? "estimator" : "contact",
            name: data.name,
            email: data.email,
            domain: data.domain || null,
            budget: data.budget || null,
            message: data.message,
            estimate: fromEstimator ? sentEstimate : null,
          },
        });
        show("✓ Inquiry received. Expect a reply within 24 hours.");
        form.reset();
        sentEstimate = null;
        return;
      } catch {
        // Never lose a lead: fall through to the email fallback below.
      } finally {
        submit.disabled = false;
      }
    }

    if (CONFIG.formEndpoint) {
      submit.disabled = true;
      try {
        const res = await fetch(CONFIG.formEndpoint, {
          method: "POST",
          headers: { "content-type": "application/json", accept: "application/json" },
          body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error();
        show("✓ Proposal received. Expect a reply within 24 hours.");
        form.reset();
      } catch {
        show(`Something went wrong — email ${CONFIG.contactEmail} directly.`, false);
      } finally {
        submit.disabled = false;
      }
      return;
    }

    const subject = `Project inquiry: ${data.domain} (${data.budget})`;
    const body = `Name: ${data.name}\nEmail: ${data.email}\nDomain: ${data.domain}\nBudget: ${data.budget}\n\n${data.message}`;
    window.location.href = `mailto:${CONFIG.contactEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    show("✓ Opening your email client with the proposal pre-filled.");
  });
}

// --- 9. Wallet-signed reviews --------------------------------------------
// Optional: a reviewer signs the exact review text with their wallet (free, no transaction).
// Every visitor's browser re-verifies the signature before showing the badge, so a row
// inserted directly into the database can't fake it. Editing the review text breaks the badge.
const REVIEW_LIBS = {
  evm: { src: "https://cdn.jsdelivr.net/npm/ethers@6.13.4/dist/ethers.umd.min.js", integrity: "sha384-6Zl0Pc8zjSz8KvmNeXRvUQgY4ryFb+BwDvKCmLYcBME0joAaru491tQgi9B7zsMM", global: "ethers" },
  solana: { src: "https://cdn.jsdelivr.net/npm/tweetnacl@1.0.3/nacl-fast.min.js", integrity: "sha384-05+sicyRJQ56XpL4U9HJ8YbtSzFDvAg7apPKOGV6A0JsAJKFM68jp5oLnUjG5mEp", global: "nacl" },
};

const reviewMessage = ({ name, rating, body, signedAt }) =>
  `Review for Vincent Inferido's portfolio\n\nName: ${name}\nRating: ${rating}/5\nReview: ${body}\n\nSigned at: ${signedAt}`;

const bytesToHex = (bytes) => Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
const hexToBytes = (hex) => new Uint8Array(hex.replace(/^0x/, "").match(/../g).map((h) => parseInt(h, 16)));
const B58 = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
function base58Decode(str) {
  let bytes = [0];
  for (const ch of str) {
    let carry = B58.indexOf(ch);
    if (carry < 0) throw new Error("Invalid base58");
    for (let i = 0; i < bytes.length; i++) { carry += bytes[i] * 58; bytes[i] = carry & 0xff; carry >>= 8; }
    while (carry) { bytes.push(carry & 0xff); carry >>= 8; }
  }
  for (const ch of str) { if (ch === "1") bytes.push(0); else break; }
  return new Uint8Array(bytes.reverse());
}

const libLoads = {};
function loadLib(kind) {
  const lib = REVIEW_LIBS[kind];
  if (window[lib.global]) return Promise.resolve(window[lib.global]);
  libLoads[kind] ??= new Promise((resolve, reject) => {
    const s = document.createElement("script");
    Object.assign(s, { src: lib.src, integrity: lib.integrity, crossOrigin: "anonymous", async: true });
    s.onload = () => (window[lib.global] ? resolve(window[lib.global]) : reject(new Error("library missing")));
    s.onerror = () => reject(new Error("library failed to load"));
    document.head.appendChild(s);
  });
  return libLoads[kind];
}

const solanaWallet = () => window.phantom?.solana || window.solflare || (window.solana?.signMessage ? window.solana : null);

async function signReview(chain, fields) {
  const signedAt = new Date().toISOString();
  const message = reviewMessage({ ...fields, signedAt });
  if (chain === "evm") {
    const eth = window.ethereum;
    if (!eth) throw new Error("No EVM wallet found. Install MetaMask or a similar wallet.");
    const [address] = await eth.request({ method: "eth_requestAccounts" });
    const msgHex = "0x" + bytesToHex(new TextEncoder().encode(message));
    const signature = await eth.request({ method: "personal_sign", params: [msgHex, address] });
    return { wallet_chain: "evm", wallet_address: address.toLowerCase(), wallet_signature: signature.toLowerCase(), signed_at: signedAt };
  }
  const sol = solanaWallet();
  if (!sol) throw new Error("No Solana wallet found. Install Phantom or Solflare.");
  const res = await sol.connect();
  const address = (res?.publicKey || sol.publicKey).toString();
  const signed = await sol.signMessage(new TextEncoder().encode(message), "utf8");
  const sigBytes = signed?.signature || signed;
  return { wallet_chain: "solana", wallet_address: address, wallet_signature: bytesToHex(sigBytes), signed_at: signedAt };
}

async function verifyReviewSignature(r) {
  if (!r.wallet_chain || !r.wallet_signature || !r.signed_at) return false;
  const message = reviewMessage({ name: r.name, rating: r.rating, body: r.body, signedAt: new Date(r.signed_at).toISOString() });
  try {
    if (r.wallet_chain === "evm") {
      const ethers = await loadLib("evm");
      return ethers.verifyMessage(message, r.wallet_signature).toLowerCase() === r.wallet_address.toLowerCase();
    }
    if (r.wallet_chain === "solana") {
      const nacl = await loadLib("solana");
      return nacl.sign.detached.verify(new TextEncoder().encode(message), hexToBytes(r.wallet_signature), base58Decode(r.wallet_address));
    }
  } catch {
    return false;
  }
  return false;
}

// --- 10. Client reviews --------------------------------------------------
function initReviews() {
  const form = $("#review-form");
  const openBtn = $("#review-open");
  const list = $("#reviews-list");
  const status = $("#review-status");
  if (!form || !openBtn) return;

  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  const stars = (n) => Array.from({ length: 5 }, (_, i) =>
    `<span class="material-symbols-outlined text-[18px] ${i < n ? "text-tertiary" : "text-outline-variant"}" style="font-variation-settings:'FILL' ${i < n ? 1 : 0}" aria-hidden="true">star</span>`).join("");
  const setStatus = (msg, tone = "outline") => {
    status.textContent = msg;
    status.className = `font-label-sm text-label-sm text-${tone}`;
  };

  // Project suggestions from the portfolio's own project cards
  $("#rv-projects").innerHTML = $$("#projects-grid article h3")
    .map((h) => h.textContent.replace(/\s*\(\$OTTER\)/, "").trim())
    .filter((t) => t !== "More projects shipping")
    .map((t) => `<option value="${esc(t)}"></option>`)
    .join("");

  // Open / close the form
  openBtn.addEventListener("click", () => {
    const open = form.classList.contains("hidden");
    form.classList.toggle("hidden", !open);
    openBtn.setAttribute("aria-expanded", String(open));
    if (open) $("#rv-name").focus();
  });

  // Star rating: fill stars up to the selected value
  const starInputs = $$('#rv-stars input[name="rating"]');
  const paintStars = () => {
    const val = Number(form.rating.value || 0);
    starInputs.forEach((inp) => {
      const icon = inp.nextElementSibling;
      const on = Number(inp.value) <= val;
      icon.classList.toggle("text-tertiary", on);
      icon.classList.toggle("text-outline", !on);
      icon.style.fontVariationSettings = `'FILL' ${on ? 1 : 0}`;
    });
  };
  starInputs.forEach((i) => i.addEventListener("change", paintStars));
  paintStars();

  const body = $("#rv-body");
  body.addEventListener("input", () => ($("#rv-count").textContent = `(${body.value.length}/1500)`));

  // Optional wallet signature
  let walletSig = null;
  const walletStatus = $("#rv-wallet-status");
  const walletNote = walletStatus?.textContent;
  const setWalletStatus = (msg, tone = "outline") => { walletStatus.textContent = msg; walletStatus.className = `font-label-sm text-label-sm text-${tone}`; };
  const signedFields = () => ({ name: form.name.value.trim(), rating: Number(form.rating.value) || 5, body: form.body.value.trim() });
  $$("[data-sign]", form).forEach((btn) =>
    btn.addEventListener("click", async () => {
      const f = signedFields();
      if (f.name.length < 2 || f.body.length < 20) return setWalletStatus("Write your name and review first, then sign.", "error");
      $$("[data-sign]", form).forEach((b) => (b.disabled = true));
      setWalletStatus("Check your wallet to sign the message (free, no transaction)…");
      try {
        walletSig = await signReview(btn.dataset.sign, f);
        const a = walletSig.wallet_address;
        setWalletStatus(`✓ Signed by ${a.slice(0, 6)}…${a.slice(-4)} (${walletSig.wallet_chain === "evm" ? "EVM" : "Solana"}). If you edit your name, rating or review, sign again.`, "tertiary");
      } catch (err) {
        walletSig = null;
        setWalletStatus(err?.code === 4001 || /reject/i.test(err?.message || "") ? "Signature cancelled. You can still submit without it." : err?.message || "Could not sign. You can still submit without it.", "error");
      } finally {
        $$("[data-sign]", form).forEach((b) => (b.disabled = false));
      }
    })
  );
  // A signature only covers the exact text signed; editing it invalidates the signature.
  ["name", "body"].forEach((n) => form[n].addEventListener("input", () => { if (walletSig) { walletSig = null; setWalletStatus("Review changed after signing. Sign again for the Wallet-verified badge.", "error"); } }));
  starInputs.forEach((i) => i.addEventListener("change", () => { if (walletSig) { walletSig = null; setWalletStatus("Rating changed after signing. Sign again for the Wallet-verified badge.", "error"); } }));

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const d = Object.fromEntries(new FormData(form));
    if (d.website) return setStatus("✓ Thank you!", "tertiary"); // honeypot: silently drop bots
    if (!d.name || d.name.trim().length < 2) return setStatus("Please enter your name.", "error");
    if (!d.body || d.body.trim().length < 20) return setStatus("Please write at least 20 characters.", "error");
    if (!form.consent.checked) return setStatus("Please tick the box to allow publishing.", "error");

    const review = {
      name: d.name.trim(),
      role_company: d.role_company?.trim() || null,
      project: d.project?.trim() || null,
      rating: Number(d.rating) || 5,
      body: d.body.trim(),
      email: d.email?.trim() || null,
      consent: true,
      ...(walletSig || {}),
    };
    const submit = $("button[type=submit]", form);

    if (dbEnabled()) {
      submit.disabled = true;
      try {
        await dbRequest("reviews", { method: "POST", body: review });
        setStatus("✓ Thank you! Your review will appear once it's approved.", "tertiary");
        form.reset();
        paintStars();
        walletSig = null;
        if (walletNote) setWalletStatus(walletNote);
        return;
      } catch {
        // fall back to email so the review is never lost
      } finally {
        submit.disabled = false;
      }
    }
    const text = `Name: ${review.name}\nRole & company: ${review.role_company || "-"}\nProject: ${review.project || "-"}\n` +
      `Rating: ${review.rating}/5\nEmail: ${review.email || "-"}\nConsent to publish: yes\n` +
      (review.wallet_signature ? `Wallet (${review.wallet_chain}): ${review.wallet_address}\nSigned at: ${review.signed_at}\nSignature: ${review.wallet_signature}\n` : "") +
      `\n${review.body}`;
    window.location.href = `mailto:${CONFIG.contactEmail}?subject=${encodeURIComponent(`Client review from ${review.name}`)}&body=${encodeURIComponent(text)}`;
    setStatus("✓ Opening your email app with the review filled in. Just press send.", "tertiary");
  });

  // Show approved reviews (only when the database is connected and has some)
  if (!dbEnabled()) return;
  const badge = (icon, text, tone, title = "") =>
    `<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-surface-container-high font-label-sm text-label-sm text-${tone}"${title ? ` title="${esc(title)}"` : ""}>` +
    `<span class="material-symbols-outlined text-[14px]" style="font-variation-settings:'FILL' 1" aria-hidden="true">${icon}</span>${text}</span>`;
  const explorer = (r) => r.wallet_chain === "evm" ? `https://etherscan.io/address/${r.wallet_address}` : `https://solscan.io/account/${r.wallet_address}`;

  const order = "&order=featured.desc,created_at.desc&limit=12";
  dbRequest("reviews?select=name,role_company,project,rating,body,featured,created_at,verified_client,wallet_chain,wallet_address,wallet_signature,signed_at" + order)
    // Older database without the verification columns: still show reviews, just without badges.
    .catch(() => dbRequest("reviews?select=name,role_company,project,rating,body,featured,created_at" + order))
    .then((rows) => {
      if (!rows.length) return;
      list.innerHTML = rows.map((r, i) => `<figure class="p-space-lg rounded-xl bg-surface-container-low flex flex-col justify-between gap-space-md">
        <div class="flex flex-col gap-space-sm"><div class="flex" aria-label="${r.rating} out of 5 stars">${stars(r.rating)}</div>
        <blockquote class="font-body-md text-body-md text-on-surface-variant">&ldquo;${esc(r.body)}&rdquo;</blockquote></div>
        <figcaption class="flex flex-col gap-space-xs"><span class="font-headline-sm text-headline-sm font-bold text-on-surface">${esc(r.name)}</span>
        <span class="font-label-sm text-label-sm text-outline">${esc([r.role_company, r.project].filter(Boolean).join(" · "))}</span>
        <span class="flex flex-wrap gap-1" data-badges="${i}">${r.verified_client ? badge("verified", "Verified client", "tertiary", "Confirmed as a real client by Vincent") : ""}</span></figcaption></figure>`).join("");
      list.classList.remove("hidden");
      $("#reviews-intro").textContent = "Reviews from people I've built with. Worked with me too? I'd love to hear from you.";

      // Verify wallet signatures in this browser; only valid ones get the badge.
      rows.forEach(async (r, i) => {
        if (!r.wallet_signature || !(await verifyReviewSignature(r))) return;
        const a = r.wallet_address, short = `${a.slice(0, 6)}…${a.slice(-4)}`;
        $(`[data-badges="${i}"]`)?.insertAdjacentHTML("beforeend",
          `<a href="${explorer(r)}" target="_blank" rel="noreferrer">${badge("lock", "Wallet-verified", "primary", `Signature verified in your browser · ${r.wallet_chain === "evm" ? "EVM" : "Solana"} wallet ${short}`)}</a>`);
      });
    })
    .catch(() => {});
}

// --- 11. Audience landing pages: /?need=<topic>#contact pre-fills the message ------
function initNeedPrefill() {
  const need = new URLSearchParams(window.location.search).get("need");
  const texts = {
    crm: "Hi Vincent, I run an agency / service business and I'm interested in a custom CRM.\n\nHow we track clients today:\n\nTeam size:\n\nWhat I'd like to fix first:\n",
    booking: "Hi Vincent, I run a clinic / salon / studio and I'm interested in online booking.\n\nHow clients book today:\n\nNumber of staff / rooms:\n\nWhat I'd like to fix first (no-shows, double bookings, phone calls…):\n",
    dashboard: "Hi Vincent, I'm on a SaaS / Web3 team and I'm interested in a custom dashboard or admin panel.\n\nWhat we monitor today (tools):\n\nWho would use it:\n\nThe one screen I wish we had:\n",
  };
  const msg = $("#message");
  if (!need || !texts[need] || !msg || msg.value.trim()) return;
  msg.value = texts[need];
  msg.rows = 8;
  setTimeout(() => $("#name")?.focus({ preventScroll: true }), 400);
}

initRoles();
initFilters();
initNav();
initChainPicker();
initChainTelemetry();
initWallet();
initEstimator();
initBooking();
initForm();
initReviews();
initNeedPrefill();
