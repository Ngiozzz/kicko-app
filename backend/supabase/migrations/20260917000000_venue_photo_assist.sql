-- Lets an owner who can't take/upload their own venue photos pay a flat
-- KES 500 for admin to add them instead. Same "widen the shared payments
-- ledger" treatment as split bookings and tournament entries (see
-- 20260907000000_tournaments.sql) — a fourth mutually-exclusive target
-- keeps this fee visible in the existing admin payments/transactions
-- tooling instead of a parallel ledger.

alter table public.payments
  add column venue_id uuid references public.venues(id) on delete cascade;

alter table public.payments
  drop constraint payment_target_exactly_one;
alter table public.payments
  add constraint payment_target_exactly_one
  check (
    (case when booking_id is not null then 1 else 0 end)
    + (case when session_participant_id is not null then 1 else 0 end)
    + (case when tournament_team_id is not null then 1 else 0 end)
    + (case when venue_id is not null then 1 else 0 end) = 1
  );

alter table public.payments
  drop constraint payments_purpose_check;
alter table public.payments
  add constraint payments_purpose_check
  check (purpose in ('booking', 'session_share', 'session_topup', 'session_remainder', 'split_share', 'tournament_entry', 'venue_photo_assist'));

create index idx_payments_venue on public.payments(venue_id);

-- Set once a venue_photo_assist payment is confirmed, cleared once admin
-- actually adds the photos (see admin.controller.ts#setVenuePhotos) — the
-- one field the admin venues list/detail screens need to surface "an owner
-- paid for this and is waiting."
alter table public.venues
  add column photo_assist_requested_at timestamptz;

-- Admins can write into any owner's folder in venue-photos (owners remain
-- scoped to their own folder via the existing per-owner policies from
-- 20260817000000_venue_photos_storage.sql — Postgres OR's permissive
-- policies together, so both apply). Same shape as email-assets' admin
-- policies in 20260901000002_email_assets_storage.sql.
create policy "Admins can upload any venue's photos"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'venue-photos'
  and exists (select 1 from public.users where id = auth.uid() and role = 'admin')
);

create policy "Admins can update any venue's photos"
on storage.objects for update
to authenticated
using (
  bucket_id = 'venue-photos'
  and exists (select 1 from public.users where id = auth.uid() and role = 'admin')
);

create policy "Admins can delete any venue's photos"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'venue-photos'
  and exists (select 1 from public.users where id = auth.uid() and role = 'admin')
);
