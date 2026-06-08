import PermissionService from "../services/permission.service.js";
import { asyncHandler } from "../helpers/handleError.js";
import { handleSuccessResponse } from "../helpers/handleResponse.js";

class PermissionController {
  list = asyncHandler(async (req, res) => {
    const { items, meta } = await PermissionService.list(req.query, req.user);
    res.status(200).json(handleSuccessResponse(items, "Lấy danh sách phân quyền thành công.", meta));
  });

  upsert = asyncHandler(async (req, res) => {
    const data = await PermissionService.upsert(req.body, req.user);
    res.status(200).json(handleSuccessResponse(data, "Cập nhật quyền truy cập thành công."));
  });

  update = asyncHandler(async (req, res) => {
    const data = await PermissionService.update(req.params.permissionId, req.body, req.user);
    res.status(200).json(handleSuccessResponse(data, "Cập nhật phân quyền thành công."));
  });

  remove = asyncHandler(async (req, res) => {
    await PermissionService.remove(req.params.permissionId, req.user);
    res.status(200).json(handleSuccessResponse(null, "Thu hồi quyền truy cập thành công."));
  });
}

export default new PermissionController();
