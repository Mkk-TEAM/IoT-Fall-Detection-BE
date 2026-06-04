import { BadRequestError } from "../helpers/handleError.js";

const rateLimitStore = new Map();

function getClientIp(req) {
    const forwarded = req.headers["x-forwarded-for"];
    if (typeof forwarded === "string" && forwarded.length > 0) {
        return forwarded.split(",")[0].trim();
    }

    return req.ip || req.socket?.remoteAddress || "unknown";
}

export function createRateLimit({ windowMs, maxRequests }) {
    return (req, res, next) => {
        const key = `${getClientIp(req)}:${req.path}`;
        const now = Date.now();
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
            const retryAfterSeconds = Math.ceil(
                (current.expiresAt - now) / 1000,
            );
            throw new BadRequestError(
                `Bạn thao tác quá nhanh. Vui lòng thử lại sau ${retryAfterSeconds} giây.`,
            );
        }

        return next();
    };
}
