-- Supabase SQL to create the `summaries` table used by the app
-- Run this in Supabase SQL Editor (or via migrations) before using the Smart Summary feature.

-- 1) Table definition
create table if not exists public.summaries (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  companion_id text not null,
  session_id text null,
  title text null,
  points jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz null
);

-- 2) Helpful index for faster lookups (latest first per user/companion)
create index if not exists idx_summaries_user_companion_created_desc
  on public.summaries (user_id, companion_id, created_at desc);

-- 3) Enable Row Level Security (RLS)
alter table public.summaries enable row level security;

-- 4) Policies
-- Choose ONE of the following policy sets depending on how your project authenticates with Supabase:
-- A) If you use Supabase Auth directly (auth.uid() is available):
--    Uncomment these 3 policies and comment out the Clerk/JWT ones below.
--
-- drop policy if exists "Summaries select own" on public.summaries;
-- drop policy if exists "Summaries insert own" on public.summaries;
-- drop policy if exists "Summaries delete own" on public.summaries;
-- create policy "Summaries select own" on public.summaries
--   for select using (user_id = auth.uid());
-- create policy "Summaries insert own" on public.summaries
--   for insert with check (user_id = auth.uid());
-- create policy "Summaries delete own" on public.summaries
--   for delete using (user_id = auth.uid());

-- B) If you proxy Clerk (or another provider) to Supabase using JWTs,
--    and store the user id in the token's `sub` claim (common with Clerk),
--    use these policies which rely on request.jwt.claims.sub.
--    Adjust the claim path if your setup differs.

drop policy if exists "Summaries select own (jwt sub)" on public.summaries;
drop policy if exists "Summaries insert own (jwt sub)" on public.summaries;
drop policy if exists "Summaries delete own (jwt sub)" on public.summaries;
create policy "Summaries select own (jwt sub)" on public.summaries
  for select using (user_id = coalesce(nullif(current_setting('request.jwt.claims', true), '')::jsonb->>'sub', '')); 
create policy "Summaries insert own (jwt sub)" on public.summaries
  for insert with check (user_id = coalesce(nullif(current_setting('request.jwt.claims', true), '')::jsonb->>'sub', ''));
create policy "Summaries delete own (jwt sub)" on public.summaries
  for delete using (user_id = coalesce(nullif(current_setting('request.jwt.claims', true), '')::jsonb->>'sub', ''));

-- 5) Optional: keep updated_at in sync (if you plan to support updates)
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- attach to summaries table
drop trigger if exists trg_summaries_updated_at on public.summaries;
create trigger trg_summaries_updated_at
before update on public.summaries
for each row execute function public.set_updated_at();
