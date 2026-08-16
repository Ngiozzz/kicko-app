import type { NextFunction, Request, Response } from "express";
import { supabase } from "../config/supabase.js";

export interface AuthedUser {
  id: string;
  role: "player" | "owner" | "manager" | "admin";
  name: string;
  email: string;
  phone: string | null;
  suspended: boolean;
  sport: string | null;
  position: string | null;
  owner_id: string | null;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthedUser;
    }
  }
}

const USER_COLUMNS = "id, role, name, email, phone, suspended, sport, position, owner_id";

/**
 * Verifies the Supabase access token sent from any client (web, mobile,
 * USSD gateway) in Authorization: Bearer <token>, and attaches the matching
 * public.users row onto req.user. Auth itself (sign up / sign in / session
 * refresh) stays client-side via the Supabase SDK — this only validates the
 * token the client already holds and enforces app-level permissions from
 * here on, same split Thurfa's backend uses.
 */
export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Missing or invalid Authorization header." });
    }

    const token = authHeader.split(" ")[1];
    const { data: authData, error: authError } = await supabase.auth.getUser(token);
    if (authError || !authData?.user) {
      return res.status(401).json({ error: "Invalid or expired token." });
    }

    const { data: userRow, error: userError } = await supabase
      .from("users")
      .select(USER_COLUMNS)
      .eq("id", authData.user.id)
      .single();

    if (userError || !userRow) {
      return res.status(404).json({ error: "User profile not found." });
    }
    if (userRow.suspended) {
      return res.status(403).json({ error: "This account has been suspended." });
    }

    req.user = userRow as AuthedUser;
    next();
  } catch (err) {
    console.error("requireAuth error:", err);
    res.status(500).json({ error: "Authentication check failed." });
  }
}
