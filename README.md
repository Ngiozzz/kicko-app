# Kicko

One backend, behind three kinds of client — web, mobile, and (eventually) USSD. Design reference for the web/mobile UI lives at `thurfa-platform/Kicko/docs` (static HTML mockup); this repo is the real build.

- **`backend/`** — Express + TypeScript API. Holds the Supabase *service-role* key and is the only thing that talks to the database directly (mirrors `thurfa-platform/backend`'s pattern). Every client — web, mobile, and the USSD webhook once it exists — calls this instead of Supabase directly.
- **`frontend/`** — Expo (React Native + web) app. One codebase covers both web and mobile, which is the whole point of Expo — there's no separate per-platform frontend project. Auth (sign up / sign in / session refresh) goes straight to Supabase from here via the SDK; everything else goes through `backend/`.

## Setup

```
# backend
cd backend
npm install
cp .env.example .env   # fill in after creating the Supabase project (see below)
npm run dev             # http://localhost:4001

# frontend (separate terminal)
cd frontend
npm install
cp .env.example .env
npm run web              # or: npm run ios / npm run android
```

## Database

Every schema change is a migration in `backend/supabase/migrations/`, never a hand-edit against a live database. Apply them with the Supabase CLI once a project exists:

```
cd backend
npx supabase link --project-ref <your-project-ref>
npx supabase db push
```

## Still needed before this runs against real data

1. Create the Supabase project at supabase.com/dashboard, then:
   - copy the Project URL + anon key into `frontend/.env`
   - copy the Project URL + service role key into `backend/.env`
2. Push this repo to GitHub (no `gh` CLI installed locally — create the repo via github.com, then `git remote add origin <url> && git push -u origin main`).
