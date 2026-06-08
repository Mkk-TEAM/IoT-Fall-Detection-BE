import prisma from "../loaders/dbLoader.js";
import { BadRequestError, NotFoundError } from "../helpers/handleError.js";
import { assertRequired, parseDate, parsePagination } from "../utils/validators.js";
import { canAccessDevice } from "../middleware/auth.middleware.js";

const select = {
  logId: true,
  deviceId: true,
  recordedAt: true,
  movementLevel: true,
  accelX: true,
  accelY: true,
  accelZ: true,
  gyroX: true,
  gyroY: true,
  gyroZ: true,
  tiltAngle: true,
  batteryLevel: true,
  rawPayload: true,
};

function normalizeTelemetry(data) {
  const accel = data.accel || {};
  const gyro = data.gyro || {};
  return {
    deviceId: data.deviceId,
    recordedAt: data.recordedAt || data.timestamp ? new Date(data.recordedAt || data.timestamp) : undefined,
    movementLevel: data.movementLevel !== undefined ? Number(data.movementLevel) : undefined,
    accelX: data.accelX !== undefined ? Number(data.accelX) : accel.x !== undefined ? Number(accel.x) : undefined,
    accelY: data.accelY !== undefined ? Number(data.accelY) : accel.y !== undefined ? Number(accel.y) : undefined,
    accelZ: data.accelZ !== undefined ? Number(data.accelZ) : accel.z !== undefined ? Number(accel.z) : undefined,
    gyroX: data.gyroX !== undefined ? Number(data.gyroX) : gyro.x !== undefined ? Number(gyro.x) : undefined,
    gyroY: data.gyroY !== undefined ? Number(data.gyroY) : gyro.y !== undefined ? Number(gyro.y) : undefined,
    gyroZ: data.gyroZ !== undefined ? Number(data.gyroZ) : gyro.z !== undefined ? Number(gyro.z) : undefined,
    tiltAngle: data.tiltAngle !== undefined ? Number(data.tiltAngle) : undefined,
    batteryLevel: data.batteryLevel !== undefined ? Number(data.batteryLevel) : undefined,
    rawPayload: data,
  };
}

class HealthLogService {
  async create(data) {
    assertRequired(data, ["deviceId"]);
    const device = await prisma.device.findUnique({ where: { deviceId: data.deviceId }, select: { deviceId: true } });
    if (!device) throw new NotFoundError("Thiết bị không tồn tại.", "DEVICE_NOT_FOUND");

    const normalized = normalizeTelemetry(data);
    if (normalized.recordedAt && Number.isNaN(normalized.recordedAt.getTime())) {
      throw new BadRequestError("timestamp/recordedAt không hợp lệ.", "VALIDATION_ERROR");
    }

    const [log] = await prisma.$transaction([
      prisma.healthLog.create({ data: normalized, select }),
      prisma.device.update({
        where: { deviceId: data.deviceId },
        data: {
          lastHeartbeat: new Date(),
          status: "ONLINE",
          batteryLevel: normalized.batteryLevel,
        },
      }),
    ]);

    return log;
  }

  async list(query, user) {
    const { skip, take, page, pageSize } = parsePagination(query);
    const where = {};

    if (query.deviceId) {
      const allowed = await canAccessDevice(user, query.deviceId, "canViewHistory");
      if (!allowed) throw new BadRequestError("Bạn không có quyền xem log của thiết bị này.", "FORBIDDEN");
      where.deviceId = query.deviceId;
    } else if (user.role !== "admin") {
      where.device = {
        OR: [
          { gateway: { ownerUserId: user.userId } },
          { permissions: { some: { userId: user.userId, canViewHistory: true } } },
        ],
      };
    }

    const from = parseDate(query.from, "from");
    const to = parseDate(query.to, "to");
    if (from || to) {
      where.recordedAt = {};
      if (from) where.recordedAt.gte = from;
      if (to) where.recordedAt.lte = to;
    }

    const [items, total] = await prisma.$transaction([
      prisma.healthLog.findMany({ where, skip, take, orderBy: { recordedAt: "desc" }, select }),
      prisma.healthLog.count({ where }),
    ]);

    return { items, meta: { page, pageSize, total } };
  }
}

export default new HealthLogService();
