import { supabase } from "../config/supabase.js";
import { initiateB2CPayout } from "../services/b2c.service.js";
import { notify } from "../services/notifications.service.js";
import { sendTemplatedEmail, FRONTEND_URL } from "../services/email.service.js";
import { sendSms } from "../services/sms.service.js";

const CHECK_INTERVAL_MS = 60_000;

type DuePayout = {
  id: string;
  amount: number;
  owner_id: string;
  venue_id: string;
  payout_details_reminder_sent_at: string | null;
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
      "id, amount, owner_id, venue_id, payout_details_reminder_sent_at, booking:bookings(end_at), session:match_sessions(end_at), venue:venues(name, payout_type, payout_number, payout_account_ref), owner:users!payouts_owner_id_fkey(email, phone)"
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
    if (!venue?.payout_type || !venue.payout_number) {
      if (!payout.payout_details_reminder_sent_at) {
        await notify({
          userId: payout.owner_id,
          type: "payout_details_missing",
          title: "We can't pay you out yet",
          body: `${venue?.name ?? "your venue"} · KES ${payout.amount.toLocaleString()} — add payout details to receive it`,
          link: "/owner/venues",
        });
        if (payout.owner?.email) {
          await sendTemplatedEmail("payout_details_missing", payout.owner.email, {
            venueName: venue?.name ?? "your venue",
            amount: `KES ${payout.amount.toLocaleString()}`,
            payoutSettingsUrl: `${FRONTEND_URL}/owner/venues/${payout.venue_id}/edit`,
            manageNotificationsUrl: `${FRONTEND_URL}/owner/settings`,
          });
        }
        await supabase.from("payouts").update({ payout_details_reminder_sent_at: new Date().toISOString() }).eq("id", payout.id);
      }
      continue; // no payout details on file yet
    }

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
        if (result.status === "success") {
          await sendTemplatedEmail("payout_paid", owner.email, {
            venueName,
            amount: `KES ${payout.amount.toLocaleString()}`,
            payoutHistoryUrl: `${FRONTEND_URL}/owner/payments`,
            manageNotificationsUrl: `${FRONTEND_URL}/owner/settings`,
          });
        } else {
          await sendTemplatedEmail("payout_failed", owner.email, {
            venueName,
            amount: `KES ${payout.amount.toLocaleString()}`,
            reason: failureReason,
            payoutSettingsUrl: `${FRONTEND_URL}/owner/venues/${payout.venue_id}/edit`,
            manageNotificationsUrl: `${FRONTEND_URL}/owner/settings`,
          });
        }
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
