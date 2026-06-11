/**
 * Internal API for edge gateway — authenticated via X-Edge-Secret header.
 * Not exposed in Swagger. Not subject to JWT auth.
 */
import express from "express";
import EventController from "../controllers/event.controller.js";
import HealthLogController from "../controllers/healthLog.controller.js";
import { verifyEdgeSecret } from "../middleware/auth.middleware.js";

const router = express.Router();
router.use(verifyEdgeSecret);

router.post("/events", EventController.create);
router.post("/health-logs", HealthLogController.create);

export default router;
