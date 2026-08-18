import type { PlatformSettings } from "./settings.service.js";

type ServiceFeeTiers = PlatformSettings["service_fee_tiers"];
type RefundPolicy = Pick<PlatformSettings, "refund_tiers" | "walk_in_refund_pct">;

// Flat, tiered service fee added on top of the venue subtotal — ported
// verbatim from Thurfa's real backend (booking.service.js) as the original
// defaults, now admin-editable via platform_settings (see settings.service.ts).
// `max: null` on a tier means "no cap" (JSON has no Infinity).
export function computeServiceFee(subtotal: number, tiers: ServiceFeeTiers): number {
  return tiers.find((tier) => tier.max === null || subtotal <= tier.max)!.fee;
}

// Cancellation refund tiers — walk-in bookings (booked same calendar day as
// the game) always refund at walk_in_refund_pct; scheduled bookings scale
// down by hours-to-kickoff via refund_tiers, checked in descending
// min_hours order (first match wins). The service fee portion is never
// refunded, at any tier — callers apply this pct to the subtotal only.
export function computeRefundPct(isWalkIn: boolean, hoursToKickoff: number, settings: RefundPolicy): number {
  if (isWalkIn) return settings.walk_in_refund_pct;
  const sorted = [...settings.refund_tiers].sort((a, b) => b.min_hours - a.min_hours);
  const tier = sorted.find((t) => hoursToKickoff >= t.min_hours);
  return tier ? tier.pct : 0;
}

// Exact inverse of computeServiceFee — recovers which flat fee was added to
// produce paidAmount, for callers that only have the fee-inclusive total on
// file (a session participant's paid_amount has no fee column of its own).
export function reverseServiceFee(paidAmount: number, tiers: ServiceFeeTiers): number {
  for (const tier of tiers) {
    const base = +(paidAmount - tier.fee).toFixed(2);
    if (base >= 0 && computeServiceFee(base, tiers) === tier.fee) return tier.fee;
  }
  return 0;
}

// The live per-person share for a match session subtotal split `headcount`
// ways, and the total that must be collected to fully fund it at that
// headcount. Never stored — recomputed every time, because the service fee
// is reapplied to EACH person's own share, not divided out of one lump sum.
export function computeSessionSplit(subtotal: number, headcount: number, tiers: ServiceFeeTiers): { perPersonShare: number; totalTarget: number } {
  if (headcount <= 0) return { perPersonShare: 0, totalTarget: 0 };
  const perPersonBase = +(subtotal / headcount).toFixed(2);
  const perPersonFee = computeServiceFee(perPersonBase, tiers);
  const perPersonShare = +(perPersonBase + perPersonFee).toFixed(2);
  return { perPersonShare, totalTarget: +(perPersonShare * headcount).toFixed(2) };
}
