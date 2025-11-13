# Notes Feature (User Session Notes)

This project now supports personal notes per companion/session for signed-in users.

What you get:
- Add a note while viewing a companion session
- See your notes for that companion
- Delete your own notes

## Database: Supabase schema
Create a `notes` table and enable Row Level Security (RLS).

Run the following SQL in your Supabase project (SQL editor):

```sql
-- 1) Table
create table if not exists public.notes (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  companion_id uuid not null,
  session_id uuid null,
  content varchar not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz null
);

-- 2) Indexes (optional, helps performance)
create index if not exists notes_user_idx on public.notes(user_id);
create index if not exists notes_companion_idx on public.notes(companion_id);

-- 3) RLS policies
alter table public.notes enable row level security;

-- Allow users to read only their own notes
create policy if not exists "Users can read own notes" on public.notes
for select to authenticated using (auth.uid()::text = user_id);

-- Allow users to insert their own notes
create policy if not exists "Users can insert own notes" on public.notes
for insert to authenticated with check (auth.uid()::text = user_id);

-- Allow users to delete their own notes
create policy if not exists "Users can delete own notes" on public.notes
for delete to authenticated using (auth.uid()::text = user_id);
```

Notes
- This app uses Clerk for auth on the server and Supabase client/admin for DB ops.
- Service role is used on server actions to perform inserts/deletes while still checking the user_id manually.

## Code changes overview
- lib/actions/notes.action.ts: server actions to list/add/delete notes
- components/notes-section.tsx: server component rendered on the companion session page
- app/companions/[id]/page.tsx: imports and renders <NotesSection /> under the session content

## Usage
1) Ensure you are signed in (Clerk).
2) Open a companion page: /companions/[id]
3) Scroll to "Your notes" section
4) Write a note and click "Save note"
5) Your notes list will update; you can delete notes via the trash icon

## Troubleshooting
- If saving or deleting fails, check your Supabase SQL migration ran successfully and your environment variables are set:
  - NEXT_PUBLIC_SUPABASE_URL
  - NEXT_PUBLIC_SUPABASE_ANON_KEY
  - SUPABASE_SERVICE_ROLE_KEY
- Check browser/network logs and server logs for Supabase errors.
