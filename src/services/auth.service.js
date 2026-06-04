import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import prisma from "../loaders/dbLoader.js";
import {
    BadRequestError,
    InternalServerError,
    UnAuthorizedError,
} from "../helpers/handleError.js";
import OtpService from "./otp.service.js";
import { getSaltRounds } from "../helpers/security.js";

const generateID = () => {
    const timestamp = Date.now().toString(); // Vd: "1731125220000" (13-14 ký tự)

    // Lấy 8 ký tự cuối (hoặc 10 - prefix.length)
    const suffixLength = 10;
    const startIndex = timestamp.length - suffixLength;

    return timestamp.substring(startIndex); // Vd: "5220000"
};

class AuthService {
    async requestRegisterOtp({ phoneNumber, email }) {
        if (!phoneNumber || !email) {
            throw new BadRequestError(
                "Vui lòng cung cấp số điện thoại và email",
            );
        }

        if (!/^\d{10}$/.test(phoneNumber)) {
            throw new BadRequestError("Số điện thoại không hợp lệ");
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            throw new BadRequestError("Email không hợp lệ");
        }

        const existedUser = await prisma.User.findFirst({
            where: {
                OR: [{ phoneNumber }, { email }],
            },
            select: { userID: true, phoneNumber: true, email: true },
        });

        if (existedUser) {
            if (existedUser.phoneNumber === phoneNumber) {
                throw new BadRequestError("Số điện thoại này đã được đăng ký");
            }

            throw new BadRequestError("Email này đã được đăng ký");
        }

        await OtpService.issueOtp({ phoneNumber, email, type: "register" });

        return { message: "Mã OTP đăng ký đã được gửi đến email của bạn." };
    }

    async register(data) {
        const { fullName, phoneNumber, email, password, otp } = data;

        // 1. Validation cơ bản
        if (!fullName || !phoneNumber || !email || !password || !otp) {
            throw new BadRequestError("Thiếu thông tin bắt buộc");
        }

        if (password.length < 6) {
            throw new BadRequestError("Mật khẩu phải có ít nhất 6 ký tự");
        }

        if (!/^\d{10}$/.test(phoneNumber)) {
            throw new BadRequestError("Số điện thoại không hợp lệ");
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            throw new BadRequestError("Email không hợp lệ");
        }

        const existedUser = await prisma.User.findFirst({
            where: {
                OR: [{ phoneNumber }, { email }],
            },
            select: { userID: true, phoneNumber: true, email: true },
        });

        if (existedUser) {
            if (existedUser.phoneNumber === phoneNumber) {
                throw new BadRequestError("Số điện thoại này đã được đăng ký");
            }

            throw new BadRequestError("Email này đã được đăng ký");
        }

        await OtpService.verifyOtp({ phoneNumber, otp });

        // 2. Hash password ngoài transaction để giảm thời gian khóa record trong DB
        const hashedPassword = await bcrypt.hash(password, getSaltRounds());

        try {
            // 3. Sử dụng trực tiếp create (tận dụng constraint của DB)
            const newUser = await prisma.User.create({
                data: {
                    userID: generateID(),
                    fullName,
                    phoneNumber,
                    email,
                    password: hashedPassword,
                },
                select: {
                    userID: true,
                    fullName: true,
                    phoneNumber: true,
                    email: true,
                },
            });

            await OtpService.clearOtpByPhone(phoneNumber);

            return newUser;
        } catch (error) {
            // Log chi tiết để debug
            console.error("Lỗi đăng ký:", error);

            if (error.code === "P2002") {
                const message = error.message; // Lấy thông báo lỗi thô của Prisma
                if (message.includes("phoneNumber")) {
                    throw new BadRequestError(
                        "Số điện thoại này đã được đăng ký",
                    );
                }
                if (message.includes("email")) {
                    throw new BadRequestError("Email này đã được đăng ký");
                }

                // Fallback nếu không khớp cột cụ thể
                throw new BadRequestError("Dữ liệu đã tồn tại trong hệ thống");
            }
            throw new InternalServerError(
                "Đã có lỗi xảy ra trong quá trình đăng ký",
            );
        }
    }

    async login(data) {
        const { phoneNumber, password } = data;

        if (!phoneNumber || !password) {
            throw new BadRequestError(
                "Vui lòng cung cấp đầy đủ số điện thoại và mật khẩu",
            );
        }

        // 1. Tìm user
        const user = await prisma.User.findFirst({
            where: {
                phoneNumber: phoneNumber,
            },
        });

        if (!user) {
            throw new UnAuthorizedError("Thông tin đăng nhập không hợp lệ");
        }

        // 2. Kiểm tra password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            throw new UnAuthorizedError("Thông tin đăng nhập không hợp lệ");
        }

        const payload = {
            userID: user.userID,
            phoneNumber: user.phoneNumber,
        };

        const token = jwt.sign(payload, process.env.JWT_SECRET, {
            expiresIn: process.env.JWT_EXPIRES_IN,
        });

        return {
            token,
            userInfo: {
                userID: user.userID,
                fullName: user.fullName,
                phoneNumber: user.phoneNumber,
                email: user.email,
            },
        };
    }

    async verifyForgot({ phoneNumber }) {
        if (!phoneNumber) {
            throw new BadRequestError("Vui lòng cung cấp số điện thoại");
        }

        // 1. Kiểm tra user có tồn tại không
        const user = await prisma.User.findFirst({
            where: { phoneNumber: phoneNumber },
        });

        // 2. Kiểm tra user có tồn tại không
        if (!user) {
            throw new BadRequestError("Số điện thoại này chưa được đăng ký.");
        }

        await OtpService.issueOtp({ phoneNumber, email: user.email, type: "reset" });

        return { message: "Mã xác thực đã được gửi đến email của bạn." };
    }

    async resetPassword({ phoneNumber, newPassword, otp }) {
        if (!phoneNumber || !newPassword || !otp) {
            throw new BadRequestError("Thiếu dữ liệu đặt lại mật khẩu.");
        }

        await OtpService.verifyOtp({ phoneNumber, otp });

        // 5. Hash mật khẩu (ép kiểu về số)
        const hashed = await bcrypt.hash(newPassword, getSaltRounds());

        // 6. Cập nhật và consume OTP trong cùng transaction
        await prisma.$transaction(async (tx) => {
            await tx.User.updateMany({
                where: { phoneNumber },
                data: { password: hashed },
            });

            await OtpService.consumeOtpByPhone(phoneNumber, tx);
        });

        return { message: "Đổi mật khẩu thành công!" };
    }
}

export default new AuthService();
