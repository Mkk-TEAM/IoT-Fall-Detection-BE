import prisma from "../loaders/dbLoader.js";
import { EVENT_PRIORITIES, EVENT_STATUSES, EVENT_TYPES } from "../common/enums.js";
import { BadRequestError, ForbiddenError, NotFoundError } from "../helpers/handleError.js";
import { assertEnum, assertRequired, parseDate, parsePagination } from "../utils/validators.js";
import { canAccessDevice } from "../middleware/auth.middleware.js";
import { sendFallSms } from "../config/smsService.js";

const eventSelect = {
  eventId: true,
  eventType: true,
  timestamp: true,
  priority: true,
  status: true,
  confidence: true,
  message: true,
  rawRef: true,
  snapshotUrl: true,
  relatedVideoUrl: true,
  deviceId: true,
  gatewayId: true,
  createdAt: true,
  updatedAt: true,
  device: { select: { deviceId: true, deviceType: true, displayName: true, gatewayId: true } },
};

function defaultPriority(eventType) {
  if (eventType === "FALL") return "CRITICAL";
  if (eventType === "INACTIVITY") return "HIGH";
  if (eventType === "DISCONNECT") return "HIGH";
  return "MEDIUM";
}

class EventService {
  async create(data) {
    assertRequired(data, ["eventType"]);
    assertEnum(data.eventType, EVENT_TYPES, "eventType");
    if (data.priority) assertEnum(data.priority, EVENT_PRIORITIES, "priority");
    if (data.status) assertEnum(data.status, EVENT_STATUSES, "status");

    if (data.deviceId) {
      const device = await prisma.device.findUnique({ where: { deviceId: data.deviceId }, select: { gatewayId: true } });
      if (!device) throw new NotFoundError("Thiết bị không tồn tại.", "DEVICE_NOT_FOUND");
      data.gatewayId = data.gatewayId || device.gatewayId;
    }

    if (data.gatewayId) {
      const gateway = await prisma.gateway.findUnique({ where: { gatewayId: data.gatewayId }, select: { gatewayId: true } });
      if (!gateway) throw new NotFoundError("Gateway không tồn tại.", "GATEWAY_NOT_FOUND");
    }

    const event = await prisma.event.create({
      data: {
        eventType: data.eventType,
        timestamp: data.timestamp ? new Date(data.timestamp) : undefined,
        priority: data.priority || defaultPriority(data.eventType),
        status: data.status || "UNREAD",
        confidence: data.confidence !== undefined ? Number(data.confidence) : undefined,
        message: data.message || `Phát hiện sự kiện ${data.eventType}`,
        rawRef: data.rawRef,
        snapshotUrl: data.snapshotUrl,
        relatedVideoUrl: data.relatedVideoUrl,
        deviceId: data.deviceId,
        gatewayId: data.gatewayId,
      },
      select: {
        ...eventSelect,
        device: {
          select: {
            deviceId: true, deviceType: true, displayName: true, gatewayId: true,
            gateway: { select: { ownerUserId: true } },
            permissions: { select: { user: { select: { phoneNumber: true } } } },
          },
        },
      },
    });

    // Fire-and-forget SMS for FALL events — collect all relevant phone numbers.
    if (data.eventType === "FALL") {
      const phones = new Set();

      // Gateway owner
      const ownerUserId = event.device?.gateway?.ownerUserId;
      if (ownerUserId) {
        const owner = await prisma.user.findUnique({
          where: { userId: ownerUserId },
          select: { phoneNumber: true },
        });
        if (owner?.phoneNumber) phones.add(owner.phoneNumber);
      }

      // Caregivers with canViewHistory permission
      for (const perm of event.device?.permissions ?? []) {
        if (perm.user?.phoneNumber) phones.add(perm.user.phoneNumber);
      }

      for (const phone of phones) {
        sendFallSms({ to: phone, event });
      }
    }

    return event;
  }

  async list(query, user) {
    const { skip, take, page, pageSize } = parsePagination(query);
    const where = {};

    if (query.deviceId) {
      const allowed = await canAccessDevice(user, query.deviceId, "canViewHistory");
      if (!allowed) throw new ForbiddenError("Bạn không có quyền xem lịch sử của thiết bị này.");
      where.deviceId = query.deviceId;
    } else if (user.role !== "admin") {
      where.OR = [
        { device: { gateway: { ownerUserId: user.userId } } },
        { device: { permissions: { some: { userId: user.userId, canViewHistory: true } } } },
      ];
    }

    if (query.gatewayId) where.gatewayId = query.gatewayId;
    if (query.eventType) {
      assertEnum(query.eventType, EVENT_TYPES, "eventType");
      where.eventType = query.eventType;
    }
    if (query.priority) {
      assertEnum(query.priority, EVENT_PRIORITIES, "priority");
      where.priority = query.priority;
    }
    if (query.status) {
      assertEnum(query.status, EVENT_STATUSES, "status");
      where.status = query.status;
    }

    const from = parseDate(query.from, "from");
    const to = parseDate(query.to, "to");
    if (from || to) {
      where.timestamp = {};
      if (from) where.timestamp.gte = from;
      if (to) where.timestamp.lte = to;
    }

    const [items, total] = await prisma.$transaction([
      prisma.event.findMany({ where, skip, take, orderBy: { timestamp: "desc" }, select: eventSelect }),
      prisma.event.count({ where }),
    ]);

    return { items, meta: { page, pageSize, total } };
  }

  async get(eventId, user) {
    const event = await prisma.event.findUnique({ where: { eventId }, select: eventSelect });
    if (!event) throw new NotFoundError("Sự kiện không tồn tại.", "EVENT_NOT_FOUND");

    if (event.deviceId) {
      const allowed = await canAccessDevice(user, event.deviceId, "canViewHistory");
      if (!allowed) throw new ForbiddenError("Bạn không có quyền xem sự kiện này.");
    } else if (user.role !== "admin") {
      throw new ForbiddenError("Bạn không có quyền xem sự kiện này.");
    }

    return event;
  }

  async updateStatus(eventId, status, user) {
    assertEnum(status, EVENT_STATUSES, "status");
    const event = await prisma.event.findUnique({ where: { eventId }, select: { deviceId: true } });
    if (!event) throw new NotFoundError("Sự kiện không tồn tại.", "EVENT_NOT_FOUND");

    if (event.deviceId) {
      const allowed = await canAccessDevice(user, event.deviceId, "canUpdateEvent");
      if (!allowed) throw new ForbiddenError("Bạn không có quyền cập nhật sự kiện này.");
    } else if (user.role !== "admin") {
      throw new ForbiddenError("Bạn không có quyền cập nhật sự kiện này.");
    }

    return prisma.event.update({ where: { eventId }, data: { status }, select: eventSelect });
  }
}

export default new EventService();
