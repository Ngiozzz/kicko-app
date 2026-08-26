import { supabase } from "../config/supabase.js";
import { sendTemplatedEmail } from "../services/email.service.js";

const CHECK_INTERVAL_MS = 5 * 60_000;
const REMINDER_WINDOW_MS = 60 * 60_000;

const VENUE_COLUMNS = "id, name";
const BOOKING_SELECT = `id, session_id, booking_type, start_at, player_id, venue:venues(${VENUE_COLUMNS})`;

function formatWhen(startAt: string): string {
  return new Date(startAt).toLocaleString("en-KE", { weekday: "short", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });
}

/** Every accepted participant on a session or split booking, or just the solo player otherwise. */
async function recipientsFor(booking: { id: string; booking_type: string; session_id: string | null; player_id: string }): Promise<{ name: string; email: string }[]> {
  if (booking.booking_type === "session" && booking.session_id) {
    const { data } = await supabase
      .from("session_participants")
      .select("status, user:users!session_participants_user_id_fkey(name, email)")
      .eq("session_id", booking.session_id);
    return (data ?? [])
      .filter((p: any) => p.status === "accepted" && p.user?.email)
      .map((p: any) => ({ name: p.user.name, email: p.user.email }));
  }

  if (booking.booking_type === "split") {
    const { data } = await supabase
      .from("booking_participants")
      .select("status, user:users!booking_participants_user_id_fkey(name, email)")
      .eq("booking_id", booking.id);
    return (data ?? [])
      .filter((p: any) => p.status === "accepted" && p.user?.email)
      .map((p: any) => ({ name: p.user.name, email: p.user.email }));
  }

  const { data: player } = await supabase.from("users").select("name, email").eq("id", booking.player_id).maybeSingle();
  return player?.email ? [{ name: player.name, email: player.email }] : [];
}

/** Emails everyone on a confirmed booking about an hour before kickoff — solo bookings and funded sessions both land in `bookings`, so one pass covers both. */
export async function runGameReminderOnce() {
  try {
    const now = Date.now();
    const { data: due, error } = await supabase
      .from("bookings")
      .select(BOOKING_SELECT)
      .eq("status", "confirmed")
      .is("reminder_sent_at", null)
      .gte("start_at", new Date(now).toISOString())
      .lte("start_at", new Date(now + REMINDER_WINDOW_MS).toISOString());
    if (error) {
      console.error("runGameReminderOnce: could not load due bookings", error);
      return;
    }

    for (const booking of due ?? []) {
      const when = formatWhen(booking.start_at);
      const recipients = await recipientsFor(booking);
      for (const r of recipients) {
        await sendTemplatedEmail("game_reminder", r.email, { name: r.name, venueName: (booking.venue as any).name, when });
      }
      await supabase.from("bookings").update({ reminder_sent_at: new Date().toISOString() }).eq("id", booking.id);
    }
  } catch (err) {
    console.error("runGameReminderOnce error:", err);
  }
}

export function startGameReminderJob() {
  runGameReminderOnce();
  setInterval(runGameReminderOnce, CHECK_INTERVAL_MS);
}
