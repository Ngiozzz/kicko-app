import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware.js";
import { sensitiveActionLimiter } from "../middleware/rateLimit.middleware.js";
import {
  createBooking,
  createSplitBooking,
  listMyBookings,
  listOpenSplitBookings,
  getMyBooking,
  cancelMyBooking,
  respondToSplitBookingInvite,
  paySplitBookingShare,
  claimOpenBookingSlot,
  listVenueBookings,
} from "../controllers/bookings.controller.js";

const router = Router();

router.use(requireAuth);

router.get("/mine", listMyBookings);
router.get("/open", listOpenSplitBookings);
router.get("/venue", listVenueBookings);
router.post("/", sensitiveActionLimiter, createBooking);
router.post("/split", sensitiveActionLimiter, createSplitBooking);
router.get("/:id", getMyBooking);
router.post("/:id/cancel", cancelMyBooking);
router.post("/:id/respond", respondToSplitBookingInvite);
router.post("/:id/pay", sensitiveActionLimiter, paySplitBookingShare);
router.post("/:id/claim", sensitiveActionLimiter, claimOpenBookingSlot);

export default router;
