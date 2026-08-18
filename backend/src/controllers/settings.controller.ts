import type { Request, Response } from "express";
import { supabase } from "../config/supabase.js";
import { getPlatformSettings, invalidateSettingsCache } from "../services/settings.service.js";

const SETTINGS_COLUMNS =
  "service_fee_tiers, refund_tiers, walk_in_refund_pct, session_join_window_minutes, session_pay_window_minutes, session_decision_grace_minutes, session_max_per_side, updated_at";

/** Any authenticated user can read these — players need them for live fee/refund previews, not just admins. */
export async function getSettings(req: Request, res: Response) {
  try {
    const settings = await getPlatformSettings();
    res.status(200).json({ settings });
  } catch {
    res.status(500).json({ error: "Could not load platform settings." });
  }
}

function isValidServiceFeeTiers(tiers: unknown): tiers is { max: number | null; fee: number }[] {
  if (!Array.isArray(tiers) || tiers.length === 0) return false;
  return tiers.every((t) => (t.max === null || typeof t.max === "number") && typeof t.fee === "number" && t.fee >= 0);
}

function isValidRefundTiers(tiers: unknown): tiers is { min_hours: number; pct: number }[] {
  if (!Array.isArray(tiers) || tiers.length === 0) return false;
  return tiers.every((t) => typeof t.min_hours === "number" && t.min_hours >= 0 && typeof t.pct === "number" && t.pct >= 0 && t.pct <= 100);
}

/** Admin-only. Overwrites the singleton settings row and invalidates the read cache so the change is live immediately. */
export async function updateSettings(req: Request, res: Response) {
  if (req.user!.role !== "admin") return res.status(403).json({ error: "Admin access only." });

  const { service_fee_tiers, refund_tiers, walk_in_refund_pct, session_join_window_minutes, session_pay_window_minutes, session_decision_grace_minutes, session_max_per_side } =
    req.body;

  if (!isValidServiceFeeTiers(service_fee_tiers)) return res.status(400).json({ error: "service_fee_tiers must be a non-empty array of { max, fee }." });
  if (!isValidRefundTiers(refund_tiers)) return res.status(400).json({ error: "refund_tiers must be a non-empty array of { min_hours, pct }." });
  if (typeof walk_in_refund_pct !== "number" || walk_in_refund_pct < 0 || walk_in_refund_pct > 100) {
    return res.status(400).json({ error: "walk_in_refund_pct must be a number between 0 and 100." });
  }
  for (const [key, value] of Object.entries({ session_join_window_minutes, session_pay_window_minutes, session_decision_grace_minutes, session_max_per_side })) {
    if (typeof value !== "number" || value <= 0) return res.status(400).json({ error: `${key} must be a positive number.` });
  }

  const { data, error } = await supabase
    .from("platform_settings")
    .update({
      service_fee_tiers,
      refund_tiers,
      walk_in_refund_pct,
      session_join_window_minutes,
      session_pay_window_minutes,
      session_decision_grace_minutes,
      session_max_per_side,
      updated_by: req.user!.id,
    })
    .eq("id", true)
    .select(SETTINGS_COLUMNS)
    .single();

  if (error || !data) return res.status(500).json({ error: "Could not update platform settings." });

  invalidateSettingsCache();
  res.status(200).json({ settings: data });
}
