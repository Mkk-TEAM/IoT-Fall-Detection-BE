import bcrypt from "bcrypt";
import crypto from "node:crypto";
import { env } from "../config/env.js";
import { InternalServerError } from "./handleError.js";

export function getSaltRounds() {
  if (!Number.isInteger(env.saltRounds) || env.saltRounds < 4 || env.saltRounds > 15) {
    throw new InternalServerError("SALT_ROUNDS không hợp lệ. Giá trị hợp lệ nên trong khoảng 4-15.", "INVALID_SECURITY_CONFIG");
  }
  return env.saltRounds;
}

export async function hashText(text) {
  return bcrypt.hash(String(text), getSaltRounds());
}

export async function compareText(text, hash) {
  return bcrypt.compare(String(text), hash);
}

export function generateOtp(length = 6) {
  const min = 10 ** (length - 1);
  const max = 10 ** length - 1;
  return crypto.randomInt(min, max + 1).toString();
}

export function assertJwtConfig() {
  if (!env.jwtSecret || env.jwtSecret.length < 16) {
    throw new InternalServerError("JWT_SECRET chưa được cấu hình hoặc quá ngắn.", "INVALID_JWT_CONFIG");
  }
}
