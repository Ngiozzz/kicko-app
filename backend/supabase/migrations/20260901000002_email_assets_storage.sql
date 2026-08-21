-- Storage bucket for images embedded in admin-edited email templates
-- (banners, promo graphics) — same "client uploads directly with its own
-- session" pattern as venue-photos, but scoped to the admin role instead
-- of a per-user folder, since template images are shared, not owned by
-- one account.
insert into storage.buckets (id, name, public)
values ('email-assets', 'email-assets', true)
on conflict (id) do nothing;

create policy "Admins can upload email assets"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'email-assets'
  and exists (select 1 from public.users where id = auth.uid() and role = 'admin')
);

create policy "Admins can update email assets"
on storage.objects for update
to authenticated
using (
  bucket_id = 'email-assets'
  and exists (select 1 from public.users where id = auth.uid() and role = 'admin')
);

create policy "Admins can delete email assets"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'email-assets'
  and exists (select 1 from public.users where id = auth.uid() and role = 'admin')
);

create policy "Anyone can view email assets"
on storage.objects for select
to public
using (bucket_id = 'email-assets');
