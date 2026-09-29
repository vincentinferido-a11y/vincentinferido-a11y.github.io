-- =============================================================================
-- Vincent Inferido portfolio: database schema
-- Run once in Supabase: Dashboard -> SQL Editor -> New query -> paste -> Run.
-- Safe to re-run (idempotent).
--
-- Access model (the website uses the public "publishable" key = role `anon`):
--   reviews    anon may INSERT (always lands as 'pending') and SELECT approved rows,
--              but never the reviewer's email. You approve rows in the dashboard.
--   inquiries  anon may INSERT only (contact form, estimator, access requests).
--              Nobody can read them from the website; you read them in the dashboard.
-- =============================================================================

-- ---------------------------------------------------------------- reviews
create table if not exists public.reviews (
  id            uuid primary key default gen_random_uuid(),
  created_at    timestamptz not null default now(),
  name          text not null check (char_length(name) between 2 and 80),
  role_company  text check (char_length(role_company) <= 120),
  project       text check (char_length(project) <= 120),
  rating        smallint not null check (rating between 1 and 5),
  body          text not null check (char_length(body) between 20 and 1500),
  email         text check (email is null or email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  consent       boolean not null default false check (consent),  -- permission to publish
  status        text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  featured      boolean not null default false
);

-- Verification (added 2026-09-29). Two independent badges:
--   verified_client  set ONLY by you in the dashboard after confirming the reviewer.
--   wallet_*         optional wallet signature of the review. The website re-verifies
--                    the signature in every visitor's browser before showing a badge,
--                    so a forged row in the database can't produce a fake badge.
alter table public.reviews add column if not exists verified_client  boolean not null default false;
alter table public.reviews add column if not exists wallet_chain     text;
alter table public.reviews add column if not exists wallet_address   text;
alter table public.reviews add column if not exists wallet_signature text;
alter table public.reviews add column if not exists signed_at        timestamptz;

alter table public.reviews drop constraint if exists reviews_wallet_complete;
alter table public.reviews add constraint reviews_wallet_complete check (
  (wallet_chain is null and wallet_address is null and wallet_signature is null and signed_at is null)
  or (wallet_chain is not null and wallet_address is not null and wallet_signature is not null and signed_at is not null)
);
alter table public.reviews drop constraint if exists reviews_wallet_format;
alter table public.reviews add constraint reviews_wallet_format check (
  wallet_chain is null
  or (wallet_chain = 'evm'    and wallet_address ~ '^0x[0-9a-fA-F]{40}$'            and wallet_signature ~ '^0x[0-9a-fA-F]{130}$')
  or (wallet_chain = 'solana' and wallet_address ~ '^[1-9A-HJ-NP-Za-km-z]{32,44}$' and wallet_signature ~ '^[0-9a-f]{128}$')
);

comment on table public.reviews is 'Client reviews submitted from the portfolio. Set status = approved to publish.';
comment on column public.reviews.email is 'Private. Never readable by the website (no column grant to anon).';
comment on column public.reviews.verified_client is 'Set to true yourself after confirming the reviewer really was a client.';
comment on column public.reviews.wallet_signature is 'Optional wallet signature of the review text; verified in the browser before a badge is shown.';

create index if not exists reviews_status_created_idx on public.reviews (status, created_at desc);

alter table public.reviews enable row level security;

-- Start from zero privileges, then grant only what the website needs.
revoke all on table public.reviews from anon, authenticated;
grant insert (name, role_company, project, rating, body, email, consent,
              wallet_chain, wallet_address, wallet_signature, signed_at) on table public.reviews to anon;
grant select (id, created_at, name, role_company, project, rating, body, featured,
              verified_client, wallet_chain, wallet_address, wallet_signature, signed_at) on table public.reviews to anon;

drop policy if exists "Visitors can submit a pending review" on public.reviews;
create policy "Visitors can submit a pending review"
  on public.reviews for insert to anon
  with check (status = 'pending' and featured = false and consent = true and verified_client = false);

drop policy if exists "Visitors can read approved reviews" on public.reviews;
create policy "Visitors can read approved reviews"
  on public.reviews for select to anon
  using (status = 'approved');

-- ---------------------------------------------------------------- inquiries
create table if not exists public.inquiries (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  source      text not null default 'contact' check (source in ('contact', 'estimator', 'access_request')),
  name        text not null check (char_length(name) between 2 and 120),
  email       text not null check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' and char_length(email) <= 200),
  domain      text check (char_length(domain) <= 40),
  budget      text check (char_length(budget) <= 40),
  project     text check (char_length(project) <= 120),
  message     text not null check (char_length(message) between 10 and 5000),
  estimate    jsonb check (estimate is null or pg_column_size(estimate) <= 4000),
  status      text not null default 'new' check (status in ('new', 'replied', 'won', 'lost', 'spam'))
);

comment on table public.inquiries is 'Leads from the portfolio. Readable only from the Supabase dashboard.';

create index if not exists inquiries_status_created_idx on public.inquiries (status, created_at desc);

alter table public.inquiries enable row level security;

revoke all on table public.inquiries from anon, authenticated;
grant insert (source, name, email, domain, budget, project, message, estimate) on table public.inquiries to anon;

drop policy if exists "Visitors can submit an inquiry" on public.inquiries;
create policy "Visitors can submit an inquiry"
  on public.inquiries for insert to anon
  with check (status = 'new');
