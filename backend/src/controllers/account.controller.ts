import type { Request, Response } from "express";
import { supabase } from "../config/supabase.js";
import { parseDevice } from "../services/deviceInfo.service.js";

/**
 * Returns the caller's own profile — requireAuth has already fetched and
 * attached it to req.user.
 */
export function getOwnAccount(req: Request, res: Response) {
  res.status(200).json({ user: req.user });
}

/** Fire-and-forget analytics: one row per signup/sign-in, device/browser parsed from the caller's own User-Agent header — powers the admin dashboard's device breakdown. */
export async function recordDeviceEvent(req: Request, res: Response) {
  const { event } = req.body;
  if (event !== "signup" && event !== "signin") return res.status(400).json({ error: "event must be 'signup' or 'signin'." });

  const { deviceType, browser } = parseDevice(req.headers["user-agent"]);
  await supabase.from("device_events").insert({ user_id: req.user!.id, event, device_type: deviceType, browser });
  res.status(204).send();
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
    .select("id, role, name, email, phone, suspended, sport, position, owner_id, avatar_url")
    .single();

  if (error || !data) return res.status(500).json({ error: "Could not update your profile." });
  res.status(200).json({ user: data });
}

const OWNER_CLAIM_WINDOW_MS = 10 * 60 * 1000;

/**
 * Lets a brand-new Google sign-up claim the "owner" role, when they clicked
 * "Continue with Google" from the owner tab rather than the player one.
 * signInWithOAuth has no equivalent of signUp's options.data, so the
 * signup trigger (see harden_signup_role migration) always defaults an
 * OAuth account to 'player' — this endpoint is the only way it becomes
 * 'owner', and only in the narrow window right after that first Google
 * sign-in, never as a standing self-service role change:
 *  - req.user.role must still be 'player' (the trigger's default) — this
 *    alone makes the claim one-shot, since a second call after success
 *    fails here.
 *  - the underlying Supabase auth user must have exactly one identity,
 *    and it must be 'google' — proves this account exists *because of*
 *    this Google sign-in and nothing else (an existing email/password
 *    account that later links Google has two identities and is correctly
 *    rejected).
 *  - created_at must be recent — defense in depth alongside the identity
 *    check, in case a Google-only player account is dormant for a long
 *    time before someone tries this endpoint against it.
 */
export async function claimOwnerRole(req: Request, res: Response) {
  if (req.body?.role !== "owner") {
    return res.status(400).json({ error: "Only 'owner' can be claimed here." });
  }
  if (req.user!.role !== "player") {
    return res.status(403).json({ error: "Role can only be claimed once, right after signing up." });
  }

  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ") ? authHeader.split(" ")[1] : undefined;
  if (!token) return res.status(401).json({ error: "Missing or invalid Authorization header." });

  const { data: authData, error: authError } = await supabase.auth.getUser(token);
  if (authError || !authData?.user) return res.status(401).json({ error: "Invalid or expired token." });

  const identities = authData.user.identities ?? [];
  const isFreshGoogleSignup =
    identities.length === 1 &&
    identities[0].provider === "google" &&
    Date.now() - new Date(authData.user.created_at).getTime() < OWNER_CLAIM_WINDOW_MS;

  if (!isFreshGoogleSignup) {
    return res.status(403).json({ error: "Role can only be claimed once, right after signing up." });
  }

  const { data, error } = await supabase
    .from("users")
    .update({ role: "owner" })
    .eq("id", req.user!.id)
    .select("id, role, name, email, phone, suspended, sport, position, owner_id, avatar_url")
    .single();

  if (error || !data) return res.status(500).json({ error: "Could not update your role." });
  res.status(200).json({ user: data });
}
