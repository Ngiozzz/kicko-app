import type { Request, Response } from "express";
import { supabase } from "../config/supabase.js";

// Explicit allowlist — never `select("*")` here. venues also carries
// owner_id/payout_type/payout_number/payout_account_ref, which must never
// reach an unauthenticated response (see venues.controller.ts's authenticated
// explore endpoints for the private version of these same queries).
const PUBLIC_VENUE_SELECT =
  "id, name, location, sport, price_peak, price_off_peak, opening_time, closing_time, amenities, photos, avg_rating, review_count, created_at";

// Narrower than reviews.controller.ts's REVIEW_SELECT — drops booking_id,
// flagged_at, and flag_reason (moderation-internal), and the player's id
// (just their display name), since this is served to anyone on the internet.
const PUBLIC_REVIEW_SELECT = "id, rating, comment, created_at, player:users!player_id(name)";
const PAGE_SIZE_DEFAULT = 20;
const PAGE_SIZE_MAX = 50;

/** Public venue directory — no login required. Verified venues only. */
export async function listPublicVenues(req: Request, res: Response) {
  const { data, error } = await supabase
    .from("venues")
    .select(PUBLIC_VENUE_SELECT)
    .eq("status", "verified")
    .order("created_at", { ascending: false });

  if (error) return res.status(500).json({ error: "Could not load venues." });
  res.status(200).json({ venues: data });
}

/** Public single-venue page — no login required. Verified venues only. */
export async function getPublicVenue(req: Request, res: Response) {
  const { data, error } = await supabase
    .from("venues")
    .select(PUBLIC_VENUE_SELECT)
    .eq("id", req.params.id)
    .eq("status", "verified")
    .maybeSingle();

  if (error) return res.status(500).json({ error: "Could not load venue." });
  if (!data) return res.status(404).json({ error: "Venue not found." });
  res.status(200).json({ venue: data });
}

/** Booked slots across every verified venue for a given date — powers the public list page's "Date" filter, same as listExploreAvailability but without requiring a login. */
export async function listPublicVenuesAvailability(req: Request, res: Response) {
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

/** Booked slot start/end times for a venue on a given date — nothing sensitive here, safe to expose so the public page can grey out taken slots too. */
export async function getPublicVenueAvailability(req: Request, res: Response) {
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

/**
 * A page of a venue's reviews, plus its rating summary — no login required.
 * Adapted from reviews.controller.ts#getVenueReviews, minus the "which
 * booking is still eligible to review" block, which only makes sense for a
 * logged-in player and reads req.user!.role (would throw here).
 */
export async function getPublicVenueReviews(req: Request, res: Response) {
  const venueId = req.params.id;

  const page = Math.max(1, parseInt(String(req.query.page ?? "1"), 10) || 1);
  const pageSize = Math.min(PAGE_SIZE_MAX, Math.max(1, parseInt(String(req.query.pageSize ?? PAGE_SIZE_DEFAULT), 10) || PAGE_SIZE_DEFAULT));
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data: venueRow, error: venueError } = await supabase
    .from("venues")
    .select("avg_rating, review_count")
    .eq("id", venueId)
    .eq("status", "verified")
    .maybeSingle();
  if (venueError) return res.status(500).json({ error: "Could not load this venue's rating." });
  if (!venueRow) return res.status(404).json({ error: "Venue not found." });

  const { data: reviews, error } = await supabase
    .from("reviews")
    .select(PUBLIC_REVIEW_SELECT)
    .eq("venue_id", venueId)
    .order("created_at", { ascending: false })
    .range(from, to);
  if (error) return res.status(500).json({ error: "Could not load reviews." });

  res.status(200).json({
    reviews,
    average: venueRow.avg_rating,
    count: venueRow.review_count,
    page,
    pageSize,
    hasMore: page * pageSize < venueRow.review_count,
  });
}
