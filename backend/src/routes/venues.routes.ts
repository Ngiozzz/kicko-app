import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware.js";
import {
  listMyVenues,
  getVenue,
  createVenue,
  updateVenue,
  deleteVenue,
  listExploreVenues,
  getExploreVenue,
  getExploreVenueAvailability,
  listExploreAvailability,
  requestVenuePhotoAssist,
} from "../controllers/venues.controller.js";

const router = Router();

router.get("/explore", requireAuth, listExploreVenues);
router.get("/explore-availability", requireAuth, listExploreAvailability);
router.get("/explore/:id", requireAuth, getExploreVenue);
router.get("/explore/:id/availability", requireAuth, getExploreVenueAvailability);
router.get("/", requireAuth, listMyVenues);
router.post("/", requireAuth, createVenue);
router.get("/:id", requireAuth, getVenue);
router.patch("/:id", requireAuth, updateVenue);
router.delete("/:id", requireAuth, deleteVenue);
router.post("/:id/photo-assist", requireAuth, requestVenuePhotoAssist);

export default router;
