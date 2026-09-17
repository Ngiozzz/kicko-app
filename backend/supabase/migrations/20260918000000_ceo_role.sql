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

-- Drop-by-lookup instead of a hardcoded constraint name — the role check
-- constraint on public.users was added unnamed in 20260816000000_init.sql,
-- so Postgres auto-named it, and guessing wrong here would silently leave
-- the old 4-value constraint active alongside a new 5-value one (both
-- would then have to pass, permanently blocking 'ceo').
do $$
declare
  cname text;
begin
  select conname into cname
  from pg_constraint
  where conrelid = 'public.users'::regclass
    and contype = 'c'
    and pg_get_constraintdef(oid) ilike '%role%';
  if cname is not null then
    execute format('alter table public.users drop constraint %I', cname);
  end if;
end $$;

alter table public.users
  add constraint users_role_check
  check (role in ('player', 'owner', 'manager', 'admin', 'ceo'));

create or replace function public.is_admin()
returns boolean as $$
  select exists (select 1 from public.users where id = auth.uid() and role in ('admin', 'ceo'));
$$ language sql security definer set search_path = public stable;

drop policy "Admins can upload any venue's photos" on storage.objects;
drop policy "Admins can update any venue's photos" on storage.objects;
drop policy "Admins can delete any venue's photos" on storage.objects;

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
