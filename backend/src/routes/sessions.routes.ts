import { Router } from "express";
import { optionalAuth, requireAuth } from "../middleware/auth.middleware.js";
import {
  cancelSession,
  claimParticipant,
  completeRoster,
  createSession,
  getJoinInfo,
  getSession,
  getSessionsAwaitingMyCompletion,
  getSessionsAwaitingMyDecision,
  getTopUpOwed,
  inviteParticipant,
  joinViaLink,
  listMySessions,
  payMyShare,
  payTopUp,
  removeParticipant,
  resplitSession,
  respondToInvite,
} from "../controllers/sessions.controller.js";

const router = Router();

// Public — an invite link must be previewable/usable before login.
router.get("/join-info", getJoinInfo);
router.post("/join", optionalAuth, joinViaLink);

router.use(requireAuth);

router.post("/", createSession);
router.get("/mine", listMySessions);
router.get("/awaiting-decision/mine", getSessionsAwaitingMyDecision);
router.get("/awaiting-completion/mine", getSessionsAwaitingMyCompletion);
router.get("/:id", getSession);
router.post("/:id/claim", claimParticipant);
router.post("/:id/invite", inviteParticipant);
router.post("/:id/respond", respondToInvite);
router.post("/:id/complete-roster", completeRoster);
router.post("/:id/resplit", resplitSession);
router.post("/:id/cancel", cancelSession);
router.get("/:id/topup-owed", getTopUpOwed);
router.post("/:id/pay", payMyShare);
router.post("/:id/pay-topup", payTopUp);
router.delete("/:id/participants/:participantId", removeParticipant);

export default router;
