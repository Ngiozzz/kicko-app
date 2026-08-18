-- Denormalized rating aggregate on venues — reads become O(1) regardless of
-- how many reviews a venue has (no more scanning every review just to show
-- the average on a page load). Writes are rare (one review per real,
-- played booking) so recomputing on write via trigger is cheap in practice
-- even as review counts grow into the thousands.
alter table public.venues add column avg_rating numeric(2,1) not null default 0;
alter table public.venues add column review_count int not null default 0;

create or replace function public.refresh_venue_rating() returns trigger as $$
declare
  target_venue_id uuid := coalesce(new.venue_id, old.venue_id);
begin
  update public.venues
  set avg_rating = coalesce((select round(avg(rating), 1) from public.reviews where venue_id = target_venue_id), 0),
      review_count = (select count(*) from public.reviews where venue_id = target_venue_id)
  where id = target_venue_id;
  return null;
end;
$$ language plpgsql;

create trigger reviews_refresh_venue_rating
  after insert or update of rating or delete on public.reviews
  for each row execute function public.refresh_venue_rating();

-- Owner-flagged reviews — the owner flags something they think crosses a
-- line; an admin then either deletes the review or dismisses the flag
-- (keeps the review, clears the flag). Not a full moderation queue, just
-- enough signal to route attention.
alter table public.reviews add column flagged_at timestamptz;
alter table public.reviews add column flagged_by uuid references public.users(id);
alter table public.reviews add column flag_reason text;
