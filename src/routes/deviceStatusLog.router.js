import express from "express";
import DeviceStatusLogController from "../controllers/deviceStatusLog.controller.js";
import { requireRole, verifyToken } from "../middleware/auth.middleware.js";

const router = express.Router();

router.use(verifyToken);
router.get("/", DeviceStatusLogController.list);
router.get("/latest", DeviceStatusLogController.latest);
router.post("/", requireRole("admin", "caregiver"), DeviceStatusLogController.create);

export default router;
