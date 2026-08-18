import crypto from "node:crypto";

export interface StkPushResult {
  providerReference: string;
  status: "pending";
}

/**
 * Stub for Safaricom Daraja's STK push API — no sandbox/production
 * credentials exist yet. Every caller depends only on this shape
 * (a provider reference + a pending status that later resolves via a
 * callback), so swapping this file's body for a real Daraja request is
 * the only change needed once credentials are available; nothing that
 * calls initiateStkPush needs to change.
 */
export async function initiateStkPush(params: {
  phoneNumber: string;
  amount: number;
  accountReference: string;
}): Promise<StkPushResult> {
  void params;
  return {
    providerReference: `STUB-${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
    status: "pending",
  };
}
