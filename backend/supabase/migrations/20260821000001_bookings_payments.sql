-- ============================================================
-- BOOKINGS, PAYMENTS, PAYOUTS, REFUNDS
-- Individual bookings pay-and-auto-confirm via M-Pesa STK push
-- (no owner approval step — see explore-venue.html's working
-- prototype logic). Session bookings (booking_type='session')
-- are materialized once a match_sessions row reaches 'funded'.
-- Money movement has no escrow/wallet, same posture as Thurfa:
-- a booking's total sits notionally with the platform until an
-- admin manually resolves the venue payout (payouts.status).
-- ============================================================

create extension if not exists btree_gist; -- for the no-overlap exclusion constraint below

create table public.bookings (
  id               uuid primary key default gen_random_uuid(),
  venue_id         uuid not null references public.venues(id) on delete cascade,
  player_id        uuid not null references public.users(id) on delete cascade,
  booking_type     text not null default 'individual' check (booking_type in ('individual', 'session')),
  session_id       uuid references public.match_sessions(id) on delete cascade,

  start_at         timestamptz not null,
  end_at           timestamptz not null,

  subtotal         numeric(10,2) not null,
  service_fee      numeric(10,2) not null default 0,
  total_amount     numeric(10,2) not null,
  is_walk_in       boolean not null default false, -- booked same calendar day as the game -> always 100% refund

  status           text not null default 'pending_payment'
                     check (status in ('pending_payment', 'confirmed', 'completed', 'cancelled')),
  payment_status   text not null default 'unpaid'
                     check (payment_status in ('unpaid', 'paid', 'refunded', 'partially_refunded')),

  cancelled_at     timestamptz,
  cancelled_by     uuid references public.users(id),
  refund_amount    numeric(10,2),
  refund_pct       numeric(5,2),

  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),

  constraint session_fields_only_for_session_bookings
    check (booking_type = 'session' or session_id is null)
);

create index idx_bookings_venue on public.bookings(venue_id);
create index idx_bookings_player on public.bookings(player_id);
create index idx_bookings_session on public.bookings(session_id);
create index idx_bookings_status on public.bookings(status);

-- No two pending/confirmed bookings can hold overlapping time on the same venue.
alter table public.bookings add constraint bookings_no_overlap
  exclude using gist (
    venue_id with =,
    tstzrange(start_at, end_at) with &&
  ) where (status in ('pending_payment', 'confirmed'));

create trigger bookings_set_updated_at
  before update on public.bookings
  for each row execute function public.set_updated_at();

create table public.payments (
  id                     uuid primary key default gen_random_uuid(),
  booking_id             uuid references public.bookings(id) on delete cascade,
  session_participant_id uuid references public.session_participants(id) on delete cascade,
  payer_id               uuid not null references public.users(id) on delete cascade,
  purpose                text not null check (purpose in ('booking', 'session_share', 'session_topup', 'session_remainder')),
  amount                 numeric(10,2) not null,
  phone_number           text not null,
  provider               text not null default 'mpesa_stk',
  provider_reference     text,
  status                 text not null default 'pending' check (status in ('pending', 'success', 'failed', 'cancelled')),
  raw_callback           jsonb,
  initiated_at           timestamptz not null default now(),
  completed_at           timestamptz,

  constraint payment_target_exactly_one
    check ((booking_id is null) <> (session_participant_id is null))
);

create index idx_payments_booking on public.payments(booking_id);
create index idx_payments_session_participant on public.payments(session_participant_id);
create index idx_payments_payer on public.payments(payer_id);
create index idx_payments_status on public.payments(status);

create table public.payouts (
  id             uuid primary key default gen_random_uuid(),
  booking_id     uuid references public.bookings(id) on delete cascade,
  session_id     uuid references public.match_sessions(id) on delete cascade,
  venue_id       uuid not null references public.venues(id) on delete cascade,
  owner_id       uuid not null references public.users(id) on delete cascade,
  amount         numeric(10,2) not null,
  status         text not null default 'pending' check (status in ('pending', 'paid', 'failed')),
  failure_reason text,
  resolved_by    uuid references public.users(id),
  resolved_at    timestamptz,
  created_at     timestamptz not null default now(),

  constraint payout_source_exactly_one
    check ((booking_id is null) <> (session_id is null))
);

create index idx_payouts_venue on public.payouts(venue_id);
create index idx_payouts_owner on public.payouts(owner_id);
create index idx_payouts_status on public.payouts(status);

create table public.refunds (
  id                     uuid primary key default gen_random_uuid(),
  booking_id             uuid references public.bookings(id) on delete cascade,
  session_participant_id uuid references public.session_participants(id) on delete cascade,
  amount                 numeric(10,2) not null,
  pct                    numeric(5,2) not null,
  reason                 text,
  status                 text not null default 'pending' check (status in ('pending', 'approved', 'denied', 'completed')),
  requested_by           uuid references public.users(id),
  resolved_by            uuid references public.users(id),
  resolved_at            timestamptz,
  created_at             timestamptz not null default now(),

  constraint refund_target_exactly_one
    check ((booking_id is null) <> (session_participant_id is null))
);

create index idx_refunds_booking on public.refunds(booking_id);
create index idx_refunds_status on public.refunds(status);

alter table public.bookings enable row level security;
alter table public.payments enable row level security;
alter table public.payouts enable row level security;
alter table public.refunds enable row level security;
