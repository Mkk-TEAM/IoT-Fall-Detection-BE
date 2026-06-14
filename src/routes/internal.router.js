import express from "express";
import DeviceStatusLogController from "../controllers/deviceStatusLog.controller.js";
import DeviceController from "../controllers/device.controller.js";
import EventController from "../controllers/event.controller.js";
import { verifyEdgeSecret } from "../middleware/edge.middleware.js";

const router = express.Router();

router.use(verifyEdgeSecret);
router.post("/device-status-logs", DeviceStatusLogController.createInternal);
router.post("/events", EventController.create);
router.patch("/devices/:deviceId/heartbeat", DeviceController.heartbeat);

export default router;
