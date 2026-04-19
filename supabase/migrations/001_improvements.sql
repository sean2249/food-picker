-- Add proximity score (1=far, 10=very close) to restaurants
alter table restaurants
  add column if not exists proximity smallint check (proximity between 1 and 10);

-- Add AI-generated tags
alter table restaurants
  add column if not exists tags text[] not null default '{}';

-- Record which restaurant the user actually chose from a recommendation set
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
