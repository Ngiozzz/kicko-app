import { Router } from "express";
import { listPublicVenues, getPublicVenue, listPublicVenuesAvailability, getPublicVenueAvailability, getPublicVenueReviews } from "../controllers/public.controller.js";

// No requireAuth anywhere in this file — these are the only endpoints in the
// backend meant to be reachable without a login, so they exist separately
// from venues.routes.ts/reviews.routes.ts rather than toggling auth on those.
const router = Router();

router.get("/venues", listPublicVenues);
router.get("/venues-availability", listPublicVenuesAvailability);
router.get("/venues/:id", getPublicVenue);
router.get("/venues/:id/availability", getPublicVenueAvailability);
router.get("/venues/:id/reviews", getPublicVenueReviews);

export default router;
