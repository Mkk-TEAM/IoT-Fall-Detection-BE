import { TooManyRequestsError } from "../helpers/handleError.js";

const rateLimitStore = new Map();

function getClientIp(req) {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string" && forwarded.length > 0) {
    return forwarded.split(",")[0].trim();
  }

  return req.ip || req.socket?.remoteAddress || "unknown";
}

function cleanupExpiredKeys(now) {
  for (const [key, value] of rateLimitStore.entries()) {
    if (now > value.expiresAt) {
      rateLimitStore.delete(key);
    }
  }
}

export function createRateLimit({ windowMs = 60_000, maxRequests = 30, keyPrefix = "default" } = {}) {
  return (req, res, next) => {
    const now = Date.now();
    cleanupExpiredKeys(now);

    const key = `${keyPrefix}:${getClientIp(req)}:${req.method}:${req.path}`;
    const current = rateLimitStore.get(key);

    if (!current || now > current.expiresAt) {
      rateLimitStore.set(key, {
        count: 1,
        expiresAt: now + windowMs,
      });
      return next();
    }

    current.count += 1;

    if (current.count > maxRequests) {
      const retryAfterSeconds = Math.ceil((current.expiresAt - now) / 1000);
      res.set("Retry-After", String(retryAfterSeconds));
      return next(
        new TooManyRequestsError(
          `Bạn thao tác quá nhanh. Vui lòng thử lại sau ${retryAfterSeconds} giây.`,
          { retryAfterSeconds },
        ),
      );
    }

    return next();
  };
}
