import jwt from "jsonwebtoken";
import prisma from "../loaders/dbLoader.js";
import { env } from "../config/env.js";
import { USER_ROLES } from "../common/enums.js";
import { ForbiddenError, NotFoundError, UnAuthorizedError } from "../helpers/handleError.js";

export async function verifyToken(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new UnAuthorizedError("Thiếu hoặc sai định dạng token.");
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, env.jwtSecret);

    const user = await prisma.user.findUnique({
      where: { userId: decoded.userId },
      select: {
        userId: true,
        fullName: true,
        phoneNumber: true,
        email: true,
        role: true,
        isActive: true,
      },
    });

    if (!user || !user.isActive) {
      throw new UnAuthorizedError("Tài khoản không tồn tại hoặc đã bị vô hiệu hóa.");
    }

    req.user = user;
    return next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return next(new UnAuthorizedError("Token đã hết hạn."));
    }
    if (error.name === "JsonWebTokenError") {
      return next(new UnAuthorizedError("Token không hợp lệ."));
    }
    return next(error);
  }
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return next(new UnAuthorizedError("Vui lòng đăng nhập."));
    }

    if (!roles.includes(req.user.role)) {
      return next(new ForbiddenError("Bạn không có quyền thực hiện thao tác này."));
    }

    return next();
  };
}

export async function canAccessDevice(user, deviceId, permissionName = "canViewHistory") {
  if (!user) return false;
  if (user.role === USER_ROLES.ADMIN) return true;

  const device = await prisma.device.findUnique({
    where: { deviceId },
    select: {
      gateway: {
        select: { ownerUserId: true },
      },
    },
  });

  if (!device) {
    throw new NotFoundError("Thiết bị không tồn tại.", "DEVICE_NOT_FOUND");
  }

  if (device.gateway?.ownerUserId === user.userId) {
    return true;
  }

  const permission = await prisma.permission.findUnique({
    where: {
      userId_deviceId: {
        userId: user.userId,
        deviceId,
      },
    },
  });

  if (!permission) return false;
  return Boolean(permission[permissionName]);
}

export function requireDeviceAccess({ paramName = "deviceId", permission = "canViewHistory" } = {}) {
  return async (req, res, next) => {
    try {
      const deviceId = req.params[paramName] || req.body?.deviceId || req.query?.deviceId;
      if (!deviceId) {
        throw new ForbiddenError("Thiếu deviceId để kiểm tra quyền truy cập.");
      }

      const allowed = await canAccessDevice(req.user, deviceId, permission);
      if (!allowed) {
        throw new ForbiddenError("Bạn không có quyền truy cập thiết bị này.");
      }

      return next();
    } catch (error) {
      return next(error);
    }
  };
}

export function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) return next();
  return verifyToken(req, res, next);
}
