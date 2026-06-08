import { BadRequestError } from "../helpers/handleError.js";

export function assertRequired(body, fields) {
  const missing = fields.filter((field) => body[field] === undefined || body[field] === null || body[field] === "");
  if (missing.length > 0) {
    throw new BadRequestError(`Thiếu trường bắt buộc: ${missing.join(", ")}`, "VALIDATION_ERROR", { missing });
  }
}

export function isValidPhoneNumber(phoneNumber) {
  return /^\d{10}$/.test(String(phoneNumber || ""));
}

export function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || ""));
}

export function assertPhoneNumber(phoneNumber) {
  if (!isValidPhoneNumber(phoneNumber)) {
    throw new BadRequestError("Số điện thoại không hợp lệ. Vui lòng nhập đủ 10 chữ số.", "VALIDATION_ERROR");
  }
}

export function assertEmail(email, required = true) {
  if (!email && !required) return;
  if (!isValidEmail(email)) {
    throw new BadRequestError("Email không hợp lệ.", "VALIDATION_ERROR");
  }
}

export function assertStrongPassword(password) {
  if (typeof password !== "string" || password.length < 8) {
    throw new BadRequestError("Mật khẩu phải có ít nhất 8 ký tự.", "VALIDATION_ERROR");
  }
}

export function parsePagination(query) {
  const page = Math.max(Number.parseInt(query.page, 10) || 1, 1);
  const pageSize = Math.min(Math.max(Number.parseInt(query.pageSize, 10) || 10, 1), 100);
  return {
    page,
    pageSize,
    skip: (page - 1) * pageSize,
    take: pageSize,
  };
}

export function parseDate(value, fieldName) {
  if (!value) return undefined;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new BadRequestError(`${fieldName} không phải định dạng thời gian hợp lệ.`, "VALIDATION_ERROR");
  }
  return date;
}

export function assertEnum(value, allowed, fieldName) {
  if (value === undefined || value === null || value === "") return;
  if (!Object.values(allowed).includes(value)) {
    throw new BadRequestError(`${fieldName} không hợp lệ.`, "VALIDATION_ERROR", { allowed: Object.values(allowed) });
  }
}
