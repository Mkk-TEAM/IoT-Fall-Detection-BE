import express from "express";
import StreamController from "../controllers/stream.controller.js";
import { requireDeviceAccess, verifyToken } from "../middleware/auth.middleware.js";

const router = express.Router();
router.use(verifyToken);
router.post("/sessions", requireDeviceAccess({ permission: "canViewCamera" }), StreamController.createSession);
router.delete("/sessions/:sessionId", StreamController.closeSession);

export default router;
