-- The email-assets upload policies from the previous migration checked
-- role via a direct `exists (select ... from public.users ...)` subquery.
-- That subquery runs as the calling (authenticated) role, and
-- public.users has RLS enabled with no policies for that role (service-role
-- only, same posture as every other table here) — so the subquery always
-- saw zero rows and every admin's upload was silently rejected. A
-- security-definer function sidesteps that: it runs as its owner, so it
-- can read public.users regardless of the caller's own RLS visibility,
-- while still only ever answering "is this specific caller an admin".
create function public.is_admin()
returns boolean as $$
  select exists (select 1 from public.users where id = auth.uid() and role = 'admin');
$$ language sql security definer set search_path = public stable;

drop policy "Admins can upload email assets" on storage.objects;
drop policy "Admins can update email assets" on storage.objects;
drop policy "Admins can delete email assets" on storage.objects;

create policy "Admins can upload email assets"
on storage.objects for insert
to authenticated
with check (bucket_id = 'email-assets' and public.is_admin());

create policy "Admins can update email assets"
on storage.objects for update
to authenticated
using (bucket_id = 'email-assets' and public.is_admin());

create policy "Admins can delete email assets"
on storage.objects for delete
to authenticated
using (bucket_id = 'email-assets' and public.is_admin());
