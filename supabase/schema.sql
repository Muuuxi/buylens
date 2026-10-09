-- Run in the selected Supabase project's SQL editor.
-- One JSONB snapshot table. The application accesses it only from server routes.
create table if not exists public.sessions (
  id uuid primary key,
  state text not null,
  data jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.sessions enable row level security;
revoke all on table public.sessions from anon, authenticated;
grant select, insert, update on table public.sessions to service_role;
-- No public read/write policies. The service-role key never reaches the browser.
