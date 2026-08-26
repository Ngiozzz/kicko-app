import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware.js";
import { sensitiveActionLimiter } from "../middleware/rateLimit.middleware.js";
import { createTeam, listMyTeams, getTeam, updateTeam, inviteTeamMember, respondToTeamInvite, removeTeamMember } from "../controllers/teams.controller.js";

const router = Router();

router.use(requireAuth);

router.post("/", createTeam);
router.get("/mine", listMyTeams);
router.get("/:id", getTeam);
router.patch("/:id", updateTeam);
router.post("/:id/invite", sensitiveActionLimiter, inviteTeamMember);
router.post("/:id/respond", respondToTeamInvite);
router.delete("/:id/members/:memberId", removeTeamMember);

export default router;
