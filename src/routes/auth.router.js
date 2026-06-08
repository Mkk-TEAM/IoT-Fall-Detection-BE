import express from "express";
import AuthController from "../controllers/auth.controller.js";
import { createRateLimit } from "../middleware/rateLimit.middleware.js";
import { verifyToken } from "../middleware/auth.middleware.js";

const router = express.Router();
const otpRateLimit = createRateLimit({ windowMs: 60 * 1000, maxRequests: 5, keyPrefix: "auth-otp" });
const authRateLimit = createRateLimit({ windowMs: 60 * 1000, maxRequests: 20, keyPrefix: "auth" });

/**
 * @swagger
 * tags:
 *   - name: Auth
 *     description: Đăng ký, đăng nhập, OTP và tài khoản hiện tại
 */
router.post("/register/otp", otpRateLimit, AuthController.requestRegisterOtp);
router.post("/register", authRateLimit, AuthController.register);
router.post("/login", authRateLimit, AuthController.login);
router.get("/me", verifyToken, AuthController.me);
router.post("/forgot-password/verify", otpRateLimit, AuthController.requestResetPasswordOtp);
router.post("/forgot-password/otp", otpRateLimit, AuthController.requestResetPasswordOtp);
router.post("/forgot-password/reset", authRateLimit, AuthController.resetPassword);

export default router;
