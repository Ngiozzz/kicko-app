-- Player reviews on venues — one review per booking, and only once that
-- booking has actually been played (see reviews.controller.ts's eligibility
-- check: status='confirmed' and end_at in the past). Kept simple: no
-- ratings-of-ratings, no owner replies, no flagging workflow — admins can
-- just delete a bad review outright (see admin.controller.ts#deleteReview).
create table public.reviews (
  id          uuid primary key default gen_random_uuid(),
  booking_id  uuid not null references public.bookings(id) on delete cascade,
  venue_id    uuid not null references public.venues(id) on delete cascade,
  player_id   uuid not null references public.users(id) on delete cascade,
  rating      smallint not null check (rating between 1 and 5),
  comment     text,
  created_at  timestamptz not null default now(),

  unique (booking_id)
);

create index idx_reviews_venue_id on public.reviews(venue_id);

alter table public.reviews enable row level security;
