import { Prisma } from "@prisma/client";
import { handleErrorResponse } from "./handleResponse.js";
import { env } from "../config/env.js";

export class AppError extends Error {
  constructor(message, statusCode = 500, code = "INTERNAL_SERVER_ERROR", details = undefined) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    Error.captureStackTrace?.(this, this.constructor);
  }
}

export class BadRequestError extends AppError {
  constructor(message = "Bad request", code = "BAD_REQUEST", details = undefined) {
    super(message, 400, code, details);
  }
}

export class UnAuthorizedError extends AppError {
  constructor(message = "Unauthorized", code = "UNAUTHORIZED", details = undefined) {
    super(message, 401, code, details);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "Forbidden", code = "FORBIDDEN", details = undefined) {
    super(message, 403, code, details);
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Not found", code = "NOT_FOUND", details = undefined) {
    super(message, 404, code, details);
  }
}

export class ConflictError extends AppError {
  constructor(message = "Conflict", code = "CONFLICT", details = undefined) {
    super(message, 409, code, details);
  }
}

export class UnprocessableEntityError extends AppError {
  constructor(message = "Unprocessable entity", code = "UNPROCESSABLE_ENTITY", details = undefined) {
    super(message, 422, code, details);
  }
}

export class TooManyRequestsError extends AppError {
  constructor(message = "Too many requests", code = "TOO_MANY_REQUESTS", details = undefined) {
    super(message, 429, code, details);
  }
}

export class InternalServerError extends AppError {
  constructor(message = "Internal server error", code = "INTERNAL_SERVER_ERROR", details = undefined) {
    super(message, 500, code, details);
  }
}

export function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}

function prismaErrorToAppError(error) {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      return new ConflictError("Dữ liệu đã tồn tại trong hệ thống", "DUPLICATE_RESOURCE", error.meta);
    }

    if (error.code === "P2025") {
      return new NotFoundError("Không tìm thấy tài nguyên", "RESOURCE_NOT_FOUND", error.meta);
    }

    if (error.code === "P2003") {
      return new BadRequestError("Dữ liệu tham chiếu không hợp lệ", "FOREIGN_KEY_CONSTRAINT_FAILED", error.meta);
    }
  }

  return null;
}

export function errorHandler(err, req, res, next) {
  const mapped = prismaErrorToAppError(err);
  const error = mapped || err;

  const statusCode = error.statusCode || 500;
  const code = error.code || "INTERNAL_SERVER_ERROR";
  const message = statusCode >= 500 && env.isProduction ? "Internal server error" : error.message || "Internal server error";
  const details = env.isProduction ? undefined : error.details;

  if (statusCode >= 500) {
    console.error("[ERROR]", {
      method: req.method,
      url: req.originalUrl,
      message: error.message,
      stack: error.stack,
    });
  }

  return res.status(statusCode).json(handleErrorResponse(code, message, details));
}

export function notFoundHandler(req, res) {
  return res.status(404).json(handleErrorResponse("ENDPOINT_NOT_FOUND", "Endpoint not found"));
}
