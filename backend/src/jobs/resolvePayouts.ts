import { supabase } from "../config/supabase.js";
import { initiateB2CPayout } from "../services/b2c.service.js";
import { notify } from "../services/notifications.service.js";
import { sendEmail, emailTemplates } from "../services/email.service.js";
import { sendSms } from "../services/sms.service.js";

const CHECK_INTERVAL_MS = 60_000;

type DuePayout = {
  id: string;
  amount: number;
  owner_id: string;
  booking: { end_at: string } | null;
  session: { end_at: string } | null;
  venue: { name: string; payout_type: "phone" | "paybill" | "till" | null; payout_number: string | null; payout_account_ref: string | null } | null;
  owner: { email: string | null; phone: string | null } | null;
};

/**
 * Pays out venue owners automatically once their game has actually been
 * played — not the moment a booking is paid for, so a late cancellation's
 * refund (see cancelBooking's payout delete) never races an already-sent
 * payout. A pending payout with no payout details on file yet is left
 * alone (still 'pending') for whenever the owner adds them — see
 * VenueForm.tsx's payout section.
 */
async function resolveDuePayouts() {
  const { data: due, error } = await supabase
    .from("payouts")
    .select(
      "id, amount, owner_id, booking:bookings(end_at), session:match_sessions(end_at), venue:venues(name, payout_type, payout_number, payout_account_ref), owner:users!payouts_owner_id_fkey(email, phone)"
    )
    .eq("status", "pending")
    .returns<DuePayout[]>();

  if (error) {
    console.error("resolveDuePayouts fetch error:", error);
    return;
  }

  const now = Date.now();
  for (const payout of due ?? []) {
    const endAt = payout.booking?.end_at ?? payout.session?.end_at;
    if (!endAt || new Date(endAt).getTime() > now) continue; // game hasn't happened yet

    const venue = payout.venue;
    if (!venue?.payout_type || !venue.payout_number) continue; // no payout details on file yet

    const result = await initiateB2CPayout({
      payoutType: venue.payout_type,
      payoutNumber: venue.payout_number,
      payoutAccountRef: venue.payout_account_ref,
      amount: payout.amount,
      occasion: `Kicko payout ${payout.id}`,
    });

    // Scoped on status='pending' so this can't double-pay a row another
    // process already resolved between the select above and this update.
    const { data: resolved } = await supabase
      .from("payouts")
      .update(
        result.status === "success"
          ? { status: "paid", resolved_at: new Date().toISOString(), provider_reference: result.providerReference }
          : { status: "failed", failure_reason: result.failureReason ?? "Payout failed.", provider_reference: result.providerReference }
      )
      .eq("id", payout.id)
      .eq("status", "pending")
      .select("id")
      .maybeSingle();

    if (resolved) {
      const venueName = venue.name ?? "your venue";
      const failureReason = result.failureReason ?? "needs attention";
      await notify(
        result.status === "success"
          ? { userId: payout.owner_id, type: "payout_paid", title: "Payout sent", body: `${venueName} · KES ${payout.amount.toLocaleString()}`, link: "/owner/payments" }
          : {
              userId: payout.owner_id,
              type: "payout_failed",
              title: "Payout failed",
              body: `${venueName} · KES ${payout.amount.toLocaleString()} — ${failureReason}`,
              link: "/owner/payments",
            }
      );

      const owner = payout.owner;
      if (owner?.email) {
        await sendEmail({
          to: owner.email,
          subject: result.status === "success" ? "Payout sent" : "Payout failed",
          html:
            result.status === "success"
              ? emailTemplates.payoutPaid(venueName, payout.amount)
              : emailTemplates.payoutFailed(venueName, payout.amount, failureReason),
        });
      }
      if (owner?.phone) {
        await sendSms({
          to: owner.phone,
          message:
            result.status === "success"
              ? `Kicko: KES ${payout.amount.toLocaleString()} payout for ${venueName} sent to your M-Pesa.`
              : `Kicko: payout of KES ${payout.amount.toLocaleString()} for ${venueName} failed — ${failureReason}. Check your dashboard.`,
        });
      }
    }
  }
}

export async function runResolvePayoutsOnce() {
  try {
    await resolveDuePayouts();
  } catch (err) {
    console.error("runResolvePayoutsOnce error:", err);
  }
}

export function startResolvePayoutsJob() {
  runResolvePayoutsOnce();
  setInterval(runResolvePayoutsOnce, CHECK_INTERVAL_MS);
}
