import type { Request, Response } from "express";
import rateLimit from "express-rate-limit";

const jsonHandler = (message: string) => (req: Request, res: Response) => {
  res.status(429).json({ error: message });
};

/** Baseline for every /api route — catches straightforward flooding/scraping that nothing more specific covers. */
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: true,
  legacyHeaders: false,
  handler: jsonHandler("Too many requests. Please try again later."),
});

/** Unauthenticated browsing (public venue listings, invite-link preview) — reachable with no account, so it's the easiest surface to scrape or hammer. */
export const publicLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 60,
  standardHeaders: true,
  legacyHeaders: false,
  handler: jsonHandler("Too many requests. Please slow down and try again shortly."),
});

/** Actions that cost real money or send a real SMS/STK prompt to someone's phone (M-Pesa push, session invites) — tightest limit in the app. */
export const sensitiveActionLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: jsonHandler("Too many attempts. Please wait a few minutes before trying again."),
});
