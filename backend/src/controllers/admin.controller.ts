import type { Request, Response } from "express";
import { supabase } from "../config/supabase.js";
import { getLogs, type LogLevel } from "../services/logs.service.js";
import { notify } from "../services/notifications.service.js";
import { sendEmail, sendTemplatedEmail, renderEmailTemplate, SAMPLE_VARS, FALLBACK_TEMPLATES, type EmailTemplateKey } from "../services/email.service.js";

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
    .select("id, role, name, email, phone, suspended, owner_id, sport, position, created_at")
    .order("created_at", { ascending: false });

  const role = req.query.role;
  if (typeof role === "string" && ["player", "owner", "manager", "admin"].includes(role)) {
    query = query.eq("role", role);
  }

  const { data, error } = await query;
  if (error) return res.status(500).json({ error: "Could not load users." });

  // Owners' venue counts are genuinely useful admin-card metadata and cheap
  // to attach — one grouped query, not a per-row join.
  const ownerIds = data.filter((u) => u.role === "owner").map((u) => u.id);
  const venueCounts = new Map<string, number>();
  if (ownerIds.length > 0) {
    const { data: venues } = await supabase.from("venues").select("owner_id").in("owner_id", ownerIds);
    for (const v of venues ?? []) venueCounts.set(v.owner_id, (venueCounts.get(v.owner_id) ?? 0) + 1);
  }

  const shaped = data.map((u) => ({ ...u, venue_count: u.role === "owner" ? venueCounts.get(u.id) ?? 0 : null }));
  res.status(200).json({ users: shaped });
}

/** One user's full profile plus role-appropriate activity — the admin card's "more information" drill-down. */
export async function getUserDetail(req: Request, res: Response) {
  if (!requireAdmin(req, res)) return;

  const { data: user, error } = await supabase
    .from("users")
    .select("id, role, name, email, phone, suspended, owner_id, sport, position, created_at")
    .eq("id", req.params.id)
    .maybeSingle();
  if (error) return res.status(500).json({ error: "Could not load this user." });
  if (!user) return res.status(404).json({ error: "User not found." });

  const activity: Record<string, unknown> = {};

  if (user.role === "player") {
    const [{ data: recentBookings }, { count: totalBookings }, { data: paidBookings }, { count: sessionsOrganized }] = await Promise.all([
      supabase
        .from("bookings")
        .select("id, venue:venues(name), start_at, total_amount, status, payment_status, booking_type")
        .eq("player_id", user.id)
        .order("start_at", { ascending: false })
        .limit(8),
      supabase.from("bookings").select("id", { count: "exact", head: true }).eq("player_id", user.id),
      supabase.from("bookings").select("total_amount").eq("player_id", user.id).eq("payment_status", "paid"),
      supabase.from("match_sessions").select("id", { count: "exact", head: true }).eq("organizer_id", user.id),
    ]);
    activity.recentBookings = recentBookings ?? [];
    activity.totalBookings = totalBookings ?? 0;
    activity.totalSpent = (paidBookings ?? []).reduce((sum, b) => sum + Number(b.total_amount), 0);
    activity.sessionsOrganized = sessionsOrganized ?? 0;
  } else if (user.role === "owner") {
    const { data: venues } = await supabase
      .from("venues")
      .select("id, name, location, sport, status, price_peak")
      .eq("owner_id", user.id)
      .order("created_at", { ascending: false });
    activity.venues = venues ?? [];
  } else if (user.role === "manager" && user.owner_id) {
    const { data: owner } = await supabase.from("users").select("id, name, email, phone").eq("id", user.owner_id).maybeSingle();
    activity.managedBy = owner ?? null;
  }

  res.status(200).json({ user, activity });
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

/**
 * Sets a venue's moderation status — verify, suspend (with a reason), or
 * send back to pending ("unverify", for pulling a live listing back into
 * review without the harsher "suspended" framing). Not gated to any
 * particular starting status — an admin can act on a venue regardless of
 * its current state, e.g. suspending one that's already verified.
 */
export async function setVenueStatus(req: Request, res: Response) {
  if (!requireAdmin(req, res)) return;

  const { status, rejection_reason } = req.body;
  if (status !== "verified" && status !== "suspended" && status !== "pending") {
    return res.status(400).json({ error: "status must be 'verified', 'suspended', or 'pending'." });
  }
  if (status === "suspended" && (typeof rejection_reason !== "string" || !rejection_reason.trim())) {
    return res.status(400).json({ error: "A reason is required to suspend a venue." });
  }

  const { data, error } = await supabase
    .from("venues")
    .update({ status, rejection_reason: status === "suspended" ? rejection_reason.trim() : null })
    .eq("id", req.params.id)
    .select("*, owner:owner_id(id, name, email)")
    .maybeSingle();

  if (error) return res.status(500).json({ error: "Could not update this venue." });
  if (!data) return res.status(404).json({ error: "Venue not found." });

  if (status === "verified" || status === "suspended") {
    await notify({
      userId: data.owner_id,
      type: "venue_status_changed",
      title: status === "verified" ? "Venue verified" : "Venue suspended",
      body: status === "verified" ? data.name : `${data.name} — ${rejection_reason.trim()}`,
      link: `/owner/venues/${data.id}`,
    });
    if (data.owner?.email) {
      if (status === "verified") {
        await sendTemplatedEmail("venue_verified", data.owner.email, { venueName: data.name });
      } else {
        await sendTemplatedEmail("venue_suspended", data.owner.email, { venueName: data.name, reason: rejection_reason.trim() });
      }
    }
  }

  res.status(200).json({ venue: data });
}

/** Removes a review — moderation only (abusive or spam content, or a flag the admin agrees with). */
export async function deleteReview(req: Request, res: Response) {
  if (!requireAdmin(req, res)) return;

  const { error } = await supabase.from("reviews").delete().eq("id", req.params.id);
  if (error) return res.status(500).json({ error: "Could not delete this review." });
  res.status(204).send();
}

/** Clears an owner-raised flag without deleting the review — the admin looked at it and decided it doesn't need action. */
export async function dismissReviewFlag(req: Request, res: Response) {
  if (!requireAdmin(req, res)) return;

  const { data, error } = await supabase
    .from("reviews")
    .update({ flagged_at: null, flagged_by: null, flag_reason: null })
    .eq("id", req.params.id)
    .select("id, booking_id, venue_id, rating, comment, created_at, flagged_at, flag_reason, player:users!player_id(id, name)")
    .maybeSingle();
  if (error) return res.status(500).json({ error: "Could not dismiss this flag." });
  if (!data) return res.status(404).json({ error: "Review not found." });
  res.status(200).json({ review: data });
}

/** Permanently deletes a venue — cascades to its bookings, match sessions, and payouts (see migrations' ON DELETE CASCADE). */
export async function deleteVenue(req: Request, res: Response) {
  if (!requireAdmin(req, res)) return;

  const { data: target } = await supabase.from("venues").select("id").eq("id", req.params.id).maybeSingle();
  if (!target) return res.status(404).json({ error: "Venue not found." });

  const { error } = await supabase.from("venues").delete().eq("id", req.params.id);
  if (error) return res.status(500).json({ error: "Could not delete this venue." });
  res.status(204).send();
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

const LOG_LEVELS: LogLevel[] = ["info", "warn", "error"];

/** Recent in-process server logs — request lines plus unhandled-error detail, newest first. */
export async function getServerLogs(req: Request, res: Response) {
  if (!requireAdmin(req, res)) return;

  const levelParam = req.query.level;
  const level = typeof levelParam === "string" && LOG_LEVELS.includes(levelParam as LogLevel) ? (levelParam as LogLevel) : undefined;

  const limitParam = Number(req.query.limit);
  const limit = Number.isFinite(limitParam) && limitParam > 0 ? Math.min(limitParam, 500) : undefined;

  res.status(200).json({ logs: getLogs({ level, limit }) });
}

/** Platform-wide payment totals for the admin Payments home. */
export async function getPaymentsOverview(req: Request, res: Response) {
  if (!requireAdmin(req, res)) return;

  const [{ data: bookings, error: bookingsError }, { data: payouts, error: payoutsError }, { data: refunds, error: refundsError }] = await Promise.all([
    supabase.from("bookings").select("total_amount, payment_status"),
    supabase.from("payouts").select("amount, status"),
    supabase.from("refunds").select("amount, status"),
  ]);

  if (bookingsError || payoutsError || refundsError) return res.status(500).json({ error: "Could not load payments overview." });

  // "Collected" = what players actually paid, including the service fee —
  // partially_refunded bookings still collected the original full amount,
  // so they count here same as fully paid ones.
  const totalCollected = (bookings ?? [])
    .filter((b) => b.payment_status === "paid" || b.payment_status === "partially_refunded")
    .reduce((sum, b) => sum + Number(b.total_amount), 0);
  const paidOut = (payouts ?? []).filter((p) => p.status === "paid").reduce((sum, p) => sum + Number(p.amount), 0);
  const refunded = (refunds ?? []).filter((r) => r.status === "completed").reduce((sum, r) => sum + Number(r.amount), 0);
  // Same "needs attention" definition as owner/payments.tsx's client-side filter.
  const needsAttention = (payouts ?? []).filter((p) => p.status === "failed").length + (refunds ?? []).filter((r) => r.status === "pending").length;

  res.status(200).json({ totalCollected, paidOut, refunded, needsAttention });
}

const TRANSACTION_COLUMNS =
  "*, venue:venues(id, name, location, sport, photos, price_peak, price_off_peak, owner_id, status), player:users!bookings_player_id_fkey(id, name, email, phone), payouts(status, amount), refunds(status, amount, pct)";

/** Every booking with money attached to it, platform-wide, newest first — the admin Transactions table. */
export async function listAdminTransactions(req: Request, res: Response) {
  if (!requireAdmin(req, res)) return;

  const { data, error } = await supabase
    .from("bookings")
    .select(TRANSACTION_COLUMNS)
    .neq("payment_status", "unpaid")
    .order("start_at", { ascending: false })
    .limit(200);

  if (error) return res.status(500).json({ error: "Could not load transactions." });
  res.status(200).json({ bookings: data });
}

/** Match sessions platform-wide with roster fill and real cancellation reason — the admin Match sessions table. */
export async function listAdminSessions(req: Request, res: Response) {
  if (!requireAdmin(req, res)) return;

  const { data: settings } = await supabase.from("platform_settings").select("session_max_per_side").eq("id", true).single();
  const capacity = (settings?.session_max_per_side ?? 0) * 2;

  const { data, error } = await supabase
    .from("match_sessions")
    .select("id, phase, cancellation_reason, start_at, created_at, venue:venues(id, name), organizer:users(id, name), session_participants(id, status)")
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) return res.status(500).json({ error: "Could not load match sessions." });

  const sessions = (data ?? []).map((s) => {
    const { session_participants, ...rest } = s;
    return { ...rest, filled: (session_participants ?? []).filter((p) => p.status === "accepted").length, capacity };
  });

  res.status(200).json({ sessions });
}

function isEmailTemplateKey(key: string): key is EmailTemplateKey {
  return (SAMPLE_VARS as Record<string, unknown>)[key] !== undefined;
}

/** Every editable transactional-email template, DB copy where it exists, fallback copy otherwise — the admin Emails settings list. */
export async function listEmailTemplates(req: Request, res: Response) {
  if (!requireAdmin(req, res)) return;

  const { data, error } = await supabase.from("email_templates").select("key, subject, html, updated_at");
  if (error) return res.status(500).json({ error: "Could not load email templates." });

  const byKey = new Map((data ?? []).map((row) => [row.key, row]));
  const templates = Object.keys(SAMPLE_VARS).map((key) => {
    const vars = Object.keys(SAMPLE_VARS[key as EmailTemplateKey]);
    const row = byKey.get(key);
    return row
      ? { key, subject: row.subject, html: row.html, updated_at: row.updated_at, isDefault: false, vars }
      : { key, ...FALLBACK_TEMPLATES[key as EmailTemplateKey], updated_at: null, isDefault: true, vars };
  });

  res.status(200).json({ templates });
}

/** Overwrites one template's subject/body — creates the row if this key was still on its fallback. */
export async function updateEmailTemplate(req: Request, res: Response) {
  if (!requireAdmin(req, res)) return;

  const { key } = req.params;
  if (!isEmailTemplateKey(key)) return res.status(404).json({ error: "Unknown email template." });

  const { subject, html } = req.body;
  if (typeof subject !== "string" || !subject.trim()) return res.status(400).json({ error: "Subject is required." });
  if (typeof html !== "string" || !html.trim()) return res.status(400).json({ error: "Email body is required." });

  const { data, error } = await supabase
    .from("email_templates")
    .upsert({ key, subject: subject.trim(), html })
    .select("key, subject, html, updated_at")
    .single();

  if (error || !data) return res.status(500).json({ error: "Could not save this template." });
  res.status(200).json({ template: { ...data, isDefault: false } });
}

/** Deletes the DB row for this key, reverting it to the hardcoded fallback copy. */
export async function resetEmailTemplate(req: Request, res: Response) {
  if (!requireAdmin(req, res)) return;

  const { key } = req.params;
  if (!isEmailTemplateKey(key)) return res.status(404).json({ error: "Unknown email template." });

  const { error } = await supabase.from("email_templates").delete().eq("key", key);
  if (error) return res.status(500).json({ error: "Could not reset this template." });

  res.status(200).json({ template: { key, ...FALLBACK_TEMPLATES[key], updated_at: null, isDefault: true } });
}

/**
 * Renders `key` with sample data as JSON, from the exact subject/html the
 * editor currently holds (not what's saved) — the live preview pane
 * re-calls this as the admin types, so what they see always matches what
 * "Save" or "Send test" would actually produce for that draft.
 */
export async function previewDraftEmailTemplate(req: Request, res: Response) {
  if (!requireAdmin(req, res)) return;

  const { key } = req.params;
  if (!isEmailTemplateKey(key)) return res.status(404).json({ error: "Unknown email template." });

  const { subject, html } = req.body;
  if (typeof subject !== "string" || typeof html !== "string") return res.status(400).json({ error: "Subject and body are required." });

  const rendered = await renderEmailTemplate(key, SAMPLE_VARS[key], { subject, html });
  res.status(200).json(rendered);
}

/** Sends `key` to the calling admin's own email, rendered with sample data — from the given draft if one's passed, otherwise the saved (or fallback) copy. */
export async function sendTestEmailTemplate(req: Request, res: Response) {
  if (!requireAdmin(req, res)) return;

  const { key } = req.params;
  if (!isEmailTemplateKey(key)) return res.status(404).json({ error: "Unknown email template." });
  if (!req.user!.email) return res.status(400).json({ error: "Your account has no email on file to send the test to." });

  const { subject, html } = req.body ?? {};
  const draft = typeof subject === "string" && typeof html === "string" ? { subject, html } : undefined;

  const rendered = await renderEmailTemplate(key, SAMPLE_VARS[key], draft);
  await sendEmail({ to: req.user!.email, ...rendered });
  res.status(200).json({ sentTo: req.user!.email });
}
