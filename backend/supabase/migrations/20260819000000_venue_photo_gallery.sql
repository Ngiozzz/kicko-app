-- Multiple venue photos instead of a single cover image.
-- venues table is empty at time of writing, so no backfill needed.

alter table public.venues add column photos text[] not null default '{}';
alter table public.venues drop column image_url;
