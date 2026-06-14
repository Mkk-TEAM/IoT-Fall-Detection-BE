import prisma from "../loaders/dbLoader.js";
import { DEVICE_STATUSES, DEVICE_TYPES } from "../common/enums.js";
import { BadRequestError, ConflictError, ForbiddenError, NotFoundError } from "../helpers/handleError.js";
import { assertEnum, assertRequired, parsePagination } from "../utils/validators.js";

const deviceSelect = {
  deviceId: true,
  deviceType: true,
  gatewayId: true,
  displayName: true,
  location: true,
  status: true,
  batteryLevel: true,
  lastHeartbeat: true,
  pingMs: true,
  disabledAt: true,
  createdAt: true,
  updatedAt: true,
};

async function ensureGatewayWritable(gatewayId, user) {
  const gateway = await prisma.gateway.findUnique({ where: { gatewayId }, select: { ownerUserId: true } });
  if (!gateway) throw new NotFoundError("Gateway không tồn tại.", "GATEWAY_NOT_FOUND");
  if (user.role !== "admin" && gateway.ownerUserId !== user.userId) throw new ForbiddenError("Bạn không có quyền quản lý thiết bị của gateway này.");
}

class DeviceService {
  async list(query, user) {
    const { skip, take, page, pageSize } = parsePagination(query);
    const where = {};

    if (query.type || query.deviceType) {
      const type = query.type || query.deviceType;
      assertEnum(type, DEVICE_TYPES, "deviceType");
      where.deviceType = type;
    }
    if (query.status) {
      assertEnum(query.status, DEVICE_STATUSES, "status");
      where.status = query.status;
    }
    if (query.gatewayId) where.gatewayId = query.gatewayId;

    if (user.role !== "admin") {
      where.OR = [
        { gateway: { ownerUserId: user.userId } },
        { permissions: { some: { userId: user.userId } } },
      ];
    }

    const [items, total] = await prisma.$transaction([
      prisma.device.findMany({ where, skip, take, orderBy: { createdAt: "desc" }, select: deviceSelect }),
      prisma.device.count({ where }),
    ]);

    return { items, meta: { page, pageSize, total } };
  }

  async get(deviceId, user) {
    const device = await prisma.device.findUnique({
      where: { deviceId },
      select: { ...deviceSelect, gateway: { select: { ownerUserId: true } } },
    });
    if (!device) throw new NotFoundError("Thiết bị không tồn tại.", "DEVICE_NOT_FOUND");

    if (user.role !== "admin" && device.gateway.ownerUserId !== user.userId) {
      const permission = await prisma.permission.findUnique({ where: { userId_deviceId: { userId: user.userId, deviceId } } });
      if (!permission) throw new ForbiddenError("Bạn không có quyền xem thiết bị này.");
    }

    return device;
  }

  async create(data, user) {
    assertRequired(data, ["deviceId", "deviceType", "gatewayId"]);
    assertEnum(data.deviceType, DEVICE_TYPES, "deviceType");
    if (data.status) assertEnum(data.status, DEVICE_STATUSES, "status");

    await ensureGatewayWritable(data.gatewayId, user);

    const existed = await prisma.device.findUnique({ where: { deviceId: data.deviceId } });
    if (existed) throw new ConflictError("Device ID đã tồn tại.", "DEVICE_ALREADY_EXISTS");

    return prisma.device.create({
      data: {
        deviceId: data.deviceId,
        deviceType: data.deviceType,
        gatewayId: data.gatewayId,
        displayName: data.displayName,
        location: data.location,
        status: data.status || "REGISTERED",
        batteryLevel: data.batteryLevel,
        lastHeartbeat: data.lastHeartbeat ? new Date(data.lastHeartbeat) : undefined,
      },
      select: deviceSelect,
    });
  }

  async update(deviceId, data, user) {
    const device = await prisma.device.findUnique({ where: { deviceId }, select: { gatewayId: true, status: true } });
    if (!device) throw new NotFoundError("Thiết bị không tồn tại.", "DEVICE_NOT_FOUND");

    if (data.gatewayId && data.gatewayId !== device.gatewayId) {
      await ensureGatewayWritable(data.gatewayId, user);
    } else {
      await ensureGatewayWritable(device.gatewayId, user);
    }

    if (data.deviceType) assertEnum(data.deviceType, DEVICE_TYPES, "deviceType");
    if (data.status) assertEnum(data.status, DEVICE_STATUSES, "status");

    return prisma.device.update({
      where: { deviceId },
      data: {
        deviceType: data.deviceType,
        gatewayId: data.gatewayId,
        displayName: data.displayName,
        location: data.location,
        status: data.status,
        batteryLevel: data.batteryLevel,
        lastHeartbeat: data.lastHeartbeat ? new Date(data.lastHeartbeat) : undefined,
      },
      select: deviceSelect,
    });
  }

  async updateHeartbeat(deviceId, data = {}) {
    const device = await prisma.device.findUnique({ where: { deviceId } });
    if (!device) throw new NotFoundError("Thiết bị không tồn tại.", "DEVICE_NOT_FOUND");

    const pingMs = data.metrics?.jitterMeanMs != null
      ? Number(data.metrics.jitterMeanMs)
      : undefined;

    return prisma.device.update({
      where: { deviceId },
      data: {
        status: data.status || "ONLINE",
        batteryLevel: data.batteryLevel,
        lastHeartbeat: new Date(),
        ...(pingMs !== undefined && { pingMs }),
      },
      select: deviceSelect,
    });
  }

  async disable(deviceId, user) {
    const device = await prisma.device.findUnique({ where: { deviceId }, select: { gatewayId: true } });
    if (!device) throw new NotFoundError("Thiết bị không tồn tại.", "DEVICE_NOT_FOUND");
    await ensureGatewayWritable(device.gatewayId, user);

    return prisma.device.update({
      where: { deviceId },
      data: { status: "DISABLED", disabledAt: new Date() },
      select: deviceSelect,
    });
  }

  async remove(deviceId, user) {
    const device = await prisma.device.findUnique({ where: { deviceId }, select: { gatewayId: true, status: true } });
    if (!device) throw new NotFoundError("Thiết bị không tồn tại.", "DEVICE_NOT_FOUND");
    await ensureGatewayWritable(device.gatewayId, user);

    if (device.status === "ONLINE") {
      throw new BadRequestError("Không thể xóa thiết bị đang ONLINE. Hãy vô hiệu hóa hoặc ngắt kết nối trước.");
    }

    await prisma.device.delete({ where: { deviceId } });
    return null;
  }

  async statusList(query, user) {
    const result = await this.list({ ...query, pageSize: query.pageSize || 100 }, user);
    return result;
  }
}

export default new DeviceService();
