import express from "express";
import ThresholdController from "../controllers/threshold.controller.js";
import { requireRole, verifyToken } from "../middleware/auth.middleware.js";

const router = express.Router();
router.use(verifyToken);
router.get("/", ThresholdController.getCurrent);
router.put("/", requireRole("admin"), ThresholdController.update);

export default router;
