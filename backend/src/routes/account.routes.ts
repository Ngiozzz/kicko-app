import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware.js";
import { getOwnAccount } from "../controllers/account.controller.js";

const router = Router();

router.get("/me", requireAuth, getOwnAccount);

export default router;
