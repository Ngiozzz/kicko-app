import type { NextFunction, Request, Response } from "express";
import { supabase } from "../config/supabase.js";

export interface AuthedUser {
  id: string;
  role: "player" | "owner" | "manager" | "admin";
  name: string;
  // Nullable since the manager_phone_accounts migration — a phone-invited
  // manager may have no email on file at all.
  email: string | null;
  phone: string | null;
  suspended: boolean;
  sport: string | null;
  position: string | null;
  owner_id: string | null;
  // Manager-only — the single venue they're assigned to (see
  // managers.controller.ts). Null for every other role.
  venue_id: string | null;
  // Set from the OAuth provider's profile photo on signup (Google, etc.)
  // — null for email/password accounts and any provider that doesn't
  // supply one.
  avatar_url: string | null;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthedUser;
    }
  }
}

const USER_COLUMNS = "id, role, name, email, phone, suspended, sport, position, owner_id, venue_id, avatar_url";

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

/**
 * Same token-verification as requireAuth, but never rejects the request —
 * it just leaves req.user unset if there's no token, an invalid one, or no
 * matching profile. For endpoints an invite link must work on before the
 * recipient has logged in (join-session preview/join), where the handler
 * itself decides what an anonymous caller is and isn't allowed to do.
 */
export async function optionalAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) return next();

    const token = authHeader.split(" ")[1];
    const { data: authData, error: authError } = await supabase.auth.getUser(token);
    if (authError || !authData?.user) return next();

    const { data: userRow } = await supabase.from("users").select(USER_COLUMNS).eq("id", authData.user.id).single();
    if (!userRow || userRow.suspended) return next();

    req.user = userRow as AuthedUser;
    next();
  } catch (err) {
    console.error("optionalAuth error:", err);
    next();
  }
}
