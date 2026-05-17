-- Remove the proximity (1-10 self-rated distance) field.
-- Replaced by MRT line/station filtering derived from mrt_station + lib/mrt-stations.ts.
alter table restaurants drop column if exists proximity;
