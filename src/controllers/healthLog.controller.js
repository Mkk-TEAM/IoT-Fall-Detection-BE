import HealthLogService from "../services/healthLog.service.js";
import { asyncHandler } from "../helpers/handleError.js";
import { handleSuccessResponse } from "../helpers/handleResponse.js";

class HealthLogController {
  create = asyncHandler(async (req, res) => {
    const data = await HealthLogService.create(req.body);
    res.status(201).json(handleSuccessResponse(data, "Đã lưu health log."));
  });

  list = asyncHandler(async (req, res) => {
    const { items, meta } = await HealthLogService.list(req.query, req.user);
    res.status(200).json(handleSuccessResponse(items, "Lấy health log thành công.", meta));
  });
}

export default new HealthLogController();
