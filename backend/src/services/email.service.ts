import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const FROM = process.env.EMAIL_FROM ?? "Kicko <no-reply@kicko.co.ke>";

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

function wrapper(bodyHtml: string): string {
  return `
    <div style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;max-width:480px;margin:0 auto;padding:24px;color:#1a1a1a;">
      <div style="font-family:Georgia,serif;font-size:20px;font-weight:700;margin-bottom:20px;">
        Kick<span style="color:#e8a33d;">o</span>
      </div>
      ${bodyHtml}
      <p style="margin-top:32px;font-size:12px;color:#888;">Kicko · Nairobi, Kenya</p>
    </div>
  `;
}

export const emailTemplates = {
  bookingConfirmed: (venueName: string, when: string, amount: number) =>
    wrapper(`
      <h2 style="margin:0 0 12px;">Booking confirmed</h2>
      <p>Your slot at <strong>${venueName}</strong> is booked for <strong>${when}</strong>.</p>
      <p>Amount paid: <strong>KES ${amount.toLocaleString()}</strong></p>
    `),
  bookingCancelled: (venueName: string, refundLine: string) =>
    wrapper(`
      <h2 style="margin:0 0 12px;">Booking cancelled</h2>
      <p>Your booking at <strong>${venueName}</strong> has been cancelled.</p>
      <p>${refundLine}</p>
    `),
  newBooking: (venueName: string, when: string, amount: number) =>
    wrapper(`
      <h2 style="margin:0 0 12px;">New booking</h2>
      <p><strong>${venueName}</strong> · ${when}</p>
      <p>Amount: <strong>KES ${amount.toLocaleString()}</strong></p>
    `),
  payoutPaid: (venueName: string, amount: number) =>
    wrapper(`
      <h2 style="margin:0 0 12px;">Payout sent</h2>
      <p><strong>KES ${amount.toLocaleString()}</strong> for <strong>${venueName}</strong> is on its way to your M-Pesa.</p>
    `),
  payoutFailed: (venueName: string, amount: number, reason: string) =>
    wrapper(`
      <h2 style="margin:0 0 12px;">Payout failed</h2>
      <p><strong>KES ${amount.toLocaleString()}</strong> for <strong>${venueName}</strong> could not be sent: ${reason}</p>
      <p>Check your payout details in the Kicko dashboard.</p>
    `),
  venueStatusChanged: (venueName: string, verified: boolean, reason?: string) =>
    wrapper(
      verified
        ? `<h2 style="margin:0 0 12px;">Venue verified</h2><p><strong>${venueName}</strong> is now live on Kicko.</p>`
        : `<h2 style="margin:0 0 12px;">Venue suspended</h2><p><strong>${venueName}</strong> has been suspended: ${reason}</p>`
    ),
  newReview: (venueName: string, rating: number, comment: string | null) =>
    wrapper(`
      <h2 style="margin:0 0 12px;">New review</h2>
      <p><strong>${venueName}</strong> · ${"★".repeat(rating)}${"☆".repeat(5 - rating)}</p>
      ${comment ? `<p>"${comment}"</p>` : ""}
    `),
};
