import africastalking from "africastalking";

const at =
  process.env.AFRICASTALKING_API_KEY && process.env.AFRICASTALKING_USERNAME
    ? africastalking({ apiKey: process.env.AFRICASTALKING_API_KEY, username: process.env.AFRICASTALKING_USERNAME })
    : null;

/** Africa's Talking wants E.164 (+254...); players/owners enter Kenyan-local (07..., 01..., 254..., +254...) everywhere else in the app. */
function toE164(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("254")) return `+${digits}`;
  if (digits.startsWith("0")) return `+254${digits.slice(1)}`;
  if (phone.trim().startsWith("+")) return phone.trim();
  return `+254${digits}`;
}

/**
 * Sends via Africa's Talking when credentials are set; otherwise logs to
 * the console. Username "sandbox" (the default while waiting on a
 * production app) routes through AT's sandbox automatically — same
 * function works for both, no code change needed to go live.
 */
export async function sendSms(params: { to: string; message: string }): Promise<void> {
  if (!at) {
    console.log(`[sms:stub] to=${params.to} message="${params.message}"`);
    return;
  }
  try {
    const result = await at.SMS.send({ to: [toE164(params.to)], message: params.message });
    console.log("sendSms result:", JSON.stringify(result));
  } catch (err) {
    console.error("sendSms error:", err);
  }
}
