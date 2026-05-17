-- Add entity_type to restaurants so we can host both restaurant and cafe rows
-- in a single table. Existing rows default to 'restaurant'; new cafes pass 'cafe'.
alter table restaurants
  add column if not exists entity_type text not null default 'restaurant'
  check (entity_type in ('restaurant', 'cafe'));

create index if not exists restaurants_entity_type_idx on restaurants(entity_type);

-- Mirror the column on recommendation_logs so feedback per type stays separable
alter table recommendation_logs
  add column if not exists entity_type text not null default 'restaurant'
  check (entity_type in ('restaurant', 'cafe'));
