-- Coarse device/browser analytics — one row per signup or sign-in, parsed
-- server-side from the User-Agent header (see deviceInfo.service.ts).
-- Deliberately counts events, not unique users: a rough proxy for
-- "usage by device", not a headcount. Service-role only (no policies),
-- same convention as every other backend-owned table.
create table public.device_events (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.users(id) on delete cascade,
  event        text not null check (event in ('signup', 'signin')),
  device_type  text not null check (device_type in ('mobile', 'tablet', 'desktop', 'other')),
  browser      text,
  created_at   timestamptz not null default now()
);

create index idx_device_events_user on public.device_events(user_id);
create index idx_device_events_device_type on public.device_events(device_type);

alter table public.device_events enable row level security;
