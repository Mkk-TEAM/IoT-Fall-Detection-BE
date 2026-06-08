import jwt from "jsonwebtoken";
import prisma from "../loaders/dbLoader.js";
import { ForbiddenError, UnAuthorizedError } from "../helpers/handleError.js";
import { getJwtSecret } from "../helpers/security.js";

export function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return next(new UnAuthorizedError("Thiếu hoặc sai định dạng token. Vui lòng gửi Authorization: Bearer <token>."));
  }

  const token = authHeader.slice("Bearer ".length).trim();

  try {
    const decoded = jwt.verify(token, getJwtSecret());
    req.user = decoded;
    return next();
  } catch (error) {
    return next(new UnAuthorizedError("Token không hợp lệ hoặc đã hết hạn"));
  }
}

export function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return next(new UnAuthorizedError("Bạn cần đăng nhập trước khi thực hiện thao tác này"));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(new ForbiddenError("Tài khoản không đủ quyền truy cập tài nguyên này"));
    }

    return next();
  };
}

export function requireDevicePermission(permissionName = "canViewHistory") {
  return async (req, res, next) => {
    try {
      const user = req.user;
      const deviceId = req.params.deviceId || req.params.deviceID || req.body.deviceId || req.body.deviceID;

      if (!user) {
        throw new UnAuthorizedError("Bạn cần đăng nhập trước khi thực hiện thao tác này");
      }

      if (user.role === "admin") {
        return next();
      }

      if (!deviceId) {
        throw new ForbiddenError("Không xác định được thiết bị cần kiểm tra quyền truy cập");
      }

      const permission = await prisma.permission.findUnique({
        where: {
          userId_deviceId: {
            userId: user.userId,
            deviceId,
          },
        },
      });

      if (!permission || permission[permissionName] !== true) {
        throw new ForbiddenError("Bạn không có quyền truy cập thiết bị này");
      }

      return next();
    } catch (error) {
      return next(error);
    }
  };
}

export default verifyToken;
