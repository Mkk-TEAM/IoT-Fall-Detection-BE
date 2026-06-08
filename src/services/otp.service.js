import bcrypt from "bcrypt";
import prisma from "../loaders/dbLoader.js";
import { BadRequestError, InternalServerError } from "../helpers/handleError.js";
import { sendRegisterOTPEmail, sendResetPasswordOTPEmail } from "../config/emailService.js";
import { getSaltRounds, normalizeEmail, validateEmail } from "../helpers/security.js";

const OTP_RESEND_INTERVAL_MS = Number(process.env.OTP_RESEND_INTERVAL_MS || 60_000);
const OTP_EXPIRED_MS = Number(process.env.OTP_EXPIRED_MS || 5 * 60_000);

function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

class OtpService {
  async validateResendCooldown(destination) {
    const latestOtpLog = await prisma.otpLog.findFirst({
      where: {
        destination,
        consumedAt: null,
      },
      orderBy: { createdAt: "desc" },
      select: { createdAt: true },
    });

    if (!latestOtpLog) return;

    const elapsedTime = Date.now() - new Date(latestOtpLog.createdAt).getTime();

    if (elapsedTime < OTP_RESEND_INTERVAL_MS) {
      const remainingSeconds = Math.ceil((OTP_RESEND_INTERVAL_MS - elapsedTime) / 1000);
      throw new BadRequestError(
        `Vui lòng chờ ${remainingSeconds} giây trước khi yêu cầu gửi OTP mới.`,
      );
    }
  }

  async issueOtp({ email, type = "register", userId = null }) {
    const destination = normalizeEmail(email);
    validateEmail(destination);

    await this.validateResendCooldown(destination);

    const otp = generateOtp();
    const expiresAt = new Date(Date.now() + OTP_EXPIRED_MS);
    const otpHash = await bcrypt.hash(otp, getSaltRounds());

    const otpLog = await prisma.otpLog.create({
      data: {
        userId,
        destination,
        channel: "EMAIL",
        otpHash,
        expiresAt,
      },
      select: { otpLogId: true },
    });

    try {
      if (type === "register") {
        await sendRegisterOTPEmail(destination, otp);
      } else if (type === "reset") {
        await sendResetPasswordOTPEmail(destination, otp);
      } else {
        throw new BadRequestError("Loại OTP không hợp lệ");
      }
    } catch (error) {
      await prisma.otpLog.deleteMany({ where: { otpLogId: otpLog.otpLogId } });

      if (error instanceof BadRequestError) throw error;

      console.error("[EMAIL_OTP_ERROR]", error);
      throw new InternalServerError("Không thể gửi mã OTP, vui lòng thử lại sau.");
    }
  }

  async verifyOtp({ email, otp }) {
    const destination = normalizeEmail(email);
    validateEmail(destination);

    if (!otp) {
      throw new BadRequestError("Vui lòng nhập mã OTP");
    }

    const latestOtpLog = await prisma.otpLog.findFirst({
      where: {
        destination,
        consumedAt: null,
      },
      orderBy: { createdAt: "desc" },
    });

    if (!latestOtpLog) {
      throw new BadRequestError("Vui lòng yêu cầu mã OTP trước.");
    }

    if (latestOtpLog.expiresAt < new Date()) {
      throw new BadRequestError("Mã OTP đã hết hạn.");
    }

    const isOtpValid = await bcrypt.compare(String(otp), latestOtpLog.otpHash);
    if (!isOtpValid) {
      throw new BadRequestError("Mã OTP không chính xác.");
    }

    return latestOtpLog;
  }

  async consumeOtp({ email, db = prisma }) {
    const destination = normalizeEmail(email);

    await db.otpLog.updateMany({
      where: {
        destination,
        consumedAt: null,
      },
      data: {
        consumedAt: new Date(),
      },
    });
  }
}

export default new OtpService();
