import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware.js";
import { sensitiveActionLimiter } from "../middleware/rateLimit.middleware.js";
import { getVenueReviews, createReview, flagReview } from "../controllers/reviews.controller.js";

const router = Router();

router.use(requireAuth);

router.get("/venue/:venueId", getVenueReviews);
router.post("/venue/:venueId", sensitiveActionLimiter, createReview);
router.post("/:id/flag", flagReview);

export default router;
