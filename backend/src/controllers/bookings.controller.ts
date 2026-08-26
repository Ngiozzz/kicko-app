import type { Request, Response } from "express";
import { supabase } from "../config/supabase.js";
import { computeFeeInclusiveRefund, computeServiceFee, computeSessionSplit, computeRefundPct, wholeHoursBetween, MAX_BOOKING_HOURS } from "../services/pricing.service.js";
import { getPlatformSettings, type PlatformSettings } from "../services/settings.service.js";
import { initiateStkPush } from "../services/stk.service.js";
import { notify } from "../services/notifications.service.js";
import { sendTemplatedEmail } from "../services/email.service.js";
import { sendSms } from "../services/sms.service.js";

const EXCLUSION_VIOLATION = "23P01";
const VENUE_COLUMNS = "id, name, location, sport, photos, price_peak, price_off_peak, owner_id, status";
const BOOKING_SELECT = `*, venue:venues(${VENUE_COLUMNS})`;
// Two FKs into users (user_id, invited_by) — must name the one we mean, same
// disambiguation session_participants needs.
const BOOKING_PARTICIPANT_SELECT = "*, user:users!booking_participants_user_id_fkey(id, name, email, phone)";

const PARTICIPANT_COUNTS: Record<string, number> = { singles: 2, doubles: 4 };

function hoursToKickoff(booking: { start_at: string }): number {
  return (new Date(booking.start_at).getTime() - Date.now()) / (1000 * 60 * 60);
}

async function getBookingParticipants(bookingId: string) {
  return supabase.from("booking_participants").select(BOOKING_PARTICIPANT_SELECT).eq("booking_id", bookingId);
}

function shapeParticipant(row: any) {
  return {
    id: row.id,
    booking_id: row.booking_id,
    is_organizer: row.is_organizer,
    status: row.status,
    share_amount: row.share_amount,
    paid: row.paid,
    paid_amount: row.paid_amount,
    user: row.user,
  };
}

/** A caller can see/act on a split booking if they organized it, are one of its named participants, or (like an open session) it's publicly open with a spot still to claim — no blind-roster rule either way, since everyone in a fixed 2/4-person group already knows who else is in it. */
async function loadAccessibleBooking(bookingId: string, userId: string) {
  const { data: booking, error } = await supabase.from("bookings").select(BOOKING_SELECT).eq("id", bookingId).maybeSingle();
  if (error || !booking) return { booking: null, error };
  if (booking.player_id === userId) return { booking, error: null };
  const { data: participant } = await supabase.from("booking_participants").select("id").eq("booking_id", bookingId).eq("user_id", userId).maybeSingle();
  if (participant) return { booking, error: null };
  if (booking.booking_type === "split" && booking.is_open && booking.status === "pending_payment") return { booking, error: null };
  return { booking: null, error: null };
}

/** Refunds every split-booking participant who's paid something — a single failure is logged, not fatal to the rest. Mirrors sessions.controller.ts's refundAllPaidParticipants. */
async function refundAllPaidBookingParticipants(booking: { id: string; start_at: string; created_at: string; is_walk_in: boolean }, reason: string, settings: PlatformSettings) {
  const { data: participants } = await getBookingParticipants(booking.id);
  for (const participant of participants ?? []) {
    if (!participant.paid || participant.paid_amount <= 0) continue;
    const refundAmount = computeFeeInclusiveRefund(participant.paid_amount, booking.is_walk_in, hoursToKickoff(booking), settings);
    if (refundAmount <= 0) continue;
    const { error } = await supabase.from("refunds").insert({
      booking_id: booking.id,
      amount: refundAmount,
      pct: computeRefundPct(booking.is_walk_in, hoursToKickoff(booking), settings),
      reason: `${reason} (${participant.user?.name ?? "participant"})`,
      status: "completed",
      resolved_at: new Date().toISOString(),
    });
    if (error) console.error(`refundAllPaidBookingParticipants: failed for participant ${participant.id}`, error);
  }
}

/** Shared by the organizer's own cancel action, a declined invite, and the auto-expiry job. */
export async function finalizeSplitBookingCancellation(booking: any, reason: string) {
  const settings = await getPlatformSettings();
  await refundAllPaidBookingParticipants(booking, reason, settings);
  await supabase.from("payouts").delete().eq("booking_id", booking.id).eq("status", "pending");

  const anyPaid = (await getBookingParticipants(booking.id)).data?.some((p) => p.paid_amount > 0) ?? false;
  const { data: updated } = await supabase
    .from("bookings")
    .update({ status: "cancelled", payment_status: anyPaid ? "refunded" : "unpaid", cancelled_at: new Date().toISOString() })
    .eq("id", booking.id)
    .select(BOOKING_SELECT)
    .single();
  if (!updated) return updated;

  const { data: participants } = await getBookingParticipants(booking.id);
  for (const p of participants ?? []) {
    // An 'open' slot never had anyone in it — nothing to notify. Declined/
    // removed participants already know; only accepted/invited real people
    // need telling.
    if (!p.user || p.status === "declined" || p.status === "removed" || p.status === "open") continue;
    await notify({ userId: p.user.id, type: "booking_cancelled", title: "Booking cancelled", body: `${updated.venue.name} — ${reason}`, link: `/player/bookings/${booking.id}` });
    if (p.user.email) await sendTemplatedEmail("booking_cancelled", p.user.email, { venueName: updated.venue.name, refundLine: reason });
  }
  return updated;
}

/** Called from payments.controller.ts#confirmPayment once a split_share payment succeeds — recomputes whether every accepted participant has now paid and, if so, confirms the booking. Mirrors sessions.controller.ts#recomputeSessionFunding, but far simpler: the booking row already exists (created up front, not materialized on funding), so this only ever flips status, never inserts one. */
export async function recomputeSplitBookingFunding(bookingId: string) {
  const { data: booking } = await supabase.from("bookings").select(BOOKING_SELECT).eq("id", bookingId).maybeSingle();
  if (!booking) return { booking: null, funded: false };
  if (booking.status !== "pending_payment") return { booking, funded: booking.status === "confirmed" };

  const rows = (await getBookingParticipants(bookingId)).data ?? [];
  // Funded means every seat is both filled AND paid — a still-pending
  // invite or an unclaimed open slot must block this exactly like an
  // unpaid accepted participant does, otherwise a doubles booking could
  // confirm one player short just because the other three already paid.
  const stillFilling = rows.some((p) => p.status === "invited" || p.status === "open");
  const accepted = rows.filter((p) => p.status === "accepted");
  const allPaid = !stillFilling && accepted.length > 0 && accepted.every((p) => p.paid);
  if (!allPaid) return { booking, funded: false };

  const { data: updated, error } = await supabase
    .from("bookings")
    .update({ status: "confirmed", payment_status: "paid" })
    .eq("id", bookingId)
    .eq("status", "pending_payment")
    .select(BOOKING_SELECT)
    .single();
  if (error || !updated) return { booking, funded: false };

  await supabase.from("payouts").insert({ booking_id: updated.id, venue_id: updated.venue_id, owner_id: updated.venue.owner_id, amount: updated.subtotal, status: "pending" });

  const when = new Date(updated.start_at).toLocaleString("en-KE", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });
  for (const p of accepted) {
    if (!p.user?.email) continue;
    await sendTemplatedEmail("booking_confirmed", p.user.email, { name: p.user.name, venueName: updated.venue.name, when, amount: p.share_amount.toLocaleString() });
    await notify({ userId: p.user.id, type: "booking_confirmed", title: "Booking confirmed", body: `${updated.venue.name} · ${when}`, link: `/player/bookings/${updated.id}` });
  }

  const { data: staff } = await supabase.from("users").select("id, email").eq("venue_id", updated.venue_id).eq("role", "manager");
  const { data: owner } = await supabase.from("users").select("email").eq("id", updated.venue.owner_id).maybeSingle();
  for (const recipient of [{ id: updated.venue.owner_id, email: owner?.email }, ...(staff ?? []).map((s) => ({ id: s.id, email: s.email }))]) {
    await notify({ userId: recipient.id, type: "new_booking", title: "New booking", body: `${updated.venue.name} · ${when} · KES ${updated.subtotal.toLocaleString()}`, link: `/owner/bookings` });
    if (recipient.email) await sendTemplatedEmail("new_booking", recipient.email, { venueName: updated.venue.name, when, amount: updated.subtotal.toLocaleString() });
  }

  return { booking: updated, funded: true };
}

/** Individual booking: pick a slot, pay via STK push, auto-confirm on payment success. */
export async function createBooking(req: Request, res: Response) {
  if (req.user!.role !== "player") {
    return res.status(403).json({ error: "Only players can book venues." });
  }

  const { venue_id, start_at, end_at, phone_number } = req.body;
  if (typeof venue_id !== "string" || typeof start_at !== "string" || typeof end_at !== "string" || typeof phone_number !== "string" || !phone_number.trim()) {
    return res.status(400).json({ error: "venue_id, start_at, end_at, and phone_number are required." });
  }

  const start = new Date(start_at);
  const end = new Date(end_at);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) {
    return res.status(400).json({ error: "Invalid booking time range." });
  }
  const hours = wholeHoursBetween(start, end);
  if (hours === null) return res.status(400).json({ error: `Bookings must be between 1 and ${MAX_BOOKING_HOURS} whole hours.` });
  if (start.getTime() < Date.now()) {
    return res.status(400).json({ error: "You can't book a slot in the past." });
  }

  const { data: venue, error: venueError } = await supabase.from("venues").select(VENUE_COLUMNS).eq("id", venue_id).maybeSingle();
  if (venueError) return res.status(500).json({ error: "Could not load venue." });
  if (!venue || venue.status !== "verified") return res.status(404).json({ error: "Venue not found." });

  const settings = await getPlatformSettings();
  const subtotal = venue.price_peak * hours;
  const serviceFee = computeServiceFee(subtotal, settings.service_fee_tiers);
  const isWalkIn = start.toDateString() === new Date().toDateString();

  const { data: booking, error: bookingError } = await supabase
    .from("bookings")
    .insert({
      venue_id,
      player_id: req.user!.id,
      booking_type: "individual",
      start_at: start.toISOString(),
      end_at: end.toISOString(),
      subtotal,
      service_fee: serviceFee,
      total_amount: subtotal + serviceFee,
      is_walk_in: isWalkIn,
    })
    .select(BOOKING_SELECT)
    .single();

  if (bookingError) {
    if (bookingError.code === EXCLUSION_VIOLATION) {
      return res.status(409).json({ error: "That slot was just taken. Pick another." });
    }
    return res.status(500).json({ error: "Could not create booking." });
  }

  const stk = await initiateStkPush({ phoneNumber: phone_number, amount: booking.total_amount, accountReference: booking.id });

  const { data: payment, error: paymentError } = await supabase
    .from("payments")
    .insert({
      booking_id: booking.id,
      payer_id: req.user!.id,
      purpose: "booking",
      amount: booking.total_amount,
      phone_number,
      provider_reference: stk.providerReference,
      status: "pending",
    })
    .select()
    .single();

  if (paymentError) return res.status(500).json({ error: "Could not start payment." });

  res.status(201).json({ booking, payment });
}

/**
 * Split booking: a fixed-size, mostly-known group (tennis singles = 2
 * total players, doubles = 4) splits one venue slot's cost. The organizer
 * names who else is playing by phone up front — no invite link needed for
 * a named slot, no strangers, no home/away sides. A slot can also be left
 * `null` ("open") instead of named, if the organizer doesn't have that
 * many players yet — any logged-in player can then claim it directly (see
 * claimOpenBookingSlot), same idea as an open session, just for a fixed-
 * size group instead of an open-ended squad. Every named phone must
 * already belong to a Kicko player account; if any doesn't, nothing is
 * created.
 */
export async function createSplitBooking(req: Request, res: Response) {
  if (req.user!.role !== "player") return res.status(403).json({ error: "Only players can book venues." });

  const { venue_id, start_at, end_at, format, partner_phones } = req.body;
  const participantCount = PARTICIPANT_COUNTS[format];
  if (typeof venue_id !== "string" || typeof start_at !== "string" || typeof end_at !== "string" || !participantCount) {
    return res.status(400).json({ error: "venue_id, start_at, end_at, and a format of 'singles' or 'doubles' are required." });
  }
  if (
    !Array.isArray(partner_phones) ||
    partner_phones.length !== participantCount - 1 ||
    partner_phones.some((p) => p !== null && (typeof p !== "string" || !p.trim()))
  ) {
    return res.status(400).json({ error: `${format} needs exactly ${participantCount - 1} other player slot(s) — each one a phone number or left open.` });
  }

  const start = new Date(start_at);
  const end = new Date(end_at);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) {
    return res.status(400).json({ error: "Invalid booking time range." });
  }
  const hours = wholeHoursBetween(start, end);
  if (hours === null) return res.status(400).json({ error: `Bookings must be between 1 and ${MAX_BOOKING_HOURS} whole hours.` });
  if (start.getTime() < Date.now()) return res.status(400).json({ error: "You can't book a slot in the past." });

  const { data: venue, error: venueError } = await supabase.from("venues").select(VENUE_COLUMNS).eq("id", venue_id).maybeSingle();
  if (venueError) return res.status(500).json({ error: "Could not load venue." });
  if (!venue || venue.status !== "verified") return res.status(404).json({ error: "Venue not found." });

  // Every named phone must resolve to a real, distinct Kicko player before
  // anything is created — no partial group, no anonymous placeholders. A
  // null entry is deliberately left open rather than named.
  const partners: { id: string; name: string; phone: string | null }[] = [];
  const openSlotCount = partner_phones.filter((p) => p === null).length;
  for (const phone of partner_phones) {
    if (phone === null) continue;
    const { data: partner, error: partnerError } = await supabase.from("users").select("id, name, phone").eq("phone", phone.trim()).eq("role", "player").maybeSingle();
    if (partnerError) return res.status(500).json({ error: "Could not look up one of the players." });
    if (!partner) return res.status(404).json({ error: `No Kicko player found with phone ${phone.trim()}. They'll need an account first.` });
    if (partner.id === req.user!.id || partners.some((p) => p.id === partner.id)) {
      return res.status(400).json({ error: "Each player can only be added once." });
    }
    partners.push(partner);
  }

  const settings = await getPlatformSettings();
  const subtotal = venue.price_peak * hours;
  const { perPersonShare, totalTarget } = computeSessionSplit(subtotal, participantCount, settings.service_fee_tiers);
  const isWalkInBooking = start.toDateString() === new Date().toDateString();

  const { data: booking, error: bookingError } = await supabase
    .from("bookings")
    .insert({
      venue_id,
      player_id: req.user!.id,
      booking_type: "split",
      start_at: start.toISOString(),
      end_at: end.toISOString(),
      subtotal,
      service_fee: +(totalTarget - subtotal).toFixed(2),
      total_amount: totalTarget,
      is_walk_in: isWalkInBooking,
      is_open: openSlotCount > 0,
      payment_deadline: new Date(Date.now() + settings.session_pay_window_minutes * 60_000).toISOString(),
    })
    .select(BOOKING_SELECT)
    .single();

  if (bookingError) {
    if (bookingError.code === EXCLUSION_VIOLATION) return res.status(409).json({ error: "That slot was just taken. Pick another." });
    return res.status(500).json({ error: "Could not create booking." });
  }

  const { error: participantsError } = await supabase.from("booking_participants").insert([
    { booking_id: booking.id, user_id: req.user!.id, is_organizer: true, status: "accepted", share_amount: perPersonShare, responded_at: new Date().toISOString() },
    ...partners.map((p) => ({ booking_id: booking.id, user_id: p.id, is_organizer: false, status: "invited" as const, share_amount: perPersonShare, invited_by: req.user!.id })),
    ...Array.from({ length: openSlotCount }, () => ({ booking_id: booking.id, user_id: null, is_organizer: false, status: "open" as const, share_amount: perPersonShare })),
  ]);
  if (participantsError) {
    await supabase.from("bookings").delete().eq("id", booking.id);
    return res.status(500).json({ error: "Could not add the other players." });
  }

  const when = new Date(booking.start_at).toLocaleString("en-KE", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });
  for (const p of partners) {
    await notify({
      userId: p.id,
      type: "split_booking_invite",
      title: `${req.user!.name} invited you to split a booking`,
      body: `${venue.name} · ${when} · your share: KES ${perPersonShare.toLocaleString()}`,
      link: `/player/bookings/${booking.id}`,
    });
    if (p.phone) {
      await sendSms({
        to: p.phone,
        message: `Kicko: ${req.user!.name} invited you to split a ${format} booking at ${venue.name} on ${when}. Your share: KES ${perPersonShare.toLocaleString()}. Open Kicko to accept and pay.`,
      });
    }
  }

  const { data: participants } = await getBookingParticipants(booking.id);
  res.status(201).json({ booking, participants: (participants ?? []).map(shapeParticipant) });
}

/** Lists the caller's own bookings, most recent first — both bookings they made and split bookings they're a named participant in. */
export async function listMyBookings(req: Request, res: Response) {
  const { data: participantRows } = await supabase.from("booking_participants").select("booking_id").eq("user_id", req.user!.id);
  const participantBookingIds = (participantRows ?? []).map((r) => r.booking_id);

  let query = supabase.from("bookings").select(BOOKING_SELECT);
  query = participantBookingIds.length > 0 ? query.or(`player_id.eq.${req.user!.id},id.in.(${participantBookingIds.join(",")})`) : query.eq("player_id", req.user!.id);
  const { data, error } = await query.order("start_at", { ascending: false });

  if (error) return res.status(500).json({ error: "Could not load bookings." });
  res.status(200).json({ bookings: data });
}

/** Fetches a single booking — must belong to the caller, either as the one who made it or (for a split booking) as one of its named participants. */
export async function getMyBooking(req: Request, res: Response) {
  const { booking, error } = await loadAccessibleBooking(req.params.id, req.user!.id);
  if (error) return res.status(500).json({ error: "Could not load booking." });
  if (!booking) return res.status(404).json({ error: "Booking not found." });

  if (booking.booking_type !== "split") return res.status(200).json({ booking });

  const { data: participants } = await getBookingParticipants(booking.id);
  const shaped = (participants ?? []).map(shapeParticipant);
  const myParticipant = shaped.find((p) => p.user?.id === req.user!.id) ?? null;
  res.status(200).json({
    booking,
    participants: shaped,
    my_participant: myParticipant,
    is_organizer: booking.player_id === req.user!.id,
    can_claim_open_slot: !myParticipant && booking.is_open && booking.status === "pending_payment" && shaped.some((p) => p.status === "open"),
  });
}

/** Any logged-in player can claim an "open" (unnamed) slot in a publicly open split booking directly — no invite needed, same idea as joinOpenSession but for a fixed-size group instead of an open-ended side. */
export async function claimOpenBookingSlot(req: Request, res: Response) {
  const { data: booking, error: bookingError } = await supabase.from("bookings").select("*").eq("id", req.params.id).eq("booking_type", "split").maybeSingle();
  if (bookingError) return res.status(500).json({ error: "Could not load booking." });
  if (!booking) return res.status(404).json({ error: "Booking not found." });
  if (!booking.is_open) return res.status(403).json({ error: "This booking isn't open to the public." });
  if (booking.status !== "pending_payment") return res.status(400).json({ error: "This booking isn't accepting new players anymore." });

  const { data: existing } = await supabase.from("booking_participants").select("id").eq("booking_id", booking.id).eq("user_id", req.user!.id).maybeSingle();
  if (existing) return res.status(400).json({ error: "You're already part of this booking." });

  const { data: openSlot } = await supabase.from("booking_participants").select("id").eq("booking_id", booking.id).eq("status", "open").limit(1).maybeSingle();
  if (!openSlot) return res.status(409).json({ error: "No open spot left — someone just took the last one." });

  // Re-checking status = 'open' at write time (not just at the read above)
  // is what makes this safe against two people claiming the same slot at
  // once: whichever request loses the race updates zero rows and .single()
  // surfaces that as an error instead of silently double-booking the spot.
  const { data: claimed, error: claimError } = await supabase
    .from("booking_participants")
    .update({ user_id: req.user!.id, status: "accepted", responded_at: new Date().toISOString() })
    .eq("id", openSlot.id)
    .eq("status", "open")
    .select(BOOKING_PARTICIPANT_SELECT)
    .single();
  if (claimError || !claimed) return res.status(409).json({ error: "That spot was just taken. Try another open game." });

  res.status(201).json({ booking, participant: shapeParticipant(claimed) });
}

/**
 * Publicly browsable — every still-open split booking with a spot left to
 * claim, across every venue, minus ones the caller's already part of.
 */
export async function listOpenSplitBookings(req: Request, res: Response) {
  const { data: bookings, error } = await supabase
    .from("bookings")
    .select(BOOKING_SELECT)
    .eq("booking_type", "split")
    .eq("is_open", true)
    .eq("status", "pending_payment")
    .order("start_at", { ascending: true });
  if (error) return res.status(500).json({ error: "Could not load open bookings." });

  const results = [];
  for (const booking of bookings ?? []) {
    const { data: participants } = await getBookingParticipants(booking.id);
    const rows = participants ?? [];
    const alreadyIn = rows.some((p) => p.user?.id === req.user!.id);
    const openCount = rows.filter((p) => p.status === "open").length;
    if (alreadyIn || openCount === 0) continue;
    results.push({ booking, open_slots: openCount, total_players: rows.length });
  }
  res.status(200).json({ bookings: results });
}

/** Cancels a booking. If it was paid, auto-refunds per the tiered policy. */
export async function cancelMyBooking(req: Request, res: Response) {
  const { data: booking, error: fetchError } = await supabase
    .from("bookings")
    .select("*")
    .eq("id", req.params.id)
    .eq("player_id", req.user!.id)
    .maybeSingle();

  if (fetchError) return res.status(500).json({ error: "Could not load booking." });
  if (!booking) return res.status(404).json({ error: "Booking not found." });
  if (booking.status === "cancelled" || booking.status === "completed") {
    return res.status(400).json({ error: `Booking is already ${booking.status}.` });
  }

  // Split bookings don't have a single payer to refund — a fixed 2/4-person
  // group either all pays or the whole thing falls through, so cancelling
  // means refunding whoever (if anyone) already paid their own share.
  if (booking.booking_type === "split") {
    const updated = await finalizeSplitBookingCancellation(booking, "Cancelled by organizer");
    return res.status(200).json({ booking: updated });
  }

  const settings = await getPlatformSettings();
  const hoursToKickoff = (new Date(booking.start_at).getTime() - Date.now()) / (1000 * 60 * 60);
  const wasPaid = booking.payment_status === "paid";
  const refundPct = wasPaid ? computeRefundPct(booking.is_walk_in, hoursToKickoff, settings) : 0;
  const refundAmount = wasPaid ? +(booking.subtotal * (refundPct / 100)).toFixed(2) : 0;

  const { data: updated, error: updateError } = await supabase
    .from("bookings")
    .update({
      status: "cancelled",
      cancelled_at: new Date().toISOString(),
      cancelled_by: req.user!.id,
      payment_status: wasPaid ? (refundAmount >= booking.subtotal ? "refunded" : refundAmount > 0 ? "partially_refunded" : "paid") : "unpaid",
      refund_amount: wasPaid ? refundAmount : null,
      refund_pct: wasPaid ? refundPct : null,
    })
    .eq("id", booking.id)
    .select(BOOKING_SELECT)
    .single();

  if (updateError) return res.status(500).json({ error: "Could not cancel booking." });

  if (wasPaid && refundAmount > 0) {
    await supabase.from("refunds").insert({
      booking_id: booking.id,
      amount: refundAmount,
      pct: refundPct,
      reason: "Player cancellation",
      status: "completed",
      requested_by: req.user!.id,
      resolved_by: req.user!.id,
      resolved_at: new Date().toISOString(),
    });
  }

  if (wasPaid) {
    // A payout may already exist for this booking (payment succeeded before
    // cancellation) — withdraw it since the venue never hosted the game.
    await supabase.from("payouts").delete().eq("booking_id", booking.id).eq("status", "pending");
  }

  const refundLine =
    wasPaid && refundAmount > 0
      ? `KES ${refundAmount.toLocaleString()} (${refundPct}%) will be refunded to your M-Pesa.`
      : "No refund applies to this booking.";

  await notify({
    userId: req.user!.id,
    type: "booking_cancelled",
    title: "Booking cancelled",
    body:
      wasPaid && refundAmount > 0
        ? `${updated.venue.name} · KES ${refundAmount.toLocaleString()} refunded (${refundPct}%)`
        : `${updated.venue.name}`,
    link: `/player/bookings/${booking.id}`,
  });
  if (req.user!.email) {
    await sendTemplatedEmail("booking_cancelled", req.user!.email, { venueName: updated.venue.name, refundLine });
  }

  res.status(200).json({ booking: updated });
}

/** A named participant accepts or declines their invite to a split booking. Declining is fixed-group-fatal — you can't play doubles with 3 — so it cancels the whole booking immediately, refunding anyone who'd already paid. */
export async function respondToSplitBookingInvite(req: Request, res: Response) {
  const { data: booking, error: bookingError } = await supabase.from("bookings").select("*").eq("id", req.params.id).eq("booking_type", "split").maybeSingle();
  if (bookingError) return res.status(500).json({ error: "Could not load booking." });
  if (!booking) return res.status(404).json({ error: "Booking not found." });
  if (booking.status !== "pending_payment") return res.status(400).json({ error: "This booking isn't awaiting a response anymore." });

  const { accept } = req.body;
  if (typeof accept !== "boolean") return res.status(400).json({ error: "accept must be true or false." });

  const { data: participant, error: participantError } = await supabase
    .from("booking_participants")
    .select("*")
    .eq("booking_id", booking.id)
    .eq("user_id", req.user!.id)
    .eq("status", "invited")
    .maybeSingle();
  if (participantError) return res.status(500).json({ error: "Could not load your invite." });
  if (!participant) return res.status(404).json({ error: "You don't have a pending invite to this booking." });

  await supabase.from("booking_participants").update({ status: accept ? "accepted" : "declined", responded_at: new Date().toISOString() }).eq("id", participant.id);

  if (!accept) {
    const updated = await finalizeSplitBookingCancellation(booking, `${req.user!.name} declined the invite`);
    return res.status(200).json({ booking: updated });
  }

  const { booking: refreshed } = await loadAccessibleBooking(booking.id, req.user!.id);
  res.status(200).json({ booking: refreshed });
}

/** A named, accepted participant pays their own share via M-Pesa STK push. */
export async function paySplitBookingShare(req: Request, res: Response) {
  const { data: booking, error: bookingError } = await supabase.from("bookings").select("*").eq("id", req.params.id).eq("booking_type", "split").maybeSingle();
  if (bookingError) return res.status(500).json({ error: "Could not load booking." });
  if (!booking) return res.status(404).json({ error: "Booking not found." });
  if (booking.status !== "pending_payment") return res.status(400).json({ error: "This booking isn't awaiting payment anymore." });

  const { phone_number } = req.body;
  if (typeof phone_number !== "string" || !phone_number.trim()) return res.status(400).json({ error: "phone_number is required." });

  const { data: participant, error: participantError } = await supabase
    .from("booking_participants")
    .select("*")
    .eq("booking_id", booking.id)
    .eq("user_id", req.user!.id)
    .eq("status", "accepted")
    .maybeSingle();
  if (participantError) return res.status(500).json({ error: "Could not load your spot in this booking." });
  if (!participant) return res.status(404).json({ error: "You don't have an accepted spot in this booking." });
  if (participant.paid) return res.status(400).json({ error: "You've already paid your share." });

  const stk = await initiateStkPush({ phoneNumber: phone_number, amount: participant.share_amount, accountReference: booking.id });
  const { data: payment, error: paymentError } = await supabase
    .from("payments")
    .insert({
      booking_id: booking.id,
      payer_id: req.user!.id,
      purpose: "split_share",
      amount: participant.share_amount,
      phone_number,
      provider_reference: stk.providerReference,
      status: "pending",
    })
    .select()
    .single();
  if (paymentError) return res.status(500).json({ error: "Could not start payment." });

  res.status(201).json({ payment });
}

/** Owner view: every booking across the venues they own. Manager view: bookings for just the one venue they're assigned to. */
export async function listVenueBookings(req: Request, res: Response) {
  if (req.user!.role !== "owner" && req.user!.role !== "manager") {
    return res.status(403).json({ error: "Only venue owners and managers can view venue bookings." });
  }

  let venueIds: string[];
  if (req.user!.role === "manager") {
    venueIds = req.user!.venue_id ? [req.user!.venue_id] : [];
  } else {
    const { data: venues, error: venuesError } = await supabase.from("venues").select("id").eq("owner_id", req.user!.id);
    if (venuesError) return res.status(500).json({ error: "Could not load venues." });
    venueIds = (venues ?? []).map((v) => v.id);
  }

  if (venueIds.length === 0) return res.status(200).json({ bookings: [] });

  const { data, error } = await supabase
    .from("bookings")
    .select(
      `*, venue:venues(${VENUE_COLUMNS}), player:users!bookings_player_id_fkey(id, name, email, phone), payouts(status, amount), refunds(status, amount, pct)`
    )
    .in("venue_id", venueIds)
    .order("start_at", { ascending: false });

  if (error) return res.status(500).json({ error: "Could not load bookings." });
  res.status(200).json({ bookings: data });
}
