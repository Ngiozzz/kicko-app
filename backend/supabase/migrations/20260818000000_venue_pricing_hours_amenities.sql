-- Venue pricing split into peak/off-peak rates, plus operating hours.
-- venues table is empty at time of writing, so no backfill needed.

alter table public.venues rename column price_per_hour to price_peak;

alter table public.venues
  add column price_off_peak numeric(10,2) not null default 0,
  add column opening_time time not null default '06:00',
  add column closing_time time not null default '22:00';

alter table public.venues alter column price_off_peak drop default;
alter table public.venues alter column opening_time drop default;
alter table public.venues alter column closing_time drop default;
