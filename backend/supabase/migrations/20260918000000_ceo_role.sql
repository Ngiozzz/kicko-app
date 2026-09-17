-- Adds 'ceo' as a full admin-equivalent account role (view + act on
-- everything admin can, provisioned the same hand-provisioned way as
-- admin — see admin.controller.ts#createAdmin). Also fixes a real bug
-- found while writing this: the venue-photos admin storage policies
-- added in 20260917000000_venue_photo_assist.sql used an inline
-- `exists (select ... from public.users ...)` subquery, which runs as
-- the calling `authenticated` role and always sees zero rows because
-- public.users has RLS enabled with no policies for that role — the
-- exact bug already fixed once for email-assets in
-- 20260901000003_email_assets_is_admin_fix.sql. Every admin's photo
-- upload was silently being rejected. Switching those policies to the
-- existing security-definer public.is_admin() helper (and widening that
-- helper to accept 'ceo') fixes both problems in one move.

-- Every statement here is written to be safely re-runnable (if exists /
-- create or replace) — the GitHub Actions auto-deploy for this migration
-- failed twice (exit 1, no usable logs surfaced), and a retry after a
-- partial apply otherwise errors on "already exists"/"does not exist"
-- rather than just finishing the job. Root cause of the CI failures
-- itself is still open — see PROGRESS.md.
alter table public.users
  drop constraint if exists users_role_check;
alter table public.users
  add constraint users_role_check
  check (role in ('player', 'owner', 'manager', 'admin', 'ceo'));

create or replace function public.is_admin()
returns boolean as $$
  select exists (select 1 from public.users where id = auth.uid() and role in ('admin', 'ceo'));
$$ language sql security definer set search_path = public stable;

drop policy if exists "Admins can upload any venue's photos" on storage.objects;
drop policy if exists "Admins can update any venue's photos" on storage.objects;
drop policy if exists "Admins can delete any venue's photos" on storage.objects;

create policy "Admins can upload any venue's photos"
on storage.objects for insert
to authenticated
with check (bucket_id = 'venue-photos' and public.is_admin());

create policy "Admins can update any venue's photos"
on storage.objects for update
to authenticated
using (bucket_id = 'venue-photos' and public.is_admin());

create policy "Admins can delete any venue's photos"
on storage.objects for delete
to authenticated
using (bucket_id = 'venue-photos' and public.is_admin());
