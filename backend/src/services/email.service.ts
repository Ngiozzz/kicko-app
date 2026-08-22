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
  | "review_request";

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
  draft?: { subject: string; html: string }
): Promise<{ subject: string; html: string }> {
  let template = draft;
  if (!template) {
    const { data } = await supabase.from("email_templates").select("subject, html").eq("key", key).maybeSingle();
    template = data?.subject && data?.html ? { subject: data.subject, html: data.html } : FALLBACK_TEMPLATES[key];
  }

  const safeVars = Object.fromEntries(Object.entries(vars).map(([k, v]) => [k, RAW_VARS.has(k) ? v : escapeHtml(v)]));

  return { subject: template.subject, html: wrapper(renderPlaceholders(template.html, safeVars)) };
}

/** Renders `key` against the DB (or fallback) template and sends it — the one call site every transactional-email trigger should use. */
export async function sendTemplatedEmail(key: EmailTemplateKey, to: string, vars: Record<string, string>): Promise<void> {
  const { subject, html } = await renderEmailTemplate(key, vars);
  await sendEmail({ to, subject, html });
}
