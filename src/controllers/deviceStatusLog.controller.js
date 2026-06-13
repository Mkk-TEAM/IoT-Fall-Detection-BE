import DeviceStatusLogService from "../services/deviceStatusLog.service.js";
import { asyncHandler } from "../helpers/handleError.js";
import { handleSuccessResponse } from "../helpers/handleResponse.js";

class DeviceStatusLogController {
  create = asyncHandler(async (req, res) => {
    const data = await DeviceStatusLogService.create(req.body);
    res.status(201).json(handleSuccessResponse(data, "Đã ghi log tình trạng thiết bị."));
  });

  createInternal = asyncHandler(async (req, res) => {
    const data = await DeviceStatusLogService.create(req.body);
    res.status(201).json(handleSuccessResponse(data, "Gateway/edge đã ghi log tình trạng thiết bị."));
  });

  list = asyncHandler(async (req, res) => {
    const { items, meta } = await DeviceStatusLogService.list(req.query, req.user);
    res.status(200).json(handleSuccessResponse(items, "Lấy log tình trạng thiết bị thành công.", meta));
  });

  latest = asyncHandler(async (req, res) => {
    const data = await DeviceStatusLogService.latest(req.query, req.user);
    res.status(200).json(handleSuccessResponse(data, "Lấy tình trạng thiết bị mới nhất thành công."));
  });
}

export default new DeviceStatusLogController();
