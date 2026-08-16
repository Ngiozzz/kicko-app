import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware.js";
import { listMyVenues, getVenue, createVenue, updateVenue, deleteVenue } from "../controllers/venues.controller.js";

const router = Router();

router.get("/", requireAuth, listMyVenues);
router.post("/", requireAuth, createVenue);
router.get("/:id", requireAuth, getVenue);
router.patch("/:id", requireAuth, updateVenue);
router.delete("/:id", requireAuth, deleteVenue);

export default router;
