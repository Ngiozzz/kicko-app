-- ============================================================
-- TOURNAMENTS — team-based competitions at a venue. An owner creates
-- one at their own verified venue; captains register a Team (the
-- persistent roster from the previous migration) and pay a flat entry
-- fee; the organizer manually creates fixtures (Team A vs Team B, a
-- time, a result) as the day unfolds. Deliberately no auto-generated
-- brackets/pools — that's a scheduling product in its own right, not
-- something to build before one real tournament has actually run.
-- ============================================================

create table public.tournaments (
  id                     uuid primary key default gen_random_uuid(),
  venue_id               uuid not null references public.venues(id) on delete cascade,
  owner_id               uuid not null references public.users(id) on delete cascade,
  name                   text not null,
  description            text,
  -- Free text, same convention as match_sessions.format (e.g. rugby's
  -- "Sevens" / "Union 15s" / "Touch") — descriptive only.
  format                 text,
  entry_fee              numeric(10,2) not null,
  start_at               timestamptz not null,
  end_at                 timestamptz not null,
  registration_deadline  timestamptz,
  status                 text not null default 'draft' check (status in ('draft', 'open', 'in_progress', 'completed', 'cancelled')),
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);

create index idx_tournaments_venue on public.tournaments(venue_id);
create index idx_tournaments_owner on public.tournaments(owner_id);
create index idx_tournaments_status on public.tournaments(status);

create trigger tournaments_set_updated_at
  before update on public.tournaments
  for each row execute function public.set_updated_at();

-- One row per team registered for a tournament. subtotal/service_fee/
-- total_amount mirror bookings' own shape — entry_fee is the organizer's
-- price, service_fee is added on top the same way computeServiceFee
-- already works everywhere else, subtotal is what the venue owner
-- actually receives via payout.
create table public.tournament_teams (
  id              uuid primary key default gen_random_uuid(),
  tournament_id   uuid not null references public.tournaments(id) on delete cascade,
  team_id         uuid not null references public.teams(id) on delete cascade,
  registered_by   uuid not null references public.users(id) on delete cascade,
  status          text not null default 'registered' check (status in ('registered', 'withdrawn')),
  payment_status  text not null default 'unpaid' check (payment_status in ('unpaid', 'paid', 'refunded')),
  subtotal        numeric(10,2) not null,
  service_fee     numeric(10,2) not null default 0,
  total_amount    numeric(10,2) not null,
  created_at      timestamptz not null default now(),

  unique (tournament_id, team_id)
);

create index idx_tournament_teams_tournament on public.tournament_teams(tournament_id);
create index idx_tournament_teams_team on public.tournament_teams(team_id);

-- Fixtures reference teams directly (not tournament_teams) — simpler FK
-- shape; the controller is what enforces that both teams are actually
-- registered before a fixture linking them can be created.
create table public.tournament_fixtures (
  id              uuid primary key default gen_random_uuid(),
  tournament_id   uuid not null references public.tournaments(id) on delete cascade,
  round_label     text,
  home_team_id    uuid not null references public.teams(id) on delete cascade,
  away_team_id    uuid not null references public.teams(id) on delete cascade,
  scheduled_at    timestamptz,
  home_score      integer,
  away_score      integer,
  winner_team_id  uuid references public.teams(id),
  status          text not null default 'scheduled' check (status in ('scheduled', 'completed', 'cancelled')),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index idx_tournament_fixtures_tournament on public.tournament_fixtures(tournament_id);

create trigger tournament_fixtures_set_updated_at
  before update on public.tournament_fixtures
  for each row execute function public.set_updated_at();

-- Widen the shared payments/payouts ledgers to a third mutually-exclusive
-- target, same treatment as every other money-movement type in this
-- schema — keeps tournament entry fees visible in the existing admin
-- payment/payout tooling instead of living in a parallel, invisible
-- ledger. refunds is deliberately NOT widened here: tournament
-- withdrawal only self-serves before payment in this first version (see
-- tournaments.controller.ts#withdrawTeam) — a paid team backing out
-- needs the organizer/admin for now, not automated refund logic.
alter table public.payments
  add column tournament_team_id uuid references public.tournament_teams(id) on delete cascade;

alter table public.payments
  drop constraint payment_target_exactly_one;
alter table public.payments
  add constraint payment_target_exactly_one
  check (
    (case when booking_id is not null then 1 else 0 end)
    + (case when session_participant_id is not null then 1 else 0 end)
    + (case when tournament_team_id is not null then 1 else 0 end) = 1
  );

alter table public.payments
  drop constraint payments_purpose_check;
alter table public.payments
  add constraint payments_purpose_check
  check (purpose in ('booking', 'session_share', 'session_topup', 'session_remainder', 'split_share', 'tournament_entry'));

alter table public.payouts
  add column tournament_team_id uuid references public.tournament_teams(id) on delete cascade;

alter table public.payouts
  drop constraint payout_source_exactly_one;
alter table public.payouts
  add constraint payout_source_exactly_one
  check (
    (case when booking_id is not null then 1 else 0 end)
    + (case when session_id is not null then 1 else 0 end)
    + (case when tournament_team_id is not null then 1 else 0 end) = 1
  );

alter table public.tournaments enable row level security;
alter table public.tournament_teams enable row level security;
alter table public.tournament_fixtures enable row level security;
