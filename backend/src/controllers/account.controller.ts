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
  const { name, phone } = req.body;

  if (typeof name !== "string" || !name.trim()) {
    return res.status(400).json({ error: "Name is required." });
  }

  const { data, error } = await supabase
    .from("users")
    .update({ name: name.trim(), phone: phone || null })
    .eq("id", req.user!.id)
    .select("id, role, name, email, phone, suspended, sport, position, owner_id")
    .single();

  if (error || !data) return res.status(500).json({ error: "Could not update your profile." });
  res.status(200).json({ user: data });
}
