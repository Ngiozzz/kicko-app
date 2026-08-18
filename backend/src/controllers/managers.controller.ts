import type { Request, Response } from "express";
import { supabase } from "../config/supabase.js";

// users<->venues has two FK paths now (venues.owner_id, and this
// migration's users.venue_id) — same ambiguous-embed trap as thurfa's
// bookings<->users, so the venue embed has to pin the FK explicitly.
const MANAGER_COLUMNS = "id, name, email, phone, suspended, venue_id, created_at, venue:venues!users_venue_id_fkey(id, name)";

// Supabase's Phone auth provider turned out to require a real, fully
// configured SMS provider (Twilio Account SID/Auth Token/Message Service
// SID) just to save the setting — even with phone confirmations turned
// off and no OTP ever sent. Rather than wire up a paid SMS account for a
// login flow that never actually sends a text, managers authenticate
// through Supabase's already-working Email provider with a deterministic,
// never-shown placeholder address derived from their phone number. The
// frontend sign-in page computes this exact same address from what the
// manager types — see sign-in.tsx's managerPhoneToEmail — so both sides
// must stay in sync if this ever changes.
function managerPhoneToEmail(phone: string): string {
  return `${phone.replace(/\D/g, "")}@manager.kicko.internal`;
}

function requireOwner(req: Request, res: Response): boolean {
  if (req.user!.role !== "owner") {
    res.status(403).json({ error: "Only venue owners can manage staff." });
    return false;
  }
  return true;
}

/** Lists the caller's own managers — owners only, scoped to owner_id. */
export async function listManagers(req: Request, res: Response) {
  if (!requireOwner(req, res)) return;

  const { data, error } = await supabase
    .from("users")
    .select(MANAGER_COLUMNS)
    .eq("owner_id", req.user!.id)
    .eq("role", "manager")
    .order("created_at", { ascending: false });

  if (error) return res.status(500).json({ error: "Could not load managers." });
  res.status(200).json({ managers: data });
}

/**
 * Invites a manager by phone + a temporary password the owner sets and
 * relays themselves (call/WhatsApp) — no email or SMS/OTP required. See
 * managerPhoneToEmail above for how sign-in actually works under the hood.
 */
export async function createManager(req: Request, res: Response) {
  if (!requireOwner(req, res)) return;

  const { name, phone, password, email, venue_id } = req.body;

  if (typeof name !== "string" || !name.trim()) return res.status(400).json({ error: "Name is required." });
  if (typeof phone !== "string" || !/^\+?[0-9]{7,15}$/.test(phone.trim())) {
    return res.status(400).json({ error: "A valid phone number is required." });
  }
  if (typeof password !== "string" || password.length < 8) return res.status(400).json({ error: "Password must be at least 8 characters." });
  if (email !== undefined && email !== "" && !/^\S+@\S+\.\S+$/.test(email)) return res.status(400).json({ error: "That email doesn't look right." });
  if (typeof venue_id !== "string" || !venue_id) return res.status(400).json({ error: "Pick a venue to assign this manager to." });

  const { data: venue } = await supabase.from("venues").select("id").eq("id", venue_id).eq("owner_id", req.user!.id).maybeSingle();
  if (!venue) return res.status(404).json({ error: "Venue not found." });

  const { data: created, error: createError } = await supabase.auth.admin.createUser({
    email: managerPhoneToEmail(phone.trim()),
    password,
    email_confirm: true,
    user_metadata: { name: name.trim() },
  });
  if (createError) {
    // Supabase's own message here talks about "email" (the synthetic
    // one), which would be a confusing thing to show an owner inviting by
    // phone — the only realistic trigger is a duplicate phone number.
    const message = /already been registered|already exists/i.test(createError.message) ? "A manager with this phone number already exists." : createError.message;
    return res.status(400).json({ error: message });
  }

  // Overwrites the trigger's default insert (role defaults to 'player',
  // and email would be the synthetic auth address) with the real values —
  // same override pattern as createAdmin.
  const { data, error } = await supabase
    .from("users")
    .update({ role: "manager", owner_id: req.user!.id, venue_id, phone: phone.trim(), email: email || null })
    .eq("id", created.user.id)
    .select(MANAGER_COLUMNS)
    .single();

  if (error || !data) {
    // Roll back the auth user rather than leave an orphaned account stuck as 'player'.
    await supabase.auth.admin.deleteUser(created.user.id);
    return res.status(500).json({ error: "Could not provision this manager account." });
  }
  res.status(201).json({ manager: data });
}

/** Removes a manager — owners only, scoped to their own. Frees the venue back to "unmanaged". */
export async function deleteManager(req: Request, res: Response) {
  if (!requireOwner(req, res)) return;

  const { data: target } = await supabase.from("users").select("owner_id").eq("id", req.params.id).eq("role", "manager").maybeSingle();
  if (!target || target.owner_id !== req.user!.id) return res.status(404).json({ error: "Manager not found." });

  const { error } = await supabase.auth.admin.deleteUser(req.params.id);
  if (error) return res.status(500).json({ error: "Could not remove this manager." });
  res.status(204).send();
}
