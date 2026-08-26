import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware.js";
import { sensitiveActionLimiter } from "../middleware/rateLimit.middleware.js";
import {
  createTournament,
  listMyTournaments,
  listOpenTournaments,
  getTournament,
  updateTournament,
  registerTeam,
  withdrawTeam,
  createFixture,
  updateFixture,
  deleteFixture,
} from "../controllers/tournaments.controller.js";

const router = Router();

router.use(requireAuth);

router.post("/", createTournament);
router.get("/mine", listMyTournaments);
router.get("/open", listOpenTournaments);
router.get("/:id", getTournament);
router.patch("/:id", updateTournament);
router.post("/:id/register", sensitiveActionLimiter, registerTeam);
router.post("/:id/withdraw", withdrawTeam);
router.post("/:id/fixtures", createFixture);
router.patch("/:id/fixtures/:fixtureId", updateFixture);
router.delete("/:id/fixtures/:fixtureId", deleteFixture);

export default router;
