// Verifies supabase/schema.sql access rules on a real Postgres engine (PGlite). Run: npm run test:db
// Simulates Supabase's `anon` role (what the website's publishable key maps to).
import { PGlite } from "@electric-sql/pglite";
import fs from "node:fs";

const schema = fs.readFileSync(process.argv[2], "utf8");
const db = new PGlite();
let pass = 0, fail = 0;
const ok = (name) => { pass++; console.log("  PASS", name); };
const bad = (name, e) => { fail++; console.log("  FAIL", name, e ? "-> " + e : ""); };

async function asAnon(sql, params) {
  await db.exec("set role anon");
  try { return await db.query(sql, params); } finally { await db.exec("reset role"); }
}
async function expectOk(name, sql, params) {
  try { const r = await asAnon(sql, params); ok(name); return r; } catch (e) { bad(name, e.message); }
}
async function expectDenied(name, sql, params) {
  try { await asAnon(sql, params); bad(name, "was allowed"); } catch (e) { ok(`${name} (denied: ${e.message.split("\n")[0]})`); }
}

// Supabase-like roles
await db.exec(`create role anon nologin; create role authenticated nologin; grant usage on schema public to anon, authenticated;`);
await db.exec(schema);
await db.exec(schema); // idempotent re-run
console.log("schema applied twice (idempotent) OK");

console.log("\nreviews");
await expectOk("visitor submits a review (lands as pending)",
  `insert into public.reviews (name, role_company, project, rating, body, email, consent) values ($1,$2,$3,$4,$5,$6,true)`,
  ["Jane Client", "CTO, Acme", "CRM System", 5, "Vincent delivered a clean, fast CRM and was great to work with.", "jane@acme.com"]);
await expectDenied("visitor cannot self-approve a review",
  `insert into public.reviews (name, rating, body, consent, status) values ('Spammer', 5, 'Totally real review, trust me.', true, 'approved')`);
await expectDenied("visitor cannot mark review as featured",
  `insert into public.reviews (name, rating, body, consent, featured) values ('Spammer', 5, 'Totally real review, trust me.', true, true)`);
await expectDenied("review without publish consent is rejected",
  `insert into public.reviews (name, rating, body, consent) values ('No Consent', 4, 'Good work but do not publish.', false)`);
await expectDenied("rating out of range is rejected",
  `insert into public.reviews (name, rating, body, consent) values ('Bad Rating', 9, 'This rating is way too high.', true)`);
let r = await expectOk("visitor reads reviews", `select id, name, rating, body from public.reviews`);
if (r) (r.rows.length === 0 ? ok("pending review is NOT visible yet") : bad("pending review leaked", JSON.stringify(r.rows)));

// Owner approves in dashboard (superuser / service role)
await db.exec(`update public.reviews set status = 'approved' where name = 'Jane Client'`);
r = await expectOk("visitor reads reviews after approval", `select name, rating, body, featured from public.reviews`);
if (r) (r.rows.length === 1 && r.rows[0].name === "Jane Client" ? ok("approved review IS visible") : bad("approved review missing", JSON.stringify(r?.rows)));
await expectDenied("visitor cannot read reviewer email", `select email from public.reviews`);
await expectDenied("visitor cannot read status column", `select status from public.reviews`);
await expectDenied("visitor cannot edit a review", `update public.reviews set body = 'hacked' where true`);
await expectDenied("visitor cannot delete reviews", `delete from public.reviews where true`);

console.log("\ninquiries");
await expectOk("visitor submits contact inquiry",
  `insert into public.inquiries (source, name, email, domain, budget, message) values ('contact','Bob','bob@corp.io','system','5k-15k','We need a CRM for our sales team.')`);
await expectOk("visitor submits estimator inquiry with JSON estimate",
  `insert into public.inquiries (source, name, email, message, estimate) values ('estimator','Ann','ann@x.co','Estimate from your site: CRM, 12 screens', $1)`,
  [JSON.stringify({ type: "system", screens: 12, hours: [231, 326], weeks: 11 })]);
await expectDenied("visitor cannot read any inquiries", `select * from public.inquiries`);
await expectDenied("visitor cannot read inquiry emails", `select email from public.inquiries`);
await expectDenied("visitor cannot set inquiry status", `insert into public.inquiries (name, email, message, status) values ('X','x@y.zz','Hello there friend','won')`);
await expectDenied("invalid email rejected", `insert into public.inquiries (name, email, message) values ('Xavier','not-an-email','Hello there friend')`);
await expectDenied("unknown source rejected", `insert into public.inquiries (source, name, email, message) values ('hack','Xavier','x@y.zz','Hello there friend')`);
await expectDenied("visitor cannot delete inquiries", `delete from public.inquiries where true`);

const owner = await db.query(`select source, name, email from public.inquiries order by created_at`);
owner.rows.length === 2 ? ok("owner (dashboard) sees both inquiries") : bad("owner view", JSON.stringify(owner.rows));

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
