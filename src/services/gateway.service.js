import prisma from "../loaders/dbLoader.js";
import { GATEWAY_STATUSES } from "../common/enums.js";
import { BadRequestError, ConflictError, ForbiddenError, NotFoundError } from "../helpers/handleError.js";
import { assertEnum, assertRequired, parsePagination } from "../utils/validators.js";

const gatewaySelect = {
  gatewayId: true,
  displayName: true,
  status: true,
  ipAddress: true,
  lastHeartbeat: true,
  ownerUserId: true,
  createdAt: true,
  updatedAt: true,
};

class GatewayService {
  async list(query, user) {
    const { skip, take, page, pageSize } = parsePagination(query);
    const where = {};

    if (query.status) {
      assertEnum(query.status, GATEWAY_STATUSES, "status");
      where.status = query.status;
    }

    if (user.role !== "admin") {
      where.OR = [
        { ownerUserId: user.userId },
        { devices: { some: { permissions: { some: { userId: user.userId } } } } },
      ];
    }

    const [items, total] = await prisma.$transaction([
      prisma.gateway.findMany({ where, skip, take, orderBy: { createdAt: "desc" }, select: gatewaySelect }),
      prisma.gateway.count({ where }),
    ]);

    return { items, meta: { page, pageSize, total } };
  }

  async get(gatewayId, user) {
    const gateway = await prisma.gateway.findUnique({
      where: { gatewayId },
      select: { ...gatewaySelect, devices: true },
    });

    if (!gateway) throw new NotFoundError("Gateway không tồn tại.", "GATEWAY_NOT_FOUND");
    if (user.role !== "admin" && gateway.ownerUserId !== user.userId) {
      const permissionCount = await prisma.permission.count({
        where: { userId: user.userId, device: { gatewayId } },
      });
      if (permissionCount === 0) throw new ForbiddenError("Bạn không có quyền xem gateway này.");
    }

    return gateway;
  }

  async create(data, user) {
    assertRequired(data, ["gatewayId"]);
    if (data.status) assertEnum(data.status, GATEWAY_STATUSES, "status");

    const existed = await prisma.gateway.findUnique({ where: { gatewayId: data.gatewayId } });
    if (existed) throw new ConflictError("Gateway ID đã tồn tại.", "GATEWAY_ALREADY_EXISTS");

    return prisma.gateway.create({
      data: {
        gatewayId: data.gatewayId,
        displayName: data.displayName,
        ipAddress: data.ipAddress,
        status: data.status || "UNKNOWN",
        lastHeartbeat: data.lastHeartbeat ? new Date(data.lastHeartbeat) : undefined,
        ownerUserId: data.ownerUserId || user.userId,
      },
      select: gatewaySelect,
    });
  }

  async update(gatewayId, data, user) {
    const gateway = await prisma.gateway.findUnique({ where: { gatewayId } });
    if (!gateway) throw new NotFoundError("Gateway không tồn tại.", "GATEWAY_NOT_FOUND");
    if (user.role !== "admin" && gateway.ownerUserId !== user.userId) throw new ForbiddenError("Bạn không có quyền cập nhật gateway này.");

    if (data.status) assertEnum(data.status, GATEWAY_STATUSES, "status");

    return prisma.gateway.update({
      where: { gatewayId },
      data: {
        displayName: data.displayName,
        ipAddress: data.ipAddress,
        status: data.status,
        ownerUserId: user.role === "admin" ? data.ownerUserId : undefined,
      },
      select: gatewaySelect,
    });
  }

  async heartbeat(gatewayId, data = {}) {
    const gateway = await prisma.gateway.findUnique({ where: { gatewayId } });
    if (!gateway) throw new NotFoundError("Gateway không tồn tại.", "GATEWAY_NOT_FOUND");

    return prisma.gateway.update({
      where: { gatewayId },
      data: {
        status: data.status || "ONLINE",
        ipAddress: data.ipAddress,
        lastHeartbeat: new Date(),
      },
      select: gatewaySelect,
    });
  }

  async remove(gatewayId, user) {
    const gateway = await prisma.gateway.findUnique({
      where: { gatewayId },
      include: { devices: { select: { deviceId: true, status: true } } },
    });

    if (!gateway) throw new NotFoundError("Gateway không tồn tại.", "GATEWAY_NOT_FOUND");
    if (user.role !== "admin" && gateway.ownerUserId !== user.userId) throw new ForbiddenError("Bạn không có quyền xóa gateway này.");
    if (gateway.devices.length > 0) throw new BadRequestError("Không thể xóa gateway đang có thiết bị. Hãy xóa/vô hiệu hóa thiết bị trước.");

    await prisma.gateway.delete({ where: { gatewayId } });
    return null;
  }
}

export default new GatewayService();
