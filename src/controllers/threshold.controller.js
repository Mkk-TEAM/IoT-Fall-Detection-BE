import ThresholdService from "../services/threshold.service.js";
import { asyncHandler } from "../helpers/handleError.js";
import { handleSuccessResponse } from "../helpers/handleResponse.js";

class ThresholdController {
  getCurrent = asyncHandler(async (req, res) => {
    const data = await ThresholdService.getCurrent();
    res.status(200).json(handleSuccessResponse(data, "Lấy cấu hình ngưỡng thành công."));
  });

  update = asyncHandler(async (req, res) => {
    const data = await ThresholdService.update(req.body, req.user);
    res.status(200).json(handleSuccessResponse(data, "Cập nhật ngưỡng cảnh báo thành công."));
  });
}

export default new ThresholdController();
