import EventService from "../services/event.service.js";
import { asyncHandler } from "../helpers/handleError.js";
import { handleSuccessResponse } from "../helpers/handleResponse.js";

class EventController {
  create = asyncHandler(async (req, res) => {
    const data = await EventService.create(req.body);
    res.status(201).json(handleSuccessResponse(data, "Đã tạo sự kiện cảnh báo."));
  });

  list = asyncHandler(async (req, res) => {
    const { items, meta } = await EventService.list(req.query, req.user);
    res.status(200).json(handleSuccessResponse(items, "Lấy danh sách sự kiện thành công.", meta));
  });

  get = asyncHandler(async (req, res) => {
    const data = await EventService.get(req.params.eventId, req.user);
    res.status(200).json(handleSuccessResponse(data, "Lấy chi tiết sự kiện thành công."));
  });

  updateStatus = asyncHandler(async (req, res) => {
    const data = await EventService.updateStatus(req.params.eventId, req.body.status, req.user);
    res.status(200).json(handleSuccessResponse(data, "Cập nhật trạng thái sự kiện thành công."));
  });
}

export default new EventController();
