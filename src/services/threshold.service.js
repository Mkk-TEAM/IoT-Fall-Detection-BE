import prisma from "../loaders/dbLoader.js";
import { BadRequestError } from "../helpers/handleError.js";

const select = {
  thresholdConfigId: true,
  accelerationThreshold: true,
  inactivityThresholdSeconds: true,
  disconnectThresholdSeconds: true,
  updatedByUserId: true,
  createdAt: true,
  updatedAt: true,
};

function validateThresholds(data) {
  if (data.accelerationThreshold !== undefined && (Number(data.accelerationThreshold) <= 0 || Number(data.accelerationThreshold) > 50)) {
    throw new BadRequestError("Ngưỡng gia tốc không hợp lệ.", "VALIDATION_ERROR");
  }
  if (data.inactivityThresholdSeconds !== undefined && (Number(data.inactivityThresholdSeconds) < 10 || Number(data.inactivityThresholdSeconds) > 86400)) {
    throw new BadRequestError("Ngưỡng thời gian bất động không hợp lệ.", "VALIDATION_ERROR");
  }
  if (data.disconnectThresholdSeconds !== undefined && (Number(data.disconnectThresholdSeconds) < 5 || Number(data.disconnectThresholdSeconds) > 3600)) {
    throw new BadRequestError("Ngưỡng mất kết nối không hợp lệ.", "VALIDATION_ERROR");
  }
}

class ThresholdService {
  async getCurrent() {
    const current = await prisma.thresholdConfig.findFirst({ orderBy: { updatedAt: "desc" }, select });
    if (current) return current;

    return prisma.thresholdConfig.create({
      data: {
        accelerationThreshold: 2.8,
        inactivityThresholdSeconds: 420,
        disconnectThresholdSeconds: 30,
      },
      select,
    });
  }

  async update(data, user) {
    validateThresholds(data);
    const current = await this.getCurrent();

    return prisma.thresholdConfig.update({
      where: { thresholdConfigId: current.thresholdConfigId },
      data: {
        accelerationThreshold: data.accelerationThreshold,
        inactivityThresholdSeconds: data.inactivityThresholdSeconds,
        disconnectThresholdSeconds: data.disconnectThresholdSeconds,
        updatedByUserId: user.userId,
      },
      select,
    });
  }
}

export default new ThresholdService();
