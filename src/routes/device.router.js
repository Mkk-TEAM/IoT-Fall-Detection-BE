import express from "express";
import DeviceController from "../controllers/device.controller.js";
import { requireRole, verifyToken } from "../middleware/auth.middleware.js";

const router = express.Router();
router.use(verifyToken);

router.get("/status", DeviceController.statusList);
router.get("/", DeviceController.list);
router.get("/:deviceId/status", DeviceController.get);
router.get("/:deviceId", DeviceController.get);
router.post("/", requireRole("admin", "caregiver"), DeviceController.create);
router.put("/:deviceId", requireRole("admin", "caregiver"), DeviceController.update);
router.patch("/:deviceId/heartbeat", DeviceController.heartbeat);
router.patch("/:deviceId/disable", requireRole("admin", "caregiver"), DeviceController.disable);
router.delete("/:deviceId", requireRole("admin", "caregiver"), DeviceController.remove);

export default router;
