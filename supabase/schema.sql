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

comment on table public.reviews is 'Client reviews submitted from the portfolio. Set status = approved to publish.';
comment on column public.reviews.email is 'Private. Never readable by the website (no column grant to anon).';

create index if not exists reviews_status_created_idx on public.reviews (status, created_at desc);

alter table public.reviews enable row level security;

-- Start from zero privileges, then grant only what the website needs.
revoke all on table public.reviews from anon, authenticated;
grant insert (name, role_company, project, rating, body, email, consent) on table public.reviews to anon;
grant select (id, created_at, name, role_company, project, rating, body, featured) on table public.reviews to anon;

drop policy if exists "Visitors can submit a pending review" on public.reviews;
create policy "Visitors can submit a pending review"
  on public.reviews for insert to anon
  with check (status = 'pending' and featured = false and consent = true);

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
