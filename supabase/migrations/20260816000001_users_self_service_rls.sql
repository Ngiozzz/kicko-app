-- ============================================================
-- USERS — self-service RLS policies
-- Unlike Thurfa (custom Express backend on the service-role key, RLS
-- enabled with zero policies by design), Kicko's Expo app talks to
-- Supabase directly from the client with the anon key — there's no
-- backend server here. That means auth needs real policies now,
-- not later: sign-up (app/sign-up.tsx) inserts a profile row right
-- after auth.signUp(), which RLS-enabled-with-no-policies would
-- silently reject.
-- ============================================================

create policy "Users can view their own profile"
  on public.users for select
  using (auth.uid() = id);

create policy "Users can insert their own profile"
  on public.users for insert
  with check (auth.uid() = id);

create policy "Users can update their own profile"
  on public.users for update
  using (auth.uid() = id);
