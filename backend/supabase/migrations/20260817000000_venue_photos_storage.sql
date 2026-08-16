-- Storage bucket for venue cover photos, uploaded directly from the client
-- (owner's authenticated Supabase session) — same "auth stays client-side"
-- split the rest of the app follows, no backend upload endpoint needed.
-- Objects are keyed "<owner_id>/<filename>" so the RLS policies below can
-- scope access by matching the first path segment against auth.uid().

insert into storage.buckets (id, name, public)
values ('venue-photos', 'venue-photos', true)
on conflict (id) do nothing;

create policy "Owners can upload their own venue photos"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'venue-photos'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "Owners can update their own venue photos"
on storage.objects for update
to authenticated
using (
  bucket_id = 'venue-photos'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "Owners can delete their own venue photos"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'venue-photos'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "Anyone can view venue photos"
on storage.objects for select
to public
using (bucket_id = 'venue-photos');
