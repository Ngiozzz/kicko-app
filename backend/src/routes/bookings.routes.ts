import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware.js";
import { sensitiveActionLimiter } from "../middleware/rateLimit.middleware.js";
import { createBooking, listMyBookings, getMyBooking, cancelMyBooking, listVenueBookings } from "../controllers/bookings.controller.js";

const router = Router();

router.use(requireAuth);

router.get("/mine", listMyBookings);
router.get("/venue", listVenueBookings);
router.post("/", sensitiveActionLimiter, createBooking);
router.get("/:id", getMyBooking);
router.post("/:id/cancel", cancelMyBooking);

export default router;
