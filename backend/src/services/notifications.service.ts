import { supabase } from "../config/supabase.js";

export type NotificationType =
  | "booking_confirmed"
  | "booking_cancelled"
  | "new_booking"
  | "payout_paid"
  | "payout_failed"
  | "venue_status_changed"
  | "new_review"
  | "split_booking_invite"
  | "team_invite"
  | "tournament_entry_confirmed";

/**
 * Inserts one notification row. Called directly from whatever controller
 * action caused the event (payment confirmation, payout job, admin venue
 * review, etc.) — not a generic event bus, just a plain insert at the
 * point it happens, same directness as the rest of this backend.
 *
 * Deliberately swallows its own errors: a notification failing to save
 * should never fail the request that triggered it (a confirmed payment
 * must still succeed even if the notification insert has a hiccup).
 */
export async function notify(params: { userId: string; type: NotificationType; title: string; body?: string; link?: string }): Promise<void> {
  const { error } = await supabase.from("notifications").insert({
    user_id: params.userId,
    type: params.type,
    title: params.title,
    body: params.body ?? null,
    link: params.link ?? null,
  });
  if (error) console.error("notify insert error:", error);
}
