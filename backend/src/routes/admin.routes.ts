import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware.js";
import {
  getStats,
  listUsers,
  setUserSuspended,
  listAllVenues,
  getAdminVenue,
  setVenueStatus,
  createAdmin,
  deleteAdmin,
} from "../controllers/admin.controller.js";

const router = Router();

router.use(requireAuth);

router.get("/stats", getStats);
router.get("/users", listUsers);
router.patch("/users/:id/suspend", setUserSuspended);
router.post("/admins", createAdmin);
router.delete("/admins/:id", deleteAdmin);
router.get("/venues", listAllVenues);
router.get("/venues/:id", getAdminVenue);
router.patch("/venues/:id/status", setVenueStatus);

export default router;
