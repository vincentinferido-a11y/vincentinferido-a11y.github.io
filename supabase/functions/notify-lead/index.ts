// Supabase Edge Function: notify-lead
// Called by a database trigger (see supabase/notify.sql) whenever a new row lands in
// public.inquiries or public.reviews. Emails Vincent instantly via Resend, with the lead's
// address as reply-to. Optionally auto-replies to the lead once a verified sending domain exists.
//
// Secrets (Supabase dashboard → Edge Functions → Secrets):
//   RESEND_API_KEY   required  Resend API key (never commit it)
//   WEBHOOK_SECRET   required  shared secret; must match the x-webhook-secret header sent by the trigger
//   ALERT_EMAIL      optional  where alerts go (default vincent.inferido@gmail.com)
//   FROM_EMAIL       optional  verified sender, e.g. "Vincent Inferido <hello@yourdomain.com>".
//                              When set, leads also get an automatic reply. Until then, alerts are
//                              sent from Resend's test sender (which may only email your own inbox).

type Row = Record<string, unknown>;
type Payload = { type?: string; table?: string; record?: Row };

const esc = (v: unknown) =>
  String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
const isEmail = (v: unknown): v is string => typeof v === "string" && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v) && v.length <= 200;

async function send(apiKey: string, body: Record<string, unknown>) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Resend ${res.status}: ${await res.text()}`);
}

function table(rows: Array<[string, unknown]>) {
  return `<table style="border-collapse:collapse;font:14px/1.5 -apple-system,Segoe UI,Arial,sans-serif">${rows
    .filter(([, v]) => v !== null && v !== undefined && v !== "")
    .map(([k, v]) => `<tr><td style="padding:6px 12px 6px 0;color:#667;vertical-align:top;white-space:nowrap">${esc(k)}</td><td style="padding:6px 0;white-space:pre-wrap">${esc(typeof v === "object" ? JSON.stringify(v, null, 2) : v)}</td></tr>`)
    .join("")}</table>`;
}

function describe(tableName: string, r: Row) {
  const est = (r.estimate ?? {}) as Row;
  const brand = est.brand === "spanwise" ? "Spanwise" : "Portfolio";
  if (tableName === "reviews") {
    return {
      brand, kind: "review",
      subject: `⭐ New ${r.rating}-star review to approve: ${r.name}`,
      html: `<h2 style="font:600 18px Arial">New review waiting for approval</h2>${table([
        ["Name", r.name], ["Role / company", r.role_company], ["Project", r.project], ["Rating", `${r.rating} / 5`],
        ["Review", r.body], ["Private email", r.email], ["Wallet-signed", r.wallet_chain ? `yes (${r.wallet_chain})` : "no"],
      ])}<p style="font:14px Arial">Approve it in Supabase → Table Editor → reviews → set <b>status</b> to <b>approved</b>.</p>`,
    };
  }
  const label = est.form === "intake" ? "Project request" : r.source === "estimator" ? "Estimate request" : r.source === "access_request" ? "Access request" : "Message";
  return {
    brand, kind: "lead",
    subject: `🔔 [${brand}] New ${label.toLowerCase()} from ${r.name}${r.project ? ` · ${String(r.project).slice(0, 60)}` : ""}`,
    html: `<h2 style="font:600 18px Arial">${esc(label)} from ${esc(r.name)}</h2>
<p style="font:14px Arial;color:#667">Reply to this email to answer ${esc(r.name)} directly. Replying within a few hours wins far more projects than replying tomorrow.</p>
${table([["Name", r.name], ["Email", r.email], ["Project / company", r.project], ["Service", r.domain], ["Budget", r.budget], ["Message", r.message], ["Details", Object.keys(est).length ? est : null], ["Received", r.created_at]])}`,
  };
}

function autoReplyHtml(name: string, brand: string) {
  const who = brand === "Spanwise" ? "Spanwise Studio" : "Vincent Inferido";
  return `<div style="font:15px/1.6 -apple-system,Segoe UI,Arial,sans-serif;color:#1b1f27;max-width:560px">
<p>Hi ${esc(name.split(" ")[0] || name)},</p>
<p>Thanks for reaching out. Your message came through, and I'll personally reply within 24 hours (usually much sooner).</p>
<p><b>What happens next:</b></p>
<ol><li>I review what you sent and note any questions.</li><li>I reply with those questions and a suggested approach.</li><li>If it's a fit, you get a written, fixed-scope plan before any work starts.</li></ol>
<p>While you wait, you might like these practical guides: <a href="https://vincentinferido-a11y.github.io/blog/">vincentinferido-a11y.github.io/blog</a></p>
<p>Talk soon,<br>${esc(who)}</p></div>`;
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });
  const secret = Deno.env.get("WEBHOOK_SECRET");
  if (!secret || req.headers.get("x-webhook-secret") !== secret) return new Response("Unauthorized", { status: 401 });

  const apiKey = Deno.env.get("RESEND_API_KEY");
  if (!apiKey) return new Response("RESEND_API_KEY not set", { status: 500 });
  const alertTo = Deno.env.get("ALERT_EMAIL") || "vincent.inferido@gmail.com";
  const from = Deno.env.get("FROM_EMAIL");

  let payload: Payload;
  try { payload = await req.json(); } catch { return new Response("Bad JSON", { status: 400 }); }
  const r = payload.record;
  const tableName = payload.table ?? "";
  if (!r || !["inquiries", "reviews"].includes(tableName)) return new Response("Ignored", { status: 200 });

  const d = describe(tableName, r);
  const errors: string[] = [];
  try {
    await send(apiKey, {
      from: from || "Lead Alerts <onboarding@resend.dev>",
      to: [alertTo],
      subject: d.subject,
      html: d.html,
      ...(isEmail(r.email) ? { reply_to: r.email } : {}),
    });
  } catch (e) { errors.push(`alert: ${(e as Error).message}`); }

  // Auto-reply to new leads (not reviews), only with a verified sending domain.
  if (from && d.kind === "lead" && isEmail(r.email)) {
    try {
      await send(apiKey, {
        from, to: [r.email], reply_to: alertTo,
        subject: "Thanks, I got your message",
        html: autoReplyHtml(String(r.name ?? ""), d.brand),
      });
    } catch (e) { errors.push(`auto-reply: ${(e as Error).message}`); }
  }

  if (errors.length) console.error(errors.join(" | "));
  return new Response(JSON.stringify({ ok: errors.length === 0, errors }), { status: errors.length ? 502 : 200, headers: { "Content-Type": "application/json" } });
});
