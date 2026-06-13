import crypto from "node:crypto";
import { env } from "../config/env.js";
import { UnAuthorizedError } from "../helpers/handleError.js";

function safeEqual(a, b) {
  const left = Buffer.from(String(a || ""));
  const right = Buffer.from(String(b || ""));
  if (left.length !== right.length) return false;
  return crypto.timingSafeEqual(left, right);
}

export function verifyEdgeSecret(req, res, next) {
  const configuredSecret = env.edgeSecret;

  if (!configuredSecret) {
    return next(
      new UnAuthorizedError(
        "EDGE_SECRET chưa được cấu hình trên backend.",
        "EDGE_SECRET_NOT_CONFIGURED",
      ),
    );
  }

  const requestSecret = req.header("X-Edge-Secret");
  if (!requestSecret || !safeEqual(requestSecret, configuredSecret)) {
    return next(
      new UnAuthorizedError(
        "Gateway/edge secret không hợp lệ.",
        "INVALID_EDGE_SECRET",
      ),
    );
  }

  return next();
}
