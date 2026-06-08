import NotificationService from "../services/notification.service.js";
import { asyncHandler } from "../helpers/handleError.js";
import { handleSuccessResponse } from "../helpers/handleResponse.js";

class NotificationController {
  listLogs = asyncHandler(async (req, res) => {
    const { items, meta } = await NotificationService.listLogs(req.query);
    res.status(200).json(handleSuccessResponse(items, "Lấy lịch sử gửi cảnh báo thành công.", meta));
  });

  sendAlert = asyncHandler(async (req, res) => {
    const data = await NotificationService.sendEventNotification(req.params.eventId, req.body);
    res.status(200).json(handleSuccessResponse(data, "Đã xử lý gửi cảnh báo."));
  });
}

export default new NotificationController();
