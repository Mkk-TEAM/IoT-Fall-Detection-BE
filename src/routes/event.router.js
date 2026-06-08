import express from "express";
import EventController from "../controllers/event.controller.js";
import { requireRole, verifyToken } from "../middleware/auth.middleware.js";

const router = express.Router();
router.use(verifyToken);

router.get("/", EventController.list);
router.get("/:eventId", EventController.get);
router.post("/", requireRole("admin", "caregiver"), EventController.create);
router.patch("/:eventId/status", EventController.updateStatus);

export default router;
