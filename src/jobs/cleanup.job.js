import prisma from "../loaders/dbLoader.js";
import { env } from "../config/env.js";

export async function cleanupExpiredOtpLogs() {
  return prisma.otpLog.deleteMany({
    where: {
      expiresAt: { lt: new Date(Date.now() - 24 * 60 * 60 * 1000) },
    },
  });
}

export async function cleanupOldHealthLogs() {
  const cutoff = new Date(Date.now() - env.logRetentionDays * 24 * 60 * 60 * 1000);
  return prisma.healthLog.deleteMany({ where: { recordedAt: { lt: cutoff } } });
}
