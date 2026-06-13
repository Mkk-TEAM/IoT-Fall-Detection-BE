import prisma from "../loaders/dbLoader.js";
import { DEVICE_STATUSES, USER_ROLES } from "../common/enums.js";
import { BadRequestError, ForbiddenError, NotFoundError } from "../helpers/handleError.js";
import { assertEnum, assertRequired, parseDate, parsePagination } from "../utils/validators.js";
import { canAccessDevice } from "../middleware/auth.middleware.js";

const statusLogSelect = {
  statusLogId: true,
  deviceId: true,
  gatewayId: true,
  source: true,
  status: true,
  statusMessage: true,
  batteryLevel: true,
  ipAddress: true,
  signalStrength: true,
  cameraOpened: true,
  streamStatus: true,
  frameRate: true,
  resolution: true,
  recordedAt: true,
  rawPayload: true,
  createdAt: true,
  device: {
    select: {
      deviceId: true,
      deviceType: true,
      displayName: true,
      gatewayId: true,
      status: true,
    },
  },
  gateway: {
    select: {
      gatewayId: true,
      displayName: true,
      status: true,
      ipAddress: true,
    },
  },
};

const GATEWAY_COMPATIBLE_STATUSES = new Set(["ONLINE", "OFFLINE", "UNKNOWN"]);

function optionalNumber(value, fieldName) {
  if (value === undefined || value === null || value === "") return undefined;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    throw new BadRequestError(`${fieldName} phải là số hợp lệ.`, "VALIDATION_ERROR");
  }
  return parsed;
}

function optionalInteger(value, fieldName) {
  const parsed = optionalNumber(value, fieldName);
  if (parsed === undefined) return undefined;
  if (!Number.isInteger(parsed)) {
    throw new BadRequestError(`${fieldName} phải là số nguyên.`, "VALIDATION_ERROR");
  }
  return parsed;
}

function normalizeStatusLogPayload(data) {
  assertRequired(data, ["status"]);
  assertEnum(data.status, DEVICE_STATUSES, "status");

  if (!data.deviceId && !data.gatewayId) {
    throw new BadRequestError(
      "Cần cung cấp ít nhất deviceId hoặc gatewayId để ghi log tình trạng.",
      "VALIDATION_ERROR",
    );
  }

  const recordedAt = parseDate(data.recordedAt || data.timestamp, "recordedAt/timestamp") || new Date();
  const batteryLevel = optionalInteger(data.batteryLevel, "batteryLevel");
  const frameRate = optionalInteger(data.frameRate ?? data.fps, "frameRate/fps");
  const signalStrength = optionalInteger(data.signalStrength ?? data.rssi, "signalStrength/rssi");

  if (batteryLevel !== undefined && (batteryLevel < 0 || batteryLevel > 100)) {
    throw new BadRequestError("batteryLevel phải nằm trong khoảng 0-100.", "VALIDATION_ERROR");
  }

  return {
    deviceId: data.deviceId || undefined,
    gatewayId: data.gatewayId || undefined,
    source: data.source || data.service || "EDGE",
    status: data.status,
    statusMessage: data.statusMessage || data.message || data.errorMessage || undefined,
    batteryLevel,
    ipAddress: data.ipAddress || data.edgeIp || undefined,
    signalStrength,
    cameraOpened: data.cameraOpened === undefined ? undefined : Boolean(data.cameraOpened),
    streamStatus: data.streamStatus || undefined,
    frameRate,
    resolution: data.resolution || (data.width && data.height ? `${data.width}x${data.height}` : undefined),
    recordedAt,
    rawPayload: data,
  };
}

async function canAccessGateway(user, gatewayId) {
  if (!user) return false;
  if (user.role === USER_ROLES.ADMIN) return true;

  const gateway = await prisma.gateway.findUnique({
    where: { gatewayId },
    select: {
      ownerUserId: true,
      devices: {
        select: {
          permissions: {
            where: { userId: user.userId },
            select: { canViewHistory: true, canViewCamera: true, canUpdateEvent: true },
            take: 1,
          },
        },
        take: 1,
      },
    },
  });

  if (!gateway) throw new NotFoundError("Gateway không tồn tại.", "GATEWAY_NOT_FOUND");
  if (gateway.ownerUserId === user.userId) return true;

  return gateway.devices.some((device) =>
    device.permissions.some((permission) =>
      permission.canViewHistory || permission.canViewCamera || permission.canUpdateEvent,
    ),
  );
}

function applyQueryFilters(query, where) {
  if (query.deviceId) where.deviceId = query.deviceId;
  if (query.gatewayId) where.gatewayId = query.gatewayId;
  if (query.source) where.source = query.source;
  if (query.status) {
    assertEnum(query.status, DEVICE_STATUSES, "status");
    where.status = query.status;
  }

  const from = parseDate(query.from, "from");
  const to = parseDate(query.to, "to");
  if (from || to) {
    where.recordedAt = {};
    if (from) where.recordedAt.gte = from;
    if (to) where.recordedAt.lte = to;
  }
}

class DeviceStatusLogService {
  async create(data) {
    const normalized = normalizeStatusLogPayload(data);
    let device = null;
    let gateway = null;

    if (normalized.deviceId) {
      device = await prisma.device.findUnique({
        where: { deviceId: normalized.deviceId },
        select: { deviceId: true, gatewayId: true },
      });
      if (!device) throw new NotFoundError("Thiết bị không tồn tại.", "DEVICE_NOT_FOUND");
      normalized.gatewayId = normalized.gatewayId || device.gatewayId;
    }

    if (normalized.gatewayId) {
      gateway = await prisma.gateway.findUnique({
        where: { gatewayId: normalized.gatewayId },
        select: { gatewayId: true },
      });
      if (!gateway) throw new NotFoundError("Gateway không tồn tại.", "GATEWAY_NOT_FOUND");
    }

    return prisma.$transaction(async (tx) => {
      const statusLog = await tx.deviceStatusLog.create({
        data: normalized,
        select: statusLogSelect,
      });

      if (normalized.deviceId) {
        await tx.device.update({
          where: { deviceId: normalized.deviceId },
          data: {
            status: normalized.status,
            lastHeartbeat: normalized.recordedAt,
            batteryLevel: normalized.batteryLevel,
          },
        });
      }

      if (normalized.gatewayId) {
        const gatewayUpdate = {
          lastHeartbeat: normalized.recordedAt,
          ipAddress: normalized.ipAddress,
        };
        if (GATEWAY_COMPATIBLE_STATUSES.has(normalized.status)) {
          gatewayUpdate.status = normalized.status;
        }
        await tx.gateway.update({
          where: { gatewayId: normalized.gatewayId },
          data: gatewayUpdate,
        });
      }

      return statusLog;
    });
  }

  async list(query, user) {
    const { skip, take, page, pageSize } = parsePagination(query);
    const where = {};
    applyQueryFilters(query, where);

    if (query.deviceId) {
      const allowed = await canAccessDevice(user, query.deviceId, "canViewHistory");
      if (!allowed) throw new ForbiddenError("Bạn không có quyền xem log tình trạng của thiết bị này.");
    } else if (query.gatewayId) {
      const allowed = await canAccessGateway(user, query.gatewayId);
      if (!allowed) throw new ForbiddenError("Bạn không có quyền xem log tình trạng của gateway này.");
    } else if (user.role !== USER_ROLES.ADMIN) {
      where.OR = [
        { gateway: { ownerUserId: user.userId } },
        { device: { gateway: { ownerUserId: user.userId } } },
        { device: { permissions: { some: { userId: user.userId, canViewHistory: true } } } },
      ];
    }

    const [items, total] = await prisma.$transaction([
      prisma.deviceStatusLog.findMany({
        where,
        skip,
        take,
        orderBy: { recordedAt: "desc" },
        select: statusLogSelect,
      }),
      prisma.deviceStatusLog.count({ where }),
    ]);

    return { items, meta: { page, pageSize, total } };
  }

  async latest(query, user) {
    const where = {};
    applyQueryFilters(query, where);

    if (query.deviceId) {
      const allowed = await canAccessDevice(user, query.deviceId, "canViewHistory");
      if (!allowed) throw new ForbiddenError("Bạn không có quyền xem log tình trạng của thiết bị này.");
    } else if (query.gatewayId) {
      const allowed = await canAccessGateway(user, query.gatewayId);
      if (!allowed) throw new ForbiddenError("Bạn không có quyền xem log tình trạng của gateway này.");
    } else if (user.role !== USER_ROLES.ADMIN) {
      where.OR = [
        { gateway: { ownerUserId: user.userId } },
        { device: { gateway: { ownerUserId: user.userId } } },
        { device: { permissions: { some: { userId: user.userId, canViewHistory: true } } } },
      ];
    }

    if (query.deviceId || query.gatewayId) {
      return prisma.deviceStatusLog.findFirst({
        where,
        orderBy: { recordedAt: "desc" },
        select: statusLogSelect,
      });
    }

    const recentLogs = await prisma.deviceStatusLog.findMany({
      where,
      take: 500,
      orderBy: { recordedAt: "desc" },
      select: statusLogSelect,
    });

    const seen = new Set();
    return recentLogs.filter((log) => {
      const key = log.deviceId ? `device:${log.deviceId}` : `gateway:${log.gatewayId}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }
}

export default new DeviceStatusLogService();
