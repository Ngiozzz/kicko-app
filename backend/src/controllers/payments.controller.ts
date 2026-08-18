import type { Request, Response } from "express";
import { supabase } from "../config/supabase.js";
import { recomputeSessionFunding } from "./sessions.controller.js";
import { notify } from "../services/notifications.service.js";
import { sendEmail, emailTemplates } from "../services/email.service.js";
import { sendSms } from "../services/sms.service.js";

/**
 * Resolves a pending payment to success and confirms whatever it was paying
 * for. Stands in for Safaricom's async STK push callback — in the stub
 * world there's no real phone to enter a PIN on, so the client calls this
 * directly (mirrors explore-venue.html's "Simulate M-Pesa confirmation"
 * link). Swapping in real Daraja later means this same resolution logic
 * moves behind a webhook route instead of a client-callable endpoint.
 */
export async function confirmPayment(req: Request, res: Response) {
  const { data: payment, error: fetchError } = await supabase
    .from("payments")
    .select("*")
    .eq("id", req.params.id)
    .eq("payer_id", req.user!.id)
    .maybeSingle();

  if (fetchError) return res.status(500).json({ error: "Could not load payment." });
  if (!payment) return res.status(404).json({ error: "Payment not found." });
  if (payment.status !== "pending") return res.status(400).json({ error: `Payment is already ${payment.status}.` });

  const { error: paymentUpdateError } = await supabase
    .from("payments")
    .update({ status: "success", completed_at: new Date().toISOString() })
    .eq("id", payment.id);
  if (paymentUpdateError) return res.status(500).json({ error: "Could not confirm payment." });

  if (payment.purpose === "booking") {
    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .update({ status: "confirmed", payment_status: "paid" })
      .eq("id", payment.booking_id)
      .select("*, venue:venues(id, name, owner_id, price_peak)")
      .single();

    if (bookingError || !booking) return res.status(500).json({ error: "Payment confirmed but the booking could not be updated." });

    await supabase.from("payouts").insert({
      booking_id: booking.id,
      venue_id: booking.venue_id,
      owner_id: booking.venue.owner_id,
      amount: booking.subtotal,
      status: "pending",
    });

    const when = new Date(booking.start_at).toLocaleString("en-KE", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });
    await notify({
      userId: payment.payer_id,
      type: "booking_confirmed",
      title: "Booking confirmed",
      body: `${booking.venue.name} · ${when}`,
      link: `/player/bookings/${booking.id}`,
    });

    const { data: player } = await supabase.from("users").select("email").eq("id", payment.payer_id).maybeSingle();
    if (player?.email) {
      await sendEmail({
        to: player.email,
        subject: "Booking confirmed",
        html: emailTemplates.bookingConfirmed(booking.venue.name, when, booking.total_amount),
      });
    }
    await sendSms({
      to: payment.phone_number,
      message: `Kicko: your slot at ${booking.venue.name} on ${when} is confirmed. Paid KES ${booking.total_amount.toLocaleString()}.`,
    });

    // Owner and, if the venue has one, their assigned manager both run
    // day-to-day for this venue — both should know a slot just got booked.
    const { data: staff } = await supabase
      .from("users")
      .select("id, email")
      .eq("venue_id", booking.venue_id)
      .eq("role", "manager");
    const { data: owner } = await supabase.from("users").select("email").eq("id", booking.venue.owner_id).maybeSingle();
    const recipients = [{ id: booking.venue.owner_id, email: owner?.email }, ...(staff ?? []).map((s) => ({ id: s.id, email: s.email }))];
    for (const recipient of recipients) {
      await notify({
        userId: recipient.id,
        type: "new_booking",
        title: "New booking",
        body: `${booking.venue.name} · ${when} · KES ${booking.subtotal.toLocaleString()}`,
        link: `/owner/bookings`,
      });
      if (recipient.email) {
        await sendEmail({
          to: recipient.email,
          subject: "New booking",
          html: emailTemplates.newBooking(booking.venue.name, when, booking.subtotal),
        });
      }
    }

    return res.status(200).json({ booking });
  }

  if (payment.purpose === "session_share" || payment.purpose === "session_topup" || payment.purpose === "session_remainder") {
    if (payment.purpose === "session_share") {
      await supabase.from("session_participants").update({ paid: true, paid_amount: payment.amount }).eq("id", payment.session_participant_id);
    }
    const { session, funded } = await recomputeSessionFunding(payment.session_participant_id);
    return res.status(200).json({ session, funded });
  }

  res.status(200).json({ payment: { ...payment, status: "success" } });
}
