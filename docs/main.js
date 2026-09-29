// ---------------------------------------------------------------------------
// Site config — edit these to make the portfolio yours.
// ---------------------------------------------------------------------------
const CONFIG = {
  contactEmail: "vincent.inferido@gmail.com",
  // Optional: a Formspree / Getform endpoint. When empty, the form opens the visitor's mail client.
  formEndpoint: "",
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
    "Full-Stack Product Builder",
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
        `About my project:\n`;
    }
    $("#contact")?.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth" });
    setTimeout(() => { msg?.focus(); msg?.setSelectionRange(msg.value.length, msg.value.length); }, reducedMotion ? 0 : 600);
    toast("Estimate added to the contact form. Add a few details and send.");
  });
}

// --- 7. Contact form -----------------------------------------------------
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

initRoles();
initFilters();
initNav();
initChainPicker();
initChainTelemetry();
initWallet();
initEstimator();
initForm();
