-- Tink OAuth tokens. RLS is enabled with NO policies, so only the
-- service-role key (used exclusively inside Edge Functions) can read or
-- write this table. The anon/authenticated client keys can never see it.
create table tink_tokens (
  id uuid primary key default gen_random_uuid(),
  created_by_id uuid not null unique references auth.users(id) on delete cascade,
  access_token text not null,
  refresh_token text not null,
  expires_at timestamptz not null,
  scope text,
  transactions_cursor text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table tink_tokens enable row level security;
-- Intentionally no policies: default-deny for anon/authenticated roles.

create trigger tink_tokens_set_updated_at
  before update on tink_tokens
  for each row execute function set_updated_at();
