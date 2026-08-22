import { supabase } from "../config/supabase.js";
import { sendTemplatedEmail } from "../services/email.service.js";

const CHECK_INTERVAL_MS = 15 * 60_000;
// Give it a couple hours after the final whistle before asking — not the
// moment the clock runs out.
const REQUEST_DELAY_MS = 2 * 60 * 60_000;

const FRONTEND_URL = process.env.FRONTEND_URL ?? "https://kicko-app.co.ke";

const BOOKING_SELECT = "id, venue_id, player_id, end_at, venue:venues(name)";

/** Only the booking's own player_id can review it (reviews are one-per-booking, and eligibility already keys off this same field) — mirrors reviews.controller.ts#getVenueReviews' eligibility check. */
export async function runReviewRequestOnce() {
  try {
    const cutoff = new Date(Date.now() - REQUEST_DELAY_MS).toISOString();
    const { data: due, error } = await supabase
      .from("bookings")
      .select(BOOKING_SELECT)
      .eq("status", "confirmed")
      .is("review_requested_at", null)
      .lte("end_at", cutoff);
    if (error) {
      console.error("runReviewRequestOnce: could not load due bookings", error);
      return;
    }
    if (!due || due.length === 0) return;

    const { data: reviewed } = await supabase
      .from("reviews")
      .select("booking_id")
      .in("booking_id", due.map((b) => b.id));
    const reviewedIds = new Set((reviewed ?? []).map((r) => r.booking_id));

    for (const booking of due) {
      if (!reviewedIds.has(booking.id)) {
        const { data: player } = await supabase.from("users").select("name, email").eq("id", booking.player_id).maybeSingle();
        if (player?.email) {
          await sendTemplatedEmail("review_request", player.email, {
            name: player.name,
            venueName: (booking.venue as any).name,
            reviewUrl: `${FRONTEND_URL}/player/explore/${booking.venue_id}`,
          });
        }
      }
      await supabase.from("bookings").update({ review_requested_at: new Date().toISOString() }).eq("id", booking.id);
    }
  } catch (err) {
    console.error("runReviewRequestOnce error:", err);
  }
}

export function startReviewRequestJob() {
  runReviewRequestOnce();
  setInterval(runReviewRequestOnce, CHECK_INTERVAL_MS);
}
