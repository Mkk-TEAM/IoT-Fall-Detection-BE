import express from "express";
import GatewayController from "../controllers/gateway.controller.js";
import { requireRole, verifyToken } from "../middleware/auth.middleware.js";

const router = express.Router();
router.use(verifyToken);

router.get("/", GatewayController.list);
router.get("/:gatewayId", GatewayController.get);
router.post("/", requireRole("admin", "caregiver"), GatewayController.create);
router.put("/:gatewayId", requireRole("admin", "caregiver"), GatewayController.update);
router.patch("/:gatewayId/heartbeat", GatewayController.heartbeat);
router.delete("/:gatewayId", requireRole("admin", "caregiver"), GatewayController.remove);

export default router;
