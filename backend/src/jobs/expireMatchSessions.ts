import { supabase } from "../config/supabase.js";
import { finalizeSessionCancellation } from "../controllers/sessions.controller.js";
import { getPlatformSettings, type PlatformSettings } from "../services/settings.service.js";

const CHECK_INTERVAL_MS = 45_000;

/** joining sessions past their join deadline move to paying, whether or not every invite was answered. */
async function advanceJoiningToPaying(settings: PlatformSettings) {
  const { data: due } = await supabase.from("match_sessions").select("id").eq("phase", "joining").lt("phase_deadline", new Date().toISOString());
  for (const session of due ?? []) {
    await supabase
      .from("match_sessions")
      .update({ phase: "paying", phase_deadline: new Date(Date.now() + settings.session_pay_window_minutes * 60_000).toISOString() })
      .eq("id", session.id)
      .eq("phase", "joining");
  }
}

/** paying sessions that missed their payment deadline while still unfunded move to awaiting_decision. */
async function flagUnfundedPayingSessions() {
  const { data: due } = await supabase.from("match_sessions").select("id").eq("phase", "paying").lt("phase_deadline", new Date().toISOString());
  for (const session of due ?? []) {
    await supabase
      .from("match_sessions")
      .update({ phase: "awaiting_decision", phase_deadline: new Date().toISOString() })
      .eq("id", session.id)
      .eq("phase", "paying");
  }
}

/** awaiting_decision sessions the organizer never acted on (no resplit) get auto-cancelled and refunded after a grace period. */
async function autoExpireAbandonedSessions(settings: PlatformSettings) {
  const graceCutoff = new Date(Date.now() - settings.session_decision_grace_minutes * 60_000).toISOString();
  const { data: abandoned } = await supabase
    .from("match_sessions")
    .select("*, venue:venues(id, name, location, sport, photos, price_peak, price_off_peak, owner_id, status)")
    .eq("phase", "awaiting_decision")
    .eq("resplit_active", false)
    .lt("phase_deadline", graceCutoff);

  for (const session of abandoned ?? []) {
    await finalizeSessionCancellation(session, "Auto-cancelled — organizer didn't resolve funding in time");
  }
}

export async function runMatchSessionExpiryOnce() {
  try {
    const settings = await getPlatformSettings();
    await advanceJoiningToPaying(settings);
    await flagUnfundedPayingSessions();
    await autoExpireAbandonedSessions(settings);
    // Deliberately not porting thurfa's reconcileStuckParticipantPayments /
    // reconcileStuckTopUps — those exist only to rescue payments whose async
    // Daraja webhook never arrived. kicko's confirmPayment is a synchronous
    // client-callable stub, so there's no async gap to reconcile yet.
  } catch (err) {
    console.error("runMatchSessionExpiryOnce error:", err);
  }
}

export function startMatchSessionExpiryJob() {
  runMatchSessionExpiryOnce();
  setInterval(runMatchSessionExpiryOnce, CHECK_INTERVAL_MS);
}
