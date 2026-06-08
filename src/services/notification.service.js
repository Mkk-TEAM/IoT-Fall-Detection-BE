import prisma from "../loaders/dbLoader.js";
import { ALERT_CHANNELS, DELIVERY_STATUSES } from "../common/enums.js";
import { sendAlertEmail } from "../config/emailService.js";
import { BadRequestError, NotFoundError } from "../helpers/handleError.js";
import { assertEnum, parseDate, parsePagination } from "../utils/validators.js";

const logSelect = {
  deliveryLogId: true,
  eventId: true,
  recipientUserId: true,
  recipient: true,
  channel: true,
  sentAt: true,
  deliveryStatus: true,
  providerMessageId: true,
  errorMessage: true,
  createdAt: true,
  updatedAt: true,
};

class NotificationService {
  async listLogs(query) {
    const { skip, take, page, pageSize } = parsePagination(query);
    const where = {};
    if (query.eventId) where.eventId = query.eventId;
    if (query.channel) {
      assertEnum(query.channel, ALERT_CHANNELS, "channel");
      where.channel = query.channel;
    }
    if (query.deliveryStatus) {
      assertEnum(query.deliveryStatus, DELIVERY_STATUSES, "deliveryStatus");
      where.deliveryStatus = query.deliveryStatus;
    }

    const from = parseDate(query.from, "from");
    const to = parseDate(query.to, "to");
    if (from || to) {
      where.createdAt = {};
      if (from) where.createdAt.gte = from;
      if (to) where.createdAt.lte = to;
    }

    const [items, total] = await prisma.$transaction([
      prisma.alertDeliveryLog.findMany({ where, skip, take, orderBy: { createdAt: "desc" }, select: logSelect }),
      prisma.alertDeliveryLog.count({ where }),
    ]);

    return { items, meta: { page, pageSize, total } };
  }

  async createLog(data) {
    return prisma.alertDeliveryLog.create({ data, select: logSelect });
  }

  async sendEventNotification(eventId, { channels = ["EMAIL"], recipients = [] }) {
    const event = await prisma.event.findUnique({
      where: { eventId },
      include: {
        device: {
          include: {
            gateway: true,
            permissions: { include: { user: true } },
          },
        },
      },
    });

    if (!event) throw new NotFoundError("Sự kiện không tồn tại.", "EVENT_NOT_FOUND");

    const targetRecipients = new Set(recipients.filter(Boolean));
    for (const permission of event.device?.permissions || []) {
      if (permission.user?.email) targetRecipients.add(permission.user.email);
    }

    if (targetRecipients.size === 0) {
      throw new BadRequestError("Không có người nhận hợp lệ để gửi cảnh báo.", "NO_VALID_RECIPIENT");
    }

    const results = [];
    for (const channel of channels) {
      assertEnum(channel, ALERT_CHANNELS, "channel");
      for (const recipient of targetRecipients) {
        const log = await prisma.alertDeliveryLog.create({
          data: {
            eventId,
            recipient,
            channel,
            deliveryStatus: "PENDING",
          },
          select: logSelect,
        });

        try {
          if (channel === "EMAIL") {
            const result = await sendAlertEmail({ to: recipient, event });
            const updated = await prisma.alertDeliveryLog.update({
              where: { deliveryLogId: log.deliveryLogId },
              data: {
                sentAt: new Date(),
                deliveryStatus: "SUCCESS",
                providerMessageId: result.messageId,
              },
              select: logSelect,
            });
            results.push(updated);
          } else {
            const updated = await prisma.alertDeliveryLog.update({
              where: { deliveryLogId: log.deliveryLogId },
              data: {
                sentAt: new Date(),
                deliveryStatus: "FAILED",
                errorMessage: `${channel} provider chưa được cấu hình trong MVP backend.`,
              },
              select: logSelect,
            });
            results.push(updated);
          }
        } catch (error) {
          const updated = await prisma.alertDeliveryLog.update({
            where: { deliveryLogId: log.deliveryLogId },
            data: {
              deliveryStatus: "FAILED",
              errorMessage: error.message,
            },
            select: logSelect,
          });
          results.push(updated);
        }
      }
    }

    return results;
  }
}

export default new NotificationService();
