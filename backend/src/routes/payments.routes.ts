import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware.js";
import { sensitiveActionLimiter } from "../middleware/rateLimit.middleware.js";
import { confirmPayment } from "../controllers/payments.controller.js";

const router = Router();

router.use(requireAuth);

router.post("/:id/confirm", sensitiveActionLimiter, confirmPayment);

export default router;
