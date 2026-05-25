-- Add Google Places metadata to restaurants so we can deep-link to Google Maps
-- and store the canonical address/coordinates. All nullable — existing rows are
-- untouched and stay valid (no Google data until edited/re-saved).
alter table restaurants
  add column if not exists address text,
  add column if not exists google_place_id text,
  add column if not exists google_maps_url text,
  add column if not exists latitude double precision,
  add column if not exists longitude double precision;
