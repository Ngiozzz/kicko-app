import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware.js";
import {
  getStats,
  listUsers,
  getUserDetail,
  setUserSuspended,
  listAllVenues,
  getAdminVenue,
  setVenueStatus,
  deleteVenue,
  deleteReview,
  dismissReviewFlag,
  createAdmin,
  deleteAdmin,
  getServerLogs,
  getPaymentsOverview,
  listAdminTransactions,
  listAdminSessions,
  listEmailTemplates,
  updateEmailTemplate,
  resetEmailTemplate,
  previewDraftEmailTemplate,
  sendTestEmailTemplate,
} from "../controllers/admin.controller.js";

const router = Router();

router.use(requireAuth);

router.get("/stats", getStats);
router.get("/logs", getServerLogs);
router.get("/payments/overview", getPaymentsOverview);
router.get("/payments/transactions", listAdminTransactions);
router.get("/payments/sessions", listAdminSessions);
router.get("/users", listUsers);
router.get("/users/:id", getUserDetail);
router.patch("/users/:id/suspend", setUserSuspended);
router.post("/admins", createAdmin);
router.delete("/admins/:id", deleteAdmin);
router.get("/venues", listAllVenues);
router.get("/venues/:id", getAdminVenue);
router.patch("/venues/:id/status", setVenueStatus);
router.delete("/venues/:id", deleteVenue);
router.delete("/reviews/:id", deleteReview);
router.patch("/reviews/:id/dismiss-flag", dismissReviewFlag);
router.get("/email-templates", listEmailTemplates);
router.patch("/email-templates/:key", updateEmailTemplate);
router.delete("/email-templates/:key", resetEmailTemplate);
router.post("/email-templates/:key/preview-draft", previewDraftEmailTemplate);
router.post("/email-templates/:key/send-test", sendTestEmailTemplate);

export default router;
