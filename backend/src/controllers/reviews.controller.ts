import type { Request, Response } from "express";
import { supabase } from "../config/supabase.js";
import { notify } from "../services/notifications.service.js";
import { sendEmail, emailTemplates } from "../services/email.service.js";

const REVIEW_SELECT = "id, booking_id, venue_id, rating, comment, created_at, flagged_at, flag_reason, player:users!player_id(id, name)";
const PAGE_SIZE_DEFAULT = 20;
const PAGE_SIZE_MAX = 50;

/**
 * A page of a venue's reviews, plus its rating summary — any authenticated
 * user (players browsing, an owner checking their own venue, admins
 * moderating). The average/count come off venues.avg_rating/review_count
 * (kept up to date by a DB trigger — see the venue_ratings_review_flags
 * migration), not by scanning every review here, so this stays cheap no
 * matter how many reviews a venue has. For a player caller, also resolves
 * which one of their own past, played bookings (if any) is still
 * unreviewed, so the frontend knows whether to offer the "leave a review"
 * form and which booking it attaches to.
 */
export async function getVenueReviews(req: Request, res: Response) {
  const venueId = req.params.venueId;

  const page = Math.max(1, parseInt(String(req.query.page ?? "1"), 10) || 1);
  const pageSize = Math.min(PAGE_SIZE_MAX, Math.max(1, parseInt(String(req.query.pageSize ?? PAGE_SIZE_DEFAULT), 10) || PAGE_SIZE_DEFAULT));
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data: venueRow, error: venueError } = await supabase.from("venues").select("avg_rating, review_count").eq("id", venueId).maybeSingle();
  if (venueError) return res.status(500).json({ error: "Could not load this venue's rating." });
  if (!venueRow) return res.status(404).json({ error: "Venue not found." });

  const { data: reviews, error } = await supabase.from("reviews").select(REVIEW_SELECT).eq("venue_id", venueId).order("created_at", { ascending: false }).range(from, to);
  if (error) return res.status(500).json({ error: "Could not load reviews." });

  let eligibleBookingId: string | null = null;
  if (req.user!.role === "player") {
    const { data: reviewedRows } = await supabase.from("reviews").select("booking_id").eq("venue_id", venueId).eq("player_id", req.user!.id);
    const reviewedBookingIds = new Set((reviewedRows ?? []).map((r) => r.booking_id));
    const { data: bookings } = await supabase
      .from("bookings")
      .select("id, end_at")
      .eq("venue_id", venueId)
      .eq("player_id", req.user!.id)
      .eq("status", "confirmed")
      .lt("end_at", new Date().toISOString())
      .order("end_at", { ascending: false });
    eligibleBookingId = (bookings ?? []).find((b) => !reviewedBookingIds.has(b.id))?.id ?? null;
  }

  res.status(200).json({
    reviews,
    average: venueRow.avg_rating,
    count: venueRow.review_count,
    page,
    pageSize,
    hasMore: page * pageSize < venueRow.review_count,
    eligible_booking_id: eligibleBookingId,
  });
}

/** Player leaves a review on one of their own past, played bookings — one review per booking, enforced by the DB's unique constraint too. */
export async function createReview(req: Request, res: Response) {
  if (req.user!.role !== "player") return res.status(403).json({ error: "Only players can leave reviews." });

  const { booking_id, rating, comment } = req.body;
  if (typeof booking_id !== "string") return res.status(400).json({ error: "booking_id is required." });
  if (typeof rating !== "number" || !Number.isInteger(rating) || rating < 1 || rating > 5) {
    return res.status(400).json({ error: "rating must be a whole number from 1 to 5." });
  }
  if (comment !== undefined && comment !== null && typeof comment !== "string") {
    return res.status(400).json({ error: "comment must be text." });
  }

  const { data: booking, error: bookingError } = await supabase
    .from("bookings")
    .select("id, venue_id, player_id, status, end_at")
    .eq("id", booking_id)
    .maybeSingle();
  if (bookingError) return res.status(500).json({ error: "Could not load that booking." });
  if (!booking || booking.player_id !== req.user!.id || booking.venue_id !== req.params.venueId) {
    return res.status(404).json({ error: "Booking not found." });
  }
  if (booking.status !== "confirmed" || new Date(booking.end_at) >= new Date()) {
    return res.status(400).json({ error: "You can only review a booking after you've played it." });
  }

  const { data, error } = await supabase
    .from("reviews")
    .insert({ booking_id, venue_id: booking.venue_id, player_id: req.user!.id, rating, comment: typeof comment === "string" ? comment.trim() || null : null })
    .select(REVIEW_SELECT)
    .single();

  if (error) {
    if (error.code === "23505") return res.status(400).json({ error: "You've already reviewed this booking." });
    return res.status(500).json({ error: "Could not save your review." });
  }

  const { data: venue } = await supabase
    .from("venues")
    .select("name, owner_id, owner:owner_id(email)")
    .eq("id", booking.venue_id)
    .maybeSingle()
    .returns<{ name: string; owner_id: string; owner: { email: string | null } | null }>();
  if (venue) {
    await notify({
      userId: venue.owner_id,
      type: "new_review",
      title: "New review",
      body: `${venue.name} · ${"★".repeat(rating)}${data.comment ? ` — "${data.comment}"` : ""}`,
      link: `/owner/venues/${booking.venue_id}/reviews`,
    });
    if (venue.owner?.email) {
      await sendEmail({
        to: venue.owner.email,
        subject: "New review",
        html: emailTemplates.newReview(venue.name, rating, data.comment),
      });
    }
  }

  res.status(201).json({ review: data });
}

/** Venue owner flags a review on their own venue for admin attention — doesn't remove anything itself, just routes it to admin.controller.ts#deleteReview or #dismissReviewFlag. */
export async function flagReview(req: Request, res: Response) {
  if (req.user!.role !== "owner") return res.status(403).json({ error: "Only venue owners can flag reviews." });

  const { reason } = req.body;
  if (reason !== undefined && reason !== null && typeof reason !== "string") return res.status(400).json({ error: "reason must be text." });

  const { data: review, error: fetchError } = await supabase
    .from("reviews")
    .select("id, flagged_at, venue:venues!venue_id(owner_id)")
    .eq("id", req.params.id)
    .maybeSingle();
  if (fetchError) return res.status(500).json({ error: "Could not load this review." });
  const owningOwnerId = (review as any)?.venue?.owner_id;
  if (!review || owningOwnerId !== req.user!.id) return res.status(404).json({ error: "Review not found." });
  if (review.flagged_at) return res.status(400).json({ error: "This review has already been flagged." });

  const { data, error } = await supabase
    .from("reviews")
    .update({ flagged_at: new Date().toISOString(), flagged_by: req.user!.id, flag_reason: typeof reason === "string" ? reason.trim() || null : null })
    .eq("id", req.params.id)
    .select(REVIEW_SELECT)
    .single();
  if (error) return res.status(500).json({ error: "Could not flag this review." });
  res.status(200).json({ review: data });
}
