-- The Financial Hub: initial schema
-- All user-owned tables use RLS scoped to auth.uid() = created_by_id.

create extension if not exists pgcrypto;

create type living_situation as enum ('alone', 'roommates', 'partner');
create type world_key as enum ('starter', 'balanced', 'independent');
create type category_key as enum (
  'food', 'transport', 'shopping', 'going_out', 'coffee',
  'health', 'subscriptions', 'bnpl', 'cash', 'other'
);
create type subscription_category as enum (
  'entertainment', 'utilities', 'health', 'productivity', 'finance', 'other'
);
create type quest_type as enum ('daily', 'monthly');
create type expense_source as enum ('manual', 'tink');

-- ---------------------------------------------------------------------------
-- user_profiles
-- ---------------------------------------------------------------------------
create table user_profiles (
  id uuid primary key default gen_random_uuid(),
  created_by_id uuid not null references auth.users(id) on delete cascade,
  display_name text not null,
  living_situation living_situation not null default 'alone',
  monthly_income numeric(12,2) not null default 0,
  income_varies boolean not null default false,
  rent numeric(12,2) not null default 0,
  utilities numeric(12,2) not null default 0,
  insurance numeric(12,2) not null default 0,
  subscriptions numeric(12,2) not null default 0,
  other_fixed_costs numeric(12,2) not null default 0,
  savings_goal numeric(12,2) not null default 0,
  uses_bnpl boolean not null default false,
  bnpl_owed numeric(12,2) not null default 0,
  onboarding_completed boolean not null default false,
  total_points integer not null default 0,
  streak_days integer not null default 0,
  last_active_date date,
  solo_mode boolean not null default false,
  daily_question_answered_today boolean not null default false,
  last_question_date date,
  current_world world_key not null default 'starter',
  tink_connected boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (created_by_id)
);

alter table user_profiles enable row level security;

create policy "profile owner read" on user_profiles for select
  using (auth.uid() = created_by_id);
create policy "profile owner insert" on user_profiles for insert
  with check (auth.uid() = created_by_id);
create policy "profile owner update" on user_profiles for update
  using (auth.uid() = created_by_id);

-- ---------------------------------------------------------------------------
-- expenses
-- ---------------------------------------------------------------------------
create table expenses (
  id uuid primary key default gen_random_uuid(),
  created_by_id uuid not null references auth.users(id) on delete cascade,
  amount numeric(12,2) not null,
  category category_key not null,
  description text,
  date date not null default current_date,
  is_cash boolean not null default false,
  source expense_source not null default 'manual',
  tink_transaction_id text,
  created_at timestamptz not null default now()
);

create index expenses_owner_date_idx on expenses (created_by_id, date desc);
create unique index expenses_tink_transaction_unique_idx on expenses (tink_transaction_id)
  where tink_transaction_id is not null;

alter table expenses enable row level security;

create policy "expenses owner read" on expenses for select
  using (auth.uid() = created_by_id);
create policy "expenses owner insert" on expenses for insert
  with check (auth.uid() = created_by_id);
create policy "expenses owner update" on expenses for update
  using (auth.uid() = created_by_id);
-- delete intentionally omitted (matches spec: "delete": null) -- expenses are corrected, not erased.

-- ---------------------------------------------------------------------------
-- subscriptions
-- ---------------------------------------------------------------------------
create table subscriptions (
  id uuid primary key default gen_random_uuid(),
  created_by_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  amount numeric(12,2) not null,
  renewal_day smallint not null check (renewal_day between 1 and 31),
  is_active boolean not null default true,
  category subscription_category not null default 'entertainment',
  notes text,
  created_at timestamptz not null default now()
);

alter table subscriptions enable row level security;

create policy "subscriptions owner all" on subscriptions for all
  using (auth.uid() = created_by_id)
  with check (auth.uid() = created_by_id);

-- ---------------------------------------------------------------------------
-- savings_goals
-- ---------------------------------------------------------------------------
create table savings_goals (
  id uuid primary key default gen_random_uuid(),
  created_by_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  target_amount numeric(12,2) not null,
  saved_amount numeric(12,2) not null default 0,
  priority smallint not null default 1,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table savings_goals enable row level security;

create policy "savings_goals owner all" on savings_goals for all
  using (auth.uid() = created_by_id)
  with check (auth.uid() = created_by_id);

-- ---------------------------------------------------------------------------
-- quests
-- ---------------------------------------------------------------------------
create table quests (
  id uuid primary key default gen_random_uuid(),
  created_by_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text,
  points integer not null default 10,
  quest_type quest_type not null,
  target_value numeric(12,2) not null default 1,
  current_value numeric(12,2) not null default 0,
  is_completed boolean not null default false,
  date date not null default current_date
);

create index quests_owner_date_idx on quests (created_by_id, date desc);

alter table quests enable row level security;

create policy "quests owner all" on quests for all
  using (auth.uid() = created_by_id)
  with check (auth.uid() = created_by_id);

-- ---------------------------------------------------------------------------
-- daily_questions -- shared content, readable by any authenticated user
-- ---------------------------------------------------------------------------
create table daily_questions (
  id uuid primary key default gen_random_uuid(),
  question_text text not null,
  options text[] not null,
  correct_index smallint not null,
  explanation text not null,
  world_level world_key not null,
  related_video_title text
);

alter table daily_questions enable row level security;

create policy "daily_questions read all authenticated" on daily_questions for select
  using (auth.role() = 'authenticated');

-- ---------------------------------------------------------------------------
-- weekly_insights
-- ---------------------------------------------------------------------------
create table weekly_insights (
  id uuid primary key default gen_random_uuid(),
  created_by_id uuid not null references auth.users(id) on delete cascade,
  insight_text text not null,
  week_start date not null,
  total_spent numeric(12,2) not null default 0,
  budget numeric(12,2) not null default 0,
  top_category category_key,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create unique index weekly_insights_owner_week_idx on weekly_insights (created_by_id, week_start);

alter table weekly_insights enable row level security;

create policy "weekly_insights owner all" on weekly_insights for all
  using (auth.uid() = created_by_id)
  with check (auth.uid() = created_by_id);

-- ---------------------------------------------------------------------------
-- bnpl_commitments (Klarna / pay-later tracking)
-- ---------------------------------------------------------------------------
create table bnpl_commitments (
  id uuid primary key default gen_random_uuid(),
  created_by_id uuid not null references auth.users(id) on delete cascade,
  description text not null,
  amount numeric(12,2) not null,
  due_date date,
  is_settled boolean not null default false,
  created_at timestamptz not null default now()
);

alter table bnpl_commitments enable row level security;

create policy "bnpl_commitments owner all" on bnpl_commitments for all
  using (auth.uid() = created_by_id)
  with check (auth.uid() = created_by_id);

-- ---------------------------------------------------------------------------
-- tink_connections -- never stores tokens here; those live encrypted
-- server-side (see supabase/functions/tink-exchange). This table only
-- records that a connection exists, for UI state.
-- ---------------------------------------------------------------------------
create table tink_connections (
  id uuid primary key default gen_random_uuid(),
  created_by_id uuid not null references auth.users(id) on delete cascade,
  provider_name text,
  external_account_id text not null,
  connected_at timestamptz not null default now(),
  last_synced_at timestamptz
);

alter table tink_connections enable row level security;

create policy "tink_connections owner read" on tink_connections for select
  using (auth.uid() = created_by_id);
-- insert/update to this table happens only via the service-role key inside
-- the tink-exchange / tink-sync Edge Functions, never directly from the app.

-- ---------------------------------------------------------------------------
-- updated_at trigger for user_profiles
-- ---------------------------------------------------------------------------
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger user_profiles_set_updated_at
  before update on user_profiles
  for each row execute function set_updated_at();
