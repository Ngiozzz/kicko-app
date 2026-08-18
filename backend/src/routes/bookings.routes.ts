import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware.js";
import { createBooking, listMyBookings, getMyBooking, cancelMyBooking, listVenueBookings } from "../controllers/bookings.controller.js";

const router = Router();

router.use(requireAuth);

router.get("/mine", listMyBookings);
router.get("/venue", listVenueBookings);
router.post("/", createBooking);
router.get("/:id", getMyBooking);
router.post("/:id/cancel", cancelMyBooking);

export default router;
