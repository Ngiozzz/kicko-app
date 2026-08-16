# Kicko

One backend, behind three kinds of client — web, mobile, and (eventually) USSD. Design reference for the web/mobile UI lives at `thurfa-platform/Kicko/docs` (static HTML mockup); this repo is the real build.

- **`backend/`** — Express + TypeScript API. Holds the Supabase *service-role* key and is the only thing that talks to the database directly (mirrors `thurfa-platform/backend`'s pattern). Every client — web, mobile, and the USSD webhook once it exists — calls this instead of Supabase directly.
- **`frontend/mobile/`** — Expo app, the player-facing product. Its own codebase, own design language (native full-bleed screens, no browser chrome to sit inside).
- **`frontend/web/`** — a separate Expo project (web target only) for the owner/manager/admin dashboard, matching the sidebar-driven layout already designed in `Kicko/docs`. Deliberately *not* sharing UI/screens with `mobile/` — the two are different products with different conventions, not one app squeezed onto two screen sizes.
- **`frontend/shared/`** (`@kicko/shared`) — the only thing `mobile/` and `web/` share: theme tokens, the Supabase client (auth only), and the backend API helper. No UI lives here.

Auth (sign up / sign in / session refresh) goes straight to Supabase from each frontend via the SDK; everything else goes through `backend/`.

## Setup

```
# backend
cd backend
npm install
cp .env.example .env   # fill in after creating the Supabase project (see below)
npm run dev             # http://localhost:4001

# frontend — installs mobile/, web/, and shared/ together (npm workspaces)
cd frontend
npm install

cp mobile/.env.example mobile/.env
cd mobile && npm run web    # or: npm run ios / npm run android

cp web/.env.example web/.env
cd ../web && npm run web
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
   - copy the Project URL + anon key into `frontend/mobile/.env` and `frontend/web/.env`
   - copy the Project URL + service role key into `backend/.env`
2. Push this repo to GitHub (no `gh` CLI installed locally — create the repo via github.com, then `git remote add origin <url> && git push -u origin main`).
