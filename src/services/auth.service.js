import jwt from "jsonwebtoken";
import prisma from "../loaders/dbLoader.js";
import OtpService, { PURPOSES } from "./otp.service.js";
import { env } from "../config/env.js";
import { USER_ROLES } from "../common/enums.js";
import { BadRequestError, ConflictError, InternalServerError, UnAuthorizedError } from "../helpers/handleError.js";
import { assertEmail, assertPhoneNumber, assertRequired, assertStrongPassword } from "../utils/validators.js";
import { assertJwtConfig, compareText, hashText } from "../helpers/security.js";

function publicUserSelect() {
  return {
    userId: true,
    fullName: true,
    phoneNumber: true,
    email: true,
    role: true,
    deviceToken: true,
    isActive: true,
    createdAt: true,
  };
}

function signAccessToken(user) {
  assertJwtConfig();
  return jwt.sign(
    {
      userId: user.userId,
      phoneNumber: user.phoneNumber,
      role: user.role,
    },
    env.jwtSecret,
    { expiresIn: env.jwtExpiresIn },
  );
}

class AuthService {
  async requestRegisterOtp({ phoneNumber, email }) {
    assertRequired({ phoneNumber, email }, ["phoneNumber", "email"]);
    assertPhoneNumber(phoneNumber);
    assertEmail(email);

    const existedUser = await prisma.user.findFirst({
      where: { OR: [{ phoneNumber }, { email }] },
      select: { phoneNumber: true, email: true },
    });

    if (existedUser?.phoneNumber === phoneNumber) {
      throw new ConflictError("Số điện thoại này đã được đăng ký.", "USER_ALREADY_EXISTS");
    }
    if (existedUser?.email === email) {
      throw new ConflictError("Email này đã được đăng ký.", "USER_ALREADY_EXISTS");
    }

    await OtpService.issueOtp({ destination: phoneNumber, email, purpose: PURPOSES.REGISTER });
    return null;
  }

  async register(data) {
    const { fullName, phoneNumber, email, password, otp, deviceToken } = data;
    assertRequired(data, ["fullName", "phoneNumber", "email", "password", "otp"]);
    assertPhoneNumber(phoneNumber);
    assertEmail(email);
    assertStrongPassword(password);

    const existedUser = await prisma.user.findFirst({
      where: { OR: [{ phoneNumber }, { email }] },
      select: { phoneNumber: true, email: true },
    });

    if (existedUser?.phoneNumber === phoneNumber) {
      throw new ConflictError("Số điện thoại này đã được đăng ký.", "USER_ALREADY_EXISTS");
    }
    if (existedUser?.email === email) {
      throw new ConflictError("Email này đã được đăng ký.", "USER_ALREADY_EXISTS");
    }

    await OtpService.verifyOtp({ destination: phoneNumber, otp, purpose: PURPOSES.REGISTER });
    const passwordHash = await hashText(password);

    try {
      const user = await prisma.$transaction(async (tx) => {
        const created = await tx.user.create({
          data: {
            fullName,
            phoneNumber,
            email,
            passwordHash,
            role: USER_ROLES.CAREGIVER,
            deviceToken,
          },
          select: publicUserSelect(),
        });

        await OtpService.consumeOtp({ destination: phoneNumber, purpose: PURPOSES.REGISTER }, tx);
        return created;
      });

      return user;
    } catch (error) {
      if (error.code === "P2002") {
        throw new ConflictError("Email hoặc số điện thoại đã tồn tại.", "USER_ALREADY_EXISTS");
      }
      throw new InternalServerError("Đã có lỗi xảy ra trong quá trình đăng ký.");
    }
  }

  async login({ phoneNumber, password }) {
    assertRequired({ phoneNumber, password }, ["phoneNumber", "password"]);
    assertPhoneNumber(phoneNumber);

    const user = await prisma.user.findUnique({ where: { phoneNumber } });
    if (!user || !user.isActive) {
      throw new UnAuthorizedError("Thông tin đăng nhập không hợp lệ.", "INVALID_CREDENTIALS");
    }

    const isMatch = await compareText(password, user.passwordHash);
    if (!isMatch) {
      throw new UnAuthorizedError("Thông tin đăng nhập không hợp lệ.", "INVALID_CREDENTIALS");
    }

    const accessToken = signAccessToken(user);

    return {
      accessToken,
      expiresIn: env.jwtExpiresIn,
      user: {
        userId: user.userId,
        fullName: user.fullName,
        phoneNumber: user.phoneNumber,
        email: user.email,
        role: user.role,
      },
    };
  }

  async getMe(userId) {
    const user = await prisma.user.findUnique({
      where: { userId },
      select: publicUserSelect(),
    });

    if (!user) {
      throw new UnAuthorizedError("Tài khoản không tồn tại.");
    }

    return user;
  }

  async requestResetPasswordOtp({ phoneNumber }) {
    assertRequired({ phoneNumber }, ["phoneNumber"]);
    assertPhoneNumber(phoneNumber);

    const user = await prisma.user.findUnique({
      where: { phoneNumber },
      select: { userId: true, email: true, isActive: true },
    });

    if (!user || !user.isActive) {
      throw new BadRequestError("Số điện thoại này chưa được đăng ký.", "USER_NOT_FOUND");
    }

    if (!user.email) {
      throw new BadRequestError("Tài khoản chưa có email để nhận OTP.", "EMAIL_NOT_FOUND");
    }

    await OtpService.issueOtp({
      userId: user.userId,
      destination: phoneNumber,
      email: user.email,
      purpose: PURPOSES.RESET_PASSWORD,
    });

    return null;
  }

  async resetPassword({ phoneNumber, otp, newPassword }) {
    assertRequired({ phoneNumber, otp, newPassword }, ["phoneNumber", "otp", "newPassword"]);
    assertPhoneNumber(phoneNumber);
    assertStrongPassword(newPassword);

    const user = await prisma.user.findUnique({ where: { phoneNumber }, select: { userId: true } });
    if (!user) {
      throw new BadRequestError("Số điện thoại này chưa được đăng ký.", "USER_NOT_FOUND");
    }

    await OtpService.verifyOtp({ destination: phoneNumber, otp, purpose: PURPOSES.RESET_PASSWORD });
    const passwordHash = await hashText(newPassword);

    await prisma.$transaction(async (tx) => {
      await tx.user.update({ where: { phoneNumber }, data: { passwordHash } });
      await OtpService.consumeOtp({ destination: phoneNumber, purpose: PURPOSES.RESET_PASSWORD }, tx);
    });

    return null;
  }
}

export default new AuthService();
