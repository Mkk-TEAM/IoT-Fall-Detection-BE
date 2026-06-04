import express from "express";
import AuthController from "../controllers/auth.controller.js"
import { createRateLimit } from "../middleware/rateLimit.middleware.js";
const authRouter = express.Router();

const otpSendRateLimit = createRateLimit({ windowMs: 60 * 1000, maxRequests: 5 });
const registerRateLimit = createRateLimit({ windowMs: 60 * 1000, maxRequests: 10 });

authRouter.post('/register/otp', otpSendRateLimit, AuthController.requestRegisterOtp);
authRouter.post('/register', registerRateLimit, AuthController.register);
authRouter.post('/login', AuthController.login);

authRouter.post("/forgot-password/verify", otpSendRateLimit, AuthController.verifyForgot);
authRouter.post("/forgot-password/reset", AuthController.resetPassword);

export default authRouter;

