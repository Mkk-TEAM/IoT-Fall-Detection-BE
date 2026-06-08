import GatewayService from "../services/gateway.service.js";
import { asyncHandler } from "../helpers/handleError.js";
import { handleSuccessResponse } from "../helpers/handleResponse.js";

class GatewayController {
  list = asyncHandler(async (req, res) => {
    const { items, meta } = await GatewayService.list(req.query, req.user);
    res.status(200).json(handleSuccessResponse(items, "Lấy danh sách gateway thành công.", meta));
  });

  get = asyncHandler(async (req, res) => {
    const data = await GatewayService.get(req.params.gatewayId, req.user);
    res.status(200).json(handleSuccessResponse(data, "Lấy thông tin gateway thành công."));
  });

  create = asyncHandler(async (req, res) => {
    const data = await GatewayService.create(req.body, req.user);
    res.status(201).json(handleSuccessResponse(data, "Tạo gateway thành công."));
  });

  update = asyncHandler(async (req, res) => {
    const data = await GatewayService.update(req.params.gatewayId, req.body, req.user);
    res.status(200).json(handleSuccessResponse(data, "Cập nhật gateway thành công."));
  });

  heartbeat = asyncHandler(async (req, res) => {
    const data = await GatewayService.heartbeat(req.params.gatewayId, req.body);
    res.status(200).json(handleSuccessResponse(data, "Heartbeat gateway đã được cập nhật."));
  });

  remove = asyncHandler(async (req, res) => {
    await GatewayService.remove(req.params.gatewayId, req.user);
    res.status(200).json(handleSuccessResponse(null, "Xóa gateway thành công."));
  });
}

export default new GatewayController();
