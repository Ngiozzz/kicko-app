import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware.js";
import { listManagers, createManager, deleteManager } from "../controllers/managers.controller.js";

const router = Router();

router.use(requireAuth);

router.get("/", listManagers);
router.post("/", createManager);
router.delete("/:id", deleteManager);

export default router;
