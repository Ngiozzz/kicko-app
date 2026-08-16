import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware.js";
import { getOwnAccount, updateOwnAccount } from "../controllers/account.controller.js";

const router = Router();

router.get("/me", requireAuth, getOwnAccount);
router.patch("/me", requireAuth, updateOwnAccount);

export default router;
