# Portfolio database (Supabase)

The portfolio stores **client reviews** and **inquiries** (contact form, cost estimator, access requests) in Supabase.
Until it's configured, both forms fall back to email, so nothing is lost.

| Table | Website visitors can | Only you (dashboard) can |
| --- | --- | --- |
| `reviews` | Submit a review (always saved as `pending`); read **approved** reviews (never the reviewer's email) | Approve, reject, feature, edit or delete reviews; see emails |
| `inquiries` | Submit an inquiry | Read everything, update `status` (`new`, `replied`, `won`, `lost`, `spam`) |

The rules are enforced by Postgres row-level security and column permissions in [`schema.sql`](schema.sql),
and verified by 22 automated checks: `npm run test:db`.

## One-time setup (about 10 minutes)

1. **Create a project** at https://supabase.com/dashboard. The free plan is enough. Pick a region close to your visitors (for example Singapore).
2. **Create the tables:** go to **SQL Editor → New query**, paste the whole contents of `schema.sql`, and click **Run**. It's safe to run again later.
3. **Copy two values** from **Project Settings → API Keys** (and the project URL from **Project Settings → Data API**):
   - Project URL, like `https://abcdefgh.supabase.co`
   - **Publishable key**, starting with `sb_publishable_…`
4. **Paste them** into `docs/main.js`:
   ```js
   supabase: {
     url: "https://abcdefgh.supabase.co",
     publishableKey: "sb_publishable_...",
   },
   ```
   The publishable key is designed to be public. **Never** paste the **secret** key (`sb_secret_…`) or the legacy `service_role` key into the website.
5. Commit and push. GitHub Pages redeploys in about a minute.

## Day-to-day

- **Approve a review:** go to **Table Editor → reviews**, set `status` to `approved` (and optionally `featured` to `true` to pin it first). It appears on the site on the next page load.
- **Read inquiries:** go to **Table Editor → inquiries**, newest first. Estimator inquiries include the full estimate in the `estimate` column.
- **Get an email for every new inquiry (recommended):** go to **Database → Webhooks → Create a new hook** on table `inquiries`, event `INSERT`, and point it at an email service (for example a Zapier or Make "Catch Hook → Send Email" zap, or a Supabase Edge Function using Resend). Without it, check the dashboard regularly.

## Spam protection

- Forms include a hidden honeypot field that bots fill in and humans never see.
- Database checks reject bad data (length limits, email format, rating 1–5, publish consent required).
- If spam becomes a problem, add Cloudflare Turnstile (free CAPTCHA) and Supabase's CAPTCHA protection.

## Custom domain (when you buy it)

1. In the portfolio repo on GitHub, go to **Settings → Pages → Custom domain**, enter your domain, and save. This adds `docs/CNAME`; pull it locally afterwards.
2. At your domain registrar, add these DNS records:
   - `A` records for the root domain: `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`
   - `CNAME` record: `www` pointing to `vincentinferido-a11y.github.io`
3. Once DNS works, tick **Enforce HTTPS** in GitHub Pages.
4. Nothing changes on the Supabase side: the Data API accepts requests from any domain, and security comes from the rules above, not from the domain.
5. Update the site URL in your GitHub profile, LinkedIn and project READMEs.
