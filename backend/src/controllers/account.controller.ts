import type { Request, Response } from "express";

/**
 * Returns the caller's own profile — requireAuth has already fetched and
 * attached it to req.user.
 */
export function getOwnAccount(req: Request, res: Response) {
  res.status(200).json({ user: req.user });
}
