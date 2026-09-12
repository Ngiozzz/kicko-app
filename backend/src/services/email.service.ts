import { Resend } from "resend";
import { supabase } from "../config/supabase.js";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const FROM = process.env.EMAIL_FROM ?? "Kicko <no-reply@kicko-app.co.ke>";

/**
 * Sends via Resend when RESEND_API_KEY is set; otherwise logs to the
 * console so local dev and CI never need a real key. Unlike stk/b2c's
 * permanent stubs, this flips to real sending the moment the env var is
 * set — no code change needed at go-live.
 */
export async function sendEmail(params: { to: string; subject: string; html: string }): Promise<void> {
  if (!resend) {
    console.log(`[email:stub] to=${params.to} subject="${params.subject}"`);
    return;
  }
  try {
    const { error } = await resend.emails.send({ from: FROM, to: params.to, subject: params.subject, html: params.html });
    if (error) console.error("sendEmail error:", error);
  } catch (err) {
    console.error("sendEmail threw:", err);
  }
}

// Rendered once from the app's own logo mark + wordmark (see
// frontend/web/src/components/Logo.tsx) and uploaded to the email-assets
// bucket — a real <img> banner, not the text-div stand-in this replaced.
// Swap this constant to re-brand every email at once; per-template banner
// images (promos etc.) go through the editor's own "Add image" upload
// instead.
const BANNER_URL = "https://angyrszlptntfkqmcwwn.supabase.co/storage/v1/object/public/email-assets/banner/kicko-logo-banner.png";

function wrapper(bodyHtml: string): string {
  return `
    <div style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;max-width:480px;margin:0 auto;padding:24px;color:#1a1a1a;">
      <img src="${BANNER_URL}" alt="Kicko" style="height:36px;display:block;margin-bottom:20px;" />
      ${bodyHtml}
      <p style="margin-top:32px;font-size:12px;color:#888;">Kicko · Nairobi, Kenya</p>
    </div>
  `;
}

export function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

function renderPlaceholders(html: string, vars: Record<string, string>): string {
  return html.replace(/\{\{(\w+)\}\}/g, (_match, key: string) => vars[key] ?? "");
}

export type EmailTemplateKey =
  | "booking_confirmed"
  | "booking_cancelled"
  | "new_booking"
  | "payout_paid"
  | "payout_failed"
  | "venue_verified"
  | "venue_suspended"
  | "new_review"
  | "game_reminder"
  | "review_request"
  | "split_booking_invite"
  | "team_invite"
  | "fixture_scheduled"
  | "session_cancelled"
  | "payout_details_missing"
  | "tournament_withdrawal"
  | "venue_submitted";

// Only "commentBlock" ever carries caller-built HTML (the review-comment
// paragraph, already escaped by its caller) — every other placeholder is
// plain text and gets escaped here so a venue name or refund line can
// never break the surrounding markup or inject content into the email.
const RAW_VARS = new Set(["commentBlock"]);

// Fallback copy, used only when a row is missing from email_templates
// (deleted, or the table itself unreachable) — keeps sending resilient to
// a bad admin edit. Admin-editable copy normally comes from the DB; see
// migration 20260901000001_email_templates.sql for the seeded defaults
// these mirror.
export const FALLBACK_TEMPLATES: Record<EmailTemplateKey, { subject: string; html: string }> = {
  booking_confirmed: {
    subject: "Booking confirmed",
    html: '<h2 style="margin:0 0 12px;">Booking confirmed</h2><p>Hi {{name}},</p><p>Your slot at <strong>{{venueName}}</strong> is booked for <strong>{{when}}</strong>.</p><p>Amount paid: <strong>KES {{amount}}</strong></p>',
  },
  booking_cancelled: {
    subject: "Booking cancelled",
    html: '<h2 style="margin:0 0 12px;">Booking cancelled</h2><p>Your booking at <strong>{{venueName}}</strong> has been cancelled.</p><p>{{refundLine}}</p>',
  },
  new_booking: {
    subject: "New booking",
    html: '<h2 style="margin:0 0 12px;">New booking</h2><p><strong>{{venueName}}</strong> · {{when}}</p><p>Amount: <strong>KES {{amount}}</strong></p>',
  },
  payout_paid: {
    subject: "Payout sent",
    html: '<h2 style="margin:0 0 12px;">Payout sent</h2><p><strong>KES {{amount}}</strong> for <strong>{{venueName}}</strong> is on its way to your M-Pesa.</p>',
  },
  payout_failed: {
    subject: "Payout failed",
    html: '<h2 style="margin:0 0 12px;">Payout failed</h2><p><strong>KES {{amount}}</strong> for <strong>{{venueName}}</strong> could not be sent: {{reason}}</p><p>Check your payout details in the Kicko dashboard.</p>',
  },
  venue_verified: {
    subject: "Venue verified",
    html: '<h2 style="margin:0 0 12px;">Venue verified</h2><p><strong>{{venueName}}</strong> is now live on Kicko.</p>',
  },
  venue_suspended: {
    subject: "Venue suspended",
    html: '<h2 style="margin:0 0 12px;">Venue suspended</h2><p><strong>{{venueName}}</strong> has been suspended: {{reason}}</p>',
  },
  new_review: {
    subject: "New review",
    html: '<h2 style="margin:0 0 12px;">New review</h2><p><strong>{{venueName}}</strong> · {{stars}}</p>{{commentBlock}}',
  },
  game_reminder: {
    subject: "Your game is in an hour",
    html: '<h2 style="margin:0 0 12px;">Kickoff in about an hour</h2><p>Hi {{name}},</p><p>Your game at <strong>{{venueName}}</strong> starts at <strong>{{when}}</strong>. See you there!</p>',
  },
  review_request: {
    subject: "How was your game?",
    html: '<h2 style="margin:0 0 12px;">How was your game?</h2><p>Hi {{name}},</p><p>Hope you had a great time at <strong>{{venueName}}</strong>. Got a minute to rate it for other players?</p><p><a href="{{reviewUrl}}" style="color:#C08A3E;font-weight:600;">Leave a review →</a></p>',
  },
  split_booking_invite: {
    subject: "You've been invited to split a booking",
    html: '<h2 style="margin:0 0 12px;">You\'re invited to play</h2><p><strong>{{inviterName}}</strong> invited you to split a booking at <strong>{{venueName}}</strong> on <strong>{{when}}</strong>.</p><p>Your share: <strong>KES {{shareAmount}}</strong></p>',
  },
  team_invite: {
    subject: "You've been invited to join a team",
    html: '<h2 style="margin:0 0 12px;">You\'re invited to join a team</h2><p><strong>{{inviterName}}</strong> invited you to join <strong>{{teamName}}</strong>{{sportLine}}.</p>',
  },
  fixture_scheduled: {
    subject: "Your match has been scheduled",
    html: '<h2 style="margin:0 0 12px;">Match scheduled</h2><p><strong>{{teamName}}</strong> vs <strong>{{opponentName}}</strong> — {{tournamentName}}</p><p>{{venueName}} · <strong>{{when}}</strong></p>',
  },
  session_cancelled: {
    subject: "Session cancelled",
    html: '<h2 style="margin:0 0 12px;">Session cancelled</h2><p>Your session at <strong>{{venueName}}</strong> has been cancelled.</p><p>{{refundLine}}</p>',
  },
  payout_details_missing: {
    subject: "We can't pay you out yet",
    html: '<h2 style="margin:0 0 12px;">Payout on hold</h2><p><strong>KES {{amount}}</strong> for <strong>{{venueName}}</strong> is ready to send, but this venue has no payout details on file.</p><p>Add your M-Pesa payout details in the Kicko dashboard to receive it.</p>',
  },
  tournament_withdrawal: {
    subject: "A team has withdrawn",
    html: '<h2 style="margin:0 0 12px;">Team withdrew</h2><p><strong>{{teamName}}</strong> has withdrawn from <strong>{{tournamentName}}</strong>.</p>',
  },
  venue_submitted: {
    subject: "New venue awaiting review",
    html: '<h2 style="margin:0 0 12px;">New venue submitted</h2><p><strong>{{venueName}}</strong> was submitted by <strong>{{ownerName}}</strong> and is awaiting review.</p><p>{{location}}</p>',
  },
};

/** Sample values for every placeholder any template key uses — powers the admin "send test" and preview actions. */
export const SAMPLE_VARS: Record<EmailTemplateKey, Record<string, string>> = {
  booking_confirmed: { name: "Glenn", venueName: "Test Turf", when: "Sat, Aug 22 · 6:00–7:00 PM", amount: "2,000" },
  booking_cancelled: { venueName: "Test Turf", refundLine: "A full refund of KES 2,000 has been issued." },
  new_booking: { venueName: "Test Turf", when: "Sat, Aug 22 · 6:00–7:00 PM", amount: "2,000" },
  payout_paid: { venueName: "Test Turf", amount: "1,800" },
  payout_failed: { venueName: "Test Turf", amount: "1,800", reason: "Invalid M-Pesa number on file" },
  venue_verified: { venueName: "Test Turf" },
  venue_suspended: { venueName: "Test Turf", reason: "Repeated no-shows reported by players" },
  new_review: { venueName: "Test Turf", stars: "★★★★☆", commentBlock: '<p>"Great pitch, would book again!"</p>' },
  game_reminder: { name: "Glenn", venueName: "Test Turf", when: "Sat, Aug 22 · 6:00 PM" },
  review_request: { name: "Glenn", venueName: "Test Turf", reviewUrl: "https://kicko-app.co.ke/player/explore/00000000-0000-0000-0000-000000000000" },
  split_booking_invite: { inviterName: "Glenn", venueName: "Test Turf", when: "Sat, Aug 22 · 6:00–7:00 PM", shareAmount: "500" },
  team_invite: { inviterName: "Glenn", teamName: "Mombasa Sharks", sportLine: " · Rugby" },
  fixture_scheduled: { teamName: "Mombasa Sharks", opponentName: "Nairobi Lions", tournamentName: "Coast Cup", venueName: "Test Turf", when: "Sat, Aug 22 · 6:00 PM" },
  session_cancelled: { venueName: "Test Turf", refundLine: "A full refund of KES 2,000 has been issued." },
  payout_details_missing: { venueName: "Test Turf", amount: "1,800" },
  tournament_withdrawal: { teamName: "Mombasa Sharks", tournamentName: "Coast Cup" },
  venue_submitted: { venueName: "Test Turf", ownerName: "Glenn", location: "Nairobi, Kenya" },
};

/**
 * Renders the admin-editable (or fallback) template for `key` with `vars`
 * — used for real sends and the admin editor's live preview. Pass
 * `draft` to render unsaved subject/html straight from the editor
 * instead of what's in the DB (or its fallback) — same rendering path
 * either way, so what the editor's preview shows always matches exactly
 * what a real send would produce for that same source content.
 */
export async function renderEmailTemplate(
  key: EmailTemplateKey,
  vars: Record<string, string>,
  draft?: { subject: string; html: string; useWrapper?: boolean }
): Promise<{ subject: string; html: string }> {
  let template: { subject: string; html: string; useWrapper: boolean };
  if (draft) {
    template = { subject: draft.subject, html: draft.html, useWrapper: draft.useWrapper ?? true };
  } else {
    const { data } = await supabase.from("email_templates").select("subject, html, use_wrapper").eq("key", key).maybeSingle();
    template = data?.subject && data?.html
      ? { subject: data.subject, html: data.html, useWrapper: data.use_wrapper }
      : { ...FALLBACK_TEMPLATES[key], useWrapper: true };
  }

  const safeVars = Object.fromEntries(Object.entries(vars).map(([k, v]) => [k, RAW_VARS.has(k) ? v : escapeHtml(v)]));
  const body = renderPlaceholders(template.html, safeVars);

  return { subject: template.subject, html: template.useWrapper ? wrapper(body) : body };
}

/** Renders `key` against the DB (or fallback) template and sends it — the one call site every transactional-email trigger should use. */
export async function sendTemplatedEmail(key: EmailTemplateKey, to: string, vars: Record<string, string>): Promise<void> {
  const { subject, html } = await renderEmailTemplate(key, vars);
  await sendEmail({ to, subject, html });
}
