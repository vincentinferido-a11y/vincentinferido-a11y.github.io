-- Instant lead alerts: call the notify-lead Edge Function whenever a new inquiry or review is saved.
-- Replace REPLACE_WITH_WEBHOOK_SECRET with the same value you store as the WEBHOOK_SECRET
-- Edge Function secret. Keep the real value out of this public repo.
-- Safe to run more than once.

create extension if not exists pg_net with schema extensions;

create or replace function public.notify_new_row()
returns trigger
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  perform net.http_post(
    url := 'https://catbgcjucrassbmpwlnw.supabase.co/functions/v1/notify-lead',
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-webhook-secret', 'REPLACE_WITH_WEBHOOK_SECRET'),
    body := jsonb_build_object('type', 'INSERT', 'table', TG_TABLE_NAME, 'record', to_jsonb(NEW))
  );
  return NEW;
exception when others then
  -- Never block a form submission because an alert failed.
  raise warning 'notify_new_row failed: %', sqlerrm;
  return NEW;
end;
$$;

revoke all on function public.notify_new_row() from public, anon, authenticated;

drop trigger if exists notify_new_inquiry on public.inquiries;
create trigger notify_new_inquiry after insert on public.inquiries
  for each row execute function public.notify_new_row();

drop trigger if exists notify_new_review on public.reviews;
create trigger notify_new_review after insert on public.reviews
  for each row execute function public.notify_new_row();
