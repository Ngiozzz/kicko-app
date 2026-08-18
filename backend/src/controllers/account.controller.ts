import type { Request, Response } from "express";
import { supabase } from "../config/supabase.js";

/**
 * Returns the caller's own profile — requireAuth has already fetched and
 * attached it to req.user.
 */
export function getOwnAccount(req: Request, res: Response) {
  res.status(200).json({ user: req.user });
}

/**
 * Updates the caller's own name/phone. Email is intentionally not editable
 * here — changing it is a Supabase Auth operation (requires re-confirming
 * the new address), not a plain profile-table update.
 */
export async function updateOwnAccount(req: Request, res: Response) {
  const { name, phone, sport, position } = req.body;

  if (typeof name !== "string" || !name.trim()) {
    return res.status(400).json({ error: "Name is required." });
  }

  const update: Record<string, unknown> = { name: name.trim() };
  // Managers sign in via a placeholder email derived from their phone (see
  // managers.controller.ts) — letting them change it here would desync
  // that identity from what Supabase actually has on file and lock them
  // out. Only their owner can change it (not built yet), so it's simply
  // not editable through this self-service endpoint.
  if (req.user!.role !== "manager") update.phone = phone || null;
  // Playing preferences are player-only fields, but harmless to accept from
  // anyone — the columns are just null for every other role.
  if (sport !== undefined) update.sport = sport || null;
  if (position !== undefined) update.position = position || null;

  const { data, error } = await supabase
    .from("users")
    .update(update)
    .eq("id", req.user!.id)
    .select("id, role, name, email, phone, suspended, sport, position, owner_id")
    .single();

  if (error || !data) return res.status(500).json({ error: "Could not update your profile." });
  res.status(200).json({ user: data });
}
