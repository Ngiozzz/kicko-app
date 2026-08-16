import type { Request, Response } from "express";
import { supabase } from "../config/supabase.js";

function requireAdmin(req: Request, res: Response): boolean {
  if (req.user!.role !== "admin") {
    res.status(403).json({ error: "Admin access only." });
    return false;
  }
  return true;
}

/** How many admin accounts are currently active (not suspended) — the floor a suspend/delete can't cross. */
async function countActiveAdmins(): Promise<number> {
  const { count } = await supabase
    .from("users")
    .select("id", { count: "exact", head: true })
    .eq("role", "admin")
    .eq("suspended", false);
  return count ?? 0;
}

/** Platform-wide counts for the admin dashboard home. */
export async function getStats(req: Request, res: Response) {
  if (!requireAdmin(req, res)) return;

  const [{ data: users, error: usersError }, { data: venues, error: venuesError }] = await Promise.all([
    supabase.from("users").select("role"),
    supabase.from("venues").select("status"),
  ]);

  if (usersError || venuesError) return res.status(500).json({ error: "Could not load platform stats." });

  const usersByRole = { player: 0, owner: 0, manager: 0, admin: 0 };
  for (const u of users!) usersByRole[u.role as keyof typeof usersByRole]++;

  const venuesByStatus = { pending: 0, verified: 0, suspended: 0 };
  for (const v of venues!) venuesByStatus[v.status as keyof typeof venuesByStatus]++;

  res.status(200).json({
    totalUsers: users!.length,
    usersByRole,
    totalVenues: venues!.length,
    venuesByStatus,
  });
}

/** Every account on the platform, across all roles — optionally filtered by ?role=. */
export async function listUsers(req: Request, res: Response) {
  if (!requireAdmin(req, res)) return;

  let query = supabase
    .from("users")
    .select("id, role, name, email, phone, suspended, owner_id, created_at")
    .order("created_at", { ascending: false });

  const role = req.query.role;
  if (typeof role === "string" && ["player", "owner", "manager", "admin"].includes(role)) {
    query = query.eq("role", role);
  }

  const { data, error } = await query;
  if (error) return res.status(500).json({ error: "Could not load users." });
  res.status(200).json({ users: data });
}

/** Toggle a user's suspended flag — locks them out of the platform (see requireAuth). */
export async function setUserSuspended(req: Request, res: Response) {
  if (!requireAdmin(req, res)) return;

  const { suspended } = req.body;
  if (typeof suspended !== "boolean") {
    return res.status(400).json({ error: "suspended must be a boolean." });
  }
  if (req.params.id === req.user!.id) {
    return res.status(400).json({ error: "You can't suspend your own account." });
  }

  if (suspended) {
    const { data: target } = await supabase.from("users").select("role, suspended").eq("id", req.params.id).maybeSingle();
    if (target?.role === "admin" && !target.suspended && (await countActiveAdmins()) <= 1) {
      return res.status(400).json({ error: "You can't suspend the last remaining admin." });
    }
  }

  const { data, error } = await supabase
    .from("users")
    .update({ suspended })
    .eq("id", req.params.id)
    .select("id, role, name, email, phone, suspended, owner_id, created_at")
    .maybeSingle();

  if (error) return res.status(500).json({ error: "Could not update this user." });
  if (!data) return res.status(404).json({ error: "User not found." });
  res.status(200).json({ user: data });
}

/** Every venue on the platform, across all owners — optionally filtered by ?status=. */
export async function listAllVenues(req: Request, res: Response) {
  if (!requireAdmin(req, res)) return;

  let query = supabase
    .from("venues")
    .select("*, owner:owner_id(id, name, email)")
    .order("created_at", { ascending: false });

  const status = req.query.status;
  if (typeof status === "string" && ["pending", "verified", "suspended"].includes(status)) {
    query = query.eq("status", status);
  }

  const { data, error } = await query;
  if (error) return res.status(500).json({ error: "Could not load venues." });
  res.status(200).json({ venues: data });
}

/** A single venue with owner contact info, for the moderation detail screen. */
export async function getAdminVenue(req: Request, res: Response) {
  if (!requireAdmin(req, res)) return;

  const { data, error } = await supabase
    .from("venues")
    .select("*, owner:owner_id(id, name, email, phone)")
    .eq("id", req.params.id)
    .maybeSingle();

  if (error) return res.status(500).json({ error: "Could not load venue." });
  if (!data) return res.status(404).json({ error: "Venue not found." });
  res.status(200).json({ venue: data });
}

/** Approve (verify) or reject (suspend) a venue during moderation. */
export async function setVenueStatus(req: Request, res: Response) {
  if (!requireAdmin(req, res)) return;

  const { status, rejection_reason } = req.body;
  if (status !== "verified" && status !== "suspended") {
    return res.status(400).json({ error: "status must be 'verified' or 'suspended'." });
  }
  if (status === "suspended" && (typeof rejection_reason !== "string" || !rejection_reason.trim())) {
    return res.status(400).json({ error: "A reason is required to reject a venue." });
  }

  const { data, error } = await supabase
    .from("venues")
    .update({ status, rejection_reason: status === "suspended" ? rejection_reason.trim() : null })
    .eq("id", req.params.id)
    .select("*, owner:owner_id(id, name, email)")
    .maybeSingle();

  if (error) return res.status(500).json({ error: "Could not update this venue." });
  if (!data) return res.status(404).json({ error: "Venue not found." });
  res.status(200).json({ venue: data });
}

const USER_COLUMNS = "id, role, name, email, phone, suspended, owner_id, created_at";

/**
 * Provisions a new admin account — the only way one gets created, since
 * admin is deliberately excluded from public sign-up (see
 * ..._harden_signup_role.sql). Two-step, same as the original test-account
 * script: create the auth user with the service-role client (bypassing the
 * signup trigger's role trust entirely), then set role='admin' directly.
 */
export async function createAdmin(req: Request, res: Response) {
  if (!requireAdmin(req, res)) return;

  const { name, email, password, phone } = req.body;
  if (typeof name !== "string" || !name.trim()) return res.status(400).json({ error: "Name is required." });
  if (typeof email !== "string" || !/^\S+@\S+\.\S+$/.test(email)) return res.status(400).json({ error: "A valid email is required." });
  if (typeof password !== "string" || password.length < 8) return res.status(400).json({ error: "Password must be at least 8 characters." });

  const { data: created, error: createError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { name: name.trim() },
  });
  if (createError) return res.status(400).json({ error: createError.message });

  const { data, error } = await supabase
    .from("users")
    .update({ role: "admin", phone: phone || null })
    .eq("id", created.user.id)
    .select(USER_COLUMNS)
    .single();

  if (error || !data) {
    // Roll back the auth user rather than leave an orphaned account stuck as 'player'.
    await supabase.auth.admin.deleteUser(created.user.id);
    return res.status(500).json({ error: "Could not provision this admin account." });
  }
  res.status(201).json({ user: data });
}

/** Deletes an admin account entirely — scoped to admin-role targets only. */
export async function deleteAdmin(req: Request, res: Response) {
  if (!requireAdmin(req, res)) return;

  if (req.params.id === req.user!.id) {
    return res.status(400).json({ error: "You can't delete your own account." });
  }

  const { data: target } = await supabase.from("users").select("role, suspended").eq("id", req.params.id).maybeSingle();
  if (!target) return res.status(404).json({ error: "User not found." });
  if (target.role !== "admin") return res.status(400).json({ error: "Only admin accounts can be deleted here." });
  if (!target.suspended && (await countActiveAdmins()) <= 1) {
    return res.status(400).json({ error: "You can't delete the last remaining admin." });
  }

  const { error } = await supabase.auth.admin.deleteUser(req.params.id);
  if (error) return res.status(500).json({ error: "Could not delete this admin account." });
  res.status(204).send();
}
