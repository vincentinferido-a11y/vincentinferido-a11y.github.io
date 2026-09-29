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
// Optional: an older schema version to apply first, to prove the upgrade path on a live database.
if (process.argv[3]) {
  await db.exec(fs.readFileSync(process.argv[3], "utf8"));
  await db.exec(`insert into public.reviews (name, rating, body, consent, status) values ('Old Row', 5, 'Review saved before the upgrade.', true, 'approved')`);
  console.log("older schema applied + existing row inserted (upgrade test)");
}
await db.exec(schema);
await db.exec(schema); // idempotent re-run
console.log("schema applied twice (idempotent) OK");
if (process.argv[3]) {
  const old = await db.query(`select name, verified_client, wallet_chain from public.reviews where name = 'Old Row'`);
  old.rows.length === 1 && old.rows[0].verified_client === false && old.rows[0].wallet_chain === null
    ? ok("existing reviews survive the upgrade with new columns defaulted")
    : bad("upgrade kept existing rows", JSON.stringify(old.rows));
  await db.exec(`delete from public.reviews where name = 'Old Row'`);
}

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

console.log("\nreview verification");
const evmAddr = "0x" + "ab".repeat(20), evmSig = "0x" + "cd".repeat(65);
const solAddr = "7EcDhSYGxXyscszYEp35KHN8vvw3svAuLKTzXwCFLtV", solSig = "ef".repeat(64);
await expectOk("visitor submits an EVM wallet-signed review",
  `insert into public.reviews (name, rating, body, consent, wallet_chain, wallet_address, wallet_signature, signed_at) values ('Eve Evm', 5, 'Signed with my EVM wallet, great work.', true, 'evm', $1, $2, now())`, [evmAddr, evmSig]);
await expectOk("visitor submits a Solana wallet-signed review",
  `insert into public.reviews (name, rating, body, consent, wallet_chain, wallet_address, wallet_signature, signed_at) values ('Sol Sam', 5, 'Signed with Phantom, smooth delivery.', true, 'solana', $1, $2, now())`, [solAddr, solSig]);
await expectDenied("incomplete wallet fields rejected",
  `insert into public.reviews (name, rating, body, consent, wallet_chain, wallet_address) values ('Half Sig', 5, 'Only half of the wallet data here.', true, 'evm', $1)`, [evmAddr]);
await expectDenied("malformed wallet address rejected",
  `insert into public.reviews (name, rating, body, consent, wallet_chain, wallet_address, wallet_signature, signed_at) values ('Bad Addr', 5, 'Address is not a real EVM address.', true, 'evm', '0x123', $1, now())`, [evmSig]);
await expectDenied("unknown wallet chain rejected",
  `insert into public.reviews (name, rating, body, consent, wallet_chain, wallet_address, wallet_signature, signed_at) values ('Bad Chain', 5, 'Chain value is not supported here.', true, 'bitcoin', $1, $2, now())`, [evmAddr, evmSig]);
await expectDenied("visitor cannot give themselves the Verified client badge",
  `insert into public.reviews (name, rating, body, consent, verified_client) values ('Faker', 5, 'I claim to be verified, trust me.', true, true)`);
await db.exec(`update public.reviews set status = 'approved' where name in ('Eve Evm', 'Sol Sam'); update public.reviews set verified_client = true where name = 'Jane Client'`);
r = await expectOk("visitor reads badges and wallet data of approved reviews",
  `select name, verified_client, wallet_chain, wallet_address, wallet_signature, signed_at from public.reviews order by name`);
if (r) {
  const byName = Object.fromEntries(r.rows.map((x) => [x.name, x]));
  byName["Jane Client"]?.verified_client === true ? ok("owner-set Verified client badge is visible") : bad("verified_client visible", JSON.stringify(byName["Jane Client"]));
  byName["Eve Evm"]?.wallet_address === evmAddr && byName["Sol Sam"]?.wallet_chain === "solana" ? ok("wallet signature data is readable for in-browser verification") : bad("wallet data readable", JSON.stringify(r.rows));
}
await expectDenied("visitor still cannot read reviewer email", `select email from public.reviews`);

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
