import type { Request, Response } from "express";
import { supabase } from "../config/supabase.js";

const SPORTS = ["football", "basketball", "tennis", "padel", "volleyball"];
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

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

  return errors;
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

/** Fetches a single venue — must belong to the caller. */
export async function getVenue(req: Request, res: Response) {
  if (req.user!.role !== "owner") {
    return res.status(403).json({ error: "Only venue owners can manage venues." });
  }

  const { data, error } = await supabase
    .from("venues")
    .select("*")
    .eq("id", req.params.id)
    .eq("owner_id", req.user!.id)
    .maybeSingle();

  if (error) return res.status(500).json({ error: "Could not load venue." });
  if (!data) return res.status(404).json({ error: "Venue not found." });
  res.status(200).json({ venue: data });
}

/** Creates a venue owned by the caller. New venues start out pending review. */
export async function createVenue(req: Request, res: Response) {
  if (req.user!.role !== "owner") {
    return res.status(403).json({ error: "Only venue owners can create venues." });
  }

  const errors = validateVenueInput(req.body);
  if (Object.keys(errors).length > 0) return res.status(400).json({ errors });

  const { name, location, sport, price_peak, price_off_peak, opening_time, closing_time, amenities, photos } = req.body;

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

  const { name, location, sport, price_peak, price_off_peak, opening_time, closing_time, amenities, photos } = req.body;

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
