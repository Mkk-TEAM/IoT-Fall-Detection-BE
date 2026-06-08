import { handleErrorResponse } from "./handleResponse.js";

export class AppError extends Error {
  constructor(
    message = "Internal Server Error",
    statusCode = 500,
    errorCode = "INTERNAL_SERVER_ERROR",
    details = null,
  ) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = statusCode;
    this.errorCode = errorCode;
    this.details = details;
    Error.captureStackTrace?.(this, this.constructor);
  }
}

export class BadRequestError extends AppError {
  constructor(message = "Dữ liệu đầu vào không hợp lệ", details = null) {
    super(message, 400, "BAD_REQUEST", details);
  }
}

export class UnAuthorizedError extends AppError {
  constructor(message = "Bạn chưa được xác thực", details = null) {
    super(message, 401, "UNAUTHORIZED", details);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "Bạn không có quyền thực hiện thao tác này", details = null) {
    super(message, 403, "FORBIDDEN", details);
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Không tìm thấy tài nguyên", details = null) {
    super(message, 404, "NOT_FOUND", details);
  }
}

export class ConflictError extends AppError {
  constructor(message = "Dữ liệu đã tồn tại", details = null) {
    super(message, 409, "CONFLICT", details);
  }
}

export class TooManyRequestsError extends AppError {
  constructor(message = "Bạn thao tác quá nhanh", details = null) {
    super(message, 429, "TOO_MANY_REQUESTS", details);
  }
}

export class InternalServerError extends AppError {
  constructor(message = "Lỗi hệ thống", details = null) {
    super(message, 500, "INTERNAL_SERVER_ERROR", details);
  }
}

function mapPrismaError(err) {
  if (!err?.code) return null;

  switch (err.code) {
    case "P2002":
      return new ConflictError("Dữ liệu đã tồn tại trong hệ thống", {
        target: err.meta?.target,
      });
    case "P2025":
      return new NotFoundError("Không tìm thấy dữ liệu cần thao tác");
    case "P2003":
      return new BadRequestError("Dữ liệu liên kết không hợp lệ", {
        fieldName: err.meta?.field_name,
      });
    default:
      return null;
  }
}

export const notFoundHandler = (req, res, next) => {
  next(new NotFoundError(`Endpoint không tồn tại: ${req.method} ${req.originalUrl}`));
};

export const errorHandler = (err, req, res, next) => {
  const mappedPrismaError = mapPrismaError(err);
  const normalizedError = mappedPrismaError || err;

  const statusCode = Number.isInteger(normalizedError.statusCode)
    ? normalizedError.statusCode
    : Number.isInteger(normalizedError.code)
      ? normalizedError.code
      : 500;

  const safeStatusCode = statusCode >= 400 && statusCode <= 599 ? statusCode : 500;

  const message = safeStatusCode === 500 && process.env.NODE_ENV === "production"
    ? "Lỗi hệ thống"
    : normalizedError.message || "Internal Server Error";

  const errorCode = normalizedError.errorCode || (safeStatusCode === 500
    ? "INTERNAL_SERVER_ERROR"
    : "REQUEST_ERROR");

  if (safeStatusCode >= 500) {
    console.error("[ERROR]", {
      method: req.method,
      url: req.originalUrl,
      message: normalizedError.message,
      stack: normalizedError.stack,
    });
  }

  const response = handleErrorResponse(
    safeStatusCode,
    message,
    errorCode,
    normalizedError.details ?? null,
  );

  return res.status(safeStatusCode).json(response);
};
