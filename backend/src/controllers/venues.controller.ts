import type { Request, Response } from "express";
import { supabase } from "../config/supabase.js";

const SPORTS = ["football", "basketball", "tennis", "padel", "volleyball"];
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;
const PAYOUT_TYPES = ["phone", "paybill", "till"];

function validateVenueInput(body: Record<string, unknown>) {
  const errors: Record<string, string> = {};

  if (typeof body.name !== "string" || !body.name.trim()) errors.name = "Name is required.";
  if (typeof body.location !== "string" || !body.location.trim()) errors.location = "Location is required.";
  if (typeof body.sport !== "string" || !SPORTS.includes(body.sport)) {
    errors.sport = `Sport must be one of: ${SPORTS.join(", ")}.`;
  }
  if (typeof body.price_peak !== "number" || body.price_peak <= 0) {
    errors.price_peak = "Peak rate must be a positive number.";
  }
  if (typeof body.price_off_peak !== "number" || body.price_off_peak <= 0) {
    errors.price_off_peak = "Off-peak rate must be a positive number.";
  }
  if (typeof body.opening_time !== "string" || !TIME_RE.test(body.opening_time)) {
    errors.opening_time = "Opening time must be a valid time (HH:MM).";
  }
  if (typeof body.closing_time !== "string" || !TIME_RE.test(body.closing_time)) {
    errors.closing_time = "Closing time must be a valid time (HH:MM).";
  }
  if (body.amenities !== undefined && !Array.isArray(body.amenities)) {
    errors.amenities = "Amenities must be a list of strings.";
  }
  if (body.photos !== undefined) {
    if (!Array.isArray(body.photos) || body.photos.some((p) => typeof p !== "string")) {
      errors.photos = "Photos must be a list of URLs.";
    } else if (body.photos.length > 5) {
      errors.photos = "You can add up to 5 photos.";
    }
  }

  // Payout details are optional at venue creation (an owner can add them
  // later) — but once a type is picked, a number is required, and vice
  // versa, matching the DB's own payout_number_required_with_type check.
  if (body.payout_type !== undefined && body.payout_type !== null) {
    if (typeof body.payout_type !== "string" || !PAYOUT_TYPES.includes(body.payout_type)) {
      errors.payout_type = `Payout type must be one of: ${PAYOUT_TYPES.join(", ")}.`;
    }
    if (typeof body.payout_number !== "string" || !body.payout_number.trim()) {
      errors.payout_number = "Enter the M-Pesa number, paybill, or till.";
    }
  } else if (typeof body.payout_number === "string" && body.payout_number.trim()) {
    errors.payout_type = "Pick a payout type for this number.";
  }

  return errors;
}

/** Lists verified venues for players to browse — any authenticated user. */
export async function listExploreVenues(req: Request, res: Response) {
  const { data, error } = await supabase
    .from("venues")
    .select("*")
    .eq("status", "verified")
    .order("created_at", { ascending: false });

  if (error) return res.status(500).json({ error: "Could not load venues." });
  res.status(200).json({ venues: data });
}

/** Fetches a single verified venue for players — any authenticated user. */
export async function getExploreVenue(req: Request, res: Response) {
  const { data, error } = await supabase
    .from("venues")
    .select("*")
    .eq("id", req.params.id)
    .eq("status", "verified")
    .maybeSingle();

  if (error) return res.status(500).json({ error: "Could not load venue." });
  if (!data) return res.status(404).json({ error: "Venue not found." });
  res.status(200).json({ venue: data });
}

/** Booked slots across every verified venue for a given date — powers the Explore "Date" filter (which venues have any open slot that day) without a round trip per venue. */
export async function listExploreAvailability(req: Request, res: Response) {
  const date = typeof req.query.date === "string" ? req.query.date : "";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return res.status(400).json({ error: "date must be YYYY-MM-DD." });

  const dayStart = new Date(`${date}T00:00:00.000Z`);
  const dayEnd = new Date(`${date}T23:59:59.999Z`);

  const { data, error } = await supabase
    .from("bookings")
    .select("venue_id, start_at, end_at, venue:venues!inner(status)")
    .eq("venue.status", "verified")
    .in("status", ["pending_payment", "confirmed"])
    .gte("start_at", dayStart.toISOString())
    .lte("start_at", dayEnd.toISOString());

  if (error) return res.status(500).json({ error: "Could not load availability." });
  res.status(200).json({ booked: (data ?? []).map((b) => ({ venue_id: b.venue_id, start_at: b.start_at, end_at: b.end_at })) });
}

/** Booked slot start times for a venue on a given date — any authenticated user, so the booking screen can grey out taken slots. */
export async function getExploreVenueAvailability(req: Request, res: Response) {
  const date = typeof req.query.date === "string" ? req.query.date : "";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return res.status(400).json({ error: "date must be YYYY-MM-DD." });

  const dayStart = new Date(`${date}T00:00:00.000Z`);
  const dayEnd = new Date(`${date}T23:59:59.999Z`);

  const { data, error } = await supabase
    .from("bookings")
    .select("start_at, end_at")
    .eq("venue_id", req.params.id)
    .in("status", ["pending_payment", "confirmed"])
    .gte("start_at", dayStart.toISOString())
    .lte("start_at", dayEnd.toISOString());

  if (error) return res.status(500).json({ error: "Could not load availability." });
  res.status(200).json({ booked: (data ?? []).map((b) => ({ start_at: b.start_at, end_at: b.end_at })) });
}

/** Lists the caller's own venues — owners only, scoped to owner_id. */
export async function listMyVenues(req: Request, res: Response) {
  if (req.user!.role !== "owner") {
    return res.status(403).json({ error: "Only venue owners can manage venues." });
  }

  const { data, error } = await supabase
    .from("venues")
    .select("*")
    .eq("owner_id", req.user!.id)
    .order("created_at", { ascending: false });

  if (error) return res.status(500).json({ error: "Could not load venues." });
  res.status(200).json({ venues: data });
}

/**
 * Fetches a single venue — must belong to the caller, or (read-only) be the
 * one venue a manager is assigned to. Includes a cheap booking-count/revenue
 * summary for the venue's own detail page.
 */
export async function getVenue(req: Request, res: Response) {
  const { role, id: userId, venue_id: managerVenueId } = req.user!;
  const isAssignedManager = role === "manager" && managerVenueId === req.params.id;
  if (role !== "owner" && !isAssignedManager) {
    return res.status(403).json({ error: "Only venue owners and their assigned manager can view this venue." });
  }

  let query = supabase.from("venues").select("*").eq("id", req.params.id);
  if (role === "owner") query = query.eq("owner_id", userId);
  const { data, error } = await query.maybeSingle();

  if (error) return res.status(500).json({ error: "Could not load venue." });
  if (!data) return res.status(404).json({ error: "Venue not found." });

  const { data: bookings } = await supabase.from("bookings").select("subtotal, status, payment_status").eq("venue_id", data.id);
  const totalBookings = (bookings ?? []).filter((b) => b.status !== "cancelled").length;
  // Revenue = the venue's own cut (subtotal), not the service fee — matches
  // what actually gets paid out (see payouts.amount across the codebase).
  const totalRevenue = (bookings ?? []).filter((b) => b.payment_status === "paid").reduce((sum, b) => sum + Number(b.subtotal), 0);

  res.status(200).json({ venue: data, stats: { totalBookings, totalRevenue } });
}

/** Creates a venue owned by the caller. New venues start out pending review. */
export async function createVenue(req: Request, res: Response) {
  if (req.user!.role !== "owner") {
    return res.status(403).json({ error: "Only venue owners can create venues." });
  }

  const errors = validateVenueInput(req.body);
  if (Object.keys(errors).length > 0) return res.status(400).json({ errors });

  const { name, location, sport, price_peak, price_off_peak, opening_time, closing_time, amenities, photos, payout_type, payout_number, payout_account_ref } =
    req.body;

  const { data, error } = await supabase
    .from("venues")
    .insert({
      owner_id: req.user!.id,
      name,
      location,
      sport,
      price_peak,
      price_off_peak,
      opening_time,
      closing_time,
      amenities: amenities ?? [],
      photos: photos ?? [],
      status: "pending",
      payout_type: payout_type ?? null,
      payout_number: payout_number ?? null,
      payout_account_ref: payout_account_ref ?? null,
    })
    .select()
    .single();

  if (error) return res.status(500).json({ error: "Could not create venue." });
  res.status(201).json({ venue: data });
}

/** Updates a venue — must belong to the caller. Status is not editable here. */
export async function updateVenue(req: Request, res: Response) {
  if (req.user!.role !== "owner") {
    return res.status(403).json({ error: "Only venue owners can manage venues." });
  }

  const errors = validateVenueInput(req.body);
  if (Object.keys(errors).length > 0) return res.status(400).json({ errors });

  const { name, location, sport, price_peak, price_off_peak, opening_time, closing_time, amenities, photos, payout_type, payout_number, payout_account_ref } =
    req.body;

  const { data, error } = await supabase
    .from("venues")
    .update({
      name,
      location,
      sport,
      price_peak,
      price_off_peak,
      opening_time,
      closing_time,
      amenities: amenities ?? [],
      photos: photos ?? [],
      payout_type: payout_type ?? null,
      payout_number: payout_number ?? null,
      payout_account_ref: payout_account_ref ?? null,
    })
    .eq("id", req.params.id)
    .eq("owner_id", req.user!.id)
    .select()
    .maybeSingle();

  if (error) return res.status(500).json({ error: "Could not update venue." });
  if (!data) return res.status(404).json({ error: "Venue not found." });
  res.status(200).json({ venue: data });
}

/** Deletes a venue — must belong to the caller. */
export async function deleteVenue(req: Request, res: Response) {
  if (req.user!.role !== "owner") {
    return res.status(403).json({ error: "Only venue owners can manage venues." });
  }

  const { data, error } = await supabase
    .from("venues")
    .delete()
    .eq("id", req.params.id)
    .eq("owner_id", req.user!.id)
    .select()
    .maybeSingle();

  if (error) return res.status(500).json({ error: "Could not delete venue." });
  if (!data) return res.status(404).json({ error: "Venue not found." });
  res.status(204).send();
}
