# Go-live checklist: domain, hosting, email, SMS

Everything needed to put Kicko on a real domain with real email and SMS,
while M-Pesa stays in the existing simulate-confirmation flow until
Safaricom approves the paybill and B2C access (see
[daraja-b2c-setup.md](./daraja-b2c-setup.md)). Steps are ordered — later
ones depend on earlier ones existing.

## 1. Buy the domain

- Register **kicko.co.ke** through a KENIC-accredited registrar (e.g.
  Truehost Kenya, Kenya Web Experts, Sasahost, HostPinnacle) or an
  international registrar that resells `.co.ke` (Namecheap supports it).
  `.co.ke` sometimes asks for a KRA PIN / local contact at registration —
  have that ready.
- Don't buy hosting/email add-ons from the registrar — Cloudflare, Vercel,
  and Render below cover all of that for free.

## 2. Put the domain on Cloudflare

- Add `kicko.co.ke` as a site in Cloudflare (free plan).
- Cloudflare gives you two nameservers — set those at the registrar where
  you bought the domain. Propagation is usually under an hour, can take
  up to 24h.
- Once active, turn on **Email Routing** (Cloudflare dashboard → Email):
  create `hello@kicko.co.ke` → forward to your real inbox. Free, takes
  five minutes, unrelated to the transactional email below.

## 3. Resend (transactional email)

- Create a Resend account, add `kicko.co.ke` as a sending domain.
- Resend gives you SPF/DKIM/DMARC DNS records to add — add them in
  Cloudflare's DNS tab exactly as shown. Don't let this collide with the
  Email Routing records from step 2; Resend's setup flow tells you if
  anything conflicts.
- Wait for Resend to show the domain as verified (usually minutes once
  DNS propagates).
- Generate an API key → this is `RESEND_API_KEY`.
- `EMAIL_FROM` should be something on the verified domain, e.g.
  `Kicko <no-reply@kicko.co.ke>`.
- Code side is already done: `backend/src/services/email.service.ts`
  sends for real once `RESEND_API_KEY` is set, logs to console otherwise.

## 4. Africa's Talking (SMS)

- Create an account at africastalking.com. A **sandbox app** exists
  immediately — no approval needed. Username is literally `sandbox`; the
  API key is on the sandbox app's dashboard.
- That's enough to send real SMS today under a shared/default sender ID.
- When ready for production: create a **Live** app (this is where a
  custom alphanumeric sender ID like "KICKO" needs approval — can take a
  few days). Swap `AFRICASTALKING_USERNAME`/`AFRICASTALKING_API_KEY` to
  the live app's values; no code change needed either way.
- Code side is already done: `backend/src/services/sms.service.ts`.

## 5. Deploy the backend to Render

- New Web Service on Render, connect the `kicko-app` repo.
- Root directory: `backend`. Render should pick up `backend/render.yaml`
  automatically if you use "Blueprint" deploy — otherwise set build
  command `npm install && npm run build`, start command `npm start`.
- Set env vars in Render's dashboard (not committed anywhere):
  `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`,
  `EMAIL_FROM`, `AFRICASTALKING_USERNAME`, `AFRICASTALKING_API_KEY`.
  Leave `ALLOWED_ORIGINS` blank until step 7.
- Once deployed you'll have a `https://kicko-backend.onrender.com`-style
  URL — note it, needed in step 6.

## 6. Deploy the frontend to Vercel

- New Project on Vercel, import the `kicko-app` repo.
- Root directory: `frontend/web`. Vercel will read
  `frontend/web/vercel.json` (build command `npm run build`, output
  `dist`) automatically.
- Set env vars: `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`
  (from Supabase project settings), and `EXPO_PUBLIC_API_URL` = the
  Render URL from step 5.
- Deploy. You'll get a `*.vercel.app` URL to sanity-check before wiring
  the real domain.

## 7. Point the domain at both

- In Vercel: project → Domains → add `kicko.co.ke` and `www.kicko.co.ke`.
  Vercel shows the exact A/CNAME records to add — add them in Cloudflare
  DNS (proxy status "DNS only" if Vercel's setup asks for that).
- In Render: add a custom domain too if you want the API on
  `api.kicko.co.ke` instead of the `.onrender.com` URL — same idea, add
  the CNAME Render gives you in Cloudflare.
- Back in Render's env vars, set `ALLOWED_ORIGINS` to
  `https://kicko.co.ke,https://www.kicko.co.ke` now that the real origin
  is known, and redeploy.
- Update `EXPO_PUBLIC_API_URL` in Vercel to `https://api.kicko.co.ke` (or
  the `.onrender.com` URL if you skipped the custom API domain) and
  redeploy.

## 8. Once the domain is live — revisit Google OAuth branding

This was blocked earlier because the app only existed on `.vercel.app`,
which Google won't let you brand or verify. With `kicko.co.ke` real and
owned, go back to Google Cloud Console → OAuth consent screen and add it
as an authorized domain, upload the app logo/name — this is what actually
fixes the "unverified app" / wrong-name screen users saw during sign-in
via Google, not anything in Supabase.

## 9. Smoke test before calling it live

- Sign up / sign in as each role on the real domain.
- Book a venue, use "Simulate M-Pesa confirmation" (still the only way
  to complete a payment until Daraja is approved) — confirm the booking
  email and SMS both arrive on a real phone/inbox.
- Cancel a booking — confirm the cancellation email arrives.
- As admin, verify/suspend a venue — confirm the owner gets an email.
- Check Cloudflare Email Routing by sending to `hello@kicko.co.ke`
  manually — confirm it lands in your real inbox.
