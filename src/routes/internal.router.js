import express from "express";
import DeviceStatusLogController from "../controllers/deviceStatusLog.controller.js";
import { verifyEdgeSecret } from "../middleware/edge.middleware.js";

const router = express.Router();

router.use(verifyEdgeSecret);
router.post("/device-status-logs", DeviceStatusLogController.createInternal);

export default router;
