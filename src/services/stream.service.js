import crypto from "node:crypto";
import prisma from "../loaders/dbLoader.js";
import { env } from "../config/env.js";
import { DEVICE_TYPES } from "../common/enums.js";
import { BadRequestError, ForbiddenError, NotFoundError } from "../helpers/handleError.js";

const sessions = new Map();

class StreamService {
  async getGatewayStream(gatewayId, user) {
    if (!gatewayId) {
      throw new BadRequestError("Vui lòng cung cấp gatewayId.", "VALIDATION_ERROR");
    }

    const gateway = await prisma.gateway.findUnique({
      where: { gatewayId },
      select: {
        gatewayId: true,
        displayName: true,
        ipAddress: true,
        status: true,
        ownerUserId: true,
        devices: {
          where: { deviceType: DEVICE_TYPES.CAMERA },
          select: {
            deviceId: true,
            displayName: true,
            status: true,
            location: true,
          },
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!gateway) {
      throw new NotFoundError("Gateway không tồn tại.", "GATEWAY_NOT_FOUND");
    }

    if (user.role !== "admin" && gateway.ownerUserId !== user.userId) {
      const permissionCount = await prisma.permission.count({
        where: {
          userId: user.userId,
          canViewCamera: true,
          device: {
            gatewayId,
            deviceType: DEVICE_TYPES.CAMERA,
          },
        },
      });

      if (permissionCount === 0) {
        throw new ForbiddenError("Bạn không có quyền xem stream của gateway này.");
      }
    }

    if (!gateway.ipAddress) {
      throw new BadRequestError(
        "Gateway chưa có địa chỉ IP để tạo stream URL.",
        "GATEWAY_IP_NOT_SET"
      );
    }

    const camera = gateway.devices[0];
    if (!camera) {
      throw new NotFoundError("Gateway chưa có camera nào.", "CAMERA_NOT_FOUND");
    }

    const baseUrl = `${env.edgeStreamScheme}://${gateway.ipAddress}:${env.edgeStreamPort}`;

    return {
      gatewayId: gateway.gatewayId,
      gatewayName: gateway.displayName,
      gatewayStatus: gateway.status,
      streamType: "MJPEG",
      device: camera,
      streamUrl: `${baseUrl}/stream.mjpg`,
      snapshotUrl: `${baseUrl}/snapshot.jpg`,
      statusUrl: `${baseUrl}/health`,
    };
  }

  async createSession({ deviceId }, user) {
    if (!deviceId) throw new BadRequestError("Vui lòng cung cấp deviceId.", "VALIDATION_ERROR");

    const device = await prisma.device.findUnique({ where: { deviceId } });
    if (!device) throw new NotFoundError("Camera không tồn tại.", "DEVICE_NOT_FOUND");
    if (device.deviceType !== DEVICE_TYPES.CAMERA) throw new BadRequestError("Thiết bị không phải camera.", "INVALID_DEVICE_TYPE");
    if (["OFFLINE", "DISABLED"].includes(device.status)) throw new BadRequestError("Camera đang không khả dụng.", "CAMERA_NOT_AVAILABLE");

    const sessionId = `stream_${crypto.randomUUID()}`;
    const expiresAt = new Date(Date.now() + env.streamSessionTtlSeconds * 1000);
    const session = {
      sessionId,
      deviceId,
      userId: user.userId,
      signalingChannel: `stream:${sessionId}`,
      iceServers: [{ urls: env.stunUrl }],
      expiresIn: env.streamSessionTtlSeconds,
      expiresAt,
      state: "CREATED",
    };

    sessions.set(sessionId, session);
    return session;
  }

  getSession(sessionId) {
    const session = sessions.get(sessionId);
    if (!session || session.expiresAt < new Date()) {
      sessions.delete(sessionId);
      throw new NotFoundError("Phiên stream không tồn tại hoặc đã hết hạn.", "STREAM_SESSION_NOT_FOUND");
    }
    return session;
  }

  closeSession(sessionId, user) {
    const session = this.getSession(sessionId);
    if (user.role !== "admin" && session.userId !== user.userId) {
      throw new BadRequestError("Bạn không có quyền kết thúc phiên stream này.", "FORBIDDEN");
    }
    sessions.delete(sessionId);
    return null;
  }
}

export default new StreamService();
