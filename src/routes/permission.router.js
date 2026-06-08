import express from "express";
import PermissionController from "../controllers/permission.controller.js";
import { requireRole, verifyToken } from "../middleware/auth.middleware.js";

const router = express.Router();
router.use(verifyToken);
router.get("/", requireRole("admin", "caregiver"), PermissionController.list);
router.post("/", requireRole("admin", "caregiver"), PermissionController.upsert);
router.put("/:permissionId", requireRole("admin", "caregiver"), PermissionController.update);
router.delete("/:permissionId", requireRole("admin", "caregiver"), PermissionController.remove);

export default router;
