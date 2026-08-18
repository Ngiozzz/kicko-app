import { supabase } from "../config/supabase.js";

export type PlatformSettings = {
  service_fee_tiers: { max: number | null; fee: number }[];
  refund_tiers: { min_hours: number; pct: number }[];
  walk_in_refund_pct: number;
  session_join_window_minutes: number;
  session_pay_window_minutes: number;
  session_decision_grace_minutes: number;
  session_max_per_side: number;
};

const SETTINGS_COLUMNS =
  "service_fee_tiers, refund_tiers, walk_in_refund_pct, session_join_window_minutes, session_pay_window_minutes, session_decision_grace_minutes, session_max_per_side, updated_at";

const CACHE_MS = 30_000;
let cached: { value: PlatformSettings; expiresAt: number } | null = null;

/**
 * Reads the singleton platform_settings row (payment/policy rules an admin
 * can edit) with a short in-memory cache — every booking/session request
 * needs this, so a 30s cache avoids a DB round-trip per request without
 * making edits feel sluggish to apply.
 */
export async function getPlatformSettings(): Promise<PlatformSettings> {
  if (cached && cached.expiresAt > Date.now()) return cached.value;

  const { data, error } = await supabase.from("platform_settings").select(SETTINGS_COLUMNS).eq("id", true).single();
  if (error || !data) throw new Error("Could not load platform settings.");

  const value = data as PlatformSettings;
  cached = { value, expiresAt: Date.now() + CACHE_MS };
  return value;
}

/** Called after a successful PATCH /api/settings so the next read picks up the change immediately. */
export function invalidateSettingsCache(): void {
  cached = null;
}
