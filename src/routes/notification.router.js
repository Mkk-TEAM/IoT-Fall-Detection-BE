import express from "express";
import NotificationController from "../controllers/notification.controller.js";
import { requireRole, verifyToken } from "../middleware/auth.middleware.js";

const router = express.Router();
router.use(verifyToken);
router.get("/", NotificationController.listLogs);
router.get("/logs", NotificationController.listLogs);
router.post("/alerts/:eventId/send", requireRole("admin", "caregiver"), NotificationController.sendAlert);

export default router;
