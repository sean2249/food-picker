-- Restaurants table
create table if not exists restaurants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  mrt_station text,
  items text[] not null default '{}',
  visited boolean not null default false,
  visit_date timestamptz,
  rating smallint check (rating between 1 and 5),
  review text,
  proximity smallint check (proximity between 1 and 10),
  tags text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Mood logs
create table if not exists mood_logs (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid references restaurants(id) on delete set null,
  mood text not null,
  created_at timestamptz not null default now()
);

-- Telegram bot sessions
create table if not exists telegram_sessions (
  user_id bigint primary key,
  session jsonb not null default '{}',
  updated_at timestamptz not null default now()
);

-- Enable row-level security
alter table restaurants enable row level security;
alter table mood_logs enable row level security;
alter table telegram_sessions enable row level security;

drop policy if exists "Allow all" on restaurants;
drop policy if exists "Allow all" on mood_logs;
drop policy if exists "Allow all" on telegram_sessions;

create policy "Allow all" on restaurants for all to authenticated using (true) with check (true);
create policy "Allow all" on mood_logs for all to authenticated using (true) with check (true);
create policy "Allow all" on telegram_sessions for all to authenticated using (true) with check (true);

-- Auto-clean sessions inactive for more than 24 hours
-- NOTE: pg_cron is only available on Supabase Pro plan.
-- If on free plan, skip this block.
-- Enable pg_cron first: Supabase Dashboard → Database → Extensions → enable pg_cron
select cron.schedule(
  'clean-telegram-sessions',
  '0 4 * * *',
  $$delete from telegram_sessions where updated_at < now() - interval '24 hours'$$
);

-- Recommendation feedback logs
create table if not exists recommendation_logs (
  id uuid primary key default gen_random_uuid(),
  chosen_restaurant_id uuid references restaurants(id) on delete set null,
  shown_restaurant_ids uuid[] not null default '{}',
  created_at timestamptz not null default now()
);

alter table recommendation_logs enable row level security;
drop policy if exists "Allow all" on recommendation_logs;
create policy "Allow all" on recommendation_logs
  for all to authenticated using (true) with check (true);