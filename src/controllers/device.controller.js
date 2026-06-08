import DeviceService from "../services/device.service.js";
import { asyncHandler } from "../helpers/handleError.js";
import { handleSuccessResponse } from "../helpers/handleResponse.js";

class DeviceController {
  list = asyncHandler(async (req, res) => {
    const { items, meta } = await DeviceService.list(req.query, req.user);
    res.status(200).json(handleSuccessResponse(items, "Lấy danh sách thiết bị thành công.", meta));
  });

  get = asyncHandler(async (req, res) => {
    const data = await DeviceService.get(req.params.deviceId, req.user);
    res.status(200).json(handleSuccessResponse(data, "Lấy thông tin thiết bị thành công."));
  });

  statusList = asyncHandler(async (req, res) => {
    const { items, meta } = await DeviceService.statusList(req.query, req.user);
    res.status(200).json(handleSuccessResponse(items, "Lấy trạng thái thiết bị thành công.", meta));
  });

  create = asyncHandler(async (req, res) => {
    const data = await DeviceService.create(req.body, req.user);
    res.status(201).json(handleSuccessResponse(data, "Thêm thiết bị thành công."));
  });

  update = asyncHandler(async (req, res) => {
    const data = await DeviceService.update(req.params.deviceId, req.body, req.user);
    res.status(200).json(handleSuccessResponse(data, "Cập nhật thiết bị thành công."));
  });

  heartbeat = asyncHandler(async (req, res) => {
    const data = await DeviceService.updateHeartbeat(req.params.deviceId, req.body);
    res.status(200).json(handleSuccessResponse(data, "Heartbeat thiết bị đã được cập nhật."));
  });

  disable = asyncHandler(async (req, res) => {
    const data = await DeviceService.disable(req.params.deviceId, req.user);
    res.status(200).json(handleSuccessResponse(data, "Thiết bị đã được vô hiệu hóa."));
  });

  remove = asyncHandler(async (req, res) => {
    await DeviceService.remove(req.params.deviceId, req.user);
    res.status(200).json(handleSuccessResponse(null, "Xóa thiết bị thành công."));
  });
}

export default new DeviceController();
