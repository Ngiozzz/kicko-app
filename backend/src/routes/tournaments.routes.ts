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

// Tournaments is fully built but deliberately hidden from production while
// it's still an MVP (no refunds for a paid withdrawal, no min/max team
// count, no auto-brackets — see the design-review handoff). Flip this back
// to true once the fuller module replaces/extends it; nothing else needs
// to change — the routes, controller, and frontend pages are all still
// intact underneath this gate.
const TOURNAMENTS_ENABLED = false;

if (!TOURNAMENTS_ENABLED) {
  router.use((_req, res) => res.status(404).json({ error: "Not found." }));
}

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
