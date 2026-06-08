import express from "express";
import HealthLogController from "../controllers/healthLog.controller.js";
import { requireRole, verifyToken } from "../middleware/auth.middleware.js";

const router = express.Router();
router.use(verifyToken);
router.get("/", HealthLogController.list);
router.post("/", requireRole("admin", "caregiver"), HealthLogController.create);

export default router;
