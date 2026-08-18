import type { Request, Response } from "express";
import { supabase } from "../config/supabase.js";

/** The caller's own notifications, newest first. */
export async function listNotifications(req: Request, res: Response) {
  const { data, error } = await supabase
    .from("notifications")
    .select("id, type, title, body, link, read, created_at")
    .eq("user_id", req.user!.id)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) return res.status(500).json({ error: "Could not load notifications." });
  res.status(200).json({ notifications: data });
}

/** Marks one of the caller's own notifications read. */
export async function markNotificationRead(req: Request, res: Response) {
  const { error } = await supabase.from("notifications").update({ read: true }).eq("id", req.params.id).eq("user_id", req.user!.id);
  if (error) return res.status(500).json({ error: "Could not update notification." });
  res.status(204).send();
}

/** Marks every unread notification of the caller's own as read. */
export async function markAllNotificationsRead(req: Request, res: Response) {
  const { error } = await supabase.from("notifications").update({ read: true }).eq("user_id", req.user!.id).eq("read", false);
  if (error) return res.status(500).json({ error: "Could not update notifications." });
  res.status(204).send();
}
