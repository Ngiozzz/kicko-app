import type { NextFunction, Request, Response } from "express";
import { addLog } from "../services/logs.service.js";

/**
 * Logs every request once it finishes, leveled off the final status code
 * (>=500 error, >=400 warn, else info) so the admin log viewer can flag the
 * bad ones by filtering on level alone. The global error handler attaches
 * `res.locals.errorDetail` (the stack) before it sends the response, and
 * that's already set by the time `finish` fires here — so a 500 gets a
 * proper stack trace instead of just a status line.
 */
export function requestLogger(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();
  res.on("finish", () => {
    const status = res.statusCode;
    const level = status >= 500 ? "error" : status >= 400 ? "warn" : "info";
    addLog({
      level,
      message: `${req.method} ${req.originalUrl} → ${status}`,
      method: req.method,
      path: req.originalUrl,
      status,
      durationMs: Date.now() - start,
      detail: res.locals.errorDetail,
    });
  });
  next();
}
