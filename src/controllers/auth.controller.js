import AuthService from "../services/auth.service.js";
import { asyncHandler } from "../helpers/handleError.js";
import { handleSuccessResponse } from "../helpers/handleResponse.js";

class AuthController {
  requestRegisterOtp = asyncHandler(async (req, res) => {
    await AuthService.requestRegisterOtp(req.body);
    return res.status(200).json(handleSuccessResponse(null, "Gửi OTP đăng ký thành công."));
  });

  register = asyncHandler(async (req, res) => {
    const user = await AuthService.register(req.body);
    return res.status(201).json(handleSuccessResponse(user, "Đăng ký thành công."));
  });

  login = asyncHandler(async (req, res) => {
    const result = await AuthService.login(req.body);
    return res.status(200).json(handleSuccessResponse(result, "Đăng nhập thành công."));
  });

  me = asyncHandler(async (req, res) => {
    const user = await AuthService.getMe(req.user.userId);
    return res.status(200).json(handleSuccessResponse(user, "Lấy thông tin người dùng thành công."));
  });

  requestResetPasswordOtp = asyncHandler(async (req, res) => {
    await AuthService.requestResetPasswordOtp(req.body);
    return res.status(200).json(handleSuccessResponse(null, "Gửi OTP đặt lại mật khẩu thành công."));
  });

  resetPassword = asyncHandler(async (req, res) => {
    await AuthService.resetPassword(req.body);
    return res.status(200).json(handleSuccessResponse(null, "Đổi mật khẩu thành công."));
  });
}

export default new AuthController();
