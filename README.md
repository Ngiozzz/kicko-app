# Kicko

Expo (React Native + web) app for Kicko, backed by Supabase. Design reference lives at `thurfa-platform/Kicko/docs` (static HTML mockup) — this repo is the real build.

## Setup

```
npm install
cp .env.example .env   # fill in after creating the Supabase project (see below)
npm run web             # or: npm run ios / npm run android
```

## Database

Every schema change is a migration in `supabase/migrations/`, never a hand-edit against a live database. Apply them with the Supabase CLI once a project exists:

```
npx supabase link --project-ref <your-project-ref>
npx supabase db push
```

## Still needed before this runs against real data

1. Create the Supabase project at supabase.com/dashboard, then copy the Project URL and anon key into `.env`.
2. Push this repo to GitHub (no `gh` CLI installed locally — create the repo via github.com, then `git remote add origin <url> && git push -u origin main`).
