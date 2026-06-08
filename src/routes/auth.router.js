import express from "express";
import AuthController from "../controllers/auth.controller.js";
import { verifyToken } from "../middleware/auth.middleware.js";
import { createRateLimit } from "../middleware/rateLimit.middleware.js";

const authRouter = express.Router();

const otpSendRateLimit = createRateLimit({
  windowMs: 60 * 1000,
  maxRequests: 3,
  keyPrefix: "auth-otp",
});

const registerRateLimit = createRateLimit({
  windowMs: 60 * 1000,
  maxRequests: 5,
  keyPrefix: "auth-register",
});

const loginRateLimit = createRateLimit({
  windowMs: 60 * 1000,
  maxRequests: 10,
  keyPrefix: "auth-login",
});

authRouter.post("/register/otp", otpSendRateLimit, AuthController.requestRegisterOtp.bind(AuthController));
authRouter.post("/register", registerRateLimit, AuthController.register.bind(AuthController));
authRouter.post("/login", loginRateLimit, AuthController.login.bind(AuthController));
authRouter.get("/me", verifyToken, AuthController.getMe.bind(AuthController));

authRouter.post("/forgot-password/verify", otpSendRateLimit, AuthController.verifyForgot.bind(AuthController));
authRouter.post("/forgot-password/reset", registerRateLimit, AuthController.resetPassword.bind(AuthController));

export default authRouter;
