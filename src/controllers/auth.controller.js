import AuthService from "../services/auth.service.js";
import { handleSuccessResponse } from "../helpers/handleResponse.js";

class AuthController {
  /**
   * @swagger
   * /api/v1/auth/register/otp:
   *   post:
   *     summary: Gửi OTP cho đăng ký tài khoản
   *     tags: [Auth]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [phoneNumber, email]
   *             properties:
   *               phoneNumber:
   *                 type: string
   *                 example: "0912345678"
   *               email:
   *                 type: string
   *                 format: email
   *                 example: "caregiver@example.com"
   *     responses:
   *       200:
   *         description: Gửi OTP thành công
   */
  async requestRegisterOtp(req, res, next) {
    try {
      await AuthService.requestRegisterOtp(req.body);
      return res
        .status(200)
        .json(handleSuccessResponse(200, "Gửi OTP đăng ký thành công", null));
    } catch (error) {
      return next(error);
    }
  }

  /**
   * @swagger
   * /api/v1/auth/register:
   *   post:
   *     summary: Đăng ký tài khoản người chăm sóc
   *     tags: [Auth]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [fullName, phoneNumber, email, password, otp]
   *             properties:
   *               fullName:
   *                 type: string
   *                 example: "Nguyễn Văn A"
   *               phoneNumber:
   *                 type: string
   *                 example: "0912345678"
   *               email:
   *                 type: string
   *                 format: email
   *                 example: "caregiver@example.com"
   *               password:
   *                 type: string
   *                 format: password
   *                 example: "StrongPass123"
   *               otp:
   *                 type: string
   *                 example: "123456"
   *     responses:
   *       201:
   *         description: Đăng ký thành công
   */
  async register(req, res, next) {
    try {
      const user = await AuthService.register(req.body);
      return res
        .status(201)
        .json(handleSuccessResponse(201, "Đăng ký thành công", user));
    } catch (error) {
      return next(error);
    }
  }

  /**
   * @swagger
   * /api/v1/auth/login:
   *   post:
   *     summary: Đăng nhập hệ thống
   *     tags: [Auth]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [phoneNumber, password]
   *             properties:
   *               phoneNumber:
   *                 type: string
   *                 example: "0912345678"
   *               password:
   *                 type: string
   *                 format: password
   *                 example: "StrongPass123"
   *     responses:
   *       200:
   *         description: Đăng nhập thành công
   */
  async login(req, res, next) {
    try {
      const loginResult = await AuthService.login(req.body);
      return res
        .status(200)
        .json(handleSuccessResponse(200, "Đăng nhập thành công", loginResult));
    } catch (error) {
      return next(error);
    }
  }

  /**
   * @swagger
   * /api/v1/auth/me:
   *   get:
   *     summary: Lấy thông tin người dùng đang đăng nhập
   *     tags: [Auth]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Lấy thông tin thành công
   */
  async getMe(req, res, next) {
    try {
      const user = await AuthService.getMe(req.user?.userId);
      return res
        .status(200)
        .json(handleSuccessResponse(200, "Lấy thông tin người dùng thành công", user));
    } catch (error) {
      return next(error);
    }
  }

  /**
   * @swagger
   * /api/v1/auth/forgot-password/verify:
   *   post:
   *     summary: Kiểm tra số điện thoại và gửi OTP đặt lại mật khẩu
   *     tags: [Auth]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [phoneNumber]
   *             properties:
   *               phoneNumber:
   *                 type: string
   *                 example: "0912345678"
   *     responses:
   *       200:
   *         description: Gửi OTP đặt lại mật khẩu thành công
   */
  async verifyForgot(req, res, next) {
    try {
      await AuthService.verifyForgot(req.body);
      return res
        .status(200)
        .json(handleSuccessResponse(200, "Thông tin hợp lệ. OTP đã được gửi đến email của bạn", null));
    } catch (error) {
      return next(error);
    }
  }

  /**
   * @swagger
   * /api/v1/auth/forgot-password/reset:
   *   post:
   *     summary: Đặt lại mật khẩu
   *     tags: [Auth]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [phoneNumber, otp, newPassword]
   *             properties:
   *               phoneNumber:
   *                 type: string
   *                 example: "0912345678"
   *               otp:
   *                 type: string
   *                 example: "123456"
   *               newPassword:
   *                 type: string
   *                 format: password
   *                 example: "NewStrongPass123"
   *     responses:
   *       200:
   *         description: Đổi mật khẩu thành công
   */
  async resetPassword(req, res, next) {
    try {
      await AuthService.resetPassword(req.body);
      return res
        .status(200)
        .json(handleSuccessResponse(200, "Đổi mật khẩu thành công", null));
    } catch (error) {
      return next(error);
    }
  }
}

export default new AuthController();
