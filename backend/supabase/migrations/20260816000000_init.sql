-- ============================================================
-- KICKO — INITIAL SCHEMA
-- First migration for the Kicko rebuild. Scope is deliberately
-- minimal — just what an Explore/venue-list screen needs to exist
-- against real data. Bookings, match sessions, team wallets, and
-- notifications each get their own migration when that screen
-- actually gets built, not speculatively here — same discipline
-- Thurfa's own schema.sql documents ("build later when you
-- actually wire it up").
-- ============================================================

create extension if not exists pgcrypto; -- gen_random_uuid()

-- ============================================================
-- USERS (profile only — credentials live in Supabase auth.users)
-- ============================================================
create table public.users (
  id                     uuid primary key references auth.users(id) on delete cascade,
  role                   text not null check (role in ('player', 'owner', 'manager', 'admin')),
  name                   text not null,
  email                  text not null unique,
  phone                  text unique,
  suspended              boolean not null default false,

  -- player-only
  sport                  text,
  position               text,

  -- manager-only
  owner_id               uuid references public.users(id) on delete set null,

  created_at             timestamptz not null default now(),

  constraint owner_id_only_for_managers
    check (owner_id is null or role = 'manager')
);

create index idx_users_owner_id on public.users(owner_id);
create index idx_users_role on public.users(role);

-- ============================================================
-- VENUES
-- ============================================================
create table public.venues (
  id                uuid primary key default gen_random_uuid(),
  owner_id          uuid not null references public.users(id) on delete cascade,
  name              text not null,
  location          text not null,
  sport             text not null,
  price_per_hour    numeric(10,2) not null,
  amenities         text[] not null default '{}',
  status            text not null default 'pending' check (status in ('pending', 'verified', 'suspended')),
  image_url         text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index idx_venues_owner_id on public.venues(owner_id);
create index idx_venues_status on public.venues(status);

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger venues_set_updated_at
  before update on public.venues
  for each row execute function public.set_updated_at();

-- Same posture as Thurfa's schema: RLS enabled with no policies yet
-- as a safety net. Access goes through the backend's service-role
-- client until real policies are written.
alter table public.users enable row level security;
alter table public.venues enable row level security;
