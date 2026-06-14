import "dotenv/config";

function parseNumber(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function parseBoolean(value, fallback = false) {
  if (value === undefined || value === null || value === "") return fallback;
  return ["true", "1", "yes", "on"].includes(String(value).toLowerCase());
}

export const env = Object.freeze({
  nodeEnv: process.env.NODE_ENV || "development",
  isProduction: process.env.NODE_ENV === "production",
  port: parseNumber(process.env.PORT, 3000),
  apiPrefix: process.env.API_PREFIX || "/api/v1",
  corsOrigin: process.env.CORS_ORIGIN || "*",
  trustProxy: parseBoolean(process.env.TRUST_PROXY, false),
  edgeSecret: process.env.EDGE_SECRET,

  databaseUrl: process.env.DATABASE_URL,

  saltRounds: parseNumber(process.env.SALT_ROUNDS, 10),
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "1h",

  emailEnabled: parseBoolean(process.env.EMAIL_ENABLED, false),
  emailFromName: process.env.EMAIL_FROM_NAME || "IoT Fall Detection",
  emailFromAddress: process.env.EMAIL_FROM_ADDRESS || "no-reply@iot-fall-detection.local",
  emailUser: process.env.EMAIL_USER,
  emailAppPassword: process.env.EMAIL_APP_PASSWORD,

  otpExpiresInMinutes: parseNumber(process.env.OTP_EXPIRES_IN_MINUTES, 5),
  otpResendIntervalSeconds: parseNumber(process.env.OTP_RESEND_INTERVAL_SECONDS, 60),

  mediaBaseUrl: process.env.MEDIA_BASE_URL || "/media",
  videoRetentionDays: parseNumber(process.env.VIDEO_RETENTION_DAYS, 3),
  logRetentionDays: parseNumber(process.env.LOG_RETENTION_DAYS, 30),

  streamSessionTtlSeconds: parseNumber(process.env.STREAM_SESSION_TTL_SECONDS, 300),
  stunUrl: process.env.STUN_URL || "stun:stun.l.google.com:19302",

  smsEnabled: parseBoolean(process.env.SMS_ENABLED, true),
  smsServiceUrl: process.env.SMS_SERVICE_URL || "http://localhost:8090",
});
