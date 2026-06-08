import { BadRequestError, InternalServerError } from "./handleError.js";

export function getSaltRounds() {
  const parsed = Number.parseInt(process.env.SALT_ROUNDS ?? "10", 10);

  if (!Number.isInteger(parsed) || parsed < 4 || parsed > 15) {
    throw new InternalServerError(
      "Cấu hình SALT_ROUNDS không hợp lệ. Giá trị hợp lệ nên nằm trong khoảng 4-15.",
    );
  }

  return parsed;
}

export function getJwtSecret() {
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
    throw new InternalServerError(
      "Cấu hình JWT_SECRET không hợp lệ. Vui lòng kiểm tra biến môi trường.",
    );
  }

  return process.env.JWT_SECRET;
}

export function getJwtExpiresIn() {
  return process.env.JWT_EXPIRES_IN || "1h";
}

export function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

export function normalizePhoneNumber(phoneNumber) {
  return String(phoneNumber || "").trim();
}

export function validateEmail(email) {
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new BadRequestError("Email không hợp lệ");
  }
}

export function validatePhoneNumber(phoneNumber) {
  if (!/^0\d{9}$/.test(phoneNumber)) {
    throw new BadRequestError("Số điện thoại không hợp lệ. Số điện thoại phải gồm 10 chữ số và bắt đầu bằng 0.");
  }
}

export function validatePassword(password) {
  if (typeof password !== "string" || password.length < 8) {
    throw new BadRequestError("Mật khẩu phải có ít nhất 8 ký tự");
  }

  if (!/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/\d/.test(password)) {
    throw new BadRequestError("Mật khẩu phải có chữ hoa, chữ thường và số");
  }
}
