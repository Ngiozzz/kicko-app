import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import accountRoutes from "./routes/account.routes.js";
import venuesRoutes from "./routes/venues.routes.js";
import publicRoutes from "./routes/public.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import bookingsRoutes from "./routes/bookings.routes.js";
import paymentsRoutes from "./routes/payments.routes.js";
import sessionsRoutes from "./routes/sessions.routes.js";
import settingsRoutes from "./routes/settings.routes.js";
import reviewsRoutes from "./routes/reviews.routes.js";
import managersRoutes from "./routes/managers.routes.js";
import notificationsRoutes from "./routes/notifications.routes.js";
import { startMatchSessionExpiryJob } from "./jobs/expireMatchSessions.js";
import { startResolvePayoutsJob } from "./jobs/resolvePayouts.js";
import { requestLogger } from "./middleware/requestLogger.middleware.js";

dotenv.config();

const app = express();

// ALLOWED_ORIGINS unset (local dev) => allow any origin. Set in production
// to a comma-separated list, e.g. https://kicko-app.co.ke,https://www.kicko-app.co.ke
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(",").map((o) => o.trim()).filter(Boolean);
app.use(cors(allowedOrigins?.length ? { origin: allowedOrigins } : {}));
app.use(express.json());
app.use(requestLogger);

// Health check
app.get("/", (req, res) => {
  res.json({ status: "ok", service: "kicko-backend" });
});

// Routes
app.use("/api/account", accountRoutes);
app.use("/api/venues", venuesRoutes);
app.use("/api/public", publicRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/bookings", bookingsRoutes);
app.use("/api/payments", paymentsRoutes);
app.use("/api/sessions", sessionsRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/reviews", reviewsRoutes);
app.use("/api/managers", managersRoutes);
app.use("/api/notifications", notificationsRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: "Route not found." });
});

// Global error handler
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: unknown, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err);
  res.locals.errorDetail = err instanceof Error ? (err.stack ?? err.message) : String(err);
  res.status(500).json({ error: "Something went wrong." });
});

const PORT = process.env.PORT || 4001;
app.listen(PORT, () => {
  console.log(`🟢 Kicko backend running on http://localhost:${PORT}`);
  startMatchSessionExpiryJob();
  startResolvePayoutsJob();
});
