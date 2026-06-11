import express from "express";
import authRouter from "./auth.router.js";
import gatewayRouter from "./gateway.router.js";
import deviceRouter from "./device.router.js";
import permissionRouter from "./permission.router.js";
import thresholdRouter from "./threshold.router.js";
import healthLogRouter from "./healthLog.router.js";
import eventRouter from "./event.router.js";
import notificationRouter from "./notification.router.js";
import streamRouter from "./stream.router.js";
import internalRouter from "./internal.router.js";

const router = express.Router();

router.use("/auth", authRouter);
router.use("/gateways", gatewayRouter);
router.use("/devices", deviceRouter);
router.use("/permissions", permissionRouter);
router.use("/thresholds", thresholdRouter);
router.use("/health-logs", healthLogRouter);
router.use("/events", eventRouter);
router.use("/alerts", eventRouter);
router.use("/notifications", notificationRouter);
router.use("/alert-delivery-logs", notificationRouter);
router.use("/streams", streamRouter);
router.use("/internal", internalRouter);

export default router;
