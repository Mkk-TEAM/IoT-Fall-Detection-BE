import bcrypt from "bcrypt";
import prisma from "../loaders/dbLoader.js";
import {
    BadRequestError,
    InternalServerError,
} from "../helpers/handleError.js";
import { sendRegisterOTPEmail, sendResetPasswordOTPEmail } from "../config/emailService.js";
import { getSaltRounds } from "../helpers/security.js";

const OTP_RESEND_INTERVAL_MS = 5 * 60 * 1000;
const OTP_EXPIRED_MS = 5 * 60 * 1000;

class OtpService {
    async validateResendCooldown(phoneNumber) {
        const latestOtpLog = await prisma.OtpLogs.findFirst({
            where: { phoneNumber },
            orderBy: { createdAt: "desc" },
            select: { createdAt: true },
        });

        if (!latestOtpLog) {
            return;
        }

        const elapsedTime =
            Date.now() - new Date(latestOtpLog.createdAt).getTime();

        if (elapsedTime < OTP_RESEND_INTERVAL_MS) {
            const remainingSeconds = Math.ceil(
                (OTP_RESEND_INTERVAL_MS - elapsedTime) / 1000,
            );

            throw new BadRequestError(
                `Vui lòng chờ ${remainingSeconds} giây trước khi yêu cầu gửi OTP mới.`,
            );
        }
    }

    async issueOtp({ phoneNumber, email, type }) {
        await this.validateResendCooldown(phoneNumber);

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + OTP_EXPIRED_MS);
        const hashedOtp = await bcrypt.hash(otp, getSaltRounds());

        const otpLog = await prisma.OtpLogs.create({
            data: {
                phoneNumber,
                otp: hashedOtp,
                expiresAt,
            },
            select: { id: true },
        });

        try {
            if(type === "register") {
                await sendRegisterOTPEmail(email, otp);
            } else {
                await sendResetPasswordOTPEmail(email, otp);
            }
        } catch (error) {
            // Rollback inserted OTP to avoid orphan OTP when email delivery fails.
            await prisma.OtpLogs.deleteMany({ where: { id: otpLog.id } });
            console.error("Lỗi gửi email OTP:", error);
            throw new InternalServerError(
                "Không thể gửi mã OTP, vui lòng thử lại sau.",
            );
        }
    }

    async verifyOtp({ phoneNumber, otp }) {
        const latestOtpLog = await prisma.OtpLogs.findFirst({
            where: { phoneNumber },
            orderBy: { createdAt: "desc" },
        });

        if (!latestOtpLog) {
            throw new BadRequestError("Vui lòng yêu cầu mã OTP trước.");
        }

        if (latestOtpLog.expiresAt < new Date()) {
            throw new BadRequestError("Mã OTP đã hết hạn.");
        }

        const isOtpValid = await bcrypt.compare(otp, latestOtpLog.otp);
        if (!isOtpValid) {
            throw new BadRequestError("Mã OTP không chính xác.");
        }
    }

    async consumeOtpByPhone(phoneNumber, db = prisma) {
        // Keep a timestamp marker so resend cooldown still works
        // even after OTP is consumed (register/reset password success).
        await db.OtpLogs.deleteMany({
            where: { phoneNumber },
        });
        await db.OtpLogs.create({
            data: {
                phoneNumber,
                otp: "consumed",
                expiresAt: new Date(),
            },
        });
    }

    async clearOtpByPhone(phoneNumber) {
        await prisma.$transaction(async (tx) => {
            await this.consumeOtpByPhone(phoneNumber, tx);
        });
    }
}

export default new OtpService();
