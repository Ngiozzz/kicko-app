import type { Request, Response } from "express";
import { supabase } from "../config/supabase.js";
import { computeServiceFee, computeRefundPct, wholeHoursBetween, MAX_BOOKING_HOURS } from "../services/pricing.service.js";
import { getPlatformSettings } from "../services/settings.service.js";
import { initiateStkPush } from "../services/stk.service.js";
import { notify } from "../services/notifications.service.js";
import { sendTemplatedEmail } from "../services/email.service.js";

const EXCLUSION_VIOLATION = "23P01";
const VENUE_COLUMNS = "id, name, location, sport, photos, price_peak, price_off_peak, owner_id, status";
const BOOKING_SELECT = `*, venue:venues(${VENUE_COLUMNS})`;

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

/** Lists the caller's own bookings, most recent first. */
export async function listMyBookings(req: Request, res: Response) {
  const { data, error } = await supabase
    .from("bookings")
    .select(BOOKING_SELECT)
    .eq("player_id", req.user!.id)
    .order("start_at", { ascending: false });

  if (error) return res.status(500).json({ error: "Could not load bookings." });
  res.status(200).json({ bookings: data });
}

/** Fetches a single booking — must belong to the caller. */
export async function getMyBooking(req: Request, res: Response) {
  const { data, error } = await supabase
    .from("bookings")
    .select(BOOKING_SELECT)
    .eq("id", req.params.id)
    .eq("player_id", req.user!.id)
    .maybeSingle();

  if (error) return res.status(500).json({ error: "Could not load booking." });
  if (!data) return res.status(404).json({ error: "Booking not found." });
  res.status(200).json({ booking: data });
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
