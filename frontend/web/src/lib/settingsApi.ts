import { apiFetch } from '@kicko/shared';

export type ServiceFeeTier = { max: number | null; fee: number };
export type RefundTier = { min_hours: number; pct: number };

export type PlatformSettings = {
  service_fee_tiers: ServiceFeeTier[];
  refund_tiers: RefundTier[];
  walk_in_refund_pct: number;
  session_join_window_minutes: number;
  session_pay_window_minutes: number;
  session_decision_grace_minutes: number;
  session_max_per_side: number;
  updated_at: string;
};

export const settingsApi = {
  get: () => apiFetch<{ settings: PlatformSettings }>('/api/settings'),
  update: (input: Omit<PlatformSettings, 'updated_at'>) =>
    apiFetch<{ settings: PlatformSettings }>('/api/settings', { method: 'PATCH', body: JSON.stringify(input) }),
};

// Mirrors backend/src/services/pricing.service.ts#computeServiceFee — used
// for live client-side price previews only; the server always recomputes
// authoritatively on submit.
export function computeServiceFee(subtotal: number, tiers: ServiceFeeTier[]): number {
  return tiers.find((tier) => tier.max === null || subtotal <= tier.max)!.fee;
}

// Mirrors backend/src/services/pricing.service.ts#computeSessionSplit — the
// live per-person share for a subtotal split `headcount` ways, re-applying
// the service fee to each share rather than dividing one lump fee out.
// Preview-only; the server recomputes authoritatively on submit.
export function computeSessionSplit(subtotal: number, headcount: number, tiers: ServiceFeeTier[]): { perPersonShare: number; totalTarget: number } {
  if (headcount <= 0) return { perPersonShare: 0, totalTarget: 0 };
  const perPersonBase = +(subtotal / headcount).toFixed(2);
  const perPersonFee = computeServiceFee(perPersonBase, tiers);
  const perPersonShare = +(perPersonBase + perPersonFee).toFixed(2);
  return { perPersonShare, totalTarget: +(perPersonShare * headcount).toFixed(2) };
}

// Mirrors backend/src/services/pricing.service.ts#computeRefundPct's
// tier-lookup shape (excluding the walk-in branch, which callers show
// separately) — preview-only, so admins see the effect of an edit before
// saving.
export function previewRefundPct(hoursToKickoff: number, tiers: RefundTier[]): number {
  const sorted = [...tiers].sort((a, b) => b.min_hours - a.min_hours);
  const tier = sorted.find((t) => hoursToKickoff >= t.min_hours);
  return tier ? tier.pct : 0;
}
