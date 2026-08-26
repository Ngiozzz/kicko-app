import { supabase } from "../config/supabase.js";
import { finalizeSplitBookingCancellation } from "../controllers/bookings.controller.js";

const CHECK_INTERVAL_MS = 45_000;

/** A split booking's headcount is fixed at creation, so unlike match_sessions there's just one deadline: pay by it or the whole thing is auto-cancelled and refunded. */
async function autoExpireUnpaidSplitBookings() {
  const { data: due } = await supabase
    .from("bookings")
    .select("*")
    .eq("booking_type", "split")
    .eq("status", "pending_payment")
    .lt("payment_deadline", new Date().toISOString());

  for (const booking of due ?? []) {
    await finalizeSplitBookingCancellation(booking, "Auto-cancelled — not everyone paid their share in time");
  }
}

export async function runSplitBookingExpiryOnce() {
  try {
    await autoExpireUnpaidSplitBookings();
  } catch (err) {
    console.error("runSplitBookingExpiryOnce error:", err);
  }
}

export function startSplitBookingExpiryJob() {
  runSplitBookingExpiryOnce();
  setInterval(runSplitBookingExpiryOnce, CHECK_INTERVAL_MS);
}
