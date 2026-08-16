import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import accountRoutes from "./routes/account.routes.js";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// Health check
app.get("/", (req, res) => {
  res.json({ status: "ok", service: "kicko-backend" });
});

// Routes
app.use("/api/account", accountRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: "Route not found." });
});

// Global error handler
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: unknown, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ error: "Something went wrong." });
});

const PORT = process.env.PORT || 4001;
app.listen(PORT, () => {
  console.log(`🟢 Kicko backend running on http://localhost:${PORT}`);
});
