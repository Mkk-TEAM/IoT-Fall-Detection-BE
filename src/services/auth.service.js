import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import prisma from "../loaders/dbLoader.js";
import { BadRequestError, ConflictError, NotFoundError, UnAuthorizedError } from "../helpers/handleError.js";
import OtpService from "./otp.service.js";
import {
  getJwtExpiresIn,
  getJwtSecret,
  getSaltRounds,
  normalizeEmail,
  normalizePhoneNumber,
  validateEmail,
  validatePassword,
  validatePhoneNumber,
} from "../helpers/security.js";

function mapUserResponse(user) {
  return {
    userId: user.userId,
    fullName: user.fullName,
    phoneNumber: user.phoneNumber,
    email: user.email,
    role: user.role,
  };
}

class AuthService {
  async requestRegisterOtp({ phoneNumber, email }) {
    const normalizedPhoneNumber = normalizePhoneNumber(phoneNumber);
    const normalizedEmail = normalizeEmail(email);

    validatePhoneNumber(normalizedPhoneNumber);
    validateEmail(normalizedEmail);

    const existedUser = await prisma.user.findFirst({
      where: {
        OR: [
          { phoneNumber: normalizedPhoneNumber },
          { email: normalizedEmail },
        ],
      },
      select: { userId: true, phoneNumber: true, email: true },
    });

    if (existedUser) {
      if (existedUser.phoneNumber === normalizedPhoneNumber) {
        throw new ConflictError("Số điện thoại này đã được đăng ký");
      }
      throw new ConflictError("Email này đã được đăng ký");
    }

    await OtpService.issueOtp({ email: normalizedEmail, type: "register" });
  }

  async register(data) {
    const fullName = String(data.fullName || "").trim();
    const phoneNumber = normalizePhoneNumber(data.phoneNumber);
    const email = normalizeEmail(data.email);
    const password = data.password;
    const otp = data.otp;

    if (!fullName || !phoneNumber || !email || !password || !otp) {
      throw new BadRequestError("Thiếu thông tin bắt buộc");
    }

    validatePhoneNumber(phoneNumber);
    validateEmail(email);
    validatePassword(password);

    const existedUser = await prisma.user.findFirst({
      where: {
        OR: [{ phoneNumber }, { email }],
      },
      select: { userId: true, phoneNumber: true, email: true },
    });

    if (existedUser) {
      if (existedUser.phoneNumber === phoneNumber) {
        throw new ConflictError("Số điện thoại này đã được đăng ký");
      }
      throw new ConflictError("Email này đã được đăng ký");
    }

    await OtpService.verifyOtp({ email, otp });

    const passwordHash = await bcrypt.hash(password, getSaltRounds());

    const newUser = await prisma.$transaction(async (tx) => {
      const createdUser = await tx.user.create({
        data: {
          fullName,
          phoneNumber,
          email,
          passwordHash,
          role: "caregiver",
        },
        select: {
          userId: true,
          fullName: true,
          phoneNumber: true,
          email: true,
          role: true,
        },
      });

      await OtpService.consumeOtp({ email, db: tx });
      return createdUser;
    });

    return mapUserResponse(newUser);
  }

  async login({ phoneNumber, password }) {
    const normalizedPhoneNumber = normalizePhoneNumber(phoneNumber);

    if (!normalizedPhoneNumber || !password) {
      throw new BadRequestError("Vui lòng cung cấp đầy đủ số điện thoại và mật khẩu");
    }

    validatePhoneNumber(normalizedPhoneNumber);

    const user = await prisma.user.findUnique({
      where: { phoneNumber: normalizedPhoneNumber },
    });

    if (!user || user.isActive === false) {
      throw new UnAuthorizedError("Thông tin đăng nhập không hợp lệ");
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      throw new UnAuthorizedError("Thông tin đăng nhập không hợp lệ");
    }

    const payload = {
      userId: user.userId,
      phoneNumber: user.phoneNumber,
      role: user.role,
    };

    const accessToken = jwt.sign(payload, getJwtSecret(), {
      expiresIn: getJwtExpiresIn(),
    });

    return {
      accessToken,
      tokenType: "Bearer",
      expiresIn: getJwtExpiresIn(),
      user: mapUserResponse(user),
    };
  }

  async getMe(userId) {
    if (!userId) {
      throw new UnAuthorizedError("Token không chứa thông tin người dùng");
    }

    const user = await prisma.user.findUnique({
      where: { userId },
      select: {
        userId: true,
        fullName: true,
        phoneNumber: true,
        email: true,
        role: true,
        isActive: true,
      },
    });

    if (!user || user.isActive === false) {
      throw new NotFoundError("Không tìm thấy người dùng hoặc tài khoản đã bị vô hiệu hóa");
    }

    return mapUserResponse(user);
  }

  async verifyForgot({ phoneNumber }) {
    const normalizedPhoneNumber = normalizePhoneNumber(phoneNumber);

    if (!normalizedPhoneNumber) {
      throw new BadRequestError("Vui lòng cung cấp số điện thoại");
    }

    validatePhoneNumber(normalizedPhoneNumber);

    const user = await prisma.user.findUnique({
      where: { phoneNumber: normalizedPhoneNumber },
      select: {
        userId: true,
        email: true,
        isActive: true,
      },
    });

    if (!user || user.isActive === false) {
      throw new BadRequestError("Số điện thoại này chưa được đăng ký.");
    }

    if (!user.email) {
      throw new BadRequestError("Tài khoản chưa có email để nhận OTP đặt lại mật khẩu.");
    }

    await OtpService.issueOtp({ email: user.email, type: "reset", userId: user.userId });
  }

  async resetPassword({ phoneNumber, newPassword, otp }) {
    const normalizedPhoneNumber = normalizePhoneNumber(phoneNumber);

    if (!normalizedPhoneNumber || !newPassword || !otp) {
      throw new BadRequestError("Thiếu dữ liệu đặt lại mật khẩu.");
    }

    validatePhoneNumber(normalizedPhoneNumber);
    validatePassword(newPassword);

    const user = await prisma.user.findUnique({
      where: { phoneNumber: normalizedPhoneNumber },
      select: {
        userId: true,
        email: true,
        isActive: true,
      },
    });

    if (!user || user.isActive === false) {
      throw new BadRequestError("Số điện thoại này chưa được đăng ký.");
    }

    if (!user.email) {
      throw new BadRequestError("Tài khoản chưa có email để xác thực đặt lại mật khẩu.");
    }

    await OtpService.verifyOtp({ email: user.email, otp });

    const passwordHash = await bcrypt.hash(newPassword, getSaltRounds());

    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { userId: user.userId },
        data: { passwordHash },
      });

      await OtpService.consumeOtp({ email: user.email, db: tx });
    });
  }
}

export default new AuthService();
