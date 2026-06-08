import prisma from "../loaders/dbLoader.js";
import { env } from "../config/env.js";
import { sendRegisterOTPEmail, sendResetPasswordOTPEmail } from "../config/emailService.js";
import { BadRequestError, InternalServerError } from "../helpers/handleError.js";
import { compareText, generateOtp, hashText } from "../helpers/security.js";

const PURPOSES = Object.freeze({
  REGISTER: "REGISTER",
  RESET_PASSWORD: "RESET_PASSWORD",
});

class OtpService {
  get expiresInMs() {
    return env.otpExpiresInMinutes * 60 * 1000;
  }

  get resendIntervalMs() {
    return env.otpResendIntervalSeconds * 1000;
  }

  async validateResendCooldown(destination, purpose) {
    const latestOtpLog = await prisma.otpLog.findFirst({
      where: { destination, purpose, consumedAt: null },
      orderBy: { createdAt: "desc" },
      select: { createdAt: true },
    });

    if (!latestOtpLog) return;

    const elapsedTime = Date.now() - new Date(latestOtpLog.createdAt).getTime();
    if (elapsedTime < this.resendIntervalMs) {
      const remainingSeconds = Math.ceil((this.resendIntervalMs - elapsedTime) / 1000);
      throw new BadRequestError(`Vui lòng chờ ${remainingSeconds} giây trước khi yêu cầu gửi OTP mới.`, "OTP_RATE_LIMITED");
    }
  }

  async issueOtp({ userId = null, destination, email, purpose }) {
    await this.validateResendCooldown(destination, purpose);

    const otp = generateOtp(6);
    const otpHash = await hashText(otp);
    const expiresAt = new Date(Date.now() + this.expiresInMs);

    const otpLog = await prisma.otpLog.create({
      data: {
        userId,
        destination,
        purpose,
        channel: "EMAIL",
        otpHash,
        expiresAt,
      },
      select: { otpLogId: true },
    });

    try {
      if (purpose === PURPOSES.REGISTER) {
        await sendRegisterOTPEmail(email, otp);
      } else {
        await sendResetPasswordOTPEmail(email, otp);
      }

      if (!env.emailEnabled) {
        console.log(`[DEV_OTP] ${purpose} -> ${email}: ${otp}`);
      }

      return { otpLogId: otpLog.otpLogId };
    } catch (error) {
      await prisma.otpLog.deleteMany({ where: { otpLogId: otpLog.otpLogId } });
      console.error("Lỗi gửi email OTP:", error);
      throw new InternalServerError("Không thể gửi mã OTP, vui lòng thử lại sau.", "EMAIL_PROVIDER_ERROR");
    }
  }

  async verifyOtp({ destination, otp, purpose }) {
    const latestOtpLog = await prisma.otpLog.findFirst({
      where: { destination, purpose, consumedAt: null },
      orderBy: { createdAt: "desc" },
    });

    if (!latestOtpLog) {
      throw new BadRequestError("Vui lòng yêu cầu mã OTP trước.", "OTP_NOT_FOUND");
    }

    if (latestOtpLog.expiresAt < new Date()) {
      throw new BadRequestError("Mã OTP đã hết hạn.", "OTP_EXPIRED");
    }

    const isOtpValid = await compareText(otp, latestOtpLog.otpHash);
    if (!isOtpValid) {
      throw new BadRequestError("Mã OTP không chính xác.", "OTP_INVALID");
    }

    return latestOtpLog;
  }

  async consumeOtp({ destination, purpose }, db = prisma) {
    await db.otpLog.updateMany({
      where: { destination, purpose, consumedAt: null },
      data: { consumedAt: new Date() },
    });
  }
}

export { PURPOSES };
export default new OtpService();
