import StreamService from "../services/stream.service.js";
import { asyncHandler } from "../helpers/handleError.js";
import { handleSuccessResponse } from "../helpers/handleResponse.js";

class StreamController {
  getGatewayStream = asyncHandler(async (req, res) => {
    const data = await StreamService.getGatewayStream(req.params.gatewayId, req.user);
    res.status(200).json(handleSuccessResponse(data, "Lấy cấu hình stream thành công."));
  });

  createSession = asyncHandler(async (req, res) => {
    const data = await StreamService.createSession(req.body, req.user);
    res.status(201).json(handleSuccessResponse(data, "Tạo phiên stream thành công."));
  });

  closeSession = asyncHandler(async (req, res) => {
    await StreamService.closeSession(req.params.sessionId, req.user);
    res.status(200).json(handleSuccessResponse(null, "Đã kết thúc phiên stream."));
  });
}

export default new StreamController();
