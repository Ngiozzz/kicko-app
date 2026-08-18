import crypto from "node:crypto";

export interface B2CResult {
  providerReference: string;
  status: "success" | "failed";
  failureReason?: string;
}

/**
 * Stub for Safaricom Daraja's B2C API — no sandbox/production credentials
 * exist yet (same as stk.service.ts's collection-side stub). B2C is a
 * separate Safaricom product from STK push/C2B — it needs its own
 * approval and its own shortcode with B2C enabled, and it can only pay
 * out to an M-Pesa wallet (phone/paybill/till), never a bank account.
 *
 * Every caller depends only on this shape, so swapping this file's body
 * for a real Daraja B2C request (initiator name, security credential,
 * result/timeout URLs) is the only change needed once credentials exist —
 * nothing that calls initiateB2CPayout needs to change. See
 * jobs/resolvePayouts.ts for the only caller today.
 */
export async function initiateB2CPayout(params: {
  payoutType: "phone" | "paybill" | "till";
  payoutNumber: string;
  payoutAccountRef: string | null;
  amount: number;
  occasion: string;
}): Promise<B2CResult> {
  void params;
  return {
    providerReference: `B2C-STUB-${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
    status: "success",
  };
}
