import AuthService from "../services/auth.service.js";
import { handleSuccessResponse } from "../helpers/handleResponse.js";

class AuthController{
    /**
     * @swagger
     * /auth/register/otp:
     *   post:
     *     summary: Gửi OTP cho đăng ký tài khoản
     *     tags: [Auth]
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required:
     *               - phoneNumber
     *               - email
     *             properties:
     *               phoneNumber:
     *                 type: string
     *                 example: "0123456789"
     *               email:
     *                 type: string
     *                 format: email
     *                 example: "nguyenvana@gmail.com"
     *     responses:
     *       200:
     *         description: Gửi OTP thành công
     *       400:
     *         description: Dữ liệu không hợp lệ hoặc chưa đủ thời gian gửi lại OTP
     *       500:
     *         description: Server lỗi
     */
    async requestRegisterOtp(req, res, next) {
        try {
            const data = req.body;
            await AuthService.requestRegisterOtp(data);

            return res
                .status(200)
                .json(handleSuccessResponse(200, "Gửi OTP thành công", null));
        } catch (e) {
            next(e);
        }
    }

    /**
     * @swagger
     * /auth/register:
     *   post:
     *     summary: Đăng ký tài khoản
     *     tags: [Auth]
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required:
     *               - fullName
     *               - phoneNumber
     *               - email
     *               - password
     *               - otp
     *             properties:
     *               fullName:
     *                 type: string
     *                 example: "Nguyễn Văn A"
     *                 description: Tên đầy đủ người dùng
     *               phoneNumber:
     *                 type: string
     *                 example: "0123456789"
     *                 description: Số điện thoại
     *               email:
     *                 type: string
     *                 format: email
     *                 example: "nguyenvana@gmail.com"
     *               password:
     *                 type: string
     *                 format: password
     *                 example: "123456"
     *                 description: Mật khẩu
     *               otp:
     *                 type: string
     *                 example: "123456"
     *                 description: Mã OTP đã nhận qua email
     *     responses:
     *       200:
     *         description: Đăng ký thành công
     *       400: 
     *         description: Thông tin không hợp lệ
     *       500:
     *         description: Server lỗi
     */

    async register(req, res, next){
        try{
            const registrationData = req.body;
            const userInfo = await AuthService.register(registrationData);

            res.status(200).json(handleSuccessResponse(200, "Khách hàng đăng ký thành công", userInfo));
        } catch(e){
            next(e)
        }
    }

    /**
     * @swagger
     * /auth/login:
     *   post:
     *     summary: Đăng nhập
     *     tags: [Auth]
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required:
     *               - phoneNumber
     *               - password
     *             properties:
     *               phoneNumber:
     *                 type: string
     *                 example: "0123456789"
     *                 description: Số điện thoại
     *               password:
     *                 type: string
     *                 format: password
     *                 example: "123456"
     *                 description: Mật khẩu
     *     responses:
     *       200:
     *         description: Đăng nhập thành công
     *       400:
     *         description: Thiếu thông tin đăng nhập
     *       401:
     *         description: Thông tin đăng nhập không đúng hoặc không phải tài khoản khách hàng
     *       500:
     *         description: Lỗi hệ thống trong quá trình đăng nhập
     */

    async login(req, res, next){
        try{
            const loginData = req.body;
            const userInfo = await AuthService.login(loginData);

            res.status(200).json(handleSuccessResponse(200, "Người dùng đăng nhập thành công", userInfo));
        } catch(e){
            next(e);
        }
    }

        /**
     * @swagger
     * /auth/forgot-password/verify:
     *   post:
     *     summary: Kiểm tra số điện thoại quên mật khẩu
     *     tags: [Auth]
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required:
     *               - phoneNumber
     *             properties:
     *               phoneNumber:
     *                 type: string
     *                 example: "0123456789"
     *                 description: Số điện thoại của tài khoản cần quên mật khẩu
     *             
     *     responses:
     *       200:
     *         description: Thông tin hợp lệ
     *       400:
     *         description: Số điện thoại không đúng
     *       500:
     *         description: Lỗi hệ thống
     */
    async verifyForgot(req, res, next) {
        try {
            const data = req.body; // { phoneNumber }
            await AuthService.verifyForgot(data);

            return res
                .status(200)
                .json(handleSuccessResponse(200, "Thông tin hợp lệ", null));
        } catch (e) {
            next(e);
        }
    }

    /**
     * @swagger
     * /auth/forgot-password/reset:
     *   post:
     *     summary: Đặt lại mật khẩu mới cho tài khoản
     *     tags: [Auth]
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required:
     *               - phoneNumber
     *               - otp
     *               - newPassword
     *             properties:
     *               phoneNumber:
     *                 type: string
     *                 example: "0123456789"
     *               otp:
     *                 type: string
     *                 example: "123456"
     *               newPassword:
     *                 type: string
     *                 example: "matkhau_moi_123"
     *     responses:
     *       200:
     *         description: Đổi mật khẩu thành công
     *       400:
     *         description: Dữ liệu không hợp lệ
     *       500:
     *         description: Lỗi hệ thống
     */
    async resetPassword(req, res, next) {
        try {
            const data = req.body; // { phoneNumber, newPassword, otp }
            await AuthService.resetPassword(data);

            return res
                .status(200)
                .json(
                    handleSuccessResponse(
                        200,
                        "Đổi mật khẩu thành công",
                        null
                    )
                );
        } catch (e) {
            next(e);
        }
    }
}



export default new AuthController();