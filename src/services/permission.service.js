import prisma from "../loaders/dbLoader.js";
import { BadRequestError, ForbiddenError, NotFoundError } from "../helpers/handleError.js";
import { assertRequired, parsePagination } from "../utils/validators.js";

const permissionSelect = {
  permissionId: true,
  userId: true,
  deviceId: true,
  canViewCamera: true,
  canViewHistory: true,
  canUpdateEvent: true,
  createdAt: true,
  updatedAt: true,
  user: { select: { userId: true, fullName: true, phoneNumber: true, email: true } },
  device: { select: { deviceId: true, deviceType: true, displayName: true, gatewayId: true } },
};

async function canManageDevice(deviceId, user) {
  if (user.role === "admin") return;
  const device = await prisma.device.findUnique({
    where: { deviceId },
    select: { gateway: { select: { ownerUserId: true } } },
  });
  if (!device) throw new NotFoundError("Thiết bị không tồn tại.", "DEVICE_NOT_FOUND");
  if (device.gateway.ownerUserId !== user.userId) {
    throw new ForbiddenError("Bạn không có quyền phân quyền thiết bị này.");
  }
}

class PermissionService {
  async list(query, user) {
    const { skip, take, page, pageSize } = parsePagination(query);
    const where = {};
    if (query.userId) where.userId = query.userId;
    if (query.deviceId) where.deviceId = query.deviceId;

    if (user.role !== "admin") {
      where.device = { gateway: { ownerUserId: user.userId } };
    }

    const [items, total] = await prisma.$transaction([
      prisma.permission.findMany({ where, skip, take, orderBy: { createdAt: "desc" }, select: permissionSelect }),
      prisma.permission.count({ where }),
    ]);

    return { items, meta: { page, pageSize, total } };
  }

  async upsert(data, user) {
    assertRequired(data, ["userId", "deviceId"]);
    await canManageDevice(data.deviceId, user);

    const targetUser = await prisma.user.findUnique({ where: { userId: data.userId }, select: { isActive: true } });
    if (!targetUser || !targetUser.isActive) throw new BadRequestError("Người dùng không tồn tại hoặc đã bị vô hiệu hóa.", "USER_NOT_FOUND");

    return prisma.permission.upsert({
      where: { userId_deviceId: { userId: data.userId, deviceId: data.deviceId } },
      create: {
        userId: data.userId,
        deviceId: data.deviceId,
        canViewCamera: Boolean(data.canViewCamera),
        canViewHistory: Boolean(data.canViewHistory),
        canUpdateEvent: Boolean(data.canUpdateEvent),
      },
      update: {
        canViewCamera: data.canViewCamera,
        canViewHistory: data.canViewHistory,
        canUpdateEvent: data.canUpdateEvent,
      },
      select: permissionSelect,
    });
  }

  async update(permissionId, data, user) {
    const permission = await prisma.permission.findUnique({ where: { permissionId }, select: { deviceId: true } });
    if (!permission) throw new NotFoundError("Phân quyền không tồn tại.", "PERMISSION_NOT_FOUND");
    await canManageDevice(permission.deviceId, user);

    return prisma.permission.update({
      where: { permissionId },
      data: {
        canViewCamera: data.canViewCamera,
        canViewHistory: data.canViewHistory,
        canUpdateEvent: data.canUpdateEvent,
      },
      select: permissionSelect,
    });
  }

  async remove(permissionId, user) {
    const permission = await prisma.permission.findUnique({ where: { permissionId }, select: { deviceId: true } });
    if (!permission) throw new NotFoundError("Phân quyền không tồn tại.", "PERMISSION_NOT_FOUND");
    await canManageDevice(permission.deviceId, user);
    await prisma.permission.delete({ where: { permissionId } });
    return null;
  }
}

export default new PermissionService();
