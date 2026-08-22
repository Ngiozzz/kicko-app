import crypto from "node:crypto";
import type { Request, Response } from "express";
import { supabase } from "../config/supabase.js";
import { computeRefundPct, computeSessionSplit, reverseServiceFee, wholeHoursBetween, MAX_BOOKING_HOURS } from "../services/pricing.service.js";
import { getPlatformSettings, type PlatformSettings } from "../services/settings.service.js";
import { initiateStkPush } from "../services/stk.service.js";

const VENUE_COLUMNS = "id, name, location, sport, photos, price_peak, price_off_peak, owner_id, status";
const SESSION_SELECT = `*, venue:venues(${VENUE_COLUMNS}), organizer:users(name)`;
// Two FKs into users once invited_by exists — must name the one we mean.
const PARTICIPANT_SELECT = "*, user:users!session_participants_user_id_fkey(id, name, email, phone)";

type Side = "home" | "away";

function minutesFromNow(mins: number): string {
  return new Date(Date.now() + mins * 60_000).toISOString();
}

function isWalkIn(session: { start_at: string; created_at: string }): boolean {
  return new Date(session.start_at).toDateString() === new Date(session.created_at).toDateString();
}

function hoursToKickoff(session: { start_at: string }): number {
  return (new Date(session.start_at).getTime() - Date.now()) / (1000 * 60 * 60);
}

// Strips the never-refunded service fee back out of a paid_amount (which
// has no fee column of its own), then scales the remaining venue-value
// portion by the same tiered policy individual bookings use.
function computeParticipantRefund(session: { start_at: string; created_at: string }, paidAmount: number, settings: PlatformSettings): number {
  if (paidAmount <= 0) return 0;
  const fee = reverseServiceFee(paidAmount, settings.service_fee_tiers);
  const venuePortion = +(paidAmount - fee).toFixed(2);
  const pct = computeRefundPct(isWalkIn(session), hoursToKickoff(session), settings);
  return +(venuePortion * (pct / 100)).toFixed(2);
}

function shapeParticipant(row: any) {
  return {
    id: row.id,
    session_id: row.session_id,
    side: row.side,
    is_captain: row.is_captain,
    status: row.status,
    paid: row.paid,
    paid_amount: row.paid_amount,
    joined_at: row.joined_at,
    display_name: row.display_name,
    is_unclaimed: row.user_id === null,
    user: row.user_id ? row.user : null,
  };
}

async function loadSession(id: string) {
  return supabase.from("match_sessions").select(SESSION_SELECT).eq("id", id).maybeSingle();
}

async function getParticipants(sessionId: string) {
  return supabase.from("session_participants").select(PARTICIPANT_SELECT).eq("session_id", sessionId);
}

function findCaptain(participants: any[], side: Side) {
  return participants.find((p) => p.side === side && p.is_captain && p.status === "accepted");
}

// The live per-person share and funding target for a session right now —
// never stored, since it depends on current headcount (or, once a resplit
// is active, current paid-headcount).
function getCurrentTarget(session: { total_cost: number; resplit_active: boolean }, participants: any[], settings: PlatformSettings) {
  if (session.resplit_active) {
    const paidCount = participants.filter((p) => p.paid && p.status !== "removed").length;
    return computeSessionSplit(session.total_cost, paidCount, settings.service_fee_tiers);
  }
  const acceptedCount = participants.filter((p) => p.status === "accepted").length;
  return computeSessionSplit(session.total_cost, acceptedCount, settings.service_fee_tiers);
}

async function getAmountPaidTotal(participantIds: string[]): Promise<number> {
  if (participantIds.length === 0) return 0;
  const { data } = await supabase.from("payments").select("amount").eq("status", "success").in("session_participant_id", participantIds);
  return (data ?? []).reduce((sum, p) => sum + Number(p.amount), 0);
}

// A participant's paid_amount column only ever reflects their original
// share (set once, on the session_share payment) — any later resplit
// top-up or organizer pay-remainder is a separate payments row against the
// same participant_id. Refunds need the true total, so sum it directly
// rather than trusting paid_amount alone.
async function getParticipantPaidTotal(participantId: string): Promise<number> {
  return getAmountPaidTotal([participantId]);
}

// A removed participant's original payment is refunded (minus the
// never-refunded fee) but their row is soft-removed, not deleted, purely to
// keep that fee in the accounting — it must NOT keep counting toward how
// much of the *current* funding target has been collected.
function activeParticipantIds(participants: any[]): string[] {
  return participants.filter((p) => p.status !== "removed").map((p) => p.id);
}

/** Refunds every participant who's paid something, one at a time — a single failure is logged, not fatal to the rest. */
async function refundAllPaidParticipants(session: { id: string; start_at: string; created_at: string }, reason: string, settings: PlatformSettings) {
  const { data: participants } = await getParticipants(session.id);
  for (const participant of participants ?? []) {
    if (!participant.paid) continue;
    const totalPaid = await getParticipantPaidTotal(participant.id);
    if (totalPaid <= 0) continue;
    const refundAmount = computeParticipantRefund(session, totalPaid, settings);
    if (refundAmount <= 0) continue;
    const { error } = await supabase.from("refunds").insert({
      session_participant_id: participant.id,
      amount: refundAmount,
      pct: computeRefundPct(isWalkIn(session), hoursToKickoff(session), settings),
      reason,
      status: "completed",
      resolved_at: new Date().toISOString(),
    });
    if (error) console.error(`refundAllPaidParticipants: failed for participant ${participant.id}`, error);
  }
}

/** Shared by the organizer's own cancel action and the auto-expiry job. Fetches settings itself since both callers are cross-module entry points. */
export async function finalizeSessionCancellation(session: any, reason: string) {
  const settings = await getPlatformSettings();
  await refundAllPaidParticipants(session, reason, settings);
  await supabase.from("bookings").update({ status: "cancelled" }).eq("session_id", session.id).eq("status", "confirmed");
  await supabase.from("payouts").delete().eq("session_id", session.id).eq("status", "pending");
  const { data: updated } = await supabase
    .from("match_sessions")
    .update({ phase: "cancelled", cancellation_reason: reason })
    .eq("id", session.id)
    .select(SESSION_SELECT)
    .single();
  return updated;
}

/** Turns a funded session into a real booking so it shows up in the normal booking-listing endpoints. */
async function materializeSessionBooking(session: any, totalCollected: number) {
  const { error } = await supabase.from("bookings").insert({
    venue_id: session.venue_id,
    player_id: session.organizer_id,
    booking_type: "session",
    session_id: session.id,
    start_at: session.start_at,
    end_at: session.end_at,
    subtotal: session.total_cost,
    service_fee: +(totalCollected - session.total_cost).toFixed(2),
    total_amount: totalCollected,
    is_walk_in: isWalkIn(session),
    status: "confirmed",
    payment_status: "paid",
  });
  if (error) {
    console.error("materializeSessionBooking: could not insert booking", error);
    return;
  }

  await supabase.from("payouts").insert({
    session_id: session.id,
    venue_id: session.venue_id,
    owner_id: session.venue.owner_id,
    amount: session.total_cost,
    status: "pending",
  });
}

/** Undoes materializeSessionBooking and reopens funding — used when a refund-owed participant leaves an already-funded session. */
async function reopenFundedSession(session: any) {
  await supabase.from("bookings").update({ status: "cancelled" }).eq("session_id", session.id).eq("status", "confirmed");
  await supabase.from("payouts").delete().eq("session_id", session.id).eq("status", "pending");
  await supabase
    .from("match_sessions")
    .update({ phase: "awaiting_decision", resplit_active: false, phase_deadline: new Date().toISOString() })
    .eq("id", session.id);
}

async function maybeAdvanceToPaying(sessionId: string, settings: PlatformSettings) {
  const { data: participants } = await getParticipants(sessionId);
  if ((participants ?? []).some((p) => p.status === "invited")) return;
  await supabase
    .from("match_sessions")
    .update({ phase: "paying", phase_deadline: minutesFromNow(settings.session_pay_window_minutes) })
    .eq("id", sessionId)
    .eq("phase", "joining");
}

// Called from payments.controller.ts#confirmPayment once a session_share/
// session_topup/session_remainder payment succeeds — recomputes whether the
// session is now fully funded and, if so, flips phase + materializes the
// booking. Exported so payments.controller.ts doesn't need to know any of
// this table's internals.
export async function recomputeSessionFunding(sessionParticipantId: string) {
  const { data: participantRow } = await supabase.from("session_participants").select("session_id").eq("id", sessionParticipantId).maybeSingle();
  if (!participantRow) return { session: null, funded: false };

  const { data: session } = await loadSession(participantRow.session_id);
  if (!session) return { session: null, funded: false };

  const settings = await getPlatformSettings();
  const { data: participants } = await getParticipants(session.id);
  const { totalTarget } = getCurrentTarget(session, participants ?? [], settings);
  const amountPaid = await getAmountPaidTotal(activeParticipantIds(participants ?? []));

  if (amountPaid >= totalTarget && session.phase !== "funded") {
    const { data: updated, error } = await supabase
      .from("match_sessions")
      .update({ phase: "funded" })
      .eq("id", session.id)
      .eq("phase", session.phase)
      .select(SESSION_SELECT)
      .single();
    if (!error && updated) {
      await materializeSessionBooking(updated, amountPaid);
      return { session: updated, funded: true };
    }
  }

  return { session, funded: session.phase === "funded" };
}

// ============================================================
// Handlers
// ============================================================

/** Starts a session — the caller becomes home captain/organizer immediately. */
export async function createSession(req: Request, res: Response) {
  if (req.user!.role !== "player") return res.status(403).json({ error: "Only players can start a match session." });

  const { venue_id, start_at, end_at } = req.body;
  if (typeof venue_id !== "string" || typeof start_at !== "string" || typeof end_at !== "string") {
    return res.status(400).json({ error: "venue_id, start_at, and end_at are required." });
  }

  const start = new Date(start_at);
  const end = new Date(end_at);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) {
    return res.status(400).json({ error: "Invalid session time range." });
  }
  const hours = wholeHoursBetween(start, end);
  if (hours === null) return res.status(400).json({ error: `Sessions must be between 1 and ${MAX_BOOKING_HOURS} whole hours.` });
  if (start.getTime() < Date.now()) return res.status(400).json({ error: "You can't start a session in the past." });

  const { data: venue, error: venueError } = await supabase.from("venues").select(VENUE_COLUMNS).eq("id", venue_id).maybeSingle();
  if (venueError) return res.status(500).json({ error: "Could not load venue." });
  if (!venue || venue.status !== "verified") return res.status(404).json({ error: "Venue not found." });

  const settings = await getPlatformSettings();
  const { data: session, error: sessionError } = await supabase
    .from("match_sessions")
    .insert({
      venue_id,
      organizer_id: req.user!.id,
      start_at: start.toISOString(),
      end_at: end.toISOString(),
      total_cost: venue.price_peak * hours,
      phase: "joining",
      phase_deadline: minutesFromNow(settings.session_join_window_minutes),
    })
    .select(SESSION_SELECT)
    .single();
  if (sessionError) return res.status(500).json({ error: "Could not start a match session." });

  const { error: participantError } = await supabase.from("session_participants").insert({
    session_id: session.id,
    user_id: req.user!.id,
    side: "home",
    is_captain: true,
    status: "accepted",
  });
  if (participantError) return res.status(500).json({ error: "Session created, but you couldn't be added as home captain." });

  res.status(201).json({ session });
}

/** Sessions the caller organizes or is an active/invited participant in, most recent first. */
export async function listMySessions(req: Request, res: Response) {
  const callerId = req.user!.id;

  const { data: organized, error: organizedError } = await supabase.from("match_sessions").select(SESSION_SELECT).eq("organizer_id", callerId);
  if (organizedError) return res.status(500).json({ error: "Could not load sessions." });

  const { data: participantRows, error: participantError } = await supabase
    .from("session_participants")
    .select("session_id")
    .eq("user_id", callerId)
    .in("status", ["accepted", "invited"]);
  if (participantError) return res.status(500).json({ error: "Could not load sessions." });

  const organizedIds = new Set((organized ?? []).map((s) => s.id));
  const joinedIds = [...new Set((participantRows ?? []).map((p) => p.session_id))].filter((id) => !organizedIds.has(id));

  let joined: any[] = [];
  if (joinedIds.length > 0) {
    const { data, error } = await supabase.from("match_sessions").select(SESSION_SELECT).in("id", joinedIds);
    if (error) return res.status(500).json({ error: "Could not load sessions." });
    joined = data ?? [];
  }

  const all = [...(organized ?? []), ...joined].sort((a, b) => new Date(b.start_at).getTime() - new Date(a.start_at).getTime());

  // Cheap headcount-only pass for the list view — the full roster (names,
  // captain/blind-side redaction) only ever loads on the session's own
  // detail page via getSession.
  const sessionIds = all.map((s) => s.id);
  const countsBySession = new Map<string, number>();
  if (sessionIds.length > 0) {
    const { data: participantCounts } = await supabase.from("session_participants").select("session_id").in("session_id", sessionIds).eq("status", "accepted");
    for (const p of participantCounts ?? []) countsBySession.set(p.session_id, (countsBySession.get(p.session_id) ?? 0) + 1);
  }
  const shaped = all.map((s) => ({ ...s, accepted_count: countsBySession.get(s.id) ?? 0 }));

  res.status(200).json({ sessions: shaped });
}

/** Organizer-scoped sessions stuck needing a resplit/pay-remainder/cancel decision. */
export async function getSessionsAwaitingMyDecision(req: Request, res: Response) {
  const { data, error } = await supabase.from("match_sessions").select(SESSION_SELECT).eq("organizer_id", req.user!.id).eq("phase", "awaiting_decision");
  if (error) return res.status(500).json({ error: "Could not load sessions." });
  res.status(200).json({ sessions: data });
}

/** Sessions where the caller captains a side that hasn't closed its roster yet, but the other side already has. */
export async function getSessionsAwaitingMyCompletion(req: Request, res: Response) {
  const { data: captainRows, error } = await supabase
    .from("session_participants")
    .select("session_id, side")
    .eq("user_id", req.user!.id)
    .eq("is_captain", true)
    .eq("status", "accepted");
  if (error) return res.status(500).json({ error: "Could not load sessions." });
  if (!captainRows || captainRows.length === 0) return res.status(200).json({ sessions: [] });

  const sessionIds = captainRows.map((c) => c.session_id);
  const { data: sessions, error: sessionsError } = await supabase.from("match_sessions").select(SESSION_SELECT).in("id", sessionIds).eq("phase", "joining");
  if (sessionsError) return res.status(500).json({ error: "Could not load sessions." });

  const waiting = (sessions ?? []).filter((session: any) => {
    const mySide = captainRows.find((c) => c.session_id === session.id)!.side as Side;
    const myField = mySide === "home" ? "home_roster_completed_at" : "away_roster_completed_at";
    const otherField = mySide === "home" ? "away_roster_completed_at" : "home_roster_completed_at";
    return !session[myField] && session[otherField];
  });

  res.status(200).json({ sessions: waiting });
}

/** Role-shaped roster: home captain always sees the home side; sees the away side only until a real away captain claims it. Away side never sees home. */
export async function getSession(req: Request, res: Response) {
  const { data: session, error } = await loadSession(req.params.id);
  if (error) return res.status(500).json({ error: "Could not load session." });
  if (!session) return res.status(404).json({ error: "Session not found." });

  const { data: participants, error: participantsError } = await getParticipants(session.id);
  if (participantsError) return res.status(500).json({ error: "Could not load roster." });

  const callerId = req.user!.id;
  const isOrganizer = session.organizer_id === callerId;
  const callerParticipant = (participants ?? []).find((p) => p.user_id === callerId && p.status !== "removed");
  if (!isOrganizer && !callerParticipant) return res.status(403).json({ error: "You don't have access to this session." });

  const callerSide: Side = isOrganizer ? "home" : callerParticipant.side;
  // The organizer is always exactly the home captain in this model — but
  // callerSide alone (used for roster VISIBILITY below) is true for every
  // home-side teammate too, not just the captain, so join-link SHARING
  // authority below is deliberately gated on these, not on callerSide.
  const isHomeCaptain = isOrganizer;
  const isAwayCaptain = callerSide === "away" && Boolean(callerParticipant?.is_captain);
  const awayClaimed = Boolean(findCaptain(participants ?? [], "away"));

  const canSeeHome = callerSide === "home";
  const canSeeAway = callerSide === "away" || (callerSide === "home" && !awayClaimed);

  const sideRows = (side: Side) => (participants ?? []).filter((p) => p.side === side && (p.status === "accepted" || p.status === "invited"));
  const homeRows = sideRows("home");
  const awayRows = sideRows("away");

  const settings = await getPlatformSettings();
  const { totalTarget, perPersonShare } = getCurrentTarget(session, participants ?? [], settings);
  const amountPaidSoFar = await getAmountPaidTotal(activeParticipantIds(participants ?? []));

  res.status(200).json({
    session,
    caller_side: callerSide,
    is_organizer: isOrganizer,
    is_captain: isHomeCaptain || isAwayCaptain,
    my_participant: callerParticipant ? shapeParticipant(callerParticipant) : null,
    home: canSeeHome ? homeRows.map(shapeParticipant) : { redacted: true, count: homeRows.filter((p) => p.status === "accepted").length },
    away: canSeeAway ? awayRows.map(shapeParticipant) : { redacted: true, count: awayRows.filter((p) => p.status === "accepted").length },
    home_join_link: isHomeCaptain ? session.home_invite_token : null,
    away_join_link: (isHomeCaptain && !awayClaimed) || isAwayCaptain ? session.away_invite_token : null,
    per_person_share: perPersonShare,
    total_target: totalTarget,
    amount_paid_so_far: amountPaidSoFar,
  });
}

/** Captain invites a known Kicko player onto their own side by phone number. */
export async function inviteParticipant(req: Request, res: Response) {
  const { data: session, error } = await loadSession(req.params.id);
  if (error) return res.status(500).json({ error: "Could not load session." });
  if (!session) return res.status(404).json({ error: "Session not found." });
  if (session.phase !== "joining") return res.status(400).json({ error: "This session isn't accepting invites." });

  const { side, phone } = req.body;
  if (side !== "home" && side !== "away") return res.status(400).json({ error: "side must be 'home' or 'away'." });
  if (typeof phone !== "string" || !phone.trim()) return res.status(400).json({ error: "phone is required." });

  const { data: participants, error: participantsError } = await getParticipants(session.id);
  if (participantsError) return res.status(500).json({ error: "Could not load roster." });

  const isHomeCaptain = session.organizer_id === req.user!.id;
  const captain = findCaptain(participants ?? [], side);
  const callerControls = side === "home" ? isHomeCaptain : captain?.user_id === req.user!.id;
  if (!callerControls) {
    return res.status(403).json({
      error: side === "away" && !captain ? "Share the away invite link to bring in an away captain first." : "Only that side's captain can invite.",
    });
  }

  const settings = await getPlatformSettings();
  const activeOnSide = (participants ?? []).filter((p) => p.side === side && p.status !== "declined" && p.status !== "removed").length;
  if (activeOnSide >= settings.session_max_per_side) return res.status(400).json({ error: "This side is full." });

  const { data: invitee, error: inviteeError } = await supabase.from("users").select("id, name, phone").eq("phone", phone.trim()).eq("role", "player").maybeSingle();
  if (inviteeError) return res.status(500).json({ error: "Could not look up that player." });
  if (!invitee) return res.status(404).json({ error: "No Kicko player found with that phone number." });

  const existing = (participants ?? []).find((p) => p.user_id === invitee.id);
  if (existing && existing.status !== "declined" && existing.status !== "removed") {
    return res.status(400).json({ error: "That player is already part of this session." });
  }

  const { data: participant, error: upsertError } = await supabase
    .from("session_participants")
    .upsert(
      { session_id: session.id, user_id: invitee.id, side, is_captain: false, status: "invited", invited_by: req.user!.id, responded_at: null },
      { onConflict: "session_id,user_id" }
    )
    .select(PARTICIPANT_SELECT)
    .single();
  if (upsertError) return res.status(500).json({ error: "Could not send invite." });

  res.status(201).json({ participant: shapeParticipant(participant) });
}

/** Caller accepts/declines their own pending invite. */
export async function respondToInvite(req: Request, res: Response) {
  const { data: session, error } = await loadSession(req.params.id);
  if (error) return res.status(500).json({ error: "Could not load session." });
  if (!session) return res.status(404).json({ error: "Session not found." });
  if (session.phase !== "joining") return res.status(400).json({ error: "This session isn't accepting responses right now." });

  const { accept } = req.body;
  if (typeof accept !== "boolean") return res.status(400).json({ error: "accept must be true or false." });

  const { data: participant, error: fetchError } = await supabase
    .from("session_participants")
    .select("*")
    .eq("session_id", session.id)
    .eq("user_id", req.user!.id)
    .eq("status", "invited")
    .maybeSingle();
  if (fetchError) return res.status(500).json({ error: "Could not load your invite." });
  if (!participant) return res.status(404).json({ error: "You don't have a pending invite to this session." });

  const { error: updateError } = await supabase
    .from("session_participants")
    .update({ status: accept ? "accepted" : "declined", responded_at: new Date().toISOString() })
    .eq("id", participant.id);
  if (updateError) return res.status(500).json({ error: "Could not update your invite." });

  await maybeAdvanceToPaying(session.id, await getPlatformSettings());

  const { data: updated } = await loadSession(session.id);
  res.status(200).json({ session: updated });
}

/** Captain closes their own side's invite window early; if both sides are done, joining ends immediately. */
export async function completeRoster(req: Request, res: Response) {
  const { data: session, error } = await loadSession(req.params.id);
  if (error) return res.status(500).json({ error: "Could not load session." });
  if (!session) return res.status(404).json({ error: "Session not found." });
  if (session.phase !== "joining") return res.status(400).json({ error: "This session isn't accepting invites." });

  const { data: participants, error: participantsError } = await getParticipants(session.id);
  if (participantsError) return res.status(500).json({ error: "Could not load roster." });

  const caller = (participants ?? []).find((p) => p.user_id === req.user!.id && p.status === "accepted" && p.is_captain);
  if (!caller) return res.status(403).json({ error: "Only a captain can close their side's roster." });

  await supabase
    .from("session_participants")
    .update({ status: "declined", responded_at: new Date().toISOString() })
    .eq("session_id", session.id)
    .eq("side", caller.side)
    .eq("status", "invited");

  const field = caller.side === "home" ? "home_roster_completed_at" : "away_roster_completed_at";
  await supabase
    .from("match_sessions")
    .update({ [field]: new Date().toISOString() })
    .eq("id", session.id);

  const { data: refreshed } = await supabase.from("match_sessions").select("home_roster_completed_at, away_roster_completed_at").eq("id", session.id).single();
  if (refreshed?.home_roster_completed_at && refreshed?.away_roster_completed_at) {
    const settings = await getPlatformSettings();
    await supabase
      .from("match_sessions")
      .update({ phase: "paying", phase_deadline: minutesFromNow(settings.session_pay_window_minutes) })
      .eq("id", session.id)
      .eq("phase", "joining");
  }

  const { data: updated } = await loadSession(session.id);
  res.status(200).json({ session: updated });
}

/** Public preview of an invite link — no identities, just enough to decide whether to join. */
export async function getJoinInfo(req: Request, res: Response) {
  const token = typeof req.query.token === "string" ? req.query.token : "";
  if (!token) return res.status(400).json({ error: "token is required." });

  const { data: session, error } = await supabase
    .from("match_sessions")
    .select(SESSION_SELECT)
    .or(`home_invite_token.eq.${token},away_invite_token.eq.${token}`)
    .maybeSingle();
  if (error) return res.status(500).json({ error: "Could not look up that link." });
  if (!session) return res.status(404).json({ error: "This invite link isn't valid." });

  const side: Side = session.home_invite_token === token ? "home" : "away";
  const { data: participants } = await getParticipants(session.id);
  const captain = findCaptain(participants ?? [], side);
  const headcount = (participants ?? []).filter((p) => p.side === side && p.status === "accepted").length;

  res.status(200).json({
    session_id: session.id,
    venue: session.venue,
    organizer_name: session.organizer.name,
    start_at: session.start_at,
    end_at: session.end_at,
    side,
    headcount,
    will_become_captain: side === "away" && !captain,
    phase: session.phase,
  });
}

/** Joins via an invite link — claims the away captaincy if unclaimed (login required), otherwise joins as a regular member (logged in) or an anonymous placeholder. */
export async function joinViaLink(req: Request, res: Response) {
  const { token, display_name } = req.body;
  if (typeof token !== "string" || !token) return res.status(400).json({ error: "token is required." });

  const { data: session, error } = await supabase
    .from("match_sessions")
    .select(SESSION_SELECT)
    .or(`home_invite_token.eq.${token},away_invite_token.eq.${token}`)
    .maybeSingle();
  if (error) return res.status(500).json({ error: "Could not look up that link." });
  if (!session) return res.status(404).json({ error: "This invite link isn't valid." });
  if (session.phase !== "joining") return res.status(400).json({ error: "This session is no longer accepting new players." });

  const side: Side = session.home_invite_token === token ? "home" : "away";
  const { data: participants } = await getParticipants(session.id);
  const captain = findCaptain(participants ?? [], side);
  const willBecomeCaptain = side === "away" && !captain;

  if (willBecomeCaptain && !req.user) {
    return res.status(401).json({ error: "Log in to become the away captain.", will_become_captain: true });
  }

  const settings = await getPlatformSettings();
  const activeOnSide = (participants ?? []).filter((p) => p.side === side && p.status !== "declined" && p.status !== "removed").length;
  if (activeOnSide >= settings.session_max_per_side) return res.status(400).json({ error: "This side is full." });

  if (req.user) {
    const existing = (participants ?? []).find((p) => p.user_id === req.user!.id);
    if (existing && existing.status !== "declined" && existing.status !== "removed") {
      return res.status(200).json({ session, participant: shapeParticipant(existing) });
    }
    const { data: participant, error: insertError } = await supabase
      .from("session_participants")
      .upsert(
        { session_id: session.id, user_id: req.user.id, side, is_captain: willBecomeCaptain, status: "accepted", responded_at: new Date().toISOString() },
        { onConflict: "session_id,user_id" }
      )
      .select(PARTICIPANT_SELECT)
      .single();
    if (insertError) return res.status(500).json({ error: "Could not join this session." });
    return res.status(201).json({ session, participant: shapeParticipant(participant) });
  }

  if (typeof display_name !== "string" || !display_name.trim()) {
    return res.status(400).json({ error: "display_name is required to join without logging in." });
  }
  const claimToken = crypto.randomUUID();
  const { data: participant, error: insertError } = await supabase
    .from("session_participants")
    .insert({
      session_id: session.id,
      user_id: null,
      side,
      is_captain: false,
      status: "accepted",
      display_name: display_name.trim(),
      claim_token: claimToken,
      responded_at: new Date().toISOString(),
    })
    .select(PARTICIPANT_SELECT)
    .single();
  if (insertError) return res.status(500).json({ error: "Could not join this session." });

  res.status(201).json({ session, participant: shapeParticipant(participant), claim_token: claimToken });
}

/** Attaches the caller's real identity to an anonymous placeholder row after they log in. */
export async function claimParticipant(req: Request, res: Response) {
  const { claim_token } = req.body;
  if (typeof claim_token !== "string" || !claim_token) return res.status(400).json({ error: "claim_token is required." });

  const { data: participant, error: fetchError } = await supabase
    .from("session_participants")
    .select("*")
    .eq("session_id", req.params.id)
    .eq("claim_token", claim_token)
    .is("user_id", null)
    .maybeSingle();
  if (fetchError) return res.status(500).json({ error: "Could not process the claim." });
  if (!participant) return res.status(404).json({ error: "This claim link has already been used or is invalid." });

  const { data: updated, error: updateError } = await supabase
    .from("session_participants")
    .update({ user_id: req.user!.id, claim_token: null })
    .eq("id", participant.id)
    .select(PARTICIPANT_SELECT)
    .single();
  if (updateError) return res.status(500).json({ error: "Could not claim your spot." });

  res.status(200).json({ participant: shapeParticipant(updated) });
}

/** What the caller owes right now during awaiting_decision — a resplit top-up (already-paid participants) or the full remainder (organizer only). */
async function resolveTopUp(session: any, participants: any[], callerId: string, settings: PlatformSettings) {
  if (session.phase !== "awaiting_decision") return { error: "No top-up is owed right now." } as const;

  if (session.resplit_active) {
    const participant = participants.find((p) => p.user_id === callerId && p.paid && p.status !== "removed");
    if (!participant) return { error: "Only already-paid participants owe a top-up during a resplit." } as const;
    const { perPersonShare } = getCurrentTarget(session, participants, settings);
    const owed = Math.max(+(perPersonShare - participant.paid_amount).toFixed(2), 0);
    return { owed, purpose: "session_topup" as const, participantId: participant.id };
  }

  if (session.organizer_id !== callerId) return { error: "Only the organizer can pay the remainder." } as const;
  const organizerParticipant = participants.find((p) => p.user_id === callerId);
  if (!organizerParticipant) return { error: "Organizer isn't a participant in this session." } as const;
  const { totalTarget } = getCurrentTarget(session, participants, settings);
  const amountPaid = await getAmountPaidTotal(activeParticipantIds(participants));
  const owed = Math.max(+(totalTarget - amountPaid).toFixed(2), 0);
  return { owed, purpose: "session_remainder" as const, participantId: organizerParticipant.id };
}

export async function getTopUpOwed(req: Request, res: Response) {
  const { data: session, error } = await loadSession(req.params.id);
  if (error) return res.status(500).json({ error: "Could not load session." });
  if (!session) return res.status(404).json({ error: "Session not found." });

  const { data: participants } = await getParticipants(session.id);
  const result = await resolveTopUp(session, participants ?? [], req.user!.id, await getPlatformSettings());
  if ("error" in result) return res.status(400).json({ error: result.error });

  res.status(200).json({ owed: result.owed, purpose: result.purpose });
}

/** Pays a top-up (resplit share gap or organizer's pay-remainder). */
export async function payTopUp(req: Request, res: Response) {
  const { data: session, error } = await loadSession(req.params.id);
  if (error) return res.status(500).json({ error: "Could not load session." });
  if (!session) return res.status(404).json({ error: "Session not found." });

  const { phone_number } = req.body;
  if (typeof phone_number !== "string" || !phone_number.trim()) return res.status(400).json({ error: "phone_number is required." });

  const { data: participants } = await getParticipants(session.id);
  const result = await resolveTopUp(session, participants ?? [], req.user!.id, await getPlatformSettings());
  if ("error" in result) return res.status(400).json({ error: result.error });
  if (result.owed <= 0) return res.status(400).json({ error: "You don't owe a top-up." });

  const stk = await initiateStkPush({ phoneNumber: phone_number, amount: result.owed, accountReference: result.participantId });
  const { data: payment, error: paymentError } = await supabase
    .from("payments")
    .insert({
      session_participant_id: result.participantId,
      payer_id: req.user!.id,
      purpose: result.purpose,
      amount: result.owed,
      phone_number,
      provider_reference: stk.providerReference,
      status: "pending",
    })
    .select()
    .single();
  if (paymentError) return res.status(500).json({ error: "Could not start payment." });

  res.status(201).json({ payment });
}

/** Caller pays their own share while the session is in its paying window. */
export async function payMyShare(req: Request, res: Response) {
  const { data: session, error } = await loadSession(req.params.id);
  if (error) return res.status(500).json({ error: "Could not load session." });
  if (!session) return res.status(404).json({ error: "Session not found." });
  if (session.phase !== "paying") return res.status(400).json({ error: "This session isn't collecting payment right now." });

  const { data: participant, error: participantError } = await supabase
    .from("session_participants")
    .select("*")
    .eq("session_id", session.id)
    .eq("user_id", req.user!.id)
    .eq("status", "accepted")
    .maybeSingle();
  if (participantError) return res.status(500).json({ error: "Could not load your spot in this session." });
  if (!participant) return res.status(403).json({ error: "You're not an accepted participant in this session." });
  if (participant.paid) return res.status(400).json({ error: "You've already paid your share." });

  const { phone_number } = req.body;
  if (typeof phone_number !== "string" || !phone_number.trim()) return res.status(400).json({ error: "phone_number is required." });

  const { data: participants } = await getParticipants(session.id);
  const { perPersonShare } = getCurrentTarget(session, participants ?? [], await getPlatformSettings());

  const stk = await initiateStkPush({ phoneNumber: phone_number, amount: perPersonShare, accountReference: participant.id });
  const { data: payment, error: paymentError } = await supabase
    .from("payments")
    .insert({
      session_participant_id: participant.id,
      payer_id: req.user!.id,
      purpose: "session_share",
      amount: perPersonShare,
      phone_number,
      provider_reference: stk.providerReference,
      status: "pending",
    })
    .select()
    .single();
  if (paymentError) return res.status(500).json({ error: "Could not start payment." });

  res.status(201).json({ payment });
}

/** Organizer resplits the remaining gap across everyone who's already paid — one-time per session. */
export async function resplitSession(req: Request, res: Response) {
  const { data: session, error } = await loadSession(req.params.id);
  if (error) return res.status(500).json({ error: "Could not load session." });
  if (!session) return res.status(404).json({ error: "Session not found." });
  if (session.organizer_id !== req.user!.id) return res.status(403).json({ error: "Only the organizer can resplit this session." });
  if (session.phase !== "awaiting_decision") return res.status(400).json({ error: "Resplitting is only available once payment has stalled." });
  if (session.resplit_active) return res.status(400).json({ error: "This session has already been resplit." });

  const { data: participants } = await getParticipants(session.id);
  const paidCount = (participants ?? []).filter((p) => p.paid && p.status !== "removed").length;
  if (paidCount === 0) return res.status(400).json({ error: "Nobody has paid yet — cancel instead." });

  const { data: updated, error: updateError } = await supabase
    .from("match_sessions")
    .update({ resplit_active: true })
    .eq("id", session.id)
    .eq("resplit_active", false)
    .select(SESSION_SELECT)
    .single();
  if (updateError || !updated) return res.status(409).json({ error: "Could not resplit — try again." });

  res.status(200).json({ session: updated });
}

/** Organizer cancels a stalled session — refunds everyone who paid. */
export async function cancelSession(req: Request, res: Response) {
  const { data: session, error } = await loadSession(req.params.id);
  if (error) return res.status(500).json({ error: "Could not load session." });
  if (!session) return res.status(404).json({ error: "Session not found." });
  if (session.organizer_id !== req.user!.id) return res.status(403).json({ error: "Only the organizer can cancel this session." });
  if (session.phase !== "awaiting_decision") return res.status(400).json({ error: "This session can only be cancelled once payment has stalled." });

  const updated = await finalizeSessionCancellation(session, "Session cancelled by organizer");
  res.status(200).json({ session: updated });
}

/** Home captain removes anyone on either side; a side's own captain removes anyone on their side; anyone removes themself. */
export async function removeParticipant(req: Request, res: Response) {
  const { data: session, error } = await loadSession(req.params.id);
  if (error) return res.status(500).json({ error: "Could not load session." });
  if (!session) return res.status(404).json({ error: "Session not found." });

  const { data: participants, error: participantsError } = await getParticipants(session.id);
  if (participantsError) return res.status(500).json({ error: "Could not load roster." });

  const target = (participants ?? []).find((p) => p.id === req.params.participantId);
  if (!target) return res.status(404).json({ error: "Participant not found." });
  if (target.side === "home" && target.user_id === session.organizer_id) {
    return res.status(400).json({ error: "The organizer can't be removed from their own session." });
  }

  const callerId = req.user!.id;
  const isSelf = target.user_id === callerId;
  const isHomeCaptain = session.organizer_id === callerId;
  const caller = (participants ?? []).find((p) => p.user_id === callerId && p.status !== "removed");
  const isSideCaptain = Boolean(caller?.is_captain) && caller?.side === target.side;
  if (!isSelf && !isHomeCaptain && !isSideCaptain) {
    return res.status(403).json({ error: "You don't have permission to remove this participant." });
  }

  let refundAmount = 0;
  let totalPaid = 0;
  if (target.paid) {
    const settings = await getPlatformSettings();
    totalPaid = await getParticipantPaidTotal(target.id);
    refundAmount = computeParticipantRefund(session, totalPaid, settings);
    if (refundAmount > 0) {
      const { error: refundError } = await supabase.from("refunds").insert({
        session_participant_id: target.id,
        amount: refundAmount,
        pct: computeRefundPct(isWalkIn(session), hoursToKickoff(session), settings),
        reason: isSelf ? "Participant left the session" : "Removed by captain",
        status: "completed",
        requested_by: callerId,
        resolved_by: callerId,
        resolved_at: new Date().toISOString(),
      });
      if (refundError) return res.status(500).json({ error: "Could not process the refund — participant was not removed." });
    }
  }

  const keptAmount = +(totalPaid - refundAmount).toFixed(2);
  if (keptAmount > 0) {
    await supabase.from("session_participants").update({ status: "removed", paid_amount: keptAmount }).eq("id", target.id);
  } else {
    await supabase.from("session_participants").delete().eq("id", target.id);
  }

  if (session.phase === "funded" && refundAmount > 0) {
    await reopenFundedSession(session);
  }

  const { data: updated } = await loadSession(session.id);
  res.status(200).json({ session: updated });
}
